import test from 'node:test'
import assert from 'node:assert/strict'
import { referenceJson } from './reference-helper.mjs'
import {
  validateAgentPrincipal,
  validateContextPack,
  validateAgentRun,
  validateAgentProposal,
  validateReviewPolicy,
  createAgentPrincipal,
} from '../src/index.mjs'

const load = name => referenceJson(`examples/${name}`)

function codes(result) { return new Set(result.errors.map(e => e.code)) }

test('frozen v0.7 examples validate', () => {
  assert.equal(validateAgentPrincipal(load('agent_principal_example.json')).ok, true)
  assert.equal(validateContextPack(load('context_pack_example.json')).ok, true)
  assert.equal(validateAgentRun(load('agent_run_example.json')).ok, true)
  assert.equal(validateAgentProposal(load('patch_proposal_example.json')).ok, true)
  assert.equal(validateAgentProposal(load('direct_proposal_example.json')).ok, true)
  assert.equal(validateReviewPolicy(load('review_policy_example.json')).ok, true)
})

test('principal rejects profile drift, enum drift and unknown identity fields', () => {
  const p = load('agent_principal_example.json')
  p.profile = 'agent-principal/2.0'
  p.principal_class = 'model-session'
  p.provider = 'must-not-be-identity'
  const result = validateAgentPrincipal(p)
  assert.equal(result.ok, false)
  assert.ok(codes(result).has('InvalidProfile'))
  assert.ok(codes(result).has('InvalidEnum'))
  assert.ok(codes(result).has('UnexpectedProperty'))
})

test('createAgentPrincipal never copies provider/model/transport/credential metadata', () => {
  const record = createAgentPrincipal({
    principalId: 'urn:uuid:0190a007-0000-7000-8000-000000000101',
    principalClass: 'ai-agent',
    identityScope: 'workspace',
    label: 'Agent',
    controller: { type: 'human', ref: 'owner' },
    createdAt: '2026-08-25T06:30:00Z',
    provider: 'x', model: 'y', transportSession: 'z', oauthIdentity: 'o', credential: 'secret', mcpClient: 'm',
  })
  assert.deepEqual(Object.keys(record).sort(), ['controller','created_at','default_policy_ref','identity_scope','label','metadata','principal_class','principal_id','profile'].sort())
  for (const forbidden of ['provider','model','transportSession','oauthIdentity','credential','mcpClient']) assert.equal(Object.hasOwn(record, forbidden), false)
})

test('context pack rejects duplicate grants, wrong trust enum and extra source properties', () => {
  const c = load('context_pack_example.json')
  c.policy_snapshot.capability_grant_ids.push(c.policy_snapshot.capability_grant_ids[0])
  c.sources[0].trust_class = 'system'
  c.sources[0].secret = 'nope'
  const result = validateContextPack(c)
  assert.equal(result.ok, false)
  assert.ok(codes(result).has('DuplicateItem'))
  assert.ok(codes(result).has('InvalidEnum'))
  assert.ok(codes(result).has('UnexpectedProperty'))
})

test('run rejects identity-authoritative model binding, running status and duplicate grant ids', () => {
  const r = load('agent_run_example.json')
  r.model_binding.binding_is_identity_authority = true
  r.status = 'running'
  r.capability_grant_ids.push(r.capability_grant_ids[0])
  const result = validateAgentRun(r)
  assert.equal(result.ok, false)
  assert.ok(codes(result).has('IdentityAuthorityForbidden'))
  assert.ok(codes(result).has('InvalidEnum'))
  assert.ok(codes(result).has('DuplicateItem'))
})

test('proposal rejects empty commands, enum drift and model self validation authority', () => {
  const p = load('patch_proposal_example.json')
  p.commands = []
  p.status = 'running'
  p.validation.model_self_validation_authoritative = true
  const result = validateAgentProposal(p)
  assert.equal(result.ok, false)
  assert.ok(codes(result).has('MinItems'))
  assert.ok(codes(result).has('InvalidEnum'))
  assert.ok(codes(result).has('ModelSelfValidationAuthorityForbidden'))
})

test('proposal validates command effect/replay enums and unique required capabilities', () => {
  const p = load('patch_proposal_example.json')
  p.commands[0].effect_class = 'magic-write'
  p.commands[0].replay_policy = 'blind-retry'
  p.commands[0].required_capabilities.push(p.commands[0].required_capabilities[0])
  const result = validateAgentProposal(p)
  assert.equal(result.ok, false)
  assert.ok([...codes(result)].includes('InvalidEnum'))
  assert.ok(codes(result).has('DuplicateItem'))
})

test('review policy rejects softened frozen safety constants and incomplete modes', () => {
  const p = load('review_policy_example.json')
  p.external_effect_policy.explicit_capability_required = false
  p.external_effect_policy.unknown_effect_auto_retry = true
  p.validation_policy.deterministic_validation_required = false
  delete p.modes.patch
  const result = validateReviewPolicy(p)
  assert.equal(result.ok, false)
  assert.ok(codes(result).has('InvariantViolation'))
  assert.ok(codes(result).has('MissingProperty'))
})
