import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createWorkspaceRuntime } from '../../ascs-runtime/src/index.mjs'

async function loadHistory() {
  try { return await import('../src/index.mjs') }
  catch (error) { assert.fail(`Milestone C2 history implementation missing: ${error.message}`) }
}
async function loadStore() {
  try { return await import('../../ascs-store/src/index.mjs') }
  catch (error) { assert.fail(`Milestone C1 store implementation missing: ${error.message}`) }
}

const baseBundle = JSON.parse(await readFile(new URL('../../ascs-core/test/fixtures/minimal_workspace.egir.json', import.meta.url), 'utf8'))
const objectId = baseBundle.object_records[0].persistent_id
const HUMAN = { actor: { type: 'human', id: 'human:test' }, mode: 'explicit' }

function runtimeOptions() {
  let n = 0
  return {
    clock: () => `2026-08-27T10:00:${String(n++).padStart(2, '0')}.000Z`,
    idFactory: label => `urn:uuid:0198f000-${String(n).padStart(4, '0')}-7000-8000-${String(n).padStart(12, '0')}`,
  }
}

async function makeIntrinsicEdit(bundle, value = '3') {
  const runtime = await createWorkspaceRuntime(bundle, runtimeOptions())
  const intrinsic = structuredClone(bundle.revision_records.find(r => r.revision_id === bundle.object_records[0].heads.main).intrinsic)
  intrinsic.expression.nodes.find(node => node.type === 'integer').value = value
  await runtime.editIntrinsic(objectId, { intrinsic, baseWorkspaceRevision: runtime.workspaceRevision, authority: HUMAN })
  return runtime.snapshot()
}

async function makeMove(bundle, x = '240.0', y = '160.0') {
  const runtime = await createWorkspaceRuntime(bundle, runtimeOptions())
  await runtime.moveObject(objectId, { x, y, baseWorkspaceRevision: runtime.workspaceRevision, authority: HUMAN })
  return runtime.snapshot()
}

test('stable branch identity survives rename and repository reopens from the same persistent store', async () => {
  const { createMemoryCarrier, createEgStore } = await loadStore()
  const { createHistoryRepository } = await loadHistory()
  const store = createEgStore(createMemoryCarrier())
  const repo = await createHistoryRepository({ store, initialBundle: baseBundle, branch: { branchId: 'branch:main', name: 'main' } })
  await repo.renameBranch('branch:main', 'trunk')
  const reopened = await createHistoryRepository({ store })
  assert.equal(reopened.branch('branch:main').branch_id, 'branch:main')
  assert.equal(reopened.branch('branch:main').name, 'trunk')
  assert.equal(reopened.branch('branch:main').head, baseBundle.workspace.workspace_revision)
})

test('checkpoint persists snapshot before moving the branch head and records immutable commit parents', async () => {
  const { createMemoryCarrier, createEgStore } = await loadStore()
  const { createHistoryRepository } = await loadHistory()
  const store = createEgStore(createMemoryCarrier())
  const repo = await createHistoryRepository({ store, initialBundle: baseBundle, branch: { branchId: 'branch:main', name: 'main' } })
  const next = await makeMove(baseBundle)
  const result = await repo.checkpoint(next, { branchId: 'branch:main', expectedHead: baseBundle.workspace.workspace_revision, authority: HUMAN, reason: 'user-save' })
  assert.equal(result.workspace_revision, next.workspace.workspace_revision)
  assert.equal(repo.branch('branch:main').head, next.workspace.workspace_revision)
  assert.deepEqual((await repo.explainHistory(next.workspace.workspace_revision)).parents, [baseBundle.workspace.workspace_revision])
  assert.deepEqual(await repo.loadSnapshot(next.workspace.workspace_revision), next)
})

test('autosave recovery is persistent but creates no canonical commit and never silently replays on advanced head', async () => {
  const { createMemoryCarrier, createEgStore } = await loadStore()
  const { createHistoryRepository } = await loadHistory()
  const store = createEgStore(createMemoryCarrier())
  const repo = await createHistoryRepository({ store, initialBundle: baseBundle, branch: { branchId: 'branch:main', name: 'main' } })
  const head = repo.branch('branch:main').head
  await repo.autosaveRecovery({
    profile: 'org.evemisslab.recovery/0.1', session_id: 'session:1', workspace_id: baseBundle.workspace.workspace_id,
    base_workspace_revision: head, last_observed_head: head, pending_commands: [{ command_id: 'cmd:1', base_workspace_revision: head, command_type: 'move', payload: {} }],
    draft_state_hash: 'sha256:' + '1'.repeat(64), created_at: '2026-08-27T10:00:00.000Z', tool: { name: 'test', version: '0.1' }
  })
  assert.equal(repo.branch('branch:main').head, head)
  assert.equal((await repo.recoveryDecision('session:1', head)).status, 'replay-through-normal-validation')
  const advanced = await makeMove(baseBundle)
  await repo.checkpoint(advanced, { branchId: 'branch:main', expectedHead: head, authority: HUMAN, reason: 'checkpoint' })
  assert.equal((await repo.recoveryDecision('session:1', advanced.workspace.workspace_revision)).status, 'branch-rebase-or-merge-required')
})

test('independent intrinsic and placement edits auto-merge while same-channel divergence becomes first-class conflict', async () => {
  const { createMemoryCarrier, createEgStore } = await loadStore()
  const { createHistoryRepository } = await loadHistory()
  const store = createEgStore(createMemoryCarrier())
  const repo = await createHistoryRepository({ store, initialBundle: baseBundle, branch: { branchId: 'branch:main', name: 'main' } })
  await repo.forkBranch({ sourceRevision: baseBundle.workspace.workspace_revision, branchId: 'branch:left', name: 'left' })
  await repo.forkBranch({ sourceRevision: baseBundle.workspace.workspace_revision, branchId: 'branch:right', name: 'right' })
  const left = await makeIntrinsicEdit(baseBundle, '3')
  const right = await makeMove(baseBundle, '300.0', '200.0')
  await repo.checkpoint(left, { branchId: 'branch:left', expectedHead: baseBundle.workspace.workspace_revision, authority: HUMAN, reason: 'left-edit' })
  await repo.checkpoint(right, { branchId: 'branch:right', expectedHead: baseBundle.workspace.workspace_revision, authority: HUMAN, reason: 'right-move' })
  const plan = await repo.planMerge({ baseRevision: baseBundle.workspace.workspace_revision, leftRevision: left.workspace.workspace_revision, rightRevision: right.workspace.workspace_revision })
  assert.equal(plan.status, 'Merged')
  assert.equal(plan.conflicts.length, 0)
  assert.equal(plan.bundle.workspace.object_heads[0].revision, left.workspace.object_heads[0].revision)
  assert.equal(plan.bundle.workspace.placements[0].transform.x, '300.0')

  const rightEdit = await makeIntrinsicEdit(baseBundle, '4')
  await repo.forkBranch({ sourceRevision: baseBundle.workspace.workspace_revision, branchId: 'branch:right-edit', name: 'right-edit' })
  await repo.checkpoint(rightEdit, { branchId: 'branch:right-edit', expectedHead: baseBundle.workspace.workspace_revision, authority: HUMAN, reason: 'right-edit' })
  const conflict = await repo.planMerge({ baseRevision: baseBundle.workspace.workspace_revision, leftRevision: left.workspace.workspace_revision, rightRevision: rightEdit.workspace.workspace_revision })
  assert.equal(conflict.status, 'Conflict')
  assert.equal(conflict.conflicts[0].profile, 'org.evemisslab.history-conflict/0.1')
  assert.equal(conflict.conflicts[0].conflict_type, 'object-content')
})

test('final merge commit preserves both branch heads as parents', async () => {
  const { createMemoryCarrier, createEgStore } = await loadStore()
  const { createHistoryRepository } = await loadHistory()
  const store = createEgStore(createMemoryCarrier())
  const repo = await createHistoryRepository({ store, initialBundle: baseBundle, branch: { branchId: 'branch:main', name: 'main' } })
  await repo.forkBranch({ sourceRevision: baseBundle.workspace.workspace_revision, branchId: 'branch:left', name: 'left' })
  await repo.forkBranch({ sourceRevision: baseBundle.workspace.workspace_revision, branchId: 'branch:right', name: 'right' })
  const left = await makeIntrinsicEdit(baseBundle, '3')
  const right = await makeMove(baseBundle, '300.0', '200.0')
  await repo.checkpoint(left, { branchId: 'branch:left', expectedHead: baseBundle.workspace.workspace_revision, authority: HUMAN, reason: 'left' })
  await repo.checkpoint(right, { branchId: 'branch:right', expectedHead: baseBundle.workspace.workspace_revision, authority: HUMAN, reason: 'right' })
  const merged = await repo.commitMerge({ targetBranchId: 'branch:main', baseRevision: baseBundle.workspace.workspace_revision, leftRevision: left.workspace.workspace_revision, rightRevision: right.workspace.workspace_revision, authority: HUMAN })
  assert.equal(repo.branch('branch:main').head, merged.workspace_revision)
  assert.deepEqual((await repo.explainHistory(merged.workspace_revision)).parents, [left.workspace.workspace_revision, right.workspace.workspace_revision])
})

test('canonical revert creates a new child commit and target revision remains reachable', async () => {
  const { createMemoryCarrier, createEgStore } = await loadStore()
  const { createHistoryRepository } = await loadHistory()
  const store = createEgStore(createMemoryCarrier())
  const repo = await createHistoryRepository({ store, initialBundle: baseBundle, branch: { branchId: 'branch:main', name: 'main' } })
  const moved = await makeMove(baseBundle, '500.0', '400.0')
  await repo.checkpoint(moved, { branchId: 'branch:main', expectedHead: baseBundle.workspace.workspace_revision, authority: HUMAN, reason: 'move' })
  const reverted = await repo.revert({ branchId: 'branch:main', targetRevision: baseBundle.workspace.workspace_revision, authority: HUMAN })
  assert.notEqual(reverted.workspace_revision, baseBundle.workspace.workspace_revision)
  assert.deepEqual((await repo.explainHistory(reverted.workspace_revision)).parents, [moved.workspace.workspace_revision])
  assert.ok(await repo.explainHistory(baseBundle.workspace.workspace_revision))
  const snapshot = await repo.loadSnapshot(reverted.workspace_revision)
  assert.equal(snapshot.workspace.placements[0].transform.x, baseBundle.workspace.placements[0].transform.x)
})
