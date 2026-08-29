import { canonicalBytes, newUuid7Urn, sha256Hex } from '../../ascs-core/src/index.mjs'
import { validateAgentProposal } from './model.mjs'

const TRANSITIONS = new Map([
  ['proposed', new Set(['validated', 'rejected', 'superseded'])],
  ['validated', new Set(['approved', 'rejected', 'conflicted', 'superseded'])],
  ['approved', new Set(['committed', 'conflicted', 'superseded'])],
  ['conflicted', new Set(['superseded'])],
  ['rejected', new Set()],
  ['committed', new Set()],
  ['superseded', new Set()],
])

const BASE_SENSITIVE_EFFECTS = new Set([
  'canonical-write',
  'candidate-write',
  'execution',
  'external-read',
  'external-write',
  'external-process',
  'external-network',
])

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function validatedClone(proposal) {
  const clone = structuredClone(proposal)
  const check = validateAgentProposal(clone)
  if (!check.ok) throw new TypeError(`invalid AgentProposal: ${check.errors.map(entry => `${entry.path}:${entry.code}`).join(', ')}`)
  return clone
}

export async function proposalMaterialDigest(proposal) {
  const p = validatedClone(proposal)
  const material = {
    profile: p.profile,
    proposal_id: p.proposal_id,
    run_id: p.run_id,
    principal_id: p.principal_id,
    mode: p.mode,
    base_workspace_revision: p.base_workspace_revision,
    commands: p.commands,
    validation: p.validation,
  }
  return `proposal-digest:sha256:${await sha256Hex(canonicalBytes(material))}`
}

export function createAgentProposal(input = {}, { idFactory = newUuid7Urn } = {}) {
  if (typeof idFactory !== 'function') throw new TypeError('idFactory must be a function')
  const record = {
    profile: 'agent-proposal/1.0-candidate.1',
    proposal_id: input.proposalId ?? idFactory(),
    run_id: input.runId,
    principal_id: input.principalId,
    mode: input.mode,
    base_workspace_revision: input.baseWorkspaceRevision ?? null,
    commands: structuredClone(input.commands ?? []),
    review: structuredClone(input.review),
    validation: structuredClone(input.validation),
    status: input.status ?? 'proposed',
    created_at: input.createdAt,
    metadata: structuredClone(input.metadata ?? {}),
  }
  const check = validateAgentProposal(record)
  if (!check.ok) throw new TypeError(`invalid AgentProposal: ${check.errors.map(entry => `${entry.path}:${entry.code}`).join(', ')}`)
  return deepFreeze(record)
}

export function transitionProposal(proposal, nextStatus, evidence = undefined) {
  const current = validatedClone(proposal)
  const allowed = TRANSITIONS.get(current.status)
  if (!allowed?.has(nextStatus)) throw new Error(`invalid proposal transition: ${current.status} -> ${nextStatus}`)
  current.status = nextStatus
  if (evidence !== undefined) {
    const prior = Array.isArray(current.metadata?.lifecycle_evidence) ? current.metadata.lifecycle_evidence : []
    current.metadata = {
      ...(current.metadata ?? {}),
      lifecycle_evidence: [...prior, structuredClone(evidence)],
    }
  }
  const check = validateAgentProposal(current)
  if (!check.ok) throw new TypeError(`invalid transitioned AgentProposal: ${check.errors.map(entry => `${entry.path}:${entry.code}`).join(', ')}`)
  return deepFreeze(current)
}

export function checkProposalBase(proposal, currentWorkspaceRevision) {
  const p = validatedClone(proposal)
  const baseSensitive = p.commands.some(command => BASE_SENSITIVE_EFFECTS.has(command.effect_class))
  if (!baseSensitive) {
    return Object.freeze({ ok: true, status: 'Current', proposal: deepFreeze(p) })
  }
  if (p.base_workspace_revision === null) {
    return Object.freeze({
      ok: false,
      status: 'BaseRequired',
      base_workspace_revision: null,
      current_workspace_revision: currentWorkspaceRevision,
      proposal: deepFreeze(p),
    })
  }
  if (p.base_workspace_revision === currentWorkspaceRevision) {
    return Object.freeze({
      ok: true,
      status: 'Current',
      base_workspace_revision: p.base_workspace_revision,
      current_workspace_revision: currentWorkspaceRevision,
      proposal: deepFreeze(p),
    })
  }
  if (!['validated', 'approved', 'conflicted'].includes(p.status)) {
    throw new Error('proposal must be validated or approved before conflict classification')
  }
  const conflicted = p.status === 'conflicted' ? deepFreeze(p) : transitionProposal(p, 'conflicted', {
    kind: 'base-revision-conflict',
    current_workspace_revision: currentWorkspaceRevision,
  })
  return Object.freeze({
    ok: false,
    status: 'Conflict',
    base_workspace_revision: p.base_workspace_revision,
    current_workspace_revision: currentWorkspaceRevision,
    proposal: conflicted,
  })
}
