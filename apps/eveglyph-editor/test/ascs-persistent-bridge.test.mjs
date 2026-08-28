import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

await import('../src/ascs/register.js')

const bundle = JSON.parse(await readFile(new URL('../../../packages/ascs-core/test/fixtures/minimal_workspace.egir.json', import.meta.url), 'utf8'))
const objectId = bundle.object_records[0].persistent_id
const HUMAN = { actor: { type: 'human', id: 'human:editor-test' }, mode: 'explicit' }

function runtimeOptions() {
  let n = 0
  return {
    clock: () => `2026-08-28T04:30:${String(n++).padStart(2, '0')}.000Z`,
    idFactory: () => `urn:uuid:0198f200-${String(n).padStart(4, '0')}-7000-8000-${String(n).padStart(12, '0')}`,
  }
}

test('Milestone C hidden bridge exposes safe persistent workspace and spatial factories only', async () => {
  const api = globalThis.EveGlyphASCS
  assert.equal(typeof api?.createPersistentWorkspace, 'function')
  assert.equal(typeof api?.createHistoryRepository, 'function')
  assert.equal(typeof api?.createSpatialModel, 'function')

  assert.equal(api.createEgStore, undefined)
  assert.equal(api.createMemoryCarrier, undefined)
  assert.equal(api.createOpfsCarrier, undefined)
  assert.equal(api.commitExtensionMutation, undefined)

  const workspace = await api.createPersistentWorkspace(bundle, {
    persistence: { kind: 'memory' },
    branch: { branchId: 'branch:main', name: 'main' },
    runtimeOptions: runtimeOptions(),
  })

  const initialHead = workspace.branch('branch:main').head
  assert.equal(initialHead, bundle.workspace.workspace_revision)
  assert.equal(workspace.workspaceRevision, initialHead)
  assert.equal(workspace.durabilityClass, 'D0')

  await workspace.moveObject(objectId, {
    x: '240.0', y: '160.0',
    baseWorkspaceRevision: workspace.workspaceRevision,
    authority: HUMAN,
  })
  assert.notEqual(workspace.workspaceRevision, initialHead)
  assert.equal(workspace.branch('branch:main').head, initialHead, 'runtime mutation is not a history checkpoint by itself')

  const checkpoint = await workspace.checkpoint({ branchId: 'branch:main', authority: HUMAN, reason: 'editor-save' })
  assert.equal(checkpoint.workspace_revision, workspace.workspaceRevision)
  assert.equal(workspace.branch('branch:main').head, workspace.workspaceRevision)
  assert.deepEqual(await workspace.loadSnapshot(workspace.workspaceRevision), workspace.snapshot())

  const spatial = api.createSpatialModel({
    regions: [{ id: 'R1', parent: null, localToParent: ['1','0','0','1','100','0'] }],
    nodes: [{ id: 'O1', parentRegion: 'R1', localToParent: ['1','0','0','1','10','5'] }],
  })
  assert.deepEqual(spatial.worldTransform('O1'), ['1','0','0','1','110','5'])
})

test('safe history factory accepts persistence configuration instead of a raw carrier', async () => {
  const history = await globalThis.EveGlyphASCS.createHistoryRepository({
    initialBundle: bundle,
    persistence: { kind: 'memory' },
    branch: { branchId: 'branch:main', name: 'main' },
  })
  assert.equal(history.branch('branch:main').head, bundle.workspace.workspace_revision)
  assert.equal(history.store, undefined, 'raw EGStore must not escape through the Editor global facade')
  assert.equal(history.carrier, undefined, 'raw carrier must not escape through the Editor global facade')
})
