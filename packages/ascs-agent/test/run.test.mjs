import test from 'node:test'
import assert from 'node:assert/strict'
import { referenceJson } from './reference-helper.mjs'
import { createAgentPrincipal, createAgentRun, validateAgentRun } from '../src/index.mjs'

const base = () => referenceJson('examples/agent_run_example.json')
const principalInput = () => ({
  principalId: 'urn:uuid:0190a007-0000-7000-8000-000000000101',
  principalClass: 'ai-agent',
  identityScope: 'workspace',
  label: 'Agent',
  controller: { type: 'human', ref: 'owner' },
  createdAt: '2026-08-25T06:30:00Z',
})

function inputFromExample(example = base()) {
  return {
    principalId: example.principal_id,
    contextPackId: example.context_pack_id,
    baseWorkspaceRevision: example.base_workspace_revision,
    mode: example.mode,
    modelBinding: example.model_binding,
    adapterBinding: example.adapter_binding,
    capabilityGrantIds: example.capability_grant_ids,
    status: example.status,
    startedAt: example.started_at,
    finishedAt: example.finished_at,
    proposalIds: example.proposal_ids,
    externalEffectIds: example.external_effect_ids,
    diagnostics: example.diagnostics,
    metadata: example.metadata,
  }
}

test('final AgentRun constructor emits frozen v0.7 terminal record', () => {
  const run = createAgentRun(inputFromExample(), { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000499' })
  assert.equal(run.profile, 'agent-run/1.0-candidate.1')
  assert.equal(run.status, 'completed')
  assert.equal(run.run_id, 'urn:uuid:0190a007-0000-7000-8000-000000000499')
  assert.equal(run.model_binding.binding_is_identity_authority, false)
  assert.equal(validateAgentRun(run).ok, true)
  assert.equal(Object.isFrozen(run), true)
})

test('retry of same principal/task uses a fresh run id', () => {
  let n = 0
  const ids = [
    'urn:uuid:0190a007-0000-7000-8000-000000000481',
    'urn:uuid:0190a007-0000-7000-8000-000000000482',
  ]
  const a = createAgentRun(inputFromExample(), { idFactory: () => ids[n++] })
  const b = createAgentRun(inputFromExample(), { idFactory: () => ids[n++] })
  assert.notEqual(a.run_id, b.run_id)
  assert.equal(a.principal_id, b.principal_id)
  assert.equal(a.context_pack_id, b.context_pack_id)
})

test('provider/model replacement does not change principal identity', () => {
  const principal = createAgentPrincipal(principalInput())
  const first = inputFromExample()
  const second = inputFromExample()
  second.modelBinding = { ...second.modelBinding, provider: 'other-provider', model: 'other-model' }
  const a = createAgentRun(first, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000483' })
  const b = createAgentRun(second, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000484' })
  assert.equal(a.principal_id, principal.principal_id)
  assert.equal(b.principal_id, principal.principal_id)
  assert.notDeepEqual(a.model_binding, b.model_binding)
})

test('frozen AgentRun cannot use running status or identity-authoritative model binding', () => {
  const input = inputFromExample()
  input.status = 'running'
  assert.throws(() => createAgentRun(input, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000485' }), /invalid AgentRun/)
  const other = inputFromExample()
  other.modelBinding = { ...other.modelBinding, binding_is_identity_authority: true }
  assert.throws(() => createAgentRun(other, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000486' }), /invalid AgentRun/)
})
