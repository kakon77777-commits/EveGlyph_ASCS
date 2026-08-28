# Milestone E1 Agent Principal / Run / Proposal / Review Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the frozen ASCS v0.7 logical agent kernel in `packages/ascs-agent`: AgentPrincipal, Context Pack, AgentRun, AgentProposal, proposal digest/stale-base semantics, review-policy evaluation, and additive review-decision evidence, without introducing runtime authority, MCP, credential, connector, external-effect execution, Wasmtime, or Editor integration.

**Architecture:** E1 is a pure logical/audit package stacked on the completed E0 exact head. It imports only stable ASCS core primitives (`egir-cj/0.1` canonical bytes, SHA-256, UUIDv7) and never receives or calls `WorkspaceRuntime`. Frozen v0.7 schemas/examples/vectors are copied byte-for-byte as implementation references and checked against the canonical source archive; E1 executes the vector subset whose semantics belong to Principal/Context/Run/Proposal/Review and explicitly classifies all later-slice vectors as deferred rather than pretending they pass.

**Tech Stack:** Node.js 20 ESM, `node:test`, existing `@eveglyph/ascs-core` primitives, Python 3.13 for archive/reference verification, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-28-milestone-e-authority-convergence-design.md`

## Global Constraints

- Stacked implementation base: `E0 exact head 2eb4a7d69b77a8d8373dde0d5f1727056d389577`.
- E1 work branch: `workbench/milestone-e1-agent-kernel`.
- E0 historical product baseline remains `c3258a2f461d5af5a69c879891b485ccf0f02635`.
- E0 security upstream reference remains `061a57ebd3f86dd6df83e6ff8472f5e194c567e5`, tree `664934916c950303ad7e9d166f7aa36a07ac4c57`.
- Frozen v0.7 source archive: `canonical/v1.0/source_archives/EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip` with SHA-256 `ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c`.
- Frozen profiles MUST retain exact IDs: `agent-principal/1.0-candidate.1`, `agent-context-pack/1.0-candidate.1`, `agent-run/1.0-candidate.1`, `agent-proposal/1.0-candidate.1`, `agent-review-policy/1.0-candidate.1`.
- Additive E1 review evidence profile is `agent-review-decision/1.0-candidate.1`; it MUST NOT alter the frozen Proposal/Review schema.
- Context Pack identity is exactly `context-pack:sha256:` + SHA-256 of `C_EGIR-CJ(PackWithoutId)`; do not invent a new canonicalization.
- `suggest`, `patch`, `direct` are review-policy modes, not hidden capability tiers. `direct != bypass`.
- E1 MUST NOT evaluate durable CapabilityGrant semantics beyond preserving/pinning grant IDs; E2 owns authority compilation/enforcement.
- E1 MUST NOT execute or retry external effects; E3 owns effect/credential/delegation/connector behavior.
- E1 MUST NOT define MCP/HTTP/transport identity; E4 owns ingress.
- E1 MUST NOT integrate Wasmtime; E5 owns physical execution evidence.
- E1 MUST NOT integrate current Claude/Codex/Gemini file-agent workflow; E6 owns legacy adapter convergence.
- E1 MUST NOT add an Editor bridge or modify `apps/eveglyph-editor/src/**` / `server/**`.
- `packages/ascs-agent` MUST NOT import `packages/ascs-runtime` or accept a `WorkspaceRuntime` object.
- `canonical/`, `provenance/`, and `releases/` are read-only.
- No assistant-side merge. Deliver only branch + PR + exact-head backup + Ready-for-Review; merge is local/user-controlled.

---

### Task 1: Freeze the E1 reference surface and prove RED

**Files:**
- Create: `packages/ascs-agent/package.json`
- Create: `packages/ascs-agent/test/kernel.test.mjs`
- Create: `packages/ascs-agent/test/reference-lineage.test.mjs`
- Create: `tests/test_e1_agent_reference.py`
- Create temporarily: `.github/workflows/milestone-e1-red-construction.yml`

**Interfaces:**
- Tests expect `packages/ascs-agent/src/index.mjs` and frozen reference copies to exist; production files do not exist yet.
- Python reference test reads the canonical v0.7 archive and compares E1 copies byte-for-byte once Task 2 creates them.

- [ ] **Step 1: Create the private ESM package declaration**

```json
{
  "name": "@evemisslab/ascs-agent",
  "version": "0.1.0-candidate.1",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "exports": "./src/index.mjs"
}
```

- [ ] **Step 2: Write the first JS RED contract**

`packages/ascs-agent/test/kernel.test.mjs` imports the future public API and asserts the frozen identity boundaries:

```js
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
```

Add focused tests that import `buildContextPack`, `createAgentRun`, `createAgentProposal`, and `evaluateReviewPolicy`; they should not be able to run because `src/index.mjs` is absent.

- [ ] **Step 3: Write the archive/reference RED contract**

`tests/test_e1_agent_reference.py` must assert:

```python
V07_ARCHIVE_SHA256 = "ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c"
EXPECTED_VECTOR_COUNT = 36
EXPECTED_E1_COVERED = 18
EXPECTED_DEFERRED = 18
```

It must open the ZIP through Python `zipfile`, locate the internal `V0.7_Support` root, and compare future copied reference files against ZIP entry bytes. It must also assert the frozen conformance file contains exactly 36 unique ids `AG-01` through `AG-36`.

- [ ] **Step 4: Add a construction-only RED workflow**

The temporary workflow runs only on the E1 branch and executes:

```bash
node --test packages/ascs-agent/test/kernel.test.mjs
python -B -m unittest tests.test_e1_agent_reference -v
```

Expected RED: JS import fails because `packages/ascs-agent/src/index.mjs` is missing and Python reference test fails because the copied reference directory/coverage file does not exist.

- [ ] **Step 5: Capture RED evidence and commit**

Commit message:

```text
test: define E1 agent kernel contract
```

Do not add production implementation in this commit.

---

### Task 2: Byte-pin frozen v0.7 records and implement strict record construction/validation

**Files:**
- Create: `packages/ascs-agent/reference/v07/schemas/agent-principal.schema.json`
- Create: `packages/ascs-agent/reference/v07/schemas/agent-context-pack.schema.json`
- Create: `packages/ascs-agent/reference/v07/schemas/agent-run.schema.json`
- Create: `packages/ascs-agent/reference/v07/schemas/agent-proposal.schema.json`
- Create: `packages/ascs-agent/reference/v07/schemas/agent-review-policy.schema.json`
- Create: `packages/ascs-agent/reference/v07/examples/agent_principal_example.json`
- Create: `packages/ascs-agent/reference/v07/examples/context_pack_example.json`
- Create: `packages/ascs-agent/reference/v07/examples/agent_run_example.json`
- Create: `packages/ascs-agent/reference/v07/examples/patch_proposal_example.json`
- Create: `packages/ascs-agent/reference/v07/examples/direct_proposal_example.json`
- Create: `packages/ascs-agent/reference/v07/examples/review_policy_example.json`
- Create: `packages/ascs-agent/reference/v07/conformance/agent_conformance_vectors.json`
- Create: `packages/ascs-agent/src/model.mjs`
- Create: `packages/ascs-agent/src/index.mjs`
- Create: `packages/MILESTONE_E1_AGENT_REFERENCE_LINEAGE.json`
- Test: `packages/ascs-agent/test/model.test.mjs`
- Test: `tests/test_e1_agent_reference.py`

**Interfaces:**
- Produces `validateAgentPrincipal(value)`, `validateContextPack(value)`, `validateAgentRun(value)`, `validateAgentProposal(value)`, `validateReviewPolicy(value)` returning `{ ok, errors }`.
- Produces `createAgentPrincipal(input, options?)` returning a frozen-schema record with no provider/model fields.
- All validators are deterministic and dependency-free; no Ajv or external schema package is introduced.

- [ ] **Step 1: Copy the frozen reference files byte-for-byte**

Extract exactly the listed files from the v0.7 source archive; do not edit formatting, key order, or content. `tests/test_e1_agent_reference.py` must compare each copied file's raw bytes to the archive entry.

- [ ] **Step 2: Add lineage metadata**

`packages/MILESTONE_E1_AGENT_REFERENCE_LINEAGE.json` records:

```json
{
  "schema": "eveglyph-ascs-agent-reference-lineage/1.0",
  "authority": "implementation-reference-only",
  "source_archive": "canonical/v1.0/source_archives/EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip",
  "source_archive_sha256": "ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c",
  "frozen_vector_count": 36,
  "package": "packages/ascs-agent"
}
```

The file may additionally list copied paths and SHA-256 values generated from the archive, but must not claim canonical authority.

- [ ] **Step 3: Write model validator tests first**

Tests must cover at minimum:

```text
principal: exact profile, UUID URN, class/scope enums, controller human|organization|system
context: exact profile, context-pack id shape, task run-directive, trust enums, no secret extra fields
run: model_binding.binding_is_identity_authority === false, modes/status enums, unique grant IDs
proposal: non-empty commands, frozen command/effect enums, deterministic validation booleans, frozen status enum
review policy: exact profile, all suggest/patch/direct entries, external-effect and deterministic-validation constants
```

Mutating any frozen example into an invalid enum or setting `binding_is_identity_authority=true` must produce a typed validation error.

- [ ] **Step 4: Implement minimal dependency-free validators and principal constructor**

Use helpers such as:

```js
const UUID_URN = /^urn:uuid:[0-9a-fA-F-]{36}$/
const WREV = /^wrev:sha256:[0-9a-f]{64}$/
const SHA256 = /^[0-9a-f]{64}$/
const CONTEXT_ID = /^context-pack:sha256:[0-9a-f]{64}$/
const MODES = new Set(['suggest', 'patch', 'direct'])
```

Return errors as objects `{ code, path, message }`; ordinary invalid input must not throw. Constructors may throw `TypeError` only when asked to construct an invalid record after validation.

`createAgentPrincipal()` must accept explicit logical identity inputs and MUST NOT accept/provider-copy `provider`, `model`, transport session, OAuth identity, credential, or MCP metadata.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test packages/ascs-agent/test/model.test.mjs
python -B -m unittest tests.test_e1_agent_reference -v
```

Expected: PASS and byte-equality to the canonical archive for every copied reference file.

- [ ] **Step 6: Commit**

```text
feat: add frozen v0.7 agent record model
```

---

### Task 3: Context Pack identity, trust classification, freshness, and Run creation

**Files:**
- Create: `packages/ascs-agent/src/context.mjs`
- Create: `packages/ascs-agent/src/run.mjs`
- Modify: `packages/ascs-agent/src/index.mjs`
- Test: `packages/ascs-agent/test/context.test.mjs`
- Test: `packages/ascs-agent/test/run.test.mjs`

**Interfaces:**
- Produces `contextPackAddress(pack)` -> `Promise<string>`.
- Produces `buildContextPack(input)` -> validated record with computed `context_pack_id`.
- Produces `classifyContextTrust({ role, authorityOrigin })` -> frozen trust class.
- Produces `verifyContextFresh(pack, resolveSourceBytes)` -> `Promise<{ ok, staleSources }>`.
- Produces `verifyToolManifestFresh(pack, resolveToolSchemaHash)` -> `Promise<{ ok, staleTools }>`.
- Produces `createAgentRun(input, options?)` -> validated run with a fresh `run_id` per call.

- [ ] **Step 1: Write Context Pack RED tests**

Required tests:

1. Frozen `context_pack_example.json` recomputes exactly to `context-pack:sha256:bb4c48f2c8fde586beff62d504a036bbb1f0e4224ee9b82d746c870a369b3d70`.
2. `contextPackAddress()` deletes only `context_pack_id` from the hash preimage and uses existing `canonicalBytes()` / `sha256Hex()` from `ascs-core`.
3. Two different prompt renderings produced outside the pack do not alter pack identity.
4. Workspace-document text containing "ignore previous instructions" remains `untrusted-data` because trust is host-derived.
5. `authority_origin=generated` yields `generated-data`, never `trusted-policy`.
6. A source-byte hash mismatch returns `ContextStale` evidence and does not mutate the pack.
7. A pinned tool schema mismatch returns stale-tool evidence; it does not call the tool.

- [ ] **Step 2: Implement the exact v0.7 context hash domain**

```js
export async function contextPackAddress(pack) {
  const preimage = structuredClone(pack)
  delete preimage.context_pack_id
  return `context-pack:sha256:${await sha256Hex(canonicalBytes(preimage))}`
}
```

Do not sort source/tool arrays beyond what the caller already supplied; `egir-cj/0.1` governs object-key canonicalization and the frozen example proves the exact preimage.

- [ ] **Step 3: Implement host-derived trust classification**

Use this minimum mapping:

```text
user-directive + explicit-user          -> directive
workspace-policy + committed-policy     -> trusted-policy
protected-glossary + committed-data     -> trusted-data
workspace-memory + committed-data       -> trusted-data
anything + generated                    -> generated-data
workspace-document / selection          -> untrusted-data
external-resource                       -> untrusted-data
adapter-metadata                        -> generated-data
```

Content bytes MUST NOT change the derived class.

- [ ] **Step 4: Implement freshness checks without I/O authority**

`verifyContextFresh()` receives a caller-provided read-only resolver `async ref => Uint8Array|string|null`, hashes bytes, and reports stale source IDs. It never reads filesystem/network itself.

`verifyToolManifestFresh()` receives a caller-provided resolver `async toolName => sha256|null` and reports changed tool schemas. It never executes a tool.

- [ ] **Step 5: Write Run RED tests and implement Run creation**

Tests must prove:

```text
same principal + same task retry => different run_id
provider/model changes => principal_id unchanged
transport/adapter metadata lives only in adapter_binding
model binding is always binding_is_identity_authority=false
run pins context_pack_id, base_workspace_revision, mode, policy/grant IDs
```

`createAgentRun()` must use a supplied `idFactory` for deterministic tests and default to `newUuid7Urn()` in production. It starts as an immutable record snapshot; lifecycle updates in Task 5 create replacement records rather than mutating caller-owned objects.

- [ ] **Step 6: Verify and commit**

```bash
node --test packages/ascs-agent/test/context.test.mjs packages/ascs-agent/test/run.test.mjs
```

Commit:

```text
feat: add E1 context pack and run semantics
```

---

### Task 4: Proposal material digest, lifecycle, stale-base handling, and review evidence

**Files:**
- Create: `packages/ascs-agent/src/proposal.mjs`
- Create: `packages/ascs-agent/src/review.mjs`
- Modify: `packages/ascs-agent/src/index.mjs`
- Test: `packages/ascs-agent/test/proposal.test.mjs`
- Test: `packages/ascs-agent/test/review.test.mjs`

**Interfaces:**
- Produces `proposalMaterialDigest(proposal)` -> `Promise<string>` with prefix `proposal-digest:sha256:`.
- Produces `createAgentProposal(input, options?)`.
- Produces `transitionProposal(proposal, nextStatus, evidence?)`.
- Produces `checkProposalBase(proposal, currentWorkspaceRevision)` -> `{ ok, status, ... }`.
- Produces `evaluateReviewPolicy(policy, proposal)`.
- Produces `authorityPinDigest({ capabilityGrantIds, policyRevision })` -> `Promise<string>` with prefix `authority-pin:sha256:`.
- Produces `createReviewDecision(input, options?)` -> additive `agent-review-decision/1.0-candidate.1` record.
- Produces `reviewDecisionStillValid(decision, proposal, policy, authorityPinDigest)`.

- [ ] **Step 1: Define the material proposal digest with RED tests**

The digest preimage is exactly:

```js
{
  profile: proposal.profile,
  proposal_id: proposal.proposal_id,
  run_id: proposal.run_id,
  principal_id: proposal.principal_id,
  mode: proposal.mode,
  base_workspace_revision: proposal.base_workspace_revision,
  commands: proposal.commands,
  validation: proposal.validation,
}
```

Excluded fields: `review`, `status`, `created_at`, `metadata`. Therefore approval status bookkeeping does not change the validated material digest, while changing command payload/target/base/required capabilities/replay policy does.

- [ ] **Step 2: Implement the frozen proposal lifecycle**

Use an explicit transition table:

```text
proposed   -> validated | rejected | superseded
validated  -> approved | rejected | conflicted | superseded
approved   -> committed | conflicted | superseded
conflicted -> superseded
rejected   -> terminal
committed  -> terminal
superseded -> terminal
```

No arbitrary status assignment. Every returned proposal is a structured clone; the input object remains unchanged.

- [ ] **Step 3: Implement stale-base semantics**

For mutating commands (`canonical-write`, `candidate-write`, `execution`, `external-*`), a non-null proposal base must equal the supplied current workspace revision before progression to commit-capable state. Mismatch returns:

```js
{
  ok: false,
  status: 'Conflict',
  base_workspace_revision: proposal.base_workspace_revision,
  current_workspace_revision,
  proposal: <same proposal material with status 'conflicted'>,
}
```

E1 does not rebase or commit. It MUST NOT silently replace the base revision.

- [ ] **Step 4: Implement review-policy evaluation**

Return policy facts, not authority:

```text
suggest -> canonicalMutation=forbidden, humanReview=not-applicable, autoCommitEligible=false
patch   -> canonicalMutation=proposal-only, humanReview=required, autoCommitEligible=false
direct  -> canonicalMutation=allowed-if-capable, humanReview=policy-dependent, autoCommitEligible=<policy.auto_commit>
```

For all modes, `deterministicValidationRequired=true`; mode never creates capabilities or external-effect authority.

- [ ] **Step 5: Implement additive review-decision evidence**

The record shape is:

```json
{
  "profile": "agent-review-decision/1.0-candidate.1",
  "review_id": "urn:uuid:...",
  "proposal_id": "urn:uuid:...",
  "policy_id": "...",
  "policy_revision": "...",
  "decision": "approved|rejected|auto-approved|needs-human",
  "reviewer": { "type": "human|organization|system|policy", "ref": "..." },
  "reason": "...",
  "validated_proposal_digest": "proposal-digest:sha256:...",
  "authority_snapshot_digest": "authority-pin:sha256:...",
  "base_workspace_revision": "wrev:sha256:...|null",
  "created_at": "RFC3339"
}
```

`approved` and `auto-approved` require proposal status `validated`, exact policy id/revision, exact current material digest, and a non-empty authority pin digest. This digest only binds pinned grant IDs/policy revision in E1; it does NOT claim the grants are authorized. E2 later owns actual authority compilation.

- [ ] **Step 6: Prove approval invalidation**

Tests must change each material field class one at a time: command target, payload digest, base workspace revision, required capabilities, replay policy. `reviewDecisionStillValid()` must return false in every case. Changing only proposal `status` from validated to approved must not change the material digest.

- [ ] **Step 7: Verify and commit**

```bash
node --test packages/ascs-agent/test/proposal.test.mjs packages/ascs-agent/test/review.test.mjs
```

Commit:

```text
feat: add E1 proposal and review lifecycle
```

---

### Task 5: In-memory AgentKernel orchestration without canonical mutation authority

**Files:**
- Create: `packages/ascs-agent/src/kernel.mjs`
- Modify: `packages/ascs-agent/src/index.mjs`
- Test: `packages/ascs-agent/test/kernel.test.mjs`
- Test: `packages/ascs-agent/test/no-runtime-authority.test.mjs`

**Interfaces:**
- Produces `createAgentKernel({ clock?, idFactory? } = {})`.
- Kernel methods: `registerPrincipal`, `putContextPack`, `startRun`, `putProposal`, `validateProposal`, `evaluateProposalReview`, `recordReviewDecision`, `markProposalConflicted`, `supersedeProposal`, `finishRun`, and read-only getters returning clones.
- No method accepts `WorkspaceRuntime`, raw mutation callback, credential, delegation ticket, MCP session, or provider connection.

- [ ] **Step 1: Write orchestration RED tests**

Required scenario:

```text
register principal
→ put deterministic context pack
→ start patch run
→ put proposed edit
→ deterministic validator callback returns evidence
→ proposal becomes validated
→ review policy says needs-human
→ record approved human review bound to exact digest
→ proposal becomes approved
```

At the end, an external `WorkspaceRuntime` fixture supplied only to the test must remain deep-equal to its initial snapshot because E1 never receives it.

- [ ] **Step 2: Implement deterministic validation boundary**

`kernel.validateProposal(proposalId, validator)` requires a caller-supplied deterministic callback:

```js
async proposal => ({ ok: true, evidenceRefs: ['validator:test:v1'] })
```

The callback result, not model text, controls `validated` vs `rejected`. `model_self_validation_authoritative` must remain false.

- [ ] **Step 3: Implement failure/cancellation semantics**

`finishRun(runId, { status, diagnostics })` accepts only frozen terminal statuses `completed|failed|cancelled|timed-out|conflicted`; it records diagnostics and finished_at. Failed/cancelled/timed-out runs do not change any proposal to committed and cannot create canonical state.

- [ ] **Step 4: Add a source-level no-runtime-authority gate**

The test scans `packages/ascs-agent/src/**/*.mjs` and rejects imports/references to:

```text
ascs-runtime
WorkspaceRuntime
commitExtensionMutation
createWorkspaceRuntime
Credential
DelegationTicket
McpServer
```

False positives in comments are avoided by testing import specifiers and exported API names, not arbitrary prose.

- [ ] **Step 5: Verify and commit**

```bash
node --test packages/ascs-agent/test/kernel.test.mjs packages/ascs-agent/test/no-runtime-authority.test.mjs
```

Commit:

```text
feat: add E1 agent orchestration kernel
```

---

### Task 6: Frozen v0.7 conformance coverage with explicit later-slice deferrals

**Files:**
- Create: `packages/ascs-agent/src/conformance.mjs`
- Create: `packages/ascs-agent/reference/v07/E1_VECTOR_COVERAGE.json`
- Modify: `packages/ascs-agent/src/index.mjs`
- Test: `packages/ascs-agent/test/conformance.test.mjs`
- Modify: `tests/test_e1_agent_reference.py`

**Interfaces:**
- Produces `runE1AgentConformance()` -> `Promise<{ total, passed, deferred, failed, results }>`.
- Coverage manifest classifies every AG-01..AG-36 exactly once.

- [ ] **Step 1: Freeze the E1 coverage map**

E1-covered vectors (18):

```text
AG-01 AG-02 AG-03 AG-04
AG-05 AG-06 AG-07 AG-08 AG-09
AG-11 AG-12 AG-13 AG-14
AG-17 AG-18
AG-31
AG-33 AG-34
```

Deferred vectors are explicit and not counted PASS:

```text
E2: AG-10 AG-15 AG-16 AG-19 AG-20 AG-32 AG-35
E3: AG-21 AG-22 AG-23 AG-24 AG-30
E4: AG-25 AG-26 AG-29
E6: AG-27 AG-28 AG-36
```

This accounts for all 36 vectors. E5 has no unique v0.7 vector; its physical Wasmtime obligations are additional Milestone E evidence.

- [ ] **Step 2: Write conformance tests before the runner**

Tests require:

```text
total = 36
passed = 18
deferred = 18
failed = 0
no unclassified vector ids
no result obtains its observed outcome by returning vector.expected verbatim
```

Each covered vector must execute real production functions from Tasks 2–5. Examples:

- AG-01/02/03 use principal/run constructors.
- AG-04 creates two runs and compares IDs.
- AG-05 computes context ID twice.
- AG-07/08 use host trust classification.
- AG-09 uses source freshness mismatch.
- AG-11/12/13 use review-policy evaluation.
- AG-14 uses `checkProposalBase()`.
- AG-17/18 use deterministic validator callback behavior.
- AG-31 uses tool-manifest freshness check.
- AG-33/34 use run termination + absence of canonical runtime integration.

- [ ] **Step 3: Implement generic scenario execution**

The runner reads the frozen vector list only to obtain ids/categories/premises and dispatches E1-covered ids to production-semantic scenario functions. A deferred vector returns:

```js
{ status: 'DEFERRED', slice: 'E2|E3|E4|E6', vector_id: 'AG-xx' }
```

A covered vector returns `PASS` only when its scenario assertions hold. Never implement `return { status:'PASS', observed: vector.expected }`.

- [ ] **Step 4: Verify and commit**

```bash
node --test packages/ascs-agent/test/conformance.test.mjs
python -B -m unittest tests.test_e1_agent_reference -v
```

Commit:

```text
test: close E1 frozen agent conformance slice
```

---

### Task 7: Final E1 CI, PR, exact-head backup, and Ready-for-Review closure

**Files:**
- Remove: `.github/workflows/milestone-e1-red-construction.yml`
- Create: `.github/workflows/milestone-e1-agent-kernel.yml`
- Create: `.github/workflows/milestone-e1-agent-kernel-backup.yml`
- Create: `docs/product-convergence/MILESTONE_E1_AGENT_KERNEL.md`

**Interfaces:**
- Formal E1 CI has no write permissions and no product/runtime mutation behavior.
- Backup produces `EveGlyph_ASCS_Milestone_E1_<sha8>_source-backup.zip` and `ARTIFACT_SHA256.txt`.

- [ ] **Step 1: Replace construction RED workflow with formal E1 workflow**

Formal jobs:

```text
e1-reference
  - ASCS repository/canonical preservation
  - v0.7 archive SHA and copied-reference byte equality
  - E0 security manifest/product convergence validation

e1-agent-kernel
  - all packages/ascs-agent tests
  - E1 conformance: 18 PASS / 18 DEFERRED / 0 FAIL
  - source-level no-runtime-authority gate

cross-milestone-regression
  - existing A/B/C/D runtime tests
  - existing Native Math/Glyph tests
  - existing Editor B/C/D bridge tests
  - publication/build/dynamic logic/dynamic rendering
```

No upstream security source is copied into E1; E0 reference remains a pin. The formal E1 workflow may verify the E0 security manifest locally but does not need to rerun the full upstream npm contract on every E1 commit; the exact-head backup workflow reruns the final E0 identity/reference gate.

- [ ] **Step 2: Add human-readable E1 evidence**

Document:

```text
Principal != Model Binding != Run != Transport
Context Pack != Prompt
Model Output != Proposal != Validated Command != Commit
Direct != Bypass
E1 has no canonical mutation authority
E1 covers 18 v0.7 vectors and explicitly defers 18 to E2/E3/E4/E6
```

List final run IDs and exact head only after they exist; do not fabricate them beforehand.

- [ ] **Step 3: Open the E1 PR with the safest available base**

At PR creation time:

1. Inspect `main`.
2. If local/user merge has already integrated the E0 tree, set PR base to `main`.
3. Otherwise set PR base to `workbench/milestone-e0-security-upstream` so the PR shows only E1 changes.

The assistant MUST NOT merge either PR.

- [ ] **Step 4: Add exact-head backup workflow**

The backup job checks out `${{ github.event.pull_request.head.sha }}` exactly, verifies equality to `git rev-parse HEAD`, reruns:

```bash
python -B tools/ascs_repo.py verify --repo . --json
python -B canonical/v1.0/machine/tests/test_validate_v10.py
python -B canonical/v1.0/machine/tools/validate_v10.py --json
python -B -m unittest tests.test_e1_agent_reference tests.test_security_upstream tests.test_product_convergence -v
node --test packages/ascs-agent/test/*.test.mjs
node --test packages/ascs-core/test/*.test.mjs packages/ascs-runtime/test/*.test.mjs packages/ascs-store/test/*.test.mjs packages/ascs-history/test/*.test.mjs packages/ascs-spatial/test/*.test.mjs packages/ascs-math/test/*.test.mjs packages/ascs-glyph/test/*.test.mjs
```

Then rerun current Editor bridge/publication/build/dynamic gates. Also verify the E0 security-upstream manifest identity and selected-file contract; do not claim E5 Wasmtime physical runtime revalidation.

Package the full restorable repository excluding only `.git`, `node_modules`, `dist`, `tmp`, `.cache`, `coverage`, `.DS_Store`. Include `BACKUP_MANIFEST.json`, `SHA256SUMS.txt`, `PR.patch`, `RESTORE.md`.

`BACKUP_MANIFEST.json` must record at least:

```text
milestone = E1-agent-kernel
base lineage = E0 exact head / actual PR base
head_sha = exact PR head
source_pr = actual PR number
v0.7 archive SHA-256
E1 vector coverage = 18 PASS / 18 DEFERRED / 0 FAIL
E0 security upstream commit/tree
all verification fields
snapshot counts and payload-tree SHA-256
```

- [ ] **Step 5: Independently verify the downloaded artifact**

Outside GitHub Actions, recompute:

```text
outer artifact SHA-256
inner source-backup SHA-256
ZIP integrity
all SHA256SUMS rows
manifest head/base/PR/reference identities
snapshot file count + bytes
payload-tree SHA-256
```

Only after this passes, mark E1 PR Ready for Review.

- [ ] **Step 6: Stop without merge**

Final state:

```text
E0: user/local merge authority only
E1: Ready for Review, NOT MERGED
E2: NOT STARTED until E1 exact-head closure is complete
```
