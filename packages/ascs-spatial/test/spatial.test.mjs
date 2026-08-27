import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

async function loadSpatial() {
  try { return await import('../src/index.mjs') }
  catch (error) { assert.fail(`Milestone C3 spatial implementation missing: ${error.message}`) }
}

const vectors = JSON.parse(await readFile(new URL('./fixtures/spatial_conformance_vectors.json', import.meta.url), 'utf8')).vectors
const byId = Object.fromEntries(vectors.map(v => [v.id, v]))

function expectVector(id, actual) {
  assert.deepEqual(actual, byId[id].expected)
}

test('V1 nested affine composition resolves exact world translation', async () => {
  const { composeAffine, translationOf } = await loadSpatial()
  const v = byId.V1.input
  const world = composeAffine(composeAffine(v.r1, v.r2), v.object)
  expectVector('V1', { world_translation: translationOf(world), status: 'Resolved' })
})

test('V2 view pan/zoom has no canonical authority', async () => {
  const { applyViewTransform } = await loadSpatial()
  const v = byId.V2.input
  expectVector('V2', applyViewTransform(v.workspace_revision, v.view))
})

test('V3/V4 reparent modes preserve the declared coordinate invariant', async () => {
  const { reparentTranslationKeepWorld, reparentTranslationKeepLocal } = await loadSpatial()
  const v3 = byId.V3.input
  expectVector('V3', reparentTranslationKeepWorld(v3.old_world_translation, v3.new_parent_world_translation))
  const v4 = byId.V4.input
  expectVector('V4', reparentTranslationKeepLocal(v4.old_local_translation, v4.new_parent_world_translation))
})

test('V5 region parent graph rejects cycles without commit', async () => {
  const { validateRegionForest } = await loadSpatial()
  expectVector('V5', validateRegionForest({ A: byId.V5.input.A_parent, B: byId.V5.input.B_parent }))
})

test('V6 moving a parent preserves child local coordinates', async () => {
  const { moveParentTranslation } = await loadSpatial()
  expectVector('V6', moveParentTranslation(byId.V6.input.child_local, byId.V6.input.parent_world_after))
})

test('V7 semantic zoom preserves identity/content/execution graph', async () => {
  const { semanticZoomProjection } = await loadSpatial()
  expectVector('V7', semanticZoomProjection(byId.V7.input))
})

test('V8 deny-dominates policy and V9 nearest explicit grammar are deterministic', async () => {
  const { resolvePolicyValue, resolveGrammar } = await loadSpatial()
  expectVector('V8', { effective: resolvePolicyValue([byId.V8.input.ancestor, byId.V8.input.child], 'deny-dominates') })
  expectVector('V9', { effective: resolveGrammar({ ancestor: byId.V9.input.ancestor, child: byId.V9.input.child, childMode: byId.V9.input.child_mode }) })
})

test('V10/V11 spatial parsing remains candidate-only and region-isolated', async () => {
  const { spatialParseCandidate } = await loadSpatial()
  expectVector('V10', spatialParseCandidate(byId.V10.input))
  expectVector('V11', spatialParseCandidate(byId.V11.input))
})

test('V12 explicit cross-region connector survives region motion', async () => {
  const { commitExplicitCrossRegionRelation } = await loadSpatial()
  expectVector('V12', commitExplicitCrossRegionRelation(byId.V12.input))
})

test('V13 reparent changes spatial workspace state without intrinsic content/revision', async () => {
  const { classifyReparentMutation } = await loadSpatial()
  expectVector('V13', classifyReparentMutation(byId.V13.input))
})

test('V14 concurrent distinct placement edits conflict', async () => {
  const { mergePlacement } = await loadSpatial()
  expectVector('V14', mergePlacement(byId.V14.input.base, byId.V14.input.left, byId.V14.input.right))
})

test('V15 intrinsic edit and parent-region move are independent merge channels', async () => {
  const { mergeSpatialChannels } = await loadSpatial()
  expectVector('V15', mergeSpatialChannels(byId.V15.input.left, byId.V15.input.right))
})

test('V16 parent-region delete vs descendant edit conflicts', async () => {
  const { mergeRegionLifecycle } = await loadSpatial()
  expectVector('V16', mergeRegionLifecycle(byId.V16.input.left, byId.V16.input.right))
})

test('V17 collapse/expand remains session state', async () => {
  const { collapseRegionProjection } = await loadSpatial()
  expectVector('V17', collapseRegionProjection(byId.V17.input.workspace_revision, byId.V17.input.collapsed))
})

test('V18 cross-region execution requires explicit export/import port contract', async () => {
  const { compileCrossRegion } = await loadSpatial()
  expectVector('V18', compileCrossRegion(byId.V18.input))
})

test('SpatialModel composes nested transforms, rejects cycles, and supports keep-world / keep-local reparent', async () => {
  const { createSpatialModel, identityAffine, translationAffine, translationOf } = await loadSpatial()
  const model = createSpatialModel({
    regions: [
      { id: 'R1', parent: null, localToParent: translationAffine('100', '0') },
      { id: 'R2', parent: 'R1', localToParent: translationAffine('0', '50') },
    ],
    nodes: [{ id: 'O1', parentRegion: 'R2', localToParent: translationAffine('10', '5') }],
  })
  assert.deepEqual(translationOf(model.worldTransform('O1')), ['110', '55'])
  model.reparentNode('O1', 'R1', { mode: 'keep-world' })
  assert.deepEqual(translationOf(model.worldTransform('O1')), ['110', '55'])
  model.reparentNode('O1', 'R2', { mode: 'keep-local' })
  assert.deepEqual(model.node('O1').localToParent, identityAffine({ translation: ['10', '5'] }))
  assert.throws(() => model.setRegionParent('R1', 'R2'), error => error?.code === 'RegionCycleConflict')
})

test('affine inversion is exact for finite-decimal transforms and rejects singular matrices', async () => {
  const { composeAffine, invertAffine, identityAffine } = await loadSpatial()
  const matrix = ['2', '0', '0', '3', '10.5', '-4.25']
  assert.deepEqual(composeAffine(matrix, invertAffine(matrix)), identityAffine())
  assert.throws(() => invertAffine(['1','0','2','0','0','0']), /non-invertible/)
})
