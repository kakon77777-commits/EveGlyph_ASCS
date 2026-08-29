import test from 'node:test'
import assert from 'node:assert/strict'
import { referenceJson } from './reference-helper.mjs'
import {
  proposalMaterialDigest,
  transitionProposal,
  evaluateReviewPolicy,
  authorityPinDigest,
  createReviewDecision,
  validateReviewDecision,
  reviewDecisionStillValid,
} from '../src/index.mjs'

const policy = () => referenceJson('examples/review_policy_example.json')
const patch = () => referenceJson('examples/patch_proposal_example.json')
const direct = () => referenceJson('examples/direct_proposal_example.json')

test('review policy returns facts, never authority', () => {
  const p = policy()
  const suggestProposal = patch(); suggestProposal.mode = 'suggest'
  const suggest = evaluateReviewPolicy(p, suggestProposal)
  const patchFacts = evaluateReviewPolicy(p, patch())
  const directFacts = evaluateReviewPolicy(p, direct())
  assert.deepEqual(
    [suggest.canonicalMutation, suggest.humanReview, suggest.autoCommitEligible],
    ['forbidden', 'not-applicable', false],
  )
  assert.deepEqual(
    [patchFacts.canonicalMutation, patchFacts.humanReview, patchFacts.autoCommitEligible],
    ['proposal-only', 'required', false],
  )
  assert.deepEqual(
    [directFacts.canonicalMutation, directFacts.humanReview, directFacts.autoCommitEligible],
    ['allowed-if-capable', 'policy-dependent', true],
  )
  for (const facts of [suggest, patchFacts, directFacts]) {
    assert.equal(facts.deterministicValidationRequired, true)
    assert.equal(facts.modelSelfValidationIsAuthority, false)
    assert.equal(facts.explicitCapabilityRequiredForExternalEffects, true)
    assert.equal(facts.modeGrantsExternalEffects, false)
    assert.equal(facts.capabilityAuthorizationRequired, true)
  }
})

test('authority pin digest is order-independent but binds policy revision', async () => {
  const ids = [
    'urn:uuid:0190a007-0000-7000-8000-000000000203',
    'urn:uuid:0190a007-0000-7000-8000-000000000201',
  ]
  const a = await authorityPinDigest({ capabilityGrantIds: ids, policyRevision: 'policy:r1' })
  const b = await authorityPinDigest({ capabilityGrantIds: [...ids].reverse(), policyRevision: 'policy:r1' })
  const c = await authorityPinDigest({ capabilityGrantIds: ids, policyRevision: 'policy:r2' })
  assert.match(a, /^authority-pin:sha256:[0-9a-f]{64}$/)
  assert.equal(a, b)
  assert.notEqual(a, c)
})

test('approved review decision binds exact proposal material, policy and authority pins', async () => {
  const proposal = patch()
  proposal.status = 'validated'
  const p = policy()
  const pin = await authorityPinDigest({ capabilityGrantIds: ['urn:uuid:0190a007-0000-7000-8000-000000000201'], policyRevision: p.revision })
  const decision = await createReviewDecision({
    proposal,
    policy: p,
    decision: 'approved',
    reviewer: { type: 'human', ref: 'workspace-owner' },
    reason: 'reviewed exact validated proposal',
    authoritySnapshotDigest: pin,
    createdAt: '2026-08-25T06:34:00Z',
  }, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000601' })
  assert.equal(validateReviewDecision(decision).ok, true)
  assert.equal(decision.validated_proposal_digest, await proposalMaterialDigest(proposal))
  assert.equal(await reviewDecisionStillValid(decision, proposal, p, pin), true)
  const approved = transitionProposal(proposal, 'approved')
  assert.equal(await reviewDecisionStillValid(decision, approved, p, pin), true)
})

test('approval is invalidated by every material change and by policy/authority drift', async () => {
  const proposal = patch(); proposal.status = 'validated'
  const p = policy()
  const pin = await authorityPinDigest({ capabilityGrantIds: ['urn:uuid:0190a007-0000-7000-8000-000000000201'], policyRevision: p.revision })
  const decision = await createReviewDecision({ proposal, policy: p, decision: 'approved', reviewer: { type: 'human', ref: 'owner' }, reason: 'ok', authoritySnapshotDigest: pin, createdAt: '2026-08-25T06:34:00Z' }, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000602' })
  const mutations = [
    x => { x.commands[0].target = 'object:other' },
    x => { x.commands[0].payload_digest = '0'.repeat(64) },
    x => { x.base_workspace_revision = 'wrev:sha256:' + 'd'.repeat(64) },
    x => { x.commands[0].required_capabilities = ['object.write'] },
    x => { x.commands[0].replay_policy = 'manual' },
  ]
  for (const mutate of mutations) {
    const changed = structuredClone(proposal); mutate(changed)
    assert.equal(await reviewDecisionStillValid(decision, changed, p, pin), false)
  }
  const changedPolicy = structuredClone(p); changedPolicy.revision = 'policy:changed'
  assert.equal(await reviewDecisionStillValid(decision, proposal, changedPolicy, pin), false)
  assert.equal(await reviewDecisionStillValid(decision, proposal, p, 'authority-pin:sha256:' + '0'.repeat(64)), false)
})

test('approval cannot be created from unvalidated proposal and auto approval is still capability-bound evidence', async () => {
  const p = policy()
  const unvalidated = patch(); unvalidated.status = 'proposed'
  const pin = await authorityPinDigest({ capabilityGrantIds: [], policyRevision: p.revision })
  await assert.rejects(() => createReviewDecision({ proposal: unvalidated, policy: p, decision: 'approved', reviewer: { type: 'human', ref: 'owner' }, reason: 'too early', authoritySnapshotDigest: pin, createdAt: '2026-08-25T06:34:00Z' }), /validated proposal/)

  const d = direct(); d.status = 'validated'
  const auto = await createReviewDecision({ proposal: d, policy: p, decision: 'auto-approved', reviewer: { type: 'policy', ref: p.policy_id }, reason: 'direct policy eligible; authority enforcement deferred to E2', authoritySnapshotDigest: pin, createdAt: '2026-08-25T06:34:00Z' }, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000603' })
  assert.equal(auto.decision, 'auto-approved')
  assert.equal(validateReviewDecision(auto).ok, true)
})
