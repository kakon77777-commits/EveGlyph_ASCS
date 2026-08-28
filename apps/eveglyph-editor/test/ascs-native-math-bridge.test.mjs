import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

await import('../src/ascs/register.js')

const bundle = JSON.parse(await fs.readFile(new URL('../../../packages/ascs-core/test/fixtures/minimal_workspace.egir.json', import.meta.url), 'utf8'))
const candidate = JSON.parse(await fs.readFile(new URL('../../../packages/ascs-math/test/fixtures/native_math_integral_example.json', import.meta.url), 'utf8'))
const MATH_ID = bundle.object_records.find((item) => item.kind === 'math').persistent_id
const HUMAN = { actor: { type: 'human', id: 'editor-native-math-test' }, mode: 'explicit' }

test('hidden EveGlyph bridge exposes safe Native Math service and no authority shortcuts', async () => {
  const api = globalThis.EveGlyphASCS
  assert.equal(typeof api?.createNativeMathService, 'function')
  for (const forbidden of ['parseLatexToCanonical', 'parseMathMLToCanonical', 'cas', 'prover', 'commitExtensionMutation', 'createWorkspaceRuntime']) {
    assert.equal(api?.[forbidden], undefined, `${forbidden} must not escape the safe product facade`)
  }

  const workspace = await api.createCanonicalWorkspaceBridge(bundle)
  const math = api.createNativeMathService(workspace)
  const before = workspace.workspaceRevision
  const commit = await math.edit(MATH_ID, { math: candidate, baseWorkspaceRevision: before, authority: HUMAN })
  assert.equal(commit.status, 'Committed')
  assert.equal(math.inspect(MATH_ID).profile, 'ncm/1.0-candidate.1')
  assert.match(math.projectLatex(MATH_ID).source, /\\int/)
  assert.match(math.projectMathML(MATH_ID).source, /<math/)
})
