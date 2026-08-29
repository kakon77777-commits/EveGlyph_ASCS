import test from 'node:test'
import assert from 'node:assert/strict'
import { referenceJson } from './reference-helper.mjs'
import {
  buildContextPack,
  createAgentProposal,
  createAgentKernel,
} from '../src/index.mjs'

const principal = () => referenceJson('examples/agent_principal_example.json')
const context = () => referenceJson('examples/context_pack_example.json')
const runExample = () => referenceJson('examples/agent_run_example.json')
const proposalExample = () => referenceJson('examples/patch_proposal_example.json')
const policy = () => referenceJson('examples/review_policy_example.json')

function runInput(ctx, example = runExample()) {
  return {
    principalId: example.principal_id,
    contextPackId: ctx.context_pack_id,
    baseWorkspaceRevision: example.base_workspace_revision,
    mode: example.mode,
    modelBinding: example.model_binding,
    adapterBinding: example.adapter_binding,
    capabilityGrantIds: example.capability_grant_ids,
    startedAt: example.started_at,
  }
}

function proposalInput(runId, example = proposalExample()) {
  return {
    runId,
    principalId: example.principal_id,
    mode: example.mode,
    baseWorkspaceRevision: example.base_workspace_revision,
    commands: example.commands,
    review: example.review,
    validation: { ...example.validation, evidence_refs: [] },
    status: 'proposed',
    createdAt: example.created_at,
    metadata: { raw_model_text: 'I assert this is valid; this text is not authority.' },
  }
}

test('AgentKernel orchestrates proposal/review/run without receiving canonical runtime authority', async () => {
  const ids = [
    'urn:uuid:0190a007-0000-7000-8000-000000000701',
    'urn:uuid:0190a007-0000-7000-8000-000000000702',
  ]
  let n = 0
  const kernel = createAgentKernel({
    idFactory: () => ids[n++],
    clock: () => new Date('2026-08-25T06:35:00Z'),
  })
  const externalWorkspaceRuntimeFixture = {
    revision: 'wrev:sha256:' + 'a'.repeat(64),
    objects: { untouched: { value: 1 } },
  }
  const runtimeSnapshot = structuredClone(externalWorkspaceRuntimeFixture)

  kernel.registerPrincipal(principal())
  const ctx = await buildContextPack(context())
  kernel.putContextPack(ctx)
  const active = kernel.startRun(runInput(ctx))
  assert.deepEqual(active, { run_id: ids[0], active: true })
  assert.equal(Object.hasOwn(active, 'profile'), false)
  assert.equal(Object.hasOwn(active, 'status'), false)

  const proposal = createAgentProposal(proposalInput(active.run_id), {
    idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000711',
  })
  kernel.putProposal(proposal)
  const validated = await kernel.validateProposal(proposal.proposal_id, async candidate => {
    assert.equal(candidate.metadata.raw_model_text.includes('assert'), true)
    return { ok: true, evidenceRefs: ['validator:test:v1'] }
  })
  assert.equal(validated.status, 'validated')
  assert.deepEqual(validated.validation.evidence_refs, ['validator:test:v1'])
  assert.equal(validated.validation.model_self_validation_authoritative, false)

  const reviewFacts = kernel.evaluateProposalReview(proposal.proposal_id, policy())
  assert.equal(reviewFacts.humanReview, 'required')
  const review = await kernel.recordReviewDecision(proposal.proposal_id, {
    policy: policy(),
    decision: 'approved',
    reviewer: { type: 'human', ref: 'workspace-owner' },
    reason: 'validated proposal reviewed',
  })
  assert.equal(review.decision.decision, 'approved')
  assert.equal(review.proposal.status, 'approved')

  const finalRun = kernel.finishRun(active.run_id, { status: 'completed', diagnostics: [] })
  assert.equal(finalRun.profile, 'agent-run/1.0-candidate.1')
  assert.equal(finalRun.status, 'completed')
  assert.deepEqual(finalRun.proposal_ids, [proposal.proposal_id])
  assert.equal(Object.isFrozen(finalRun), true)
  assert.deepEqual(externalWorkspaceRuntimeFixture, runtimeSnapshot)
})

test('deterministic validator result controls validated versus rejected, never raw model claims', async () => {
  const kernel = createAgentKernel({ idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000721', clock: () => new Date('2026-08-25T06:35:00Z') })
  kernel.registerPrincipal(principal())
  const ctx = await buildContextPack(context()); kernel.putContextPack(ctx)
  const active = kernel.startRun(runInput(ctx))
  const proposal = createAgentProposal(proposalInput(active.run_id), { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000722' })
  kernel.putProposal(proposal)
  const rejected = await kernel.validateProposal(proposal.proposal_id, async () => ({ ok: false, evidenceRefs: ['validator:reject:v1'] }))
  assert.equal(rejected.status, 'rejected')
  assert.deepEqual(rejected.validation.evidence_refs, ['validator:reject:v1'])
})

test('failed or cancelled run finalization never marks proposal committed', async () => {
  for (const status of ['failed', 'cancelled', 'timed-out']) {
    let i = 0
    const ids = ['urn:uuid:0190a007-0000-7000-8000-000000000731','urn:uuid:0190a007-0000-7000-8000-000000000732']
    const kernel = createAgentKernel({ idFactory: () => ids[i++], clock: () => new Date('2026-08-25T06:35:00Z') })
    kernel.registerPrincipal(principal()); const ctx = await buildContextPack(context()); kernel.putContextPack(ctx)
    const active = kernel.startRun(runInput(ctx))
    const proposal = createAgentProposal(proposalInput(active.run_id), { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000733' })
    kernel.putProposal(proposal)
    const finalRun = kernel.finishRun(active.run_id, { status, diagnostics: [`run-${status}`] })
    assert.equal(finalRun.status, status)
    assert.notEqual(kernel.getProposal(proposal.proposal_id).status, 'committed')
  }
})

test('kernel getters return clones and supersede creates a new proposal identity', async () => {
  const ids = [
    'urn:uuid:0190a007-0000-7000-8000-000000000741',
    'urn:uuid:0190a007-0000-7000-8000-000000000742',
  ]; let i = 0
  const kernel = createAgentKernel({ idFactory: () => ids[i++], clock: () => new Date('2026-08-25T06:35:00Z') })
  kernel.registerPrincipal(principal()); const ctx = await buildContextPack(context()); kernel.putContextPack(ctx)
  const active = kernel.startRun(runInput(ctx))
  const oldProposal = createAgentProposal(proposalInput(active.run_id), { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000743' })
  kernel.putProposal(oldProposal)
  const replacementInput = proposalInput(active.run_id)
  replacementInput.commands[0].target = 'object:replacement'
  const replacement = kernel.supersedeProposal(oldProposal.proposal_id, replacementInput)
  assert.equal(kernel.getProposal(oldProposal.proposal_id).status, 'superseded')
  assert.notEqual(replacement.proposal_id, oldProposal.proposal_id)
  assert.equal(replacement.metadata.supersedes, oldProposal.proposal_id)
  const clone = kernel.getProposal(replacement.proposal_id)
  clone.metadata.local_change = true
  assert.equal(Object.hasOwn(kernel.getProposal(replacement.proposal_id).metadata, 'local_change'), false)
})
