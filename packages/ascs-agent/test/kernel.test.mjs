import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAgentPrincipal,
  buildContextPack,
  createAgentRun,
  createAgentProposal,
  evaluateReviewPolicy,
} from '../src/index.mjs'

test('principal identity is independent of provider/model/run binding', () => {
  const principal = createAgentPrincipal({
    principalId: 'urn:uuid:0190a007-0000-7000-8000-000000000101',
    principalClass: 'ai-agent',
    identityScope: 'workspace',
    label: 'Workspace Research Agent',
    controller: { type: 'human', ref: 'workspace-owner' },
    createdAt: '2026-08-25T06:30:00Z',
  })
  assert.equal(principal.principal_id, 'urn:uuid:0190a007-0000-7000-8000-000000000101')
  assert.equal(Object.hasOwn(principal, 'model_binding'), false)
})

test('E1 public constructors are present as distinct logical surfaces', () => {
  assert.equal(typeof buildContextPack, 'function')
  assert.equal(typeof createAgentRun, 'function')
  assert.equal(typeof createAgentProposal, 'function')
  assert.equal(typeof evaluateReviewPolicy, 'function')
})
