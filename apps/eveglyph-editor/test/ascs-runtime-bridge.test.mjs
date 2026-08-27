import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createCanonicalWorkspaceBridge } from '../src/ascs/runtime-bridge.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const fixture = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../../packages/ascs-core/test/fixtures/minimal_workspace.egir.json'), 'utf8'))
const MATH_ID = 'urn:uuid:0190a001-1111-7abc-8def-111111111111'
const HUMAN = { actor: { type: 'human', id: 'local-user' }, mode: 'explicit' }

function options() {
  let n = 0
  return {
    clock: () => `2026-08-27T11:00:${String(++n).padStart(2, '0')}.000Z`,
    idFactory: () => `urn:uuid:0199dd00-0000-7abc-8def-${(++n).toString(16).padStart(12, '0')}`,
  }
}

test('hidden Editor bridge loads TW-01 workspace and routes move through canonical runtime', async () => {
  const bridge = await createCanonicalWorkspaceBridge(fixture, options())
  const beforeWorkspace = bridge.workspaceRevision
  const beforeHead = bridge.objectHead(MATH_ID)
  const beforeContent = bridge.revision(beforeHead).content_address

  const result = await bridge.moveObject(MATH_ID, {
    x: '510.0',
    y: '330.0',
    baseWorkspaceRevision: beforeWorkspace,
    authority: HUMAN,
  })

  assert.equal(result.status, 'Committed')
  assert.notEqual(bridge.workspaceRevision, beforeWorkspace)
  assert.equal(bridge.objectHead(MATH_ID), beforeHead)
  assert.equal(bridge.revision(beforeHead).content_address, beforeContent)
  assert.equal(bridge.placementFor(MATH_ID).transform.x, '510.0')
  assert.equal(bridge.placementFor(MATH_ID).transform.y, '330.0')
  assert.equal((await bridge.validate()).ok, true)
})
