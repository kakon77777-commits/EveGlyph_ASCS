import test from 'node:test'
import assert from 'node:assert/strict'
import { referenceJson } from './reference-helper.mjs'
import {
  contextPackAddress,
  buildContextPack,
  classifyContextTrust,
  verifyContextFresh,
  verifyToolManifestFresh,
} from '../src/index.mjs'

const frozenContext = () => referenceJson('examples/context_pack_example.json')

test('frozen v0.7 context pack recomputes exact canonical identity', async () => {
  const pack = frozenContext()
  assert.equal(
    await contextPackAddress(pack),
    'context-pack:sha256:bb4c48f2c8fde586beff62d504a036bbb1f0e4224ee9b82d746c870a369b3d70',
  )
})

test('buildContextPack computes identity and ignores caller supplied stale identity', async () => {
  const input = frozenContext()
  input.context_pack_id = 'context-pack:sha256:' + '0'.repeat(64)
  const built = await buildContextPack(input)
  assert.equal(built.context_pack_id, 'context-pack:sha256:bb4c48f2c8fde586beff62d504a036bbb1f0e4224ee9b82d746c870a369b3d70')
  assert.equal(input.context_pack_id, 'context-pack:sha256:' + '0'.repeat(64))
})

test('prompt rendering outside the pack cannot alter pack identity', async () => {
  const pack = frozenContext()
  const before = await contextPackAddress(pack)
  const promptA = `SYSTEM\n${pack.task.directive}`
  const promptB = `### task\n${pack.task.directive}\n### context`
  assert.notEqual(promptA, promptB)
  assert.equal(await contextPackAddress(pack), before)
})

test('trust is host-derived and content cannot self-upgrade authority', () => {
  assert.equal(classifyContextTrust({ role: 'workspace-document', authorityOrigin: 'workspace-data' }), 'untrusted-data')
  assert.equal(classifyContextTrust({ role: 'workspace-document', authorityOrigin: 'generated' }), 'generated-data')
  assert.equal(classifyContextTrust({ role: 'workspace-policy', authorityOrigin: 'committed-policy' }), 'trusted-policy')
  assert.equal(classifyContextTrust({ role: 'protected-glossary', authorityOrigin: 'committed-data' }), 'trusted-data')
  assert.equal(classifyContextTrust({ role: 'user-directive', authorityOrigin: 'explicit-user' }), 'directive')
})

test('source freshness mismatch is evidence only and never mutates context pack', async () => {
  const pack = frozenContext()
  const snapshot = structuredClone(pack)
  const result = await verifyContextFresh(pack, async ref => ref === 'notes/example.md' ? 'tampered bytes' : pack.sources.find(s => s.ref === ref)?.inline_content ?? null)
  assert.equal(result.ok, false)
  assert.deepEqual(result.staleSources.map(x => x.source_id), ['src-document'])
  assert.deepEqual(pack, snapshot)
})

test('tool schema mismatch is stale evidence and resolver is never asked to execute tool', async () => {
  const pack = frozenContext()
  const seen = []
  const result = await verifyToolManifestFresh(pack, async name => {
    seen.push(name)
    const tool = pack.tool_manifest.tools.find(t => t.name === name)
    return name === 'execute_math' ? '0'.repeat(64) : tool?.schema_hash ?? null
  })
  assert.equal(result.ok, false)
  assert.deepEqual(result.staleTools.map(x => x.name), ['execute_math'])
  assert.deepEqual(seen, pack.tool_manifest.tools.map(t => t.name))
})
