import { newUuid7Urn } from '../../ascs-core/src/index.mjs'
import { validateAgentRun } from './model.mjs'

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

export function createAgentRun(input = {}, { idFactory = newUuid7Urn } = {}) {
  if (typeof idFactory !== 'function') throw new TypeError('idFactory must be a function')
  const record = {
    profile: 'agent-run/1.0-candidate.1',
    run_id: input.runId ?? idFactory(),
    principal_id: input.principalId,
    context_pack_id: input.contextPackId,
    base_workspace_revision: input.baseWorkspaceRevision,
    mode: input.mode,
    model_binding: structuredClone(input.modelBinding),
    adapter_binding: structuredClone(input.adapterBinding),
    capability_grant_ids: [...(input.capabilityGrantIds ?? [])],
    status: input.status,
    started_at: input.startedAt,
    finished_at: input.finishedAt ?? null,
    proposal_ids: [...(input.proposalIds ?? [])],
    external_effect_ids: [...(input.externalEffectIds ?? [])],
    diagnostics: [...(input.diagnostics ?? [])],
    metadata: structuredClone(input.metadata ?? {}),
  }
  const check = validateAgentRun(record)
  if (!check.ok) {
    throw new TypeError(`invalid AgentRun: ${check.errors.map((entry) => `${entry.path}:${entry.code}`).join(', ')}`)
  }
  return deepFreeze(record)
}
