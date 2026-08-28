import { sha256Hex, validateBundle } from '../../ascs-core/src/index.mjs'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

export class StorageError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'StorageError'
    this.code = code
    Object.assign(this, details)
  }
}

function clone(value) { return structuredClone(value) }
function asBytes(value) {
  if (value instanceof Uint8Array) return new Uint8Array(value)
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  throw new TypeError('expected byte-like value')
}
function compareKeys(a, b) { return a < b ? -1 : a > b ? 1 : 0 }

// TW-02 reference identity uses Python json.dumps(sort_keys=True,
// separators=(',', ':'), ensure_ascii=False). JavaScript loses the lexical
// distinction between 64 and 64.0, so the schema-declared number field below
// is emitted as a float when integral to preserve the frozen reference ID.
function tw02Json(value, key = null) {
  if (value === null) return 'null'
  if (value === true) return 'true'
  if (value === false) return 'false'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('TW-02 manifest numbers must be finite')
    if (key === 'max_expansion_ratio' && Number.isInteger(value)) return `${value}.0`
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map((item) => tw02Json(item)).join(',')}]`
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort(compareKeys)
    return `{${keys.map((name) => `${JSON.stringify(name)}:${tw02Json(value[name], name)}`).join(',')}}`
  }
  throw new TypeError(`unsupported TW-02 manifest value: ${typeof value}`)
}

async function sha(bytes) { return sha256Hex(asBytes(bytes)) }

export async function manifestAddress(manifest) {
  const preimage = clone(manifest)
  preimage.manifest_id = ''
  return `store:sha256:${await sha(encoder.encode(tw02Json(preimage)))}`
}

function defaultGenerator() { return { implementation: 'eveglyph-ascs-store', version: '0.1', source: 'runtime' } }

export async function packBytes(bytesLike, options = {}) {
  const bytes = asBytes(bytesLike)
  const chunkSize = options.chunkSize ?? 4096
  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) throw new RangeError('chunkSize must be a positive safe integer')
  const maxDecodedBytes = options.maxDecodedBytes ?? 10_485_760
  const maxChunkCount = options.maxChunkCount ?? 10_000
  const maxExpansionRatio = options.maxExpansionRatio ?? 64.0
  if (bytes.length > maxDecodedBytes) throw new StorageError('DecodedSizeLimit', `decoded bytes ${bytes.length} exceed limit ${maxDecodedBytes}`)

  const chunks = []
  const chunkBytes = new Map()
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const raw = bytes.slice(offset, Math.min(offset + chunkSize, bytes.length))
    const digest = await sha(raw)
    const chunkId = `chunk:sha256:${digest}`
    const locator = `chunks/${digest}.bin`
    chunks.push({
      chunk_id: chunkId, logical_offset: offset, decoded_length: raw.length, decoded_sha256: digest,
      codec: 'identity', codec_parameters: {}, dictionary_ref: null,
      encoded_length: raw.length, encoded_sha256: digest, locator, crc32c: null,
    })
    chunkBytes.set(chunkId, raw)
  }
  if (chunks.length > maxChunkCount) throw new StorageError('ChunkCountLimit', `chunk count ${chunks.length} exceeds limit ${maxChunkCount}`)

  const manifest = {
    store_version: 'egstore/0.1', manifest_id: '', egir_version: options.egirVersion ?? 'egir/0.1',
    root_payload: {
      name: options.name ?? 'payload.bin', media_type: options.mediaType ?? 'application/octet-stream',
      decoded_length: bytes.length, decoded_sha256: await sha(bytes), chunk_ids: chunks.map((chunk) => chunk.chunk_id),
    },
    chunking: { profile: 'fixed-v1', parameters: { chunk_size: chunkSize } },
    codecs: [{ id: 'identity', name: 'Identity / raw bytes', required: true, parameters: {} }],
    chunks, dictionaries: [],
    indexes: [{ type: 'logical-offset-v1', records: chunks.map(({ chunk_id, logical_offset, decoded_length }) => ({ chunk_id, logical_offset, decoded_length })) }],
    limits: { max_decoded_bytes: maxDecodedBytes, max_chunk_count: maxChunkCount, max_expansion_ratio: maxExpansionRatio },
    generator: clone(options.generator ?? defaultGenerator()), extensions: clone(options.extensions ?? {}),
  }
  manifest.manifest_id = await manifestAddress(manifest)
  return { manifest, chunks: chunkBytes, bytes: new Uint8Array(bytes) }
}

function chunkLookup(chunks, id) {
  if (chunks instanceof Map || chunks?.get) return chunks.get(id)
  if (chunks && typeof chunks === 'object') return chunks[id]
  return undefined
}

export async function verifyManifest(manifest, chunks) {
  if (!manifest || manifest.store_version !== 'egstore/0.1') throw new StorageError('InvalidManifest', 'unsupported or missing store_version')
  const expectedManifestId = await manifestAddress(manifest)
  if (manifest.manifest_id !== expectedManifestId) throw new StorageError('ManifestIdMismatch', `${expectedManifestId} != ${manifest.manifest_id}`)
  const byId = new Map((manifest.chunks ?? []).map((chunk) => [chunk.chunk_id, chunk]))
  const parts = []
  let expectedOffset = 0
  for (const id of manifest.root_payload?.chunk_ids ?? []) {
    const meta = byId.get(id)
    if (!meta) throw new StorageError('MissingChunkMetadata', `manifest references unknown chunk ${id}`)
    if (meta.codec !== 'identity') throw new StorageError('UnsupportedCodec', `codec ${meta.codec} is not supported`)
    if (meta.logical_offset !== expectedOffset) throw new StorageError('ChunkOffsetMismatch', `expected ${expectedOffset}, got ${meta.logical_offset}`)
    const rawValue = chunkLookup(chunks, id) ?? chunkLookup(chunks, meta.locator)
    if (rawValue == null) throw new StorageError('MissingChunk', `missing ${id}`, { chunk_id: id, locator: meta.locator })
    const raw = asBytes(rawValue)
    if (raw.length !== meta.encoded_length || raw.length !== meta.decoded_length) throw new StorageError('ChunkLengthMismatch', `length mismatch for ${id}`)
    const digest = await sha(raw)
    if (digest !== meta.encoded_sha256) throw new StorageError('EncodedHashMismatch', `encoded hash mismatch for ${id}`)
    if (digest !== meta.decoded_sha256 || id !== `chunk:sha256:${digest}`) throw new StorageError('DecodedHashMismatch', `decoded hash mismatch for ${id}`)
    parts.push(raw); expectedOffset += raw.length
  }
  const rebuilt = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let cursor = 0
  for (const part of parts) { rebuilt.set(part, cursor); cursor += part.length }
  if (rebuilt.length !== manifest.root_payload.decoded_length) throw new StorageError('RootLengthMismatch', 'root decoded length mismatch')
  if (await sha(rebuilt) !== manifest.root_payload.decoded_sha256) throw new StorageError('RootHashMismatch', 'root decoded hash mismatch')
  return { ok: true, bytes: rebuilt, manifest_id: manifest.manifest_id }
}

function memoryValue(value) { return value instanceof Uint8Array ? new Uint8Array(value) : clone(value) }

export function createMemoryCarrier() {
  const data = new Map()
  return {
    durabilityClass: 'D0',
    async get(key) { return data.has(key) ? memoryValue(data.get(key)) : null },
    async put(key, value) { data.set(key, memoryValue(value)) },
    async delete(key) { data.delete(key) },
    async list(prefix = '') { return [...data.keys()].filter((key) => key.startsWith(prefix)).sort() },
  }
}

function opfsPathParts(key) { return key.split('/').filter(Boolean) }
async function opfsResolve(root, key, { create = false } = {}) {
  const parts = opfsPathParts(key)
  if (!parts.length) throw new TypeError('empty OPFS key')
  let dir = root
  for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create })
  return { dir, name: parts.at(-1) }
}

export async function createOpfsCarrier(options = {}) {
  const nav = options.navigatorObject ?? globalThis.navigator
  if (!nav?.storage?.getDirectory) throw new Error('OPFS unavailable')
  const root = await nav.storage.getDirectory()
  const base = await root.getDirectoryHandle(options.prefix ?? 'eveglyph-ascs-store', { create: true })
  return {
    durabilityClass: 'D1',
    async get(key) {
      try {
        const { dir, name } = await opfsResolve(base, key)
        const file = await (await dir.getFileHandle(name)).getFile()
        const bytes = new Uint8Array(await file.arrayBuffer())
        if (key.endsWith('.json') || key === 'active' || key.startsWith('meta/')) return JSON.parse(decoder.decode(bytes))
        return bytes
      } catch (error) { if (error?.name === 'NotFoundError') return null; throw error }
    },
    async put(key, value) {
      const { dir, name } = await opfsResolve(base, key, { create: true })
      const writable = await (await dir.getFileHandle(name, { create: true })).createWritable()
      await writable.write(value instanceof Uint8Array ? value : encoder.encode(JSON.stringify(value)))
      await writable.close()
    },
    async delete(key) {
      try { const { dir, name } = await opfsResolve(base, key); await dir.removeEntry(name) }
      catch (error) { if (error?.name !== 'NotFoundError') throw error }
    },
    async list() { throw new Error('OPFS list is not part of Milestone C D1 contract') },
  }
}

function manifestKey(id) { return `manifests/${id.replace(/^store:sha256:/, '')}.json` }

export function createEgStore(carrier, options = {}) {
  if (!carrier?.get || !carrier?.put) throw new TypeError('carrier must provide get/put')
  const activeKey = options.activeKey ?? 'active'
  return {
    carrier, durabilityClass: carrier.durabilityClass ?? 'D0',
    async commitBytes(bytes, metadata = {}) {
      const packed = await packBytes(bytes, metadata)
      for (const meta of packed.manifest.chunks) await carrier.put(meta.locator, packed.chunks.get(meta.chunk_id))
      await carrier.put(manifestKey(packed.manifest.manifest_id), packed.manifest)
      await carrier.put(activeKey, packed.manifest.manifest_id)
      return clone(packed.manifest)
    },
    async commitBundle(bundle, metadata = {}) {
      const validation = await validateBundle(bundle)
      if (!validation.ok) throw new StorageError('InvalidEgirBundle', `invalid EGIR bundle: ${validation.errors.map((x) => x.code).join(', ')}`, { errors: validation.errors })
      return this.commitBytes(encoder.encode(JSON.stringify(bundle)), {
        name: metadata.name ?? 'workspace.egir.json', mediaType: metadata.mediaType ?? 'application/json', egirVersion: 'egir/0.1', ...metadata,
      })
    },
    async loadManifest(id) {
      const manifest = await carrier.get(manifestKey(id))
      if (manifest == null) throw new StorageError('MissingManifest', `missing manifest ${id}`)
      const expected = await manifestAddress(manifest)
      if (expected !== manifest.manifest_id || manifest.manifest_id !== id) throw new StorageError('ManifestIdMismatch', `manifest identity mismatch for ${id}`)
      return clone(manifest)
    },
    async loadBytes(id) {
      const manifest = await this.loadManifest(id)
      const chunks = new Map()
      for (const meta of manifest.chunks) { const raw = await carrier.get(meta.locator); if (raw != null) chunks.set(meta.chunk_id, raw) }
      return (await verifyManifest(manifest, chunks)).bytes
    },
    async loadBundle(id) {
      const bytes = await this.loadBytes(id)
      let bundle
      try { bundle = JSON.parse(decoder.decode(bytes)) }
      catch (error) { throw new StorageError('InvalidEgirJson', `stored root is not valid UTF-8 JSON: ${error.message}`) }
      const validation = await validateBundle(bundle)
      if (!validation.ok) throw new StorageError('InvalidEgirBundle', 'stored EGIR bundle failed validation', { errors: validation.errors })
      return bundle
    },
    async setActive(id) { await this.loadManifest(id); await carrier.put(activeKey, id); return id },
    async getActive() { return carrier.get(activeKey) },
    async recoverActive() {
      const id = await this.getActive()
      if (!id) return { status: 'Empty', manifest_id: null }
      try { return { status: 'Recovered', manifest_id: id, bytes: await this.loadBytes(id) } }
      catch (error) { return { status: 'Corrupt', manifest_id: id, error } }
    },
  }
}
