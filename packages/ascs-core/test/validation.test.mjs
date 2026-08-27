import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateBundle } from '../src/index.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const original = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures', 'minimal_workspace.egir.json'), 'utf8'))
const clone = (value) => structuredClone(value)

function codes(result) {
  return result.errors.map((error) => error.code)
}

test('valid TW-01 minimal workspace passes semantic validation', async () => {
  const result = await validateBundle(clone(original))
  assert.equal(result.ok, true)
  assert.deepEqual(result.errors, [])
})

test('content address corruption is typed', async () => {
  const bundle = clone(original)
  bundle.revision_records[0].content_address = 'content:sha256:' + '0'.repeat(64)
  const result = await validateBundle(bundle)
  assert.equal(result.ok, false)
  assert.ok(codes(result).includes('ContentAddressMismatch'))
})

test('revision address corruption is typed', async () => {
  const bundle = clone(original)
  const revision = bundle.revision_records[0]
  const oldId = revision.revision_id
  const badId = 'rev:sha256:' + '1'.repeat(64)
  revision.revision_id = badId
  bundle.object_records.find((o) => o.persistent_id === revision.persistent_id).heads.main = badId
  bundle.workspace.object_heads.find((h) => h.revision === oldId).revision = badId
  const result = await validateBundle(bundle)
  assert.equal(result.ok, false)
  assert.ok(codes(result).includes('RevisionAddressMismatch'))
})

test('workspace revision corruption is typed', async () => {
  const bundle = clone(original)
  bundle.workspace.workspace_revision = 'wrev:sha256:' + '2'.repeat(64)
  const result = await validateBundle(bundle)
  assert.equal(result.ok, false)
  assert.ok(codes(result).includes('WorkspaceRevisionMismatch'))
})
