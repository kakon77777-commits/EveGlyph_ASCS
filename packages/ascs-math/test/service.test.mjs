import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createWorkspaceRuntime } from '../../ascs-runtime/src/index.mjs'
import { createNativeMathService } from '../src/service.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const bundle = JSON.parse(fs.readFileSync(path.resolve(here, '../../ascs-core/test/fixtures/minimal_workspace.egir.json'), 'utf8'))
const candidate = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/native_math_integral_example.json'), 'utf8'))
const MATH_ID = 'urn:uuid:0190a001-1111-7abc-8def-111111111111'
const HUMAN = { actor: { type: 'human', id: 'math-service-test' }, mode: 'explicit' }

function runtimeOptions() {
  let n = 0
  return {
    clock: () => `2026-08-28T08:50:${String(++n).padStart(2,'0')}.000Z`,
    idFactory: () => `urn:uuid:0199dd10-0000-7abc-8def-${(++n).toString(16).padStart(12,'0')}`,
  }
}

async function bridge() {
  const runtime = await createWorkspaceRuntime(bundle, runtimeOptions())
  return Object.freeze({
    get workspaceRevision() { return runtime.workspaceRevision },
    objectHead: (id, branch='main') => runtime.objectHead(id, branch),
    revision: (id) => runtime.revision(id),
    editIntrinsic: (id, command) => runtime.editIntrinsic(id, command),
  })
}

test('Native Math service inspects legacy math without silently reinterpreting it', async () => {
  const service = createNativeMathService(await bridge())
  const info = service.inspect(MATH_ID)
  assert.equal(info.kind, 'math')
  assert.equal(info.profile, 'ncm/0.1')
  assert.equal(info.candidate_profile, false)
  assert.equal(info.migration, 'explicit-optional')
})

test('Native Math service rejects invalid candidate before canonical mutation', async () => {
  const b = await bridge()
  const service = createNativeMathService(b)
  const before = b.workspaceRevision
  const invalid = structuredClone(candidate)
  invalid.profile = 'ncm/not-candidate'
  await assert.rejects(
    () => service.edit(MATH_ID, { math: invalid, baseWorkspaceRevision: before, authority: HUMAN }),
    (error) => error?.name === 'NativeMathValidationError',
  )
  assert.equal(b.workspaceRevision, before)
})

test('Native Math service commits valid candidate through existing authority runtime and projects it', async () => {
  const b = await bridge()
  const service = createNativeMathService(b)
  const base = b.workspaceRevision
  const result = await service.edit(MATH_ID, { math: candidate, baseWorkspaceRevision: base, authority: HUMAN })
  assert.equal(result.status, 'Committed')
  assert.notEqual(b.workspaceRevision, base)
  assert.equal(service.inspect(MATH_ID).profile, 'ncm/1.0-candidate.1')
  assert.equal((await service.validate(MATH_ID)).ok, true)
  assert.equal(service.projectLatex(MATH_ID).authority, 'projection-only')
  assert.equal(service.projectMathML(MATH_ID).authority, 'projection-only')
})

test('Native Math service preserves stale-base conflict from canonical runtime', async () => {
  const b = await bridge()
  const service = createNativeMathService(b)
  const stale = b.workspaceRevision
  await service.edit(MATH_ID, { math: candidate, baseWorkspaceRevision: stale, authority: HUMAN })
  await assert.rejects(
    () => service.edit(MATH_ID, { math: candidate, baseWorkspaceRevision: stale, authority: HUMAN }),
    (error) => error?.name === 'ConflictError',
  )
})
