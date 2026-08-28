import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateGlyphObject, validateGlyphFamily, validateGlyphBinding, validateRendererProfile, validateGscBridge, executeGlyphConformanceVector } from '../src/index.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', name), 'utf8'))

test('frozen v0.6 fixture set contains exactly 30 unique glyph vectors', () => {
  const vectors = fixture('glyph_conformance_vectors.json')
  assert.equal(vectors.profile, 'glyph-conformance-vectors/0.6')
  assert.equal(vectors.vectors.length, 30)
  assert.equal(new Set(vectors.vectors.map((item) => item.id)).size, 30)
})

test('public Native Glyph APIs validate frozen examples through candidate semantics', () => {
  assert.equal(validateGlyphObject(fixture('custom_derivative_glyph_example.json')).ok, true)
  assert.equal(validateGlyphFamily(fixture('glyph_family_example.json')).ok, true)
  assert.equal(validateGlyphBinding(fixture('glyph_binding_example.json').semantic_binding).ok, true)
  assert.equal(validateRendererProfile(fixture('renderer_profile_example.json')).ok, true)
  const bridge = fixture('gsc_asset_symbol_v07_bridge_example.json')
  const source = fixture('gsc_generated_assetsymbol_v07.json')
  assert.equal(validateGscBridge(bridge, source).ok, true)
  const vector = fixture('glyph_conformance_vectors.json').vectors[0]
  assert.equal(executeGlyphConformanceVector(vector).expectation, vector.expectation)
})
