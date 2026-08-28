import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  validGlyphScalar, compareGlyphScalars, validateGlyphPath, validateExactCarry,
  validateComponentGraph, expandComponents, canonicalizeGlyphObject, validateGlyphObject,
} from '../src/index.mjs'
const here=path.dirname(fileURLToPath(import.meta.url))
const fixture=(name)=>JSON.parse(fs.readFileSync(path.join(here,'fixtures',name),'utf8'))

test('glyph scalar grammar is canonical decimal string only',()=>{
  for (const v of ['0','1','-1','0.5','-0.5','1000']) assert.equal(validGlyphScalar(v),true,v)
  for (const v of ['-0','00','01','1.0','1.20','.5','1e2',1,NaN]) assert.equal(validGlyphScalar(v),false,String(v))
  assert.equal(compareGlyphScalars('-0.5','0'),-1)
  assert.equal(compareGlyphScalars('0.5','0.50'.replace(/0$/,'')),0)
})

test('path state machine requires M first and Z final',()=>{
  assert.equal(validateGlyphPath({path_id:'ok',commands:[{op:'M',x:'0',y:'0'},{op:'L',x:'1',y:'1'},{op:'Z'}]}).ok,true)
  assert.equal(validateGlyphPath({path_id:'bad',commands:[{op:'L',x:'0',y:'0'}]}).ok,false)
  assert.equal(validateGlyphPath({path_id:'bad2',commands:[{op:'M',x:'0',y:'0'},{op:'Z'},{op:'L',x:'1',y:'1'}]}).ok,false)
})

test('exact carry requires valid palette indices and full sequential coverage',()=>{
  const carry={carry_id:'c',kind:'palette-runs-v1',canvas:{width:2,height:2},palette:[[0,0,0,0],[255,255,255,255]],runs:[{op:'RUN',y:0,x:0,length:2,palette_index:0},{op:'RUN',y:1,x:0,length:2,palette_index:1}],fidelity:'exact'}
  assert.equal(validateExactCarry(carry).ok,true)
  const gap=structuredClone(carry); gap.runs[1].x=1; assert.equal(validateExactCarry(gap).ok,false)
  const bad=structuredClone(carry); bad.runs[0].palette_index=9; assert.equal(validateExactCarry(bad).ok,false)
})

test('component refs pin revision and expansion is cycle/budget checked',()=>{
  const self={profile:'glyph/1.0-candidate.1',geometry:{paths:[],exact_carries:[],components:[{component_id:'self',glyph_ref:{persistent_id:'g',revision_id:'r'},transform:['1','0','0','1','0','0']}]}}
  assert.equal(validateComponentGraph(self,{currentRef:{persistent_id:'g',revision_id:'r'}}).ok,false)
  const registry=new Map([
    ['a\0ra',{geometry:{paths:[],exact_carries:[],components:[{component_id:'b',glyph_ref:{persistent_id:'b',revision_id:'rb'},transform:['1','0','0','1','0','0']}]}}],
    ['b\0rb',{geometry:{paths:[],exact_carries:[],components:[]}}],
  ])
  const result=expandComponents({persistent_id:'a',revision_id:'ra'},(ref)=>registry.get(`${ref.persistent_id}\0${ref.revision_id}`))
  assert.equal(result.children.length,1)
})

test('frozen custom derivative glyph validates and canonicalization only reorders structural records',()=>{
  const glyph=fixture('custom_derivative_glyph_example.json')
  assert.equal(validateGlyphObject(glyph).ok,true)
  const scrambled=structuredClone(glyph)
  scrambled.geometry.paths=[...glyph.geometry.paths].reverse()
  const canonical=canonicalizeGlyphObject(scrambled)
  assert.deepEqual(canonical.geometry.paths.map(x=>x.path_id),[...glyph.geometry.paths.map(x=>x.path_id)].sort())
  assert.deepEqual(canonical.geometry.paths[0].commands,glyph.geometry.paths[0].commands)
})
