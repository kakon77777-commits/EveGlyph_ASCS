import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  validateGlyphBinding,promoteBindingCandidate,revokeBinding,bindGlyphToMathSymbol,validateMathGlyphBinding,
  validateGscBridge,classifySvgImport,projectGlyphToSvg,projectGlyphAccessibility,
} from '../src/index.mjs'
const here=path.dirname(fileURLToPath(import.meta.url))
const fixture=(name)=>JSON.parse(fs.readFileSync(path.join(here,'fixtures',name),'utf8'))

test('semantic candidate requires explicit promotion and promotion does not change glyph ref',()=>{
  const candidate=fixture('glyph_binding_example.json')[0]
  assert.equal(validateGlyphBinding(candidate).ok,true)
  assert.equal(candidate.authority,'candidate')
  assert.throws(()=>promoteBindingCandidate(candidate,{mode:'proposal'}))
  const promoted=promoteBindingCandidate(candidate,{mode:'explicit',actor:{type:'human'}})
  assert.equal(promoted.authority,'explicit')
  assert.deepEqual(promoted.glyph_ref,candidate.glyph_ref)
  assert.equal(revokeBinding(promoted,{mode:'explicit',actor:{type:'human'}}).authority,'revoked')
})

test('behavior binding declares runtime.execute but content does not grant execution',()=>{
  const behavior=fixture('glyph_binding_example.json').find(b=>b.kind==='behavior')
  assert.equal(validateGlyphBinding(behavior).ok,true)
  const bad=structuredClone(behavior); bad.required_capabilities=[]; assert.equal(validateGlyphBinding(bad).ok,false)
  assert.deepEqual(behavior.required_capabilities,['runtime.execute'])
})

test('Unicode and OpenType mappings are typed adapters, not glyph identity',()=>{
  const glyphRef={persistent_id:'g',revision_id:'r'}
  const u={profile:'glyph-binding/1.0-candidate.1',binding_id:'u',glyph_ref:glyphRef,kind:'unicode-sequence',authority:'candidate',target:{codepoints:['U+0066','U+0069']},required_capabilities:[],provenance:{actor_class:'importer',tool:'font',evidence_class:'imported'}}
  const ot={profile:'glyph-binding/1.0-candidate.1',binding_id:'ot',glyph_ref:glyphRef,kind:'opentype-glyph',authority:'candidate',target:{font_digest:'sha256:x',glyph_id:42},required_capabilities:[],provenance:{actor_class:'importer',tool:'font',evidence_class:'imported'}}
  assert.equal(validateGlyphBinding(u).ok,true)
  assert.equal(validateGlyphBinding(ot).ok,true)
  assert.deepEqual(u.glyph_ref,ot.glyph_ref)
})

test('SVG import is inert candidate data and active content is flagged',()=>{
  const safe=classifySvgImport('<svg><path d="M0 0L1 1"/></svg>')
  assert.equal(safe.executable,false)
  assert.equal(safe.unsafe_active_content,false)
  const unsafe=classifySvgImport('<svg onload="run()"><script>alert(1)</script></svg>')
  assert.equal(unsafe.executable,false)
  assert.equal(unsafe.unsafe_active_content,true)
})

test('GSC bridge remains source-blind, carry-lossless, non-semantic',()=>{
  const bridge=fixture('gsc_asset_symbol_v07_bridge_example.json')
  const asset=fixture('gsc_generated_assetsymbol_v07.json')
  const result=validateGscBridge(bridge,asset)
  assert.equal(result.ok,true)
  assert.equal(result.semantic_authority,false)
})

test('SVG/accessibility projections work for custom non-Unicode glyph',()=>{
  const glyph=fixture('custom_derivative_glyph_example.json')
  const svg=projectGlyphToSvg(glyph)
  assert.match(svg.source,/^<svg/)
  assert.equal(svg.authority,'projection-only')
  const a11y=projectGlyphAccessibility(glyph,[fixture('glyph_binding_example.json')[1]])
  assert.match(a11y.label,/derivative/)
  assert.equal(a11y.unicode_required,false)
})

test('Native Math symbol binding preserves separate Glyph identity',()=>{
  const ref={persistent_id:'g',revision_id:'rev1'}
  const b=bindGlyphToMathSymbol(ref,{registry:'eg-math-core',symbol:'derivative',version:1})
  assert.equal(validateMathGlyphBinding(b).ok,true)
  assert.deepEqual(b.glyph_ref,ref)
  assert.deepEqual(b.target,{registry:'eg-math-core',symbol:'derivative',version:'1'})
})
