import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { AuthorityDeniedError, createWorkspaceRuntime } from '../src/index.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const fixture = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../ascs-core/test/fixtures/minimal_workspace.egir.json'), 'utf8'))
const MATH_ID = 'urn:uuid:0190a001-1111-7abc-8def-111111111111'

function options() {
  let n = 0
  return {
    clock: () => `2026-08-27T09:00:${String(++n).padStart(2, '0')}.000Z`,
    idFactory: () => `urn:uuid:0199bb00-0000-7abc-8def-${(++n).toString(16).padStart(12, '0')}`,
  }
}

test('human explicit authority may commit', async () => {
  const runtime = await createWorkspaceRuntime(fixture, options())
  const result = await runtime.moveObject(MATH_ID, {
    x: '220.0', y: '180.0',
    baseWorkspaceRevision: runtime.workspaceRevision,
    authority: { actor: { type: 'human', id: 'local-user' }, mode: 'explicit' },
  })
  assert.equal(result.status, 'Committed')
})

test('AI actor without approved proposal is denied before mutation', async () => {
  const runtime = await createWorkspaceRuntime(fixture, options())
  const before = runtime.snapshot()

  await assert.rejects(
    runtime.moveObject(MATH_ID, {
      x: '222.0', y: '111.0',
      baseWorkspaceRevision: runtime.workspaceRevision,
      authority: { actor: { type: 'ai', id: 'agent:test', model: 'test-model' }, mode: 'explicit' },
    }),
    AuthorityDeniedError,
  )

  assert.deepEqual(runtime.snapshot(), before)
})

test('AI actor with approved-proposal may commit and provenance records authority context', async () => {
  const runtime = await createWorkspaceRuntime(fixture, options())
  const result = await runtime.moveObject(MATH_ID, {
    x: '333.0', y: '222.0',
    baseWorkspaceRevision: runtime.workspaceRevision,
    authority: {
      actor: { type: 'ai', id: 'agent:test', model: 'test-model' },
      mode: 'approved-proposal',
      proposalId: 'proposal:test-001',
    },
  })

  assert.equal(result.status, 'Committed')
  const event = runtime.snapshot().event_records.at(-1)
  assert.equal(event.actor.type, 'ai')
  assert.equal(event.actor.id, 'agent:test')
  assert.equal(event.policy.mode, 'approved-proposal')
  assert.equal(event.metadata.proposal_id, 'proposal:test-001')
})
