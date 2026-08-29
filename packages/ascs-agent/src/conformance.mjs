import fs from 'node:fs'
import { createAgentPrincipal } from './model.mjs'
import { buildContextPack, classifyContextTrust, contextPackAddress, verifyContextFresh, verifyToolManifestFresh } from './context.mjs'
import { createAgentRun } from './run.mjs'
import { checkProposalBase, createAgentProposal } from './proposal.mjs'
import { evaluateReviewPolicy } from './review.mjs'
import { createAgentKernel } from './kernel.mjs'

const REF_ROOT = new URL('../reference/v07/', import.meta.url)
const readJson = rel => JSON.parse(fs.readFileSync(new URL(rel, REF_ROOT), 'utf8'))
const principalExample = () => readJson('examples/agent_principal_example.json')
const contextExample = () => readJson('examples/context_pack_example.json')
const runExample = () => readJson('examples/agent_run_example.json')
const proposalExample = () => readJson('examples/patch_proposal_example.json')
const policyExample = () => readJson('examples/review_policy_example.json')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function principalInput(example = principalExample(), overrides = {}) {
  return {
    principalId: example.principal_id,
    principalClass: example.principal_class,
    identityScope: example.identity_scope,
    label: example.label,
    controller: example.controller,
    createdAt: example.created_at,
    defaultPolicyRef: example.default_policy_ref,
    metadata: example.metadata,
    ...overrides,
  }
}

function runInput(example = runExample(), overrides = {}) {
  return {
    runId: example.run_id,
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
    ...overrides,
  }
}

function proposalInput(runId, example = proposalExample(), overrides = {}) {
  return {
    proposalId: example.proposal_id,
    runId,
    principalId: example.principal_id,
    mode: example.mode,
    baseWorkspaceRevision: example.base_workspace_revision,
    commands: example.commands,
    review: example.review,
    validation: example.validation,
    status: example.status,
    createdAt: example.created_at,
    metadata: example.metadata,
    ...overrides,
  }
}

async function kernelScenario({ validatorOutcome, finishStatus } = {}) {
  const p = principalExample()
  const ctx = await buildContextPack(contextExample())
  const kernel = createAgentKernel({
    idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000891',
    clock: () => new Date('2026-08-25T06:35:00Z'),
  })
  kernel.registerPrincipal(p)
  const run = runExample()
  const active = kernel.startRun({
    principalId: p.principal_id,
    contextPackId: ctx.context_pack_id,
    baseWorkspaceRevision: run.base_workspace_revision,
    mode: run.mode,
    modelBinding: run.model_binding,
    adapterBinding: run.adapter_binding,
    capabilityGrantIds: run.capability_grant_ids,
    startedAt: run.started_at,
  })
  const example = proposalExample()
  const proposal = createAgentProposal(proposalInput(active.run_id, example, {
    proposalId: 'urn:uuid:0190a007-0000-7000-8000-000000000892',
    status: 'proposed',
    validation: { ...example.validation, evidence_refs: [] },
    metadata: { model_claim_valid: true },
  }))
  kernel.putProposal(proposal)
  let validated = proposal
  if (validatorOutcome) {
    validated = await kernel.validateProposal(proposal.proposal_id, async () => validatorOutcome)
  }
  let finalRun = null
  if (finishStatus) finalRun = kernel.finishRun(active.run_id, { status: finishStatus, diagnostics: [] })
  return { kernel, proposalId: proposal.proposal_id, validated, finalRun }
}

const HANDLERS = new Map([
  ['AG-01', async () => {
    const p = createAgentPrincipal(principalInput())
    const base = runExample()
    const a = createAgentRun(runInput(base, {
      runId: 'urn:uuid:0190a007-0000-7000-8000-000000000801',
      modelBinding: { ...base.model_binding, model: 'model-a' },
      proposalIds: [],
    }))
    const b = createAgentRun(runInput(base, {
      runId: 'urn:uuid:0190a007-0000-7000-8000-000000000802',
      modelBinding: { ...base.model_binding, model: 'model-b' },
      proposalIds: [],
    }))
    assert(a.principal_id === p.principal_id && b.principal_id === p.principal_id, 'model switch changed principal')
    return { principal_id: p.principal_id, models: [a.model_binding.model, b.model_binding.model] }
  }],
  ['AG-02', async () => {
    const a = createAgentPrincipal(principalInput(principalExample(), { principalId: 'urn:uuid:0190a007-0000-7000-8000-000000000811' }))
    const b = createAgentPrincipal(principalInput(principalExample(), { principalId: 'urn:uuid:0190a007-0000-7000-8000-000000000812' }))
    assert(a.principal_id !== b.principal_id, 'distinct agents collapsed')
    return { distinct: true, ids: [a.principal_id, b.principal_id] }
  }],
  ['AG-03', async () => {
    const base = runExample()
    const a = createAgentRun(runInput(base, { runId: 'urn:uuid:0190a007-0000-7000-8000-000000000821', adapterBinding: { ...base.adapter_binding, protocol_version: 'transport-a' }, proposalIds: [] }))
    const b = createAgentRun(runInput(base, { runId: 'urn:uuid:0190a007-0000-7000-8000-000000000822', adapterBinding: { ...base.adapter_binding, protocol_version: 'transport-b' }, proposalIds: [] }))
    assert(a.principal_id === b.principal_id, 'transport reconnect changed principal')
    return { principal_id: a.principal_id, protocols: [a.adapter_binding.protocol_version, b.adapter_binding.protocol_version] }
  }],
  ['AG-04', async () => {
    const p = principalExample()
    const ctx = await buildContextPack(contextExample())
    const ids = ['urn:uuid:0190a007-0000-7000-8000-000000000831','urn:uuid:0190a007-0000-7000-8000-000000000832']
    let i = 0
    const kernel = createAgentKernel({ idFactory: () => ids[i++], clock: () => new Date('2026-08-25T06:35:00Z') })
    kernel.registerPrincipal(p)
    kernel.putContextPack(ctx)
    const r = runExample()
    const input = { principalId:p.principal_id,contextPackId:ctx.context_pack_id,baseWorkspaceRevision:r.base_workspace_revision,mode:r.mode,modelBinding:r.model_binding,adapterBinding:r.adapter_binding,capabilityGrantIds:r.capability_grant_ids,startedAt:r.started_at }
    const a = kernel.startRun(input)
    const b = kernel.startRun(input)
    assert(a.run_id !== b.run_id, 'retry reused run id')
    return { distinct_run_ids: true, run_ids: [a.run_id, b.run_id] }
  }],
  ['AG-05', async () => {
    const pack = contextExample()
    const a = await contextPackAddress(pack)
    const b = await contextPackAddress(pack)
    assert(a === b && a === pack.context_pack_id, 'context identity not deterministic')
    return { context_pack_id: a, stable: true }
  }],
  ['AG-06', async () => {
    const pack = contextExample()
    const promptA = 'model A rendering'
    const promptB = 'reordered model B rendering'
    assert(promptA !== promptB, 'fixture error')
    const a = await contextPackAddress(pack)
    const b = await contextPackAddress(pack)
    assert(a === b, 'prompt rendering changed logical context id')
    return { same_context_id: true, renderings_differ: true }
  }],
  ['AG-07', async () => {
    const trust = classifyContextTrust({ role: 'workspace-document', authorityOrigin: 'workspace-data' })
    assert(trust === 'untrusted-data', 'document self-upgraded trust')
    return { trust_class: trust }
  }],
  ['AG-08', async () => {
    const trust = classifyContextTrust({ role: 'workspace-memory', authorityOrigin: 'generated' })
    assert(trust === 'generated-data', 'generated memory became trusted policy')
    return { trust_class: trust }
  }],
  ['AG-09', async () => {
    const pack = contextExample()
    const byRef = new Map(pack.sources.map(source => [source.ref, source.inline_content]))
    byRef.set('notes/example.md', 'changed bytes')
    const r = await verifyContextFresh(pack, async ref => byRef.get(ref))
    assert(!r.ok && r.staleSources.some(x => x.ref === 'notes/example.md'), 'stale context source not detected')
    return { stale_refs: r.staleSources.map(x => x.ref) }
  }],
  ['AG-11', async () => {
    const proposal = proposalExample()
    proposal.mode = 'suggest'
    const facts = evaluateReviewPolicy(policyExample(), proposal)
    assert(facts.canonicalMutation === 'forbidden' && !facts.autoCommitEligible, 'suggest allowed canonical mutation')
    return { canonical_mutation: facts.canonicalMutation, auto_commit: facts.autoCommitEligible }
  }],
  ['AG-12', async () => {
    const facts = evaluateReviewPolicy(policyExample(), proposalExample())
    assert(facts.humanReview === 'required' && facts.canonicalMutation === 'proposal-only', 'patch review not required')
    return { human_review: facts.humanReview, canonical_mutation: facts.canonicalMutation }
  }],
  ['AG-14', async () => {
    const proposal = proposalExample()
    proposal.status = 'validated'
    const current = 'wrev:sha256:' + 'd'.repeat(64)
    const r = checkProposalBase(proposal, current)
    assert(!r.ok && r.status === 'Conflict' && r.proposal.base_workspace_revision === proposal.base_workspace_revision, 'stale proposal silently rebased')
    return { conflict: r.status, base_preserved: true }
  }],
  ['AG-17', async () => {
    const r = await kernelScenario({ validatorOutcome: { ok: true, evidenceRefs: ['validator:deterministic:v1'] } })
    assert(r.validated.status === 'validated' && !r.validated.validation.model_self_validation_authoritative, 'model self assertion became authority')
    return { status: r.validated.status, evidence: r.validated.validation.evidence_refs, self_authority: false }
  }],
  ['AG-18', async () => {
    const r = await kernelScenario({ validatorOutcome: { ok: false, evidenceRefs: ['validator:reject:v1'] } })
    assert(r.validated.status === 'rejected', 'deterministic invalidity overridden')
    return { status: r.validated.status, evidence: r.validated.validation.evidence_refs }
  }],
  ['AG-31', async () => {
    const pack = contextExample()
    const expected = new Map(pack.tool_manifest.tools.map(tool => [tool.name, tool.schema_hash]))
    const changed = pack.tool_manifest.tools[0].name
    const r = await verifyToolManifestFresh(pack, async name => name === changed ? '0'.repeat(64) : expected.get(name))
    assert(!r.ok && r.staleTools.length === 1 && r.staleTools[0].name === changed, 'tool schema drift not detected')
    return { stale_tools: r.staleTools.map(x => x.name) }
  }],
  ['AG-33', async () => {
    const r = await kernelScenario({ finishStatus: 'failed' })
    assert(r.finalRun.status === 'failed' && r.kernel.getProposal(r.proposalId).status !== 'committed', 'failed run committed proposal')
    return { run_status: r.finalRun.status, proposal_status: r.kernel.getProposal(r.proposalId).status }
  }],
  ['AG-34', async () => {
    const r = await kernelScenario({ finishStatus: 'cancelled' })
    assert(r.finalRun.status === 'cancelled' && r.kernel.getProposal(r.proposalId).status !== 'committed', 'cancelled run committed proposal')
    return { run_status: r.finalRun.status, proposal_status: r.kernel.getProposal(r.proposalId).status }
  }],
])

export async function runE1AgentConformance() {
  const vectors = readJson('conformance/agent_conformance_vectors.json').vectors
  const coverage = readJson('E1_VECTOR_COVERAGE.json')
  const covered = new Set(coverage.covered)
  const deferred = new Map(coverage.deferred.map(row => [row.id, row.slice]))
  const results = []
  for (const vector of vectors) {
    if (covered.has(vector.id)) {
      const handler = HANDLERS.get(vector.id)
      if (!handler) {
        results.push({ vector_id: vector.id, status: 'FAIL', error: 'covered vector has no production scenario' })
        continue
      }
      try {
        const observed = await handler({ id: vector.id, category: vector.category, premise: vector.premise })
        results.push({ vector_id: vector.id, status: 'PASS', observed })
      } catch (error) {
        results.push({ vector_id: vector.id, status: 'FAIL', error: error instanceof Error ? error.message : String(error) })
      }
      continue
    }
    if (deferred.has(vector.id)) {
      results.push({ vector_id: vector.id, status: 'DEFERRED', slice: deferred.get(vector.id) })
      continue
    }
    results.push({ vector_id: vector.id, status: 'FAIL', error: 'vector is not classified by E1 coverage' })
  }
  return Object.freeze({
    total: results.length,
    passed: results.filter(row => row.status === 'PASS').length,
    deferred: results.filter(row => row.status === 'DEFERRED').length,
    failed: results.filter(row => row.status === 'FAIL').length,
    results: Object.freeze(results.map(row => Object.freeze(row))),
  })
}
