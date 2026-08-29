import { newUuid7Urn } from '../../ascs-core/src/index.mjs'
import {
  validateAgentPrincipal,
  validateContextPack,
  validateAgentProposal,
} from './model.mjs'
import { createAgentRun } from './run.mjs'
import { createAgentProposal, checkProposalBase, transitionProposal } from './proposal.mjs'
import { authorityPinDigest, createReviewDecision, evaluateReviewPolicy } from './review.mjs'

const TERMINAL_RUN_STATUS = new Set(['completed', 'failed', 'cancelled', 'timed-out', 'conflicted'])

function clone(value) {
  return value == null ? value : structuredClone(value)
}

function iso(clock) {
  const value = clock()
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new TypeError('clock must return a valid date')
  return date.toISOString()
}

function sorted(values) {
  return [...values].sort()
}

function sameStringSet(a, b) {
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b))
}

export function createAgentKernel({
  clock = () => new Date(),
  idFactory = newUuid7Urn,
} = {}) {
  if (typeof clock !== 'function') throw new TypeError('clock must be a function')
  if (typeof idFactory !== 'function') throw new TypeError('idFactory must be a function')

  const principals = new Map()
  const contexts = new Map()
  const activeAttempts = new Map()
  const finalRuns = new Map()
  const proposals = new Map()
  const reviews = new Map()

  function registerPrincipal(principal) {
    const check = validateAgentPrincipal(principal)
    if (!check.ok) throw new TypeError('invalid agent principal')
    if (principals.has(principal.principal_id)) throw new Error('principal already registered')
    principals.set(principal.principal_id, clone(principal))
    return clone(principal)
  }

  function putContextPack(pack) {
    const check = validateContextPack(pack)
    if (!check.ok) throw new TypeError('invalid context pack')
    contexts.set(pack.context_pack_id, clone(pack))
    return clone(pack)
  }

  function startRun(input = {}) {
    if (!principals.has(input.principalId)) throw new Error('unknown principal')
    const pack = contexts.get(input.contextPackId)
    if (!pack) throw new Error('unknown context pack')
    if (pack.base_workspace_revision !== input.baseWorkspaceRevision) throw new Error('run base does not match context pack')
    if (pack.mode !== input.mode) throw new Error('run mode does not match context pack')
    if (!sameStringSet(pack.policy_snapshot.capability_grant_ids, input.capabilityGrantIds ?? [])) {
      throw new Error('run grant ids do not match context pack snapshot')
    }
    const runId = input.runId ?? idFactory()
    if (activeAttempts.has(runId) || finalRuns.has(runId)) throw new Error('run id already exists')
    activeAttempts.set(runId, {
      runId,
      principalId: input.principalId,
      contextPackId: input.contextPackId,
      baseWorkspaceRevision: input.baseWorkspaceRevision,
      mode: input.mode,
      modelBinding: clone(input.modelBinding),
      adapterBinding: clone(input.adapterBinding),
      capabilityGrantIds: [...(input.capabilityGrantIds ?? [])],
      startedAt: input.startedAt ?? iso(clock),
      proposalIds: [],
      externalEffectIds: [],
      diagnostics: [],
      metadata: clone(input.metadata ?? {}),
    })
    return Object.freeze({ run_id: runId, active: true })
  }

  function putProposal(proposal) {
    const check = validateAgentProposal(proposal)
    if (!check.ok) throw new TypeError('invalid agent proposal')
    if (proposals.has(proposal.proposal_id)) throw new Error('proposal already exists')
    const attempt = activeAttempts.get(proposal.run_id)
    if (!attempt) throw new Error('proposal run is not active')
    if (proposal.principal_id !== attempt.principalId) throw new Error('proposal principal does not match run')
    if (proposal.mode !== attempt.mode) throw new Error('proposal mode does not match run')
    if (proposal.base_workspace_revision !== attempt.baseWorkspaceRevision) throw new Error('proposal base does not match run')
    proposals.set(proposal.proposal_id, clone(proposal))
    attempt.proposalIds.push(proposal.proposal_id)
    return clone(proposal)
  }

  async function validateProposal(proposalId, validator) {
    if (typeof validator !== 'function') throw new TypeError('validator must be a function')
    const current = proposals.get(proposalId)
    if (!current) throw new Error('unknown proposal')
    if (current.status !== 'proposed') throw new Error('proposal is not awaiting deterministic validation')
    const outcome = await validator(clone(current))
    if (!outcome || typeof outcome.ok !== 'boolean' || !Array.isArray(outcome.evidenceRefs) || !outcome.evidenceRefs.every(x => typeof x === 'string')) {
      throw new TypeError('validator must return { ok, evidenceRefs }')
    }
    const withEvidence = clone(current)
    withEvidence.validation.evidence_refs = [...outcome.evidenceRefs]
    withEvidence.validation.deterministic_required = true
    withEvidence.validation.model_self_validation_authoritative = false
    const next = transitionProposal(
      withEvidence,
      outcome.ok ? 'validated' : 'rejected',
      { kind: 'deterministic-validation', ok: outcome.ok, evidence_refs: [...outcome.evidenceRefs] },
    )
    proposals.set(proposalId, clone(next))
    return next
  }

  function evaluateProposalReview(proposalId, policy) {
    const proposal = proposals.get(proposalId)
    if (!proposal) throw new Error('unknown proposal')
    return evaluateReviewPolicy(policy, proposal)
  }

  async function recordReviewDecision(proposalId, input = {}) {
    const proposal = proposals.get(proposalId)
    if (!proposal) throw new Error('unknown proposal')
    const run = activeAttempts.get(proposal.run_id) ?? finalRuns.get(proposal.run_id)
    if (!run) throw new Error('proposal run not found')
    const grantIds = run.capabilityGrantIds ?? run.capability_grant_ids ?? []
    const pin = await authorityPinDigest({
      capabilityGrantIds: grantIds,
      policyRevision: input.policy?.revision,
    })
    const decision = await createReviewDecision({
      proposal,
      policy: input.policy,
      decision: input.decision,
      reviewer: input.reviewer,
      reason: input.reason ?? '',
      authoritySnapshotDigest: pin,
      createdAt: input.createdAt ?? iso(clock),
    }, { idFactory })
    reviews.set(decision.review_id, clone(decision))

    let updated = proposal
    if (['approved', 'auto-approved'].includes(decision.decision)) {
      updated = transitionProposal(proposal, 'approved', { review_id: decision.review_id })
    } else if (decision.decision === 'rejected') {
      updated = transitionProposal(proposal, 'rejected', { review_id: decision.review_id })
    }
    proposals.set(proposalId, clone(updated))
    return Object.freeze({ decision, proposal: updated })
  }

  function markProposalConflicted(proposalId, currentWorkspaceRevision) {
    const proposal = proposals.get(proposalId)
    if (!proposal) throw new Error('unknown proposal')
    const result = checkProposalBase(proposal, currentWorkspaceRevision)
    if (!result.ok && result.status === 'Conflict') proposals.set(proposalId, clone(result.proposal))
    return result
  }

  function supersedeProposal(proposalId, replacementInput) {
    const current = proposals.get(proposalId)
    if (!current) throw new Error('unknown proposal')
    const superseded = transitionProposal(current, 'superseded', { kind: 'superseded' })
    proposals.set(proposalId, clone(superseded))
    const replacement = createAgentProposal({
      ...clone(replacementInput),
      metadata: { ...(clone(replacementInput?.metadata ?? {})), supersedes: proposalId },
      status: 'proposed',
    }, { idFactory })
    putProposal(replacement)
    return replacement
  }

  function finishRun(runId, { status, diagnostics = [], finishedAt, metadata } = {}) {
    if (!TERMINAL_RUN_STATUS.has(status)) throw new TypeError('finishRun requires a frozen terminal status')
    if (!Array.isArray(diagnostics) || !diagnostics.every(x => typeof x === 'string')) throw new TypeError('diagnostics must be a string array')
    const attempt = activeAttempts.get(runId)
    if (!attempt) throw new Error('run is not active')
    const record = createAgentRun({
      ...attempt,
      runId,
      status,
      diagnostics: [...diagnostics],
      finishedAt: finishedAt ?? iso(clock),
      proposalIds: [...attempt.proposalIds],
      externalEffectIds: [...attempt.externalEffectIds],
      metadata: { ...attempt.metadata, ...(clone(metadata ?? {})) },
    }, { idFactory })
    finalRuns.set(runId, record)
    activeAttempts.delete(runId)
    return record
  }

  const get = (map, id) => map.has(id) ? clone(map.get(id)) : null

  return Object.freeze({
    registerPrincipal,
    putContextPack,
    startRun,
    putProposal,
    validateProposal,
    evaluateProposalReview,
    recordReviewDecision,
    markProposalConflicted,
    supersedeProposal,
    finishRun,
    getPrincipal: id => get(principals, id),
    getContextPack: id => get(contexts, id),
    getProposal: id => get(proposals, id),
    getReviewDecision: id => get(reviews, id),
    getRun: id => get(finalRuns, id),
  })
}
