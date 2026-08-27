import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createWorkspaceRuntime } from '../src/index.mjs'

const bundle = JSON.parse(await readFile(new URL('../../ascs-core/test/fixtures/minimal_workspace.egir.json', import.meta.url), 'utf8'))
const HUMAN = { actor: { type: 'human', id: 'human:test' }, mode: 'explicit' }

test('trusted extension mutation uses the same authority/base/hash/atomic-swap pipeline', async () => {
  const runtime = await createWorkspaceRuntime(bundle, {
    clock: () => '2026-08-27T10:10:00.000Z',
    idFactory: () => 'urn:uuid:0198f100-0000-7000-8000-000000000001',
  })
  assert.equal(typeof runtime.commitExtensionMutation, 'function', 'Milestone C trusted extension seam is missing')
  const before = runtime.snapshot()
  const result = await runtime.commitExtensionMutation({
    op: 'set-test-extension',
    baseWorkspaceRevision: runtime.workspaceRevision,
    authority: HUMAN,
    mutate(draft) {
      draft.extensions['org.evemisslab.test/0.1'] = { value: 'ok' }
      return { extension: 'org.evemisslab.test/0.1' }
    },
    validateExtension(draft) {
      return draft.extensions['org.evemisslab.test/0.1']?.value === 'ok'
        ? { ok: true, errors: [] }
        : { ok: false, errors: [{ code: 'BadTestExtension' }] }
    },
  })
  assert.equal(result.status, 'Committed')
  assert.equal(runtime.snapshot().extensions['org.evemisslab.test/0.1'].value, 'ok')
  assert.deepEqual(runtime.snapshot().workspace.parents, [before.workspace.workspace_revision])
  assert.notEqual(runtime.workspaceRevision, before.workspace.workspace_revision)
})

test('failed extension validation leaves canonical state byte-for-byte/deep-equal unchanged', async () => {
  const runtime = await createWorkspaceRuntime(bundle, {
    clock: () => '2026-08-27T10:10:01.000Z',
    idFactory: () => 'urn:uuid:0198f100-0000-7000-8000-000000000002',
  })
  assert.equal(typeof runtime.commitExtensionMutation, 'function', 'Milestone C trusted extension seam is missing')
  const before = runtime.snapshot()
  await assert.rejects(() => runtime.commitExtensionMutation({
    op: 'invalid-extension', baseWorkspaceRevision: runtime.workspaceRevision, authority: HUMAN,
    mutate(draft) { draft.extensions['org.evemisslab.test/0.1'] = { value: 'bad' } },
    validateExtension() { return { ok: false, errors: [{ code: 'RejectedExtension' }] } },
  }), error => error?.name === 'ExtensionValidationError')
  assert.deepEqual(runtime.snapshot(), before)
})
