const UUID_URN = /^urn:uuid:[0-9a-fA-F-]{36}$/
const WREV = /^wrev:sha256:[0-9a-f]{64}$/
const SHA256 = /^[0-9a-f]{64}$/
const CONTEXT_ID = /^context-pack:sha256:[0-9a-f]{64}$/

const PRINCIPAL_CLASSES = new Set(['ai-agent', 'automation', 'hybrid-agent'])
const IDENTITY_SCOPES = new Set(['workspace', 'installation', 'federated', 'ephemeral'])
const CONTROLLER_TYPES = new Set(['human', 'organization', 'system'])
const MODES = new Set(['suggest', 'patch', 'direct'])
const TRUST_CLASSES = new Set(['directive', 'trusted-policy', 'trusted-data', 'untrusted-data', 'generated-data'])
const SOURCE_ROLES = new Set(['workspace-policy', 'protected-glossary', 'workspace-memory', 'workspace-document', 'selection', 'tool-catalog', 'external-resource', 'adapter-metadata', 'user-directive'])
const AUTHORITY_ORIGINS = new Set(['explicit-user', 'committed-policy', 'committed-data', 'workspace-data', 'external-data', 'adapter', 'generated'])
const TOOL_EFFECTS = new Set(['canonical-read', 'canonical-write', 'candidate-write', 'execution', 'external-read', 'external-write', 'external-process', 'external-network'])
const RUN_STATUSES = new Set(['completed', 'failed', 'cancelled', 'timed-out', 'conflicted'])
const PROPOSAL_STATUSES = new Set(['proposed', 'validated', 'approved', 'rejected', 'committed', 'conflicted', 'superseded'])
const COMMAND_KINDS = new Set(['advisory', 'create-object', 'edit-object', 'move-object', 'clone-object', 'create-candidate', 'promote-relation', 'execute', 'external-effect'])
const COMMAND_EFFECTS = new Set(['pure-read', 'canonical-write', 'candidate-write', 'execution', 'external-read', 'external-write', 'external-process', 'external-network'])
const REPLAY_POLICIES = new Set(['at-most-once', 'idempotent', 'safe-retry', 'manual', null])
const CANONICAL_MUTATION = new Set(['forbidden', 'proposal-only', 'allowed-if-capable'])
const HUMAN_REVIEW = new Set(['not-applicable', 'required', 'policy-dependent'])

function issue(errors, code, path, message) { errors.push({ code, path, message }) }
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) }
function required(errors, obj, names, base='') { for (const name of names) if (!Object.hasOwn(obj, name)) issue(errors, 'MissingProperty', base ? `${base}.${name}` : name, 'required property is missing') }
function extras(errors, obj, allowed, base='') { if (!plain(obj)) return; for (const key of Object.keys(obj)) if (!allowed.has(key)) issue(errors, 'UnexpectedProperty', base ? `${base}.${key}` : key, 'property is not allowed by the frozen profile') }
function str(errors, value, path, { min=0, max=Infinity, pattern=null, nullable=false }={}) {
  if (nullable && value === null) return
  if (typeof value !== 'string') { issue(errors, 'InvalidType', path, 'expected string'); return }
  if (value.length < min || value.length > max) issue(errors, 'InvalidLength', path, `string length must be ${min}..${max}`)
  if (pattern && !pattern.test(value)) issue(errors, 'InvalidPattern', path, 'string does not match frozen pattern')
}
function object(errors, value, path) { if (!plain(value)) issue(errors, 'InvalidType', path, 'expected object') }
function array(errors, value, path, { min=0 }={}) { if (!Array.isArray(value)) { issue(errors, 'InvalidType', path, 'expected array'); return false } if (value.length < min) issue(errors, 'MinItems', path, `expected at least ${min} item(s)`); return true }
function enm(errors, value, path, values) { if (!values.has(value)) issue(errors, 'InvalidEnum', path, `unexpected value ${JSON.stringify(value)}`) }
function bool(errors, value, path) { if (typeof value !== 'boolean') issue(errors, 'InvalidType', path, 'expected boolean') }
function dateTime(errors, value, path, nullable=false) {
  if (nullable && value === null) return
  str(errors, value, path)
  if (typeof value === 'string' && Number.isNaN(Date.parse(value))) issue(errors, 'InvalidDateTime', path, 'expected RFC3339/date-time')
}
function uniqueStrings(errors, value, path, pattern=null) {
  if (!array(errors, value, path)) return
  const seen = new Set()
  for (let i=0;i<value.length;i++) {
    str(errors, value[i], `${path}[${i}]`, pattern ? { pattern } : {})
    if (typeof value[i] === 'string') {
      if (seen.has(value[i])) issue(errors, 'DuplicateItem', `${path}[${i}]`, 'array items must be unique')
      seen.add(value[i])
    }
  }
}
function result(errors) { return { ok: errors.length === 0, errors } }
function ensureRoot(value, errors) { if (!plain(value)) { issue(errors, 'InvalidType', '', 'expected object'); return false } return true }
function profile(errors, obj, expected) { if (obj.profile !== expected) issue(errors, 'InvalidProfile', 'profile', `expected ${expected}`) }

export function validateAgentPrincipal(value) {
  const errors=[]; if (!ensureRoot(value, errors)) return result(errors)
  const allowed=new Set(['profile','principal_id','principal_class','identity_scope','label','controller','created_at','default_policy_ref','metadata'])
  required(errors,value,['profile','principal_id','principal_class','identity_scope','label','controller','created_at','metadata']); extras(errors,value,allowed); profile(errors,value,'agent-principal/1.0-candidate.1')
  str(errors,value.principal_id,'principal_id',{pattern:UUID_URN}); enm(errors,value.principal_class,'principal_class',PRINCIPAL_CLASSES); enm(errors,value.identity_scope,'identity_scope',IDENTITY_SCOPES); str(errors,value.label,'label',{min:1,max:200}); dateTime(errors,value.created_at,'created_at'); if (Object.hasOwn(value,'default_policy_ref')) str(errors,value.default_policy_ref,'default_policy_ref',{nullable:true}); object(errors,value.metadata,'metadata')
  if (plain(value.controller)) { required(errors,value.controller,['type','ref'],'controller'); extras(errors,value.controller,new Set(['type','ref']),'controller'); enm(errors,value.controller.type,'controller.type',CONTROLLER_TYPES); str(errors,value.controller.ref,'controller.ref',{min:1}) } else object(errors,value.controller,'controller')
  return result(errors)
}

export function validateContextPack(value) {
  const errors=[]; if (!ensureRoot(value,errors)) return result(errors)
  const allowed=new Set(['profile','context_pack_id','workspace_id','base_workspace_revision','task','mode','policy_snapshot','tool_manifest','sources','selection_refs','created_at','metadata'])
  required(errors,value,[...allowed]); extras(errors,value,allowed); profile(errors,value,'agent-context-pack/1.0-candidate.1')
  str(errors,value.context_pack_id,'context_pack_id',{pattern:CONTEXT_ID}); str(errors,value.workspace_id,'workspace_id',{pattern:UUID_URN}); str(errors,value.base_workspace_revision,'base_workspace_revision',{pattern:WREV}); enm(errors,value.mode,'mode',MODES); dateTime(errors,value.created_at,'created_at'); object(errors,value.metadata,'metadata')
  if (plain(value.task)) { required(errors,value.task,['task_id','directive','authority_class'],'task'); extras(errors,value.task,new Set(['task_id','directive','authority_class']),'task'); str(errors,value.task.task_id,'task.task_id',{pattern:UUID_URN}); str(errors,value.task.directive,'task.directive',{min:1}); if (value.task.authority_class!=='run-directive') issue(errors,'InvariantViolation','task.authority_class','must remain run-directive') } else object(errors,value.task,'task')
  if (plain(value.policy_snapshot)) { required(errors,value.policy_snapshot,['review_policy_id','policy_revision','capability_grant_ids'],'policy_snapshot'); extras(errors,value.policy_snapshot,new Set(['review_policy_id','policy_revision','capability_grant_ids']),'policy_snapshot'); str(errors,value.policy_snapshot.review_policy_id,'policy_snapshot.review_policy_id',{min:1}); str(errors,value.policy_snapshot.policy_revision,'policy_snapshot.policy_revision',{min:1}); uniqueStrings(errors,value.policy_snapshot.capability_grant_ids,'policy_snapshot.capability_grant_ids',UUID_URN) } else object(errors,value.policy_snapshot,'policy_snapshot')
  if (plain(value.tool_manifest)) {
    required(errors,value.tool_manifest,['manifest_id','tools'],'tool_manifest'); extras(errors,value.tool_manifest,new Set(['manifest_id','tools']),'tool_manifest'); str(errors,value.tool_manifest.manifest_id,'tool_manifest.manifest_id',{min:1})
    if (array(errors,value.tool_manifest.tools,'tool_manifest.tools')) for (let i=0;i<value.tool_manifest.tools.length;i++) { const t=value.tool_manifest.tools[i]; const p=`tool_manifest.tools[${i}]`; if (!plain(t)) { object(errors,t,p); continue } required(errors,t,['name','effect_class','schema_hash'],p); extras(errors,t,new Set(['name','effect_class','schema_hash']),p); str(errors,t.name,`${p}.name`,{min:1}); enm(errors,t.effect_class,`${p}.effect_class`,TOOL_EFFECTS); str(errors,t.schema_hash,`${p}.schema_hash`,{pattern:SHA256}) }
  } else object(errors,value.tool_manifest,'tool_manifest')
  if (array(errors,value.sources,'sources')) for (let i=0;i<value.sources.length;i++) { const s=value.sources[i]; const p=`sources[${i}]`; if (!plain(s)) { object(errors,s,p); continue } required(errors,s,['source_id','role','trust_class','ref','content_sha256','authority_origin','inline_content'],p); extras(errors,s,new Set(['source_id','role','trust_class','ref','content_sha256','authority_origin','inline_content','snapshot_revision']),p); str(errors,s.source_id,`${p}.source_id`,{min:1}); enm(errors,s.role,`${p}.role`,SOURCE_ROLES); enm(errors,s.trust_class,`${p}.trust_class`,TRUST_CLASSES); str(errors,s.ref,`${p}.ref`,{min:1}); str(errors,s.content_sha256,`${p}.content_sha256`,{pattern:SHA256}); enm(errors,s.authority_origin,`${p}.authority_origin`,AUTHORITY_ORIGINS); str(errors,s.inline_content,`${p}.inline_content`,{nullable:true}); if (Object.hasOwn(s,'snapshot_revision')) str(errors,s.snapshot_revision,`${p}.snapshot_revision`,{nullable:true}) }
  if (array(errors,value.selection_refs,'selection_refs')) for (let i=0;i<value.selection_refs.length;i++) str(errors,value.selection_refs[i],`selection_refs[${i}]`)
  return result(errors)
}

export function validateAgentRun(value) {
  const errors=[]; if (!ensureRoot(value,errors)) return result(errors)
  const allowed=new Set(['profile','run_id','principal_id','context_pack_id','base_workspace_revision','mode','model_binding','adapter_binding','capability_grant_ids','status','started_at','finished_at','proposal_ids','external_effect_ids','diagnostics','metadata'])
  required(errors,value,[...allowed]); extras(errors,value,allowed); profile(errors,value,'agent-run/1.0-candidate.1')
  str(errors,value.run_id,'run_id',{pattern:UUID_URN}); str(errors,value.principal_id,'principal_id',{pattern:UUID_URN}); str(errors,value.context_pack_id,'context_pack_id',{pattern:CONTEXT_ID}); str(errors,value.base_workspace_revision,'base_workspace_revision',{pattern:WREV}); enm(errors,value.mode,'mode',MODES); enm(errors,value.status,'status',RUN_STATUSES); dateTime(errors,value.started_at,'started_at'); dateTime(errors,value.finished_at,'finished_at',true); uniqueStrings(errors,value.capability_grant_ids,'capability_grant_ids',UUID_URN); object(errors,value.metadata,'metadata')
  if (plain(value.model_binding)) { const p='model_binding'; required(errors,value.model_binding,['provider','model','runtime','binding_is_identity_authority'],p); extras(errors,value.model_binding,new Set(['provider','model','runtime','model_revision','binding_is_identity_authority']),p); str(errors,value.model_binding.provider,`${p}.provider`,{min:1}); str(errors,value.model_binding.model,`${p}.model`,{min:1}); str(errors,value.model_binding.runtime,`${p}.runtime`,{min:1}); if(Object.hasOwn(value.model_binding,'model_revision')) str(errors,value.model_binding.model_revision,`${p}.model_revision`,{nullable:true}); if(value.model_binding.binding_is_identity_authority!==false) issue(errors,'IdentityAuthorityForbidden',`${p}.binding_is_identity_authority`,'model binding is never identity authority') } else object(errors,value.model_binding,'model_binding')
  if (plain(value.adapter_binding)) { const p='adapter_binding'; required(errors,value.adapter_binding,['adapter_id','profile','protocol_version'],p); extras(errors,value.adapter_binding,new Set(['adapter_id','profile','protocol_version']),p); str(errors,value.adapter_binding.adapter_id,`${p}.adapter_id`,{min:1}); str(errors,value.adapter_binding.profile,`${p}.profile`,{min:1}); str(errors,value.adapter_binding.protocol_version,`${p}.protocol_version`,{nullable:true}) } else object(errors,value.adapter_binding,'adapter_binding')
  for (const [name, pattern] of [['proposal_ids',UUID_URN],['external_effect_ids',UUID_URN]]) uniqueStrings(errors,value[name],name,pattern)
  if (array(errors,value.diagnostics,'diagnostics')) for (let i=0;i<value.diagnostics.length;i++) str(errors,value.diagnostics[i],`diagnostics[${i}]`)
  return result(errors)
}

export function validateAgentProposal(value) {
  const errors=[]; if (!ensureRoot(value,errors)) return result(errors)
  const allowed=new Set(['profile','proposal_id','run_id','principal_id','mode','base_workspace_revision','commands','review','validation','status','created_at','metadata'])
  required(errors,value,[...allowed]); extras(errors,value,allowed); profile(errors,value,'agent-proposal/1.0-candidate.1')
  str(errors,value.proposal_id,'proposal_id',{pattern:UUID_URN}); str(errors,value.run_id,'run_id',{pattern:UUID_URN}); str(errors,value.principal_id,'principal_id',{pattern:UUID_URN}); enm(errors,value.mode,'mode',MODES); str(errors,value.base_workspace_revision,'base_workspace_revision',{pattern:WREV,nullable:true}); enm(errors,value.status,'status',PROPOSAL_STATUSES); dateTime(errors,value.created_at,'created_at'); object(errors,value.metadata,'metadata')
  if (array(errors,value.commands,'commands',{min:1})) for (let i=0;i<value.commands.length;i++) { const c=value.commands[i]; const p=`commands[${i}]`; if(!plain(c)){object(errors,c,p);continue} required(errors,c,['command_id','command_kind','effect_class','target','payload_digest','required_capabilities','validator_profile','replay_policy'],p); extras(errors,c,new Set(['command_id','command_kind','effect_class','target','payload_digest','base_object_revision','required_capabilities','validator_profile','replay_policy']),p); str(errors,c.command_id,`${p}.command_id`,{pattern:UUID_URN}); enm(errors,c.command_kind,`${p}.command_kind`,COMMAND_KINDS); enm(errors,c.effect_class,`${p}.effect_class`,COMMAND_EFFECTS); str(errors,c.target,`${p}.target`,{nullable:true}); str(errors,c.payload_digest,`${p}.payload_digest`,{pattern:SHA256}); if(Object.hasOwn(c,'base_object_revision')) str(errors,c.base_object_revision,`${p}.base_object_revision`,{nullable:true}); uniqueStrings(errors,c.required_capabilities,`${p}.required_capabilities`); str(errors,c.validator_profile,`${p}.validator_profile`,{min:1}); enm(errors,c.replay_policy,`${p}.replay_policy`,REPLAY_POLICIES) }
  if (plain(value.review)) { const p='review'; required(errors,value.review,['required','policy_id','approval_actor'],p); extras(errors,value.review,new Set(['required','policy_id','approval_actor']),p); bool(errors,value.review.required,`${p}.required`); str(errors,value.review.policy_id,`${p}.policy_id`,{min:1}); str(errors,value.review.approval_actor,`${p}.approval_actor`,{nullable:true}) } else object(errors,value.review,'review')
  if (plain(value.validation)) { const p='validation'; required(errors,value.validation,['deterministic_required','model_self_validation_authoritative','evidence_refs'],p); extras(errors,value.validation,new Set(['deterministic_required','model_self_validation_authoritative','evidence_refs']),p); if(value.validation.deterministic_required!==true) issue(errors,'DeterministicValidationRequired',`${p}.deterministic_required`,'must remain true'); if(value.validation.model_self_validation_authoritative!==false) issue(errors,'ModelSelfValidationAuthorityForbidden',`${p}.model_self_validation_authoritative`,'model self-validation is not authority'); if(array(errors,value.validation.evidence_refs,`${p}.evidence_refs`)) for(let i=0;i<value.validation.evidence_refs.length;i++) str(errors,value.validation.evidence_refs[i],`${p}.evidence_refs[${i}]`) } else object(errors,value.validation,'validation')
  return result(errors)
}

export function validateReviewPolicy(value) {
  const errors=[]; if (!ensureRoot(value,errors)) return result(errors)
  const allowed=new Set(['profile','policy_id','revision','modes','external_effect_policy','validation_policy']); required(errors,value,[...allowed]); extras(errors,value,allowed); profile(errors,value,'agent-review-policy/1.0-candidate.1'); str(errors,value.policy_id,'policy_id',{min:1}); str(errors,value.revision,'revision',{min:1})
  if(plain(value.modes)){ required(errors,value.modes,['suggest','patch','direct'],'modes'); extras(errors,value.modes,new Set(['suggest','patch','direct']),'modes'); for(const mode of ['suggest','patch','direct']){ const m=value.modes[mode]; const p=`modes.${mode}`; if(!plain(m)){object(errors,m,p);continue} required(errors,m,['canonical_mutation','auto_commit','human_review'],p); extras(errors,m,new Set(['canonical_mutation','auto_commit','human_review']),p); enm(errors,m.canonical_mutation,`${p}.canonical_mutation`,CANONICAL_MUTATION); bool(errors,m.auto_commit,`${p}.auto_commit`); enm(errors,m.human_review,`${p}.human_review`,HUMAN_REVIEW) } } else object(errors,value.modes,'modes')
  if(plain(value.external_effect_policy)){ const p='external_effect_policy'; required(errors,value.external_effect_policy,['explicit_capability_required','mode_never_grants_effects','unknown_effect_auto_retry'],p); extras(errors,value.external_effect_policy,new Set(['explicit_capability_required','mode_never_grants_effects','unknown_effect_auto_retry']),p); if(value.external_effect_policy.explicit_capability_required!==true) issue(errors,'InvariantViolation',`${p}.explicit_capability_required`,'must remain true'); if(value.external_effect_policy.mode_never_grants_effects!==true) issue(errors,'InvariantViolation',`${p}.mode_never_grants_effects`,'must remain true'); if(value.external_effect_policy.unknown_effect_auto_retry!==false) issue(errors,'InvariantViolation',`${p}.unknown_effect_auto_retry`,'must remain false') } else object(errors,value.external_effect_policy,'external_effect_policy')
  if(plain(value.validation_policy)){ const p='validation_policy'; required(errors,value.validation_policy,['deterministic_validation_required','model_self_validation_is_authority'],p); extras(errors,value.validation_policy,new Set(['deterministic_validation_required','model_self_validation_is_authority']),p); if(value.validation_policy.deterministic_validation_required!==true) issue(errors,'InvariantViolation',`${p}.deterministic_validation_required`,'must remain true'); if(value.validation_policy.model_self_validation_is_authority!==false) issue(errors,'InvariantViolation',`${p}.model_self_validation_is_authority`,'must remain false') } else object(errors,value.validation_policy,'validation_policy')
  return result(errors)
}

export function createAgentPrincipal(input={}) {
  const record={
    profile:'agent-principal/1.0-candidate.1',
    principal_id: input.principalId,
    principal_class: input.principalClass,
    identity_scope: input.identityScope,
    label: input.label,
    controller: structuredClone(input.controller),
    created_at: input.createdAt,
    default_policy_ref: input.defaultPolicyRef ?? null,
    metadata: structuredClone(input.metadata ?? {}),
  }
  const check=validateAgentPrincipal(record)
  if(!check.ok) throw new TypeError(`invalid AgentPrincipal: ${check.errors.map(e=>`${e.path}:${e.code}`).join(', ')}`)
  return Object.freeze(record)
}
