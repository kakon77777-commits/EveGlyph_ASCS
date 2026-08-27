import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createWorkspaceRuntime } from '../src/index.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const fixturePath = path.resolve(HERE, '../../ascs-core/test/fixtures/minimal_workspace.egir.json')
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
const MATH_ID = 'urn:uuid:0190a001-1111-7abc-8def-111111111111'
const HUMAN = { actor: { type: 'human', id: 'local-user' }, mode: 'explicit' }

function deterministicOptions() {
  let n = 0
  return {
    clock() {
      n += 1
      return `2026-08-27T08:00:${String(n).padStart(2, '0')}.000Z`
    },
    idFactory(label = 'id') {
      n += 1
      const tail = n.toString(16).padStart(12, '0')
      return `urn:uuid:0199aa00-0000-7abc-8def-${tail}`
    },
  }
}

test('pure move changes workspace revision but preserves object revision/content', async () => {
  const runtime = await createWorkspaceRuntime(fixture, deterministicOptions())
  const oldWorkspace = runtime.workspaceRevision
  const oldHead = runtime.objectHead(MATH_ID)
  const oldContent = runtime.revision(oldHead).content_address

  const result = await runtime.moveObject(MATH_ID, {
    x: '420.0', y: '260.0', baseWorkspaceRevision: oldWorkspace, authority: HUMAN,
  })

  assert.equal(result.status, 'Committed')
  assert.notEqual(runtime.workspaceRevision, oldWorkspace)
  assert.equal(runtime.objectHead(MATH_ID), oldHead)
  assert.equal(runtime.revision(oldHead).content_address, oldContent)
  assert.equal(runtime.placementFor(MATH_ID).transform.x, '420.0')
  assert.equal(runtime.placementFor(MATH_ID).transform.y, '260.0')
})

test('stale base returns typed Conflict and leaves canonical snapshot unchanged', async () => {
  const runtime = await createWorkspaceRuntime(fixture, deterministicOptions())
  const stale = runtime.workspaceRevision
  await runtime.moveObject(MATH_ID, {
    x: '200.0', y: '100.0', baseWorkspaceRevision: stale, authority: HUMAN,
  })
  const before = runtime.snapshot()

  const result = await runtime.tryMoveObject(MATH_ID, {
    x: '999.0', y: '999.0', baseWorkspaceRevision: stale, authority: HUMAN,
  })

  assert.equal(result.status, 'Conflict')
  assert.equal(result.base_workspace_revision, stale)
  assert.equal(result.current_workspace_revision, runtime.workspaceRevision)
  assert.deepEqual(runtime.snapshot(), before)
})

test('semantic edit preserves identity but creates new content/revision with old head as parent', async () => {
  const runtime = await createWorkspaceRuntime(fixture, deterministicOptions())
  const base = runtime.workspaceRevision
  const oldHead = runtime.objectHead(MATH_ID)
  const oldRevision = runtime.revision(oldHead)
  const intrinsic = structuredClone(oldRevision.intrinsic)
  const exponent = intrinsic.expression.nodes.find((node) => node.id === 'n2')
  exponent.value = '3'

  const result = await runtime.editIntrinsic(MATH_ID, {
    intrinsic, baseWorkspaceRevision: base, authority: HUMAN,
  })

  assert.equal(result.status, 'Committed')
  assert.equal(result.persistent_id, MATH_ID)
  const newHead = runtime.objectHead(MATH_ID)
  assert.notEqual(newHead, oldHead)
  assert.notEqual(runtime.revision(newHead).content_address, oldRevision.content_address)
  assert.equal(runtime.revision(newHead).persistent_id, MATH_ID)
  assert.deepEqual(runtime.revision(newHead).parents, [oldHead])
})

test('clone separates identity while preserving intrinsic content address', async () => {
  const runtime = await createWorkspaceRuntime(fixture, deterministicOptions())
  const base = runtime.workspaceRevision
  const oldHead = runtime.objectHead(MATH_ID)
  const oldContent = runtime.revision(oldHead).content_address

  const result = await runtime.cloneObject(MATH_ID, {
    baseWorkspaceRevision: base, authority: HUMAN,
  })

  assert.equal(result.status, 'Committed')
  assert.notEqual(result.persistent_id, MATH_ID)
  const cloneHead = runtime.objectHead(result.persistent_id)
  assert.equal(runtime.revision(cloneHead).content_address, oldContent)
  assert.equal(runtime.revision(cloneHead).persistent_id, result.persistent_id)
})
