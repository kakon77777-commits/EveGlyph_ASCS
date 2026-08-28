import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { executeGlyphConformanceVector } from '../src/index.mjs'
const here=path.dirname(fileURLToPath(import.meta.url))
const fixture=(name)=>JSON.parse(fs.readFileSync(path.join(here,'fixtures',name),'utf8'))

test('all 30 frozen v0.6 Glyph vectors execute through production invariants',()=>{
  const vectors=fixture('glyph_conformance_vectors.json')
  const fixtures={
    glyph:fixture('custom_derivative_glyph_example.json'),
    family:fixture('glyph_family_example.json'),
    bindings:fixture('glyph_binding_example.json'),
    renderer:fixture('renderer_profile_example.json'),
    bridge:fixture('gsc_asset_symbol_v07_bridge_example.json'),
    gscAsset:fixture('gsc_generated_assetsymbol_v07.json'),
  }
  assert.equal(vectors.vectors.length,30)
  for (const vector of vectors.vectors) {
    const result=executeGlyphConformanceVector(vector,fixtures)
    assert.equal(result.passed,true,vector.id)
    assert.equal(result.outcome,vector.expectation,vector.id)
  }
})
