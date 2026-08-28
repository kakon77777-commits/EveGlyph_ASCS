import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { contentAddress, revisionAddress, workspaceRevisionAddress } from '../../ascs-core/src/index.mjs'
import { createWorkspaceRuntime } from '../../ascs-runtime/src/index.mjs'
import { createNativeGlyphService } from '../src/service.mjs'

const here=path.dirname(fileURLToPath(import.meta.url))
const template=JSON.parse(fs.readFileSync(path.resolve(here,'../../ascs-core/test/fixtures/minimal_workspace.egir.json'),'utf8'))
const candidate=JSON.parse(fs.readFileSync(path.join(here,'fixtures/custom_derivative_glyph_example.json'),'utf8'))
const GLYPH_ID=template.object_records[0].persistent_id
const HUMAN={actor:{type:'human',id:'glyph-service-test'},mode:'explicit'}

async function glyphBundle(profile='glyph/0.1') {
  const bundle=structuredClone(template)
  const object=bundle.object_records[0]
  const revision=bundle.revision_records.find(r=>r.persistent_id===object.persistent_id)
  object.kind='glyph'
  revision.kind='glyph'
  revision.intrinsic=profile==='glyph/0.1' ? {profile:'glyph/0.1',geometry:{kind:'legacy-outline',data:'opaque'}} : structuredClone(candidate)
  revision.content_address=await contentAddress('glyph',revision.intrinsic)
  revision.revision_id=await revisionAddress(revision)
  object.heads.main=revision.revision_id
  bundle.workspace.object_heads[0].revision=revision.revision_id
  bundle.workspace.workspace_revision=await workspaceRevisionAddress(bundle.workspace)
  return bundle
}
function runtimeOptions(){let n=0;return{clock:()=>`2026-08-28T11:30:${String(++n).padStart(2,'0')}.000Z`,idFactory:()=>`urn:uuid:0199ee10-0000-7abc-8def-${(++n).toString(16).padStart(12,'0')}`}}
async function bridge(){const runtime=await createWorkspaceRuntime(await glyphBundle(),runtimeOptions());return Object.freeze({get workspaceRevision(){return runtime.workspaceRevision},objectHead:(id,b='main')=>runtime.objectHead(id,b),revision:(id)=>runtime.revision(id),editIntrinsic:(id,c)=>runtime.editIntrinsic(id,c)})}

test('Native Glyph service inspects legacy glyph without silent reinterpretation',async()=>{
  const service=createNativeGlyphService(await bridge())
  const info=service.inspect(GLYPH_ID)
  assert.equal(info.kind,'glyph'); assert.equal(info.profile,'glyph/0.1'); assert.equal(info.candidate_profile,false); assert.equal(info.migration,'explicit-optional')
})

test('invalid Glyph candidate fails before canonical mutation',async()=>{
  const b=await bridge(); const service=createNativeGlyphService(b); const before=b.workspaceRevision
  const invalid=structuredClone(candidate); invalid.geometry.paths[0].commands[0].op='L'
  await assert.rejects(()=>service.edit(GLYPH_ID,{glyph:invalid,baseWorkspaceRevision:before,authority:HUMAN}),(e)=>e?.name==='NativeGlyphValidationError')
  assert.equal(b.workspaceRevision,before)
})

test('valid Glyph edit routes through existing authority runtime and projects safely',async()=>{
  const b=await bridge(); const service=createNativeGlyphService(b); const base=b.workspaceRevision
  const commit=await service.edit(GLYPH_ID,{glyph:candidate,baseWorkspaceRevision:base,authority:HUMAN})
  assert.equal(commit.status,'Committed'); assert.notEqual(b.workspaceRevision,base)
  assert.equal(service.inspect(GLYPH_ID).profile,'glyph/1.0-candidate.1')
  assert.equal(service.validate(GLYPH_ID).ok,true)
  assert.equal(service.projectSvg(GLYPH_ID).authority,'projection-only')
  assert.equal(service.projectAccessibility(GLYPH_ID).unicode_required,false)
})

test('stale Glyph base preserves canonical Conflict',async()=>{
  const b=await bridge(); const service=createNativeGlyphService(b); const stale=b.workspaceRevision
  await service.edit(GLYPH_ID,{glyph:candidate,baseWorkspaceRevision:stale,authority:HUMAN})
  await assert.rejects(()=>service.edit(GLYPH_ID,{glyph:candidate,baseWorkspaceRevision:stale,authority:HUMAN}),(e)=>e?.name==='ConflictError')
})

test('binding operations remain separate from intrinsic workspace revision',async()=>{
  const b=await bridge(); const service=createNativeGlyphService(b); const before=b.workspaceRevision
  const raw=JSON.parse(fs.readFileSync(path.join(here,'fixtures/glyph_binding_example.json'),'utf8'))[0]
  const candidateBinding=service.createBindingCandidate(raw)
  const promoted=service.promoteBinding(candidateBinding,HUMAN)
  assert.equal(promoted.authority,'explicit')
  assert.equal(b.workspaceRevision,before)
})
