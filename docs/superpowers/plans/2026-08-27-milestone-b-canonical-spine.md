# EveGlyph ASCS Milestone B Canonical Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a browser-compatible EGIR canonical runtime spine that matches the frozen TW-01 identity/hash semantics, preserves typed transaction conflicts and authority boundaries, and can be loaded through a hidden EveGlyph Editor bridge without changing ASCS canonical evidence.

**Architecture:** Implement pure ESM modules in `packages/ascs-core/` and `packages/ascs-runtime/`. Hashing uses Web Crypto (`crypto.subtle`) so the same code runs in Node 20 and browser builds; hash-producing APIs are async. Runtime mutations are staged on a cloned bundle and only committed after base-revision, authority, and canonical validation gates pass. The existing EveGlyph product surface remains intact; a hidden bridge imports the runtime as an advanced integration seam.

**Tech Stack:** JavaScript ESM, Web Crypto API, Node.js 20 built-in test runner, existing EveGlyph Vite build, existing Python 3.13 ASCS/TW validators.

**Spec:** `docs/superpowers/specs/2026-08-27-eveglyph-ascs-product-convergence-design.md`

## Global Constraints

- Implementation base: `main@5844692bf00b7650d67fa1fe744ca0f790f9e4b9`.
- `canonical/v1.0/`, `provenance/`, and `releases/` remain byte-preserved authority/evidence and MUST NOT be modified.
- Canonical root inputs are pinned to Architecture archive SHA-256 `19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778` and MVP archive SHA-256 `f49a4f419f9b4539aac0721a1ad85f84151cec71bf3da68db22a197303b5cd3f`.
- TW-01 canonicalization profile remains exactly `egir-cj/0.1`.
- Persistent identity is not content hash; object is not revision; placement is not intrinsic object content; session/UI state is not canonical state.
- Hash preimages forbid floating-point numbers and structural integers outside ±9007199254740991.
- Unicode scalar sequences are preserved; canonicalization performs no NFC/NFKC normalization.
- Runtime stale-base rejection MUST cause zero canonical mutation.
- Agent/model actors MUST NOT directly commit canonical state without an explicitly approved authority context.
- Milestone B does not implement persistent EGStore providers, history/merge, spatial region semantics, native-math candidate v1, native-glyph candidate v1, or agent/MCP rebinding; those remain later milestones.
- Existing EveGlyph Markdown/editor/publication/MCP behavior MUST remain green.
- Before Ready for Review, produce an exact-head downloadable source backup ZIP; after an authorized merge, produce a merged-main backup ZIP.

---

### Task 1: Pin TW-01 reference fixtures and create RED canonical tests

**Files:**
- Create: `packages/ascs-core/package.json`
- Create: `packages/ascs-core/test/fixtures/minimal_workspace.egir.json`
- Create: `packages/ascs-core/test/fixtures/tw01_vectors.json`
- Create: `packages/ascs-core/test/fixtures/REFERENCE_LINEAGE.json`
- Create: `packages/ascs-core/test/canonical.test.mjs`
- Create: `packages/ascs-core/test/validation.test.mjs`

**Interfaces:**
- Consumes: frozen TW-01 fixture and vector bytes extracted from the pinned Architecture archive.
- Produces: required exports `canonicalBytes`, `contentAddress`, `revisionAddress`, `workspaceRevisionAddress`, and `validateBundle` that later tasks must implement.

- [ ] **Step 1: Copy exact TW-01 fixture/vector bytes and record lineage**

`REFERENCE_LINEAGE.json` must record:

```json
{
  "schema": "eveglyph-ascs-reference-fixture/1.0",
  "architecture_archive_sha256": "19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778",
  "minimal_workspace_sha256": "0d9cb28fc8c6f9d6e56c99729b14ce9cf873afe7e0f09940298e8ba459f9b78e",
  "tw01_vectors_sha256": "9043e8002069fc294c125379964d984f0110f27cbf0c500fb1691243dddbe16a"
}
```

- [ ] **Step 2: Write failing canonical tests**

Tests must prove:

```text
TW-01 canonical UTF-8 vector bytes exact match
TW-01 vector SHA-256 exact match
minimal math content address exact match
minimal math revision ID exact match
minimal relation content/revision exact match
minimal workspace revision exact match
float input rejected
unsafe structural integer rejected
Unicode input not normalized
```

- [ ] **Step 3: Write failing cross-record validation tests**

Tests must prove valid minimal fixture passes and corrupted content/revision/workspace hashes fail with typed issue codes.

- [ ] **Step 4: Run RED**

Run:

```bash
node --test packages/ascs-core/test/*.test.mjs
```

Expected: FAIL because `packages/ascs-core/src/` implementation does not yet exist.

- [ ] **Step 5: Commit tests only**

```bash
git add packages/ascs-core
 git commit -m "test: define TW-01 canonical spine contracts"
```

---

### Task 2: Implement browser-safe EGIR-CJ/0.1 and cross-record validation

**Files:**
- Create: `packages/ascs-core/src/canonical.mjs`
- Create: `packages/ascs-core/src/validate.mjs`
- Create: `packages/ascs-core/src/ids.mjs`
- Create: `packages/ascs-core/src/index.mjs`

**Interfaces:**
- Produces:
  - `canonicalBytes(value): Uint8Array`
  - `sha256Hex(bytes): Promise<string>`
  - `contentAddress(kind, intrinsic): Promise<string>`
  - `revisionAddress(record): Promise<string>`
  - `workspaceRevisionAddress(workspace): Promise<string>`
  - `validateBundle(bundle): Promise<{ok:boolean, errors:Array<{code:string,path?:string,detail?:string}>}>`
  - `newUuid7Urn(options?): string`

- [ ] **Step 1: Implement exact canonical lowering**

Rules:

```text
null -> null
boolean -> true/false
string -> JSON string escaping, UTF-8 scalar sequence preserved
safe integer -> decimal digits
float/non-integer -> reject
array -> order preserved
object -> keys sorted by Unicode code point lexical order
undefined/function/symbol/bigint -> reject
```

- [ ] **Step 2: Implement Web Crypto SHA-256 and exact address preimages**

Use the frozen preimages:

```js
{ canon: 'egir-cj/0.1', kind, intrinsic }
```

```js
{
  canon: 'egir-cj/0.1',
  persistent_id,
  kind,
  parents: [...parents].sort(),
  content_address,
  event_id,
  created_at
}
```

Workspace preimage sorts parents, object heads, relation heads, and placements exactly as TW-01 specifies.

- [ ] **Step 3: Implement semantic cross-record validation**

Validate uniqueness, head existence/lineage, parent existence, content hash, revision hash, workspace refs/placements, and workspace hash. Do not pretend this replaces JSON Schema validation; Python TW-01 validator remains a CI gate.

- [ ] **Step 4: Implement UUIDv7 URN generation**

Use current Unix milliseconds for the 48-bit timestamp, set version nibble `7`, RFC variant bits `10`, and fill remaining bytes with `crypto.getRandomValues`. Output lowercase `urn:uuid:<uuid>`.

- [ ] **Step 5: Run GREEN**

```bash
node --test packages/ascs-core/test/*.test.mjs
```

Expected: all core tests PASS and exact TW-01 vector values match.

- [ ] **Step 6: Commit**

```bash
git add packages/ascs-core/src
 git commit -m "feat: add EGIR canonical core"
```

---

### Task 3: Define RED runtime transaction and authority contracts

**Files:**
- Create: `packages/ascs-runtime/package.json`
- Create: `packages/ascs-runtime/test/runtime.test.mjs`
- Create: `packages/ascs-runtime/test/authority.test.mjs`

**Interfaces:**
- Consumes: `ascs-core` canonical/address/validation functions.
- Produces expected runtime API:
  - `createWorkspaceRuntime(bundle, options?): Promise<WorkspaceRuntime>`
  - `runtime.moveObject(id, {x,y,baseWorkspaceRevision,authority})`
  - `runtime.editIntrinsic(id, {intrinsic,baseWorkspaceRevision,authority})`
  - `runtime.cloneObject(id, {baseWorkspaceRevision,authority})`
  - `runtime.tryMoveObject(...)`
  - `runtime.snapshot()`
  - typed `ConflictError` and `AuthorityDeniedError`.

- [ ] **Step 1: Write move/edit/clone/stale-base tests**

Required invariants:

```text
move -> same persistent_id, same object revision/content, different workspace revision
edit -> same persistent_id, different content/revision, parent=[old revision]
clone -> different persistent_id, same content address, new revision lineage
stale base -> {status:'Conflict'} and snapshot byte-for-byte/deep-equal unchanged
```

- [ ] **Step 2: Write authority tests**

Human explicit commit is allowed. Agent actor without `approved-proposal` is denied with zero mutation. Agent actor with explicit approved proposal context may commit and event provenance records the actor/policy.

- [ ] **Step 3: Run RED**

```bash
node --test packages/ascs-runtime/test/*.test.mjs
```

Expected: FAIL because runtime implementation does not exist.

- [ ] **Step 4: Commit tests only**

```bash
git add packages/ascs-runtime
 git commit -m "test: define ASCS transaction runtime contracts"
```

---

### Task 4: Implement staged transaction runtime and authority gate

**Files:**
- Create: `packages/ascs-runtime/src/authority.mjs`
- Create: `packages/ascs-runtime/src/runtime.mjs`
- Create: `packages/ascs-runtime/src/index.mjs`

**Interfaces:**
- All hash-producing mutations are async.
- Runtime holds a deep-cloned canonical bundle and never exposes mutable internal references.
- `options.clock()` and `options.idFactory()` are injectable for deterministic tests; production defaults use ISO UTC time and UUIDv7 URNs.

- [ ] **Step 1: Implement authority gate**

Accepted canonical commit contexts:

```text
human + explicit
agent + approved-proposal
system + policy-authorized
```

Anything else throws `AuthorityDeniedError` before any draft mutation.

- [ ] **Step 2: Implement staged transaction helper**

Algorithm:

```text
check base revision
check authority
clone current bundle -> draft
apply operation to draft
append event/provenance
recompute content/revision/workspace addresses
validate draft
swap runtime state only after validation succeeds
```

- [ ] **Step 3: Implement move/edit/clone**

Do not specialize edit to math-power; `editIntrinsic` replaces an object's intrinsic payload while preserving identity and creating a new revision.

- [ ] **Step 4: Implement typed try-move conflict result**

Return:

```json
{
  "status": "Conflict",
  "base_workspace_revision": "...",
  "current_workspace_revision": "..."
}
```

without mutation.

- [ ] **Step 5: Run GREEN**

```bash
node --test packages/ascs-core/test/*.test.mjs packages/ascs-runtime/test/*.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add packages/ascs-runtime/src
 git commit -m "feat: add ASCS canonical transaction runtime"
```

---

### Task 5: Add hidden EveGlyph Editor bridge and product build gate

**Files:**
- Create: `apps/eveglyph-editor/src/ascs/runtime-bridge.js`
- Create: `apps/eveglyph-editor/src/ascs/register.js`
- Create: `apps/eveglyph-editor/test/ascs-runtime-bridge.test.mjs`
- Modify: `apps/eveglyph-editor/src/main.js`

**Interfaces:**
- `createCanonicalWorkspaceBridge(bundle, options?)` returns an object exposing snapshot/move/edit/clone/validate operations backed by ASCS runtime.
- `register.js` exposes a deliberately hidden advanced integration surface as `globalThis.EveGlyphASCS.createCanonicalWorkspaceBridge` without reclassifying existing `S`/filesystem state as canonical.

- [ ] **Step 1: Write bridge test**

Load the exact TW-01 fixture through the bridge, perform a move, and verify object revision unchanged while workspace revision changes.

- [ ] **Step 2: Implement bridge**

Bridge delegates all canonical writes to `WorkspaceRuntime`; it contains no direct canonical byte mutation path.

- [ ] **Step 3: Register hidden surface from existing app entry**

Import `./ascs/register.js` from `src/main.js`. No visible UI behavior changes in Milestone B.

- [ ] **Step 4: Run product tests/build**

```bash
cd apps/eveglyph-editor
npm ci
node --test test/ascs-runtime-bridge.test.mjs
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

Expected: ASCS bridge test PASS, existing 22 publication tests PASS, build/dynamic gates PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/eveglyph-editor
 git commit -m "feat: bridge EveGlyph Editor to ASCS runtime"
```

---

### Task 6: Canonical cross-check CI, exact-head verification, PR, and backup

**Files:**
- Create: `.github/workflows/milestone-b-canonical-spine.yml`
- Create: `.github/workflows/milestone-b-backup.yml`
- Create: `docs/product-convergence/MILESTONE_B_CANONICAL_INPUTS.md`
- Create: `docs/product-convergence/MILESTONE_B_VALIDATION.md`

**Interfaces:**
- CI must independently run canonical preservation, Python TW-01/TW-03 references, JS core/runtime tests, exact fixture/vector cross-check, Editor bridge test, publication/build/dynamic regressions.

- [ ] **Step 1: Add canonical preservation job**

Run existing ASCS repo verifier and v1 validator using Python `-B`.

- [ ] **Step 2: Extract pinned Architecture/MVP archives in temporary CI directories**

Verify archive SHA-256 before extraction. Run canonical TW-01 validator and MVP 26-test suite without writing into `canonical/v1.0/`.

- [ ] **Step 3: Run JS canonical/runtime gates**

Run Node 20 core/runtime/bridge tests and verify copied TW-01 fixture/vector SHA values against `REFERENCE_LINEAGE.json`.

- [ ] **Step 4: Run existing product gates**

`npm ci`, publication 22/22 or higher, build, Dynamic Logic, Dynamic Rendering.

- [ ] **Step 5: Create Draft PR and preserve RED→GREEN evidence**

PR title:

```text
feat: add ASCS canonical runtime spine
```

- [ ] **Step 6: Produce exact-head source backup**

Artifact name:

```text
EveGlyph_ASCS_Milestone_B_<head-sha8>_source-backup.zip
```

Include source snapshot, `BACKUP_MANIFEST.json`, `SHA256SUMS.txt`, `PR.patch`, `RESTORE.md`, and external `ARTIFACT_SHA256.txt`.

- [ ] **Step 7: Fresh exact-head final verification**

Do not mark Ready for Review until the final PR head has all canonical, JS runtime, Editor product, and backup workflows completed successfully.
