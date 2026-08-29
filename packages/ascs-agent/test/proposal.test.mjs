import test from 'node:test'
import assert from 'node:assert/strict'
import { referenceJson } from './reference-helper.mjs'
import {
  proposalMaterialDigest,
  createAgentProposal,
  transitionProposal,
  checkProposalBase,
} from '../src/index.mjs'

const patch = () => referenceJson('examples/patch_proposal_example.json')

function inputFromExample(example = patch()) {
  return {
    runId: example.run_id,
    principalId: example.principal_id,
    mode: example.mode,
    baseWorkspaceRevision: example.base_workspace_revision,
    commands: example.commands,
    review: example.review,
    validation: example.validation,
    status: 'proposed',
    createdAt: example.created_at,
    metadata: example.metadata,
  }
}

test('proposal material digest excludes bookkeeping but binds all material command data', async () => {
  const original = patch()
  const digest = await proposalMaterialDigest(original)
  assert.match(digest, /^proposal-digest:sha256:[0-9a-f]{64}$/)

  const bookkeeping = structuredClone(original)
  bookkeeping.status = 'approved'
  bookkeeping.review.approval_actor = 'workspace-owner'
  bookkeeping.created_at = '2026-08-25T07:00:00Z'
  bookkeeping.metadata = { changed: true }
  assert.equal(await proposalMaterialDigest(bookkeeping), digest)

  for (const mutate of [
    p => { p.commands[0].target = 'object:other' },
    p => { p.commands[0].payload_digest = '0'.repeat(64) },
    p => { p.base_workspace_revision = 'wrev:sha256:' + 'd'.repeat(64) },
    p => { p.commands[0].required_capabilities = ['object.write'] },
    p => { p.commands[0].replay_policy = 'manual' },
  ]) {
    const changed = structuredClone(original)
    mutate(changed)
    assert.notEqual(await proposalMaterialDigest(changed), digest)
  }
})

test('createAgentProposal constructs a frozen valid proposed record without mutating input', () => {
  const input = inputFromExample()
  const snapshot = structuredClone(input)
  const proposal = createAgentProposal(input, { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000599' })
  assert.equal(proposal.proposal_id, 'urn:uuid:0190a007-0000-7000-8000-000000000599')
  assert.equal(proposal.status, 'proposed')
  assert.deepEqual(input, snapshot)
  assert.equal(Object.isFrozen(proposal), true)
})

test('proposal lifecycle uses only frozen explicit transitions', () => {
  const p0 = createAgentProposal(inputFromExample(), { idFactory: () => 'urn:uuid:0190a007-0000-7000-8000-000000000591' })
  const p1 = transitionProposal(p0, 'validated', { validator: 'deterministic' })
  const p2 = transitionProposal(p1, 'approved', { review_id: 'urn:uuid:0190a007-0000-7000-8000-000000000592' })
  const p3 = transitionProposal(p2, 'committed')
  assert.deepEqual([p0.status, p1.status, p2.status, p3.status], ['proposed', 'validated', 'approved', 'committed'])
  assert.equal(p0.status, 'proposed')
  assert.throws(() => transitionProposal(p0, 'committed'), /invalid proposal transition/)
  assert.throws(() => transitionProposal(p3, 'validated'), /invalid proposal transition/)
})

test('stale mutating proposal becomes conflicted without silent rebase', () => {
  const original = structuredClone(patch())
  original.status = 'validated'
  const current = 'wrev:sha256:' + 'd'.repeat(64)
  const result = checkProposalBase(original, current)
  assert.equal(result.ok, false)
  assert.equal(result.status, 'Conflict')
  assert.equal(result.base_workspace_revision, original.base_workspace_revision)
  assert.equal(result.current_workspace_revision, current)
  assert.equal(result.proposal.status, 'conflicted')
  assert.equal(result.proposal.base_workspace_revision, original.base_workspace_revision)
  assert.equal(original.status, 'validated')
})

test('matching base passes and pure-read proposal does not invent a base requirement', () => {
  const mutating = patch()
  assert.equal(checkProposalBase(mutating, mutating.base_workspace_revision).ok, true)

  const advisory = structuredClone(mutating)
  advisory.mode = 'suggest'
  advisory.base_workspace_revision = null
  advisory.commands[0].command_kind = 'advisory'
  advisory.commands[0].effect_class = 'pure-read'
  advisory.commands[0].required_capabilities = []
  assert.equal(checkProposalBase(advisory, 'wrev:sha256:' + 'e'.repeat(64)).ok, true)
})
