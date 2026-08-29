import { canonicalBytes, newUuid7Urn, sha256Hex } from '../../ascs-core/src/index.mjs'
import { validateAgentProposal, validateReviewPolicy } from './model.mjs'
import { proposalMaterialDigest } from './proposal.mjs'

const UUID_URN = /^urn:uuid:[0-9a-fA-F-]{36}$/
const WREV = /^wrev:sha256:[0-9a-f]{64}$/
const PROPOSAL_DIGEST = /^proposal-digest:sha256:[0-9a-f]{64}$/
const AUTHORITY_PIN = /^authority-pin:sha256:[0-9a-f]{64}$/
const DECISIONS = new Set(['approved', 'rejected', 'auto-approved', 'needs-human'])
const REVIEWER_TYPES = new Set(['human', 'organization', 'system', 'policy'])

function issue(code, path, message) { return { code, path, message } }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value) }
function nonempty(value) { return typeof value === 'string' && value.length > 0 }
function validDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)) }
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

export function evaluateReviewPolicy(policy, proposal) {
  const policyCheck = validateReviewPolicy(policy)
  if (!policyCheck.ok) throw new TypeError('invalid review policy')
  const proposalCheck = validateAgentProposal(proposal)
  if (!proposalCheck.ok) throw new TypeError('invalid agent proposal')
  const mode = policy.modes[proposal.mode]
  return Object.freeze({
    policyId: policy.policy_id,
    policyRevision: policy.revision,
    mode: proposal.mode,
    canonicalMutation: mode.canonical_mutation,
    humanReview: mode.human_review,
    autoCommitEligible: mode.auto_commit === true,
    deterministicValidationRequired: policy.validation_policy.deterministic_validation_required === true,
    modelSelfValidationIsAuthority: policy.validation_policy.model_self_validation_is_authority === true,
    explicitCapabilityRequiredForExternalEffects: policy.external_effect_policy.explicit_capability_required === true,
    modeGrantsExternalEffects: policy.external_effect_policy.mode_never_grants_effects !== true,
    capabilityAuthorizationRequired: true,
  })
}

export async function authorityPinDigest({ capabilityGrantIds = [], policyRevision } = {}) {
  if (!Array.isArray(capabilityGrantIds) || !capabilityGrantIds.every(nonempty) || new Set(capabilityGrantIds).size !== capabilityGrantIds.length) {
    throw new TypeError('capabilityGrantIds must be a unique string array')
  }
  if (!nonempty(policyRevision)) throw new TypeError('policyRevision must be a non-empty string')
  const material = {
    capability_grant_ids: [...capabilityGrantIds].sort(),
    policy_revision: policyRevision,
  }
  return `authority-pin:sha256:${await sha256Hex(canonicalBytes(material))}`
}

export function validateReviewDecision(value) {
  const errors = []
  const allowed = new Set([
    'profile', 'review_id', 'proposal_id', 'policy_id', 'policy_revision', 'decision',
    'reviewer', 'reason', 'validated_proposal_digest', 'authority_snapshot_digest',
    'base_workspace_revision', 'created_at',
  ])
  if (!object(value)) return { ok: false, errors: [issue('type', '$', 'must be an object')] }
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(issue('additional_property', `$.${key}`, 'property is not allowed'))
  for (const key of allowed) if (!Object.hasOwn(value, key)) errors.push(issue('required', `$.${key}`, 'property is required'))
  if (value.profile !== 'agent-review-decision/1.0-candidate.1') errors.push(issue('profile', '$.profile', 'unexpected profile'))
  for (const key of ['review_id', 'proposal_id']) if (!UUID_URN.test(value[key] ?? '')) errors.push(issue('format', `$.${key}`, 'must be UUID URN'))
  if (!nonempty(value.policy_id) || !nonempty(value.policy_revision)) errors.push(issue('length', '$.policy_id', 'policy id/revision required'))
  if (!DECISIONS.has(value.decision)) errors.push(issue('enum', '$.decision', 'invalid review decision'))
  if (!object(value.reviewer) || !REVIEWER_TYPES.has(value.reviewer?.type) || !nonempty(value.reviewer?.ref) || Object.keys(value.reviewer ?? {}).some(k => !['type', 'ref'].includes(k))) {
    errors.push(issue('type', '$.reviewer', 'invalid reviewer'))
  }
  if (typeof value.reason !== 'string') errors.push(issue('type', '$.reason', 'reason must be string'))
  if (!PROPOSAL_DIGEST.test(value.validated_proposal_digest ?? '')) errors.push(issue('format', '$.validated_proposal_digest', 'invalid proposal digest'))
  if (!AUTHORITY_PIN.test(value.authority_snapshot_digest ?? '')) errors.push(issue('format', '$.authority_snapshot_digest', 'invalid authority pin digest'))
  if (value.base_workspace_revision !== null && !WREV.test(value.base_workspace_revision ?? '')) errors.push(issue('format', '$.base_workspace_revision', 'invalid workspace revision or null'))
  if (!validDate(value.created_at)) errors.push(issue('format', '$.created_at', 'invalid date-time'))
  return { ok: errors.length === 0, errors }
}

export async function createReviewDecision(input = {}, { idFactory = newUuid7Urn } = {}) {
  if (typeof idFactory !== 'function') throw new TypeError('idFactory must be a function')
  const proposalCheck = validateAgentProposal(input.proposal)
  if (!proposalCheck.ok) throw new TypeError('invalid agent proposal')
  const policyCheck = validateReviewPolicy(input.policy)
  if (!policyCheck.ok) throw new TypeError('invalid review policy')
  if (!DECISIONS.has(input.decision)) throw new TypeError('invalid review decision')
  if (['approved', 'auto-approved'].includes(input.decision)) {
    if (input.proposal.status !== 'validated') throw new Error('approved review decision requires validated proposal')
    if (input.proposal.review.policy_id !== input.policy.policy_id) throw new Error('proposal review policy does not match supplied policy')
    if (!AUTHORITY_PIN.test(input.authoritySnapshotDigest ?? '')) throw new Error('approved review decision requires authority pin digest')
  }
  const record = {
    profile: 'agent-review-decision/1.0-candidate.1',
    review_id: input.reviewId ?? idFactory(),
    proposal_id: input.proposal.proposal_id,
    policy_id: input.policy.policy_id,
    policy_revision: input.policy.revision,
    decision: input.decision,
    reviewer: structuredClone(input.reviewer),
    reason: input.reason ?? '',
    validated_proposal_digest: await proposalMaterialDigest(input.proposal),
    authority_snapshot_digest: input.authoritySnapshotDigest,
    base_workspace_revision: input.proposal.base_workspace_revision,
    created_at: input.createdAt,
  }
  const check = validateReviewDecision(record)
  if (!check.ok) throw new TypeError(`invalid review decision: ${check.errors.map(entry => `${entry.path}:${entry.code}`).join(', ')}`)
  return deepFreeze(record)
}

export async function reviewDecisionStillValid(decision, proposal, policy, currentAuthorityPinDigest) {
  if (!validateReviewDecision(decision).ok) return false
  if (!validateAgentProposal(proposal).ok || !validateReviewPolicy(policy).ok) return false
  if (!['validated', 'approved'].includes(proposal.status)) return false
  if (decision.proposal_id !== proposal.proposal_id) return false
  if (decision.policy_id !== policy.policy_id || decision.policy_revision !== policy.revision) return false
  if (decision.base_workspace_revision !== proposal.base_workspace_revision) return false
  if (decision.authority_snapshot_digest !== currentAuthorityPinDigest) return false
  return decision.validated_proposal_digest === await proposalMaterialDigest(proposal)
}
