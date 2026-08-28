import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateTopology, validatePartGraph, validateGlyphFamily, validateRendererProfile, classifyGlyphEquality, semanticZoomProjectionIdentity } from '../src/index.mjs'
const here=path.dirname(fileURLToPath(import.meta.url))
const fixture=(name)=>JSON.parse(fs.readFileSync(path.join(here,'fixtures',name),'utf8'))

test('topology and part graph validate without gaining semantic authority',()=>{
  const glyph=fixture('custom_derivative_glyph_example.json')
  assert.equal(validateTopology(glyph).ok,true)
  const parts=validatePartGraph(glyph)
  assert.equal(parts.ok,true)
  assert.equal(parts.semantic_authority,false)
})

test('family axes are sorted, typed and continuous range uses exact decimal comparison',()=>{
  const fam=fixture('glyph_family_example.json')
  assert.equal(validateGlyphFamily(fam).ok,true)
  const bad=structuredClone(fam); bad.axes=[...bad.axes].reverse(); assert.equal(validateGlyphFamily(bad).ok,false)
  const out=structuredClone(fam); out.axes.find(a=>a.kind==='continuous').default='2'; assert.equal(validateGlyphFamily(out).ok,false)
})

test('renderer fidelity is explicit and never identity authority',()=>{
  const renderer=fixture('renderer_profile_example.json')
  const result=validateRendererProfile(renderer)
  assert.equal(result.ok,true)
  assert.equal(result.identity_authority,false)
})

test('glyph equality is typed and never collapses persistent identity',()=>{
  const glyph=fixture('custom_derivative_glyph_example.json')
  const result=classifyGlyphEquality(glyph,structuredClone(glyph),{semanticBindingsA:[{s:'derivative'}],semanticBindingsB:[{s:'derivative'}]})
  assert.equal(result.geometry_equal,true)
  assert.equal(result.topology_equal,true)
  assert.equal(result.semantic_equal,true)
  assert.equal(result.persistent_identity,false)
})

test('semantic zoom is projection-only and preserves identity',()=>{
  const result=semanticZoomProjectionIdentity({persistent_id:'g',revision_id:'r'},1,32)
  assert.equal(result.same_identity,true)
  assert.equal(result.authority,'projection-only')
})
