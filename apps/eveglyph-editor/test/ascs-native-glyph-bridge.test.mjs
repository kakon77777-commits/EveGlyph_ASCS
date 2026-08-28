import test from 'node:test'
import assert from 'node:assert/strict'

await import('../src/ascs/register.js')

test('hidden EveGlyph bridge exposes safe Native Glyph service and no execution/authority shortcuts',()=>{
  const api=globalThis.EveGlyphASCS
  assert.equal(typeof api?.createNativeGlyphService,'function')
  for (const forbidden of ['executeSvgScript','executeFontProgram','rawRendererDom','recognizeGlyphAsCanonical','grantCapability','commitExtensionMutation','createWorkspaceRuntime']) {
    assert.equal(api?.[forbidden],undefined,`${forbidden} must not escape the safe product facade`)
  }
})
