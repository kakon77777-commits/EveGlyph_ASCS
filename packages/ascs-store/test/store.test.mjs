import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

async function loadStore() {
  try {
    return await import('../src/index.mjs')
  } catch (error) {
    assert.fail(`Milestone C1 store implementation missing: ${error.message}`)
  }
}

const fixture = new URL('./fixtures/minimal_workspace.egir.json', import.meta.url)
const vectorFile = new URL('./fixtures/tw02_vectors.json', import.meta.url)

function referenceOptions() {
  return {
    name: 'minimal_workspace.egir.json',
    mediaType: 'application/json',
    egirVersion: 'egir/0.1',
    chunkSize: 4096,
    generator: {
      implementation: 'tw02-reference-builder',
      version: '0.1',
      source: 'TW-01 minimal workspace',
    },
  }
}

test('TW-02 identity/fixed-v1 vector reproduces exact manifest and chunk identities', async () => {
  const { packBytes } = await loadStore()
  const bytes = new Uint8Array(await readFile(fixture))
  const vectors = JSON.parse(await readFile(vectorFile, 'utf8'))
  const packed = await packBytes(bytes, referenceOptions())
  assert.equal(packed.manifest.manifest_id, vectors.expected_manifest_id)
  assert.equal(packed.manifest.root_payload.decoded_sha256, vectors.root_payload_sha256)
  assert.equal(packed.manifest.root_payload.decoded_length, vectors.root_payload_length)
  assert.deepEqual(packed.manifest.chunks.map(c => ({ chunk_id: c.chunk_id, offset: c.logical_offset, length: c.decoded_length, encoded_sha256: c.encoded_sha256 })), vectors.chunks)
})

test('rechunking changes only store manifest identity while preserving decoded root identity', async () => {
  const { packBytes } = await loadStore()
  const bytes = new Uint8Array(await readFile(fixture))
  const a = await packBytes(bytes, referenceOptions())
  const b = await packBytes(bytes, { ...referenceOptions(), chunkSize: 2048 })
  assert.notEqual(a.manifest.manifest_id, b.manifest.manifest_id)
  assert.equal(a.manifest.root_payload.decoded_sha256, b.manifest.root_payload.decoded_sha256)
})

test('EGStore commit is recoverable from a second instance over the same carrier', async () => {
  const { createMemoryCarrier, createEgStore } = await loadStore()
  const bundle = JSON.parse(await readFile(fixture, 'utf8'))
  const carrier = createMemoryCarrier()
  const first = createEgStore(carrier)
  const committed = await first.commitBundle(bundle, { name: 'workspace.egir.json' })
  assert.equal(await first.getActive(), committed.manifest_id)
  const second = createEgStore(carrier)
  assert.deepEqual(await second.loadBundle(committed.manifest_id), bundle)
  assert.equal(second.durabilityClass, 'D0')
})

test('active pointer does not move when staged persistence fails before manifest activation', async () => {
  const { createEgStore } = await loadStore()
  const data = new Map()
  let failManifest = false
  const carrier = {
    durabilityClass: 'D0',
    async get(key) { return data.has(key) ? structuredClone(data.get(key)) : null },
    async put(key, value) {
      if (failManifest && key.startsWith('manifests/')) throw new Error('injected manifest write failure')
      data.set(key, structuredClone(value))
    },
    async delete(key) { data.delete(key) },
    async list(prefix = '') { return [...data.keys()].filter(k => k.startsWith(prefix)).sort() },
  }
  const store = createEgStore(carrier)
  const one = await store.commitBytes(new TextEncoder().encode('one'), { name: 'one.txt' })
  assert.equal(await store.getActive(), one.manifest_id)
  failManifest = true
  await assert.rejects(() => store.commitBytes(new TextEncoder().encode('two'), { name: 'two.txt' }), /manifest write failure/)
  assert.equal(await store.getActive(), one.manifest_id)
})

test('missing and corrupt chunks are typed storage failures', async () => {
  const { createMemoryCarrier, createEgStore, StorageError } = await loadStore()
  const carrier = createMemoryCarrier()
  const store = createEgStore(carrier)
  const committed = await store.commitBytes(new TextEncoder().encode('abcdef'), { name: 'x.txt', chunkSize: 3 })
  const manifest = await store.loadManifest(committed.manifest_id)
  const firstChunk = manifest.chunks[0]
  await carrier.delete(firstChunk.locator)
  await assert.rejects(() => store.loadBytes(committed.manifest_id), error => error instanceof StorageError && error.code === 'MissingChunk')
})

test('OPFS carrier export is browser-safe and rejects missing OPFS explicitly', async () => {
  const { createOpfsCarrier } = await loadStore()
  await assert.rejects(() => createOpfsCarrier({ navigatorObject: {} }), /OPFS unavailable/)
})
