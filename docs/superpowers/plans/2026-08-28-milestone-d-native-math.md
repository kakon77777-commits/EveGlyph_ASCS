# Milestone D — Native Math Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the ASCS v0.5 `ncm/1.0-candidate.1` Native Math runtime as a typed candidate-profile service with exact semantics, evidence/equality/rewrite contracts, LaTeX/MathML projections, authority-gated intrinsic editing, and a safe EveGlyph Editor bridge.

**Architecture:** Add one focused `packages/ascs-math` package that consumes existing Milestone B/C canonical/runtime services but does not modify `egir-cj/0.1`, hash preimages, or legacy `ncm/0.1`. Candidate Native Math objects are validated/canonicalized inside their own profile; projections are derived output only; canonical mutation still routes through `WorkspaceRuntime.editIntrinsic()` / existing authority gates. The product bridge exposes typed safe services but no parser/CAS/prover authority and no raw trusted mutation callback.

**Tech Stack:** Node.js 20 ESM, Web Crypto through existing ASCS core, Python 3.13 + `jsonschema` for frozen reference validation, Vite/EveGlyph existing browser surface.

**Spec:** `docs/superpowers/specs/2026-08-28-milestone-d-native-math-glyph-design.md`

## Global Constraints

- Base implementation lineage is `main@08133a2b794e242723c4c3f6618de2a8d78ad84f` plus approved design commit `e942a0bc1fec2838579ffcdddddc8bafffb7d30d`.
- `canonical/`, `provenance/`, and `releases/` are read-only semantic authority and MUST NOT be modified.
- Frozen v0.5 archive SHA-256 is `16f499d1721191ebf11c11baada3440332e5ddbcafa59cc26c7aecc7fe0edebe`.
- `native_math_conformance_vectors.json` contains exactly 30 unique vectors and all 30 MUST execute through production semantics before closure.
- `ncm/1.0-candidate.1` is candidate-only; candidate/parser/AI/CAS output does not gain canonical authority automatically.
- Existing `ncm/0.1` remains loadable under its own semantics. No silent reinterpretation and no mandatory migration.
- Persistent identity, revision identity, content address, workspace revision, and Canvas placement semantics from Milestones B/C remain unchanged.
- Exact integer/rational/decimal semantics MUST NOT depend on binary floating point.
- LaTeX and MathML in this milestone are export/projection surfaces, not canonical identity and not parser authority.
- MCP/OAuth/Connector security is not implemented in Milestone D-Math; original EveGlyph remains the upstream implementation line for later Milestone E rebinding.
- Every implementation PR requires exact-head CI plus an independently downloadable exact-head source backup before Ready for Review.

---

## File Structure

Create:

- `packages/ascs-math/package.json` — package metadata only.
- `packages/ascs-math/src/numeric.mjs` — exact integer/rational/decimal/approximate numeric rules.
- `packages/ascs-math/src/model.mjs` — profile validation, graph validation, canonical candidate ordering, declarations/binders/result states.
- `packages/ascs-math/src/semantics.mjs` — alpha-equivalence, capture avoidance, unit/type/result/evidence/equality semantics and 30-vector dispatcher.
- `packages/ascs-math/src/transform.mjs` — revision-aware subaddresses, rewrite/node-map/equality/fidelity records.
- `packages/ascs-math/src/adapters.mjs` — Native Math → LaTeX / MathML projection and explicit adapter-fidelity records.
- `packages/ascs-math/src/service.mjs` — safe object validation/projection/edit service over existing `WorkspaceRuntime` bridge.
- `packages/ascs-math/src/index.mjs` — public package exports.
- `packages/ascs-math/test/fixtures/*` — byte-identical frozen v0.5 schemas/vectors/examples.
- `packages/ascs-math/test/*.test.mjs` — RED→GREEN production contracts.
- `packages/MILESTONE_D_MATH_REFERENCE_LINEAGE.json` — pinned input identities.
- `apps/eveglyph-editor/test/ascs-native-math-bridge.test.mjs` — product-level safe facade contract.
- `.github/workflows/milestone-d-native-math.yml` — read-only validation workflow.
- `.github/workflows/milestone-d-math-backup.yml` — exact-head verification + source backup artifact.
- `docs/product-convergence/MILESTONE_D_MATH_CANONICAL_INPUTS.md`.
- `docs/product-convergence/MILESTONE_D_MATH_VALIDATION.md`.

Modify:

- `apps/eveglyph-editor/src/ascs/runtime-bridge.js` — add safe Native Math facade only.
- `apps/eveglyph-editor/ASCS_OVERLAY.json` — explicitly authorize new product bridge test / modified bridge file.
- `tests/test_product_convergence.py` — advance overlay expectations.
- `tools/product_convergence.py` — mark Native Math capability complete after implementation.

---

### Task 1: Pin frozen v0.5 inputs and establish RED lineage

**Files:**
- Create exact fixtures under `packages/ascs-math/test/fixtures/`.
- Create `packages/MILESTONE_D_MATH_REFERENCE_LINEAGE.json`.
- Create `.github/workflows/milestone-d-native-math.yml`.
- Create initial package tests while `src/` is absent.

**Interfaces:**
- Consumes: v0.5 archive and existing canonical-preservation tooling.
- Produces: byte-pinned fixture baseline and intended RED CI shape.

- [ ] **Step 1: Materialize exact frozen files**

Copy byte-for-byte from the v0.5 archive:

```text
native-math-object-v1-candidate.schema.json
math-transform-evidence.schema.json
math-conformance-vectors.schema.json
native_math_conformance_vectors.json
native_math_integral_example.json
math_transform_example.json
math_equality_example.json
math_adapter_fidelity_example.json
```

Record the archive SHA and each fixture SHA in `MILESTONE_D_MATH_REFERENCE_LINEAGE.json`.

- [ ] **Step 2: Write failing package tests before production modules exist**

Initial tests must import planned public APIs such as:

```js
import {
  validateNativeMathObject,
  executeMathConformanceVector,
  projectNativeMathToLatex,
  projectNativeMathToMathML,
} from '../src/index.mjs'
```

They must assert fixture count `30`, profile `org.evemisslab.math-conformance-vectors/0.1`, and schema/example pins.

- [ ] **Step 3: Add read-only CI**

CI must independently verify:

```bash
python -B tools/ascs_repo.py verify --repo . --json
python -B canonical/v1.0/machine/tests/test_validate_v10.py
python -B canonical/v1.0/machine/tools/validate_v10.py --json
```

then extract the pinned v0.5 archive, verify SHA-256, run `validate_v05.py --json`, schema-check the committed fixtures, run existing Milestone B/C tests, current EveGlyph product tests, and finally run Native Math tests.

- [ ] **Step 4: Open Draft PR and verify intended RED split**

Expected:

```text
canonical preservation = PASS
v0.5 reference validator = PASS
Milestone B/C regression = PASS
current EveGlyph product = PASS
Native Math JavaScript = FAIL because production modules are absent
```

- [ ] **Step 5: Commit RED lineage**

Commit message:

```text
test: define Native Math candidate contracts
```

---

### Task 2: Implement exact numeric kernel and candidate object validation

**Files:**
- Create `packages/ascs-math/src/numeric.mjs`.
- Create `packages/ascs-math/src/model.mjs`.
- Create `packages/ascs-math/src/index.mjs`.
- Test `packages/ascs-math/test/numeric-model.test.mjs`.

**Interfaces:**
- Produces:

```ts
validateIntegerLexical(value: string): { status: 'valid'|'reject', value?: string }
canonicalRational(numerator: string, denominator: string): { numerator: string, denominator: string }
validateRational(input): { status: 'valid'|'reject-noncanonical'|'reject', canonical_form?: object }
decimalExactSemanticValue(coefficient: string, exponent10: string): string
validateApproximateNumber(input): object
canonicalizeNativeMathObject(value: object): object
validateNativeMathObject(value: object): { ok: boolean, errors: Array<{code:string,...}> }
```

- [ ] **Step 1: Write focused RED tests for MATH-001..005 and structural example validation**

Test arbitrarily large signed integer lexicals without converting to JS `Number`; reduced rational canonicality; exact decimal lexical semantics; explicit approximate number metadata.

- [ ] **Step 2: Run RED tests**

```bash
node --test packages/ascs-math/test/numeric-model.test.mjs
```

Expected: FAIL because numeric/model APIs do not exist.

- [ ] **Step 3: Implement exact numeric functions using BigInt/string arithmetic only**

`canonicalRational('2','6')` must return `{ numerator:'1', denominator:'3' }`; denominator sign is normalized positive; denominator zero is rejected.

Exact decimal semantic conversion must be string/decimal based; no binary float round-trip is allowed.

- [ ] **Step 4: Implement candidate graph validator**

Validate:

```text
profile == ncm/1.0-candidate.1
14 frozen node kinds only
unique node IDs
graph references exist
root reachable
expression graph acyclic
free-ref uses declaration_id
bound-ref resolves to an in-scope binding_id
rational canonicality
exact-decimal lexical canonicality
assumption/constraint/evidence reference integrity
result_state shape
```

Canonical ordering is profile-local:

```text
expression.nodes lexical by id
environment.declarations lexical by declaration_id
assumptions/constraints lexical by record id
evidence lexical by evidence_id
apply.args preserved
binder bindings preserved
Unicode display labels not normalized
```

- [ ] **Step 5: Verify v0.5 integral example passes and malformed copies fail typed checks**

- [ ] **Step 6: Commit**

```text
feat: add Native Math exact numeric and model kernel
```

---

### Task 3: Implement binding, result, evidence, equality and conformance semantics

**Files:**
- Create `packages/ascs-math/src/semantics.mjs`.
- Test `packages/ascs-math/test/semantics.test.mjs`.

**Interfaces:**
- Produces:

```ts
alphaEquivalent(left, right): boolean
captureAvoidingSubstitute(expression, substitution): object
validateEvidenceRecord(record): object
validateEqualityVerdict(record): object
executeMathConformanceVector(vector): object
```

- [ ] **Step 1: Write RED tests for MATH-006..023 and MATH-030**

The dispatcher must execute the frozen vector operation rather than return the fixture's expected object verbatim.

- [ ] **Step 2: Implement binding semantics**

Free variable identity comes from `declaration_id`; visible name is presentation only. Bound variables use structural `binding_id` slots. Alpha-equivalence must treat `lambda x.x` and `lambda y.y` as alpha-equal while free `x` and bound `x` remain distinct.

Capture-avoiding substitution must alpha-rename a binder when necessary so substituting free `y` into `lambda y. x` leaves the substituted `y` free.

- [ ] **Step 3: Implement first-class result/evidence/equality semantics**

Result statuses:

```text
defined
conditional
undefined
unresolved
unevaluated
```

Evidence classes must preserve `computed != proved`; `proved` without certificate/proof verifier evidence is rejected. Equality verdicts require an explicit equality class and approximate numeric evidence cannot be promoted to theorem equality.

- [ ] **Step 4: Implement context/type/unit/structure vector semantics**

Assumption and constraint remain separate classes. Unknown type is valid. Unit dimension mismatch is detected before numeric addition. Matrix shape and piecewise-without-otherwise remain explicit.

- [ ] **Step 5: Implement legacy compatibility vector**

`ncm/0.1` load is allowed but returns `reinterpret_as_candidate_profile:false` and `migration:'explicit-optional'`.

- [ ] **Step 6: Run tests and commit**

```text
feat: add Native Math semantic conformance engine
```

---

### Task 4: Implement revision-aware transform/equality/fidelity records

**Files:**
- Create `packages/ascs-math/src/transform.mjs`.
- Test `packages/ascs-math/test/transform.test.mjs`.

**Interfaces:**
- Produces:

```ts
validateMathSubaddress(address, currentRevision): object
createNodeMapEntry(input): object
validateTransformRecord(record): object
validateAdapterFidelity(record): object
```

- [ ] **Step 1: Write RED tests for MATH-024, MATH-025 and frozen transform/equality/fidelity examples**

- [ ] **Step 2: Implement revision-local subexpression addressing**

A subaddress is `(revision,node)`. A node address from `rev:v1` cannot be directly reused on `rev:v2`; a mapping is required.

- [ ] **Step 3: Implement node-map status contract**

Allowed statuses exactly:

```text
mapped
split
merged
deleted
ambiguous
unmapped
```

- [ ] **Step 4: Validate rewrite provenance**

Transform records preserve input/output version+node, semantic rule ref, side conditions, evidence class, backend version and node map. A rewritten surface string alone is never sufficient provenance.

- [ ] **Step 5: Validate math-specific adapter fidelity dimensions**

Dimensions:

```text
semantics
binding
conditions
presentation
provenance
```

Each value is one of `exact | preserved-subset | approximated | dropped | unknown | not-applicable`.

- [ ] **Step 6: Commit**

```text
feat: add Native Math transform and fidelity contracts
```

---

### Task 5: Implement LaTeX and MathML projection adapters

**Files:**
- Create `packages/ascs-math/src/adapters.mjs`.
- Test `packages/ascs-math/test/adapters.test.mjs`.

**Interfaces:**
- Produces:

```ts
projectNativeMathToLatex(mathObject, options?): { source:string, fidelity:object }
projectNativeMathToMathML(mathObject, options?): { source:string, fidelity:object }
classifyLatexImportCandidate(source): { authority:'candidate-only', fidelity:object }
classifyMathMLImportCandidate(sourceKind): { authority:'candidate-only', fidelity:object }
```

- [ ] **Step 1: Write RED tests for MATH-026..029 plus projection examples**

- [ ] **Step 2: Implement deterministic export for the supported semantic kernel**

Support the 14 node kinds without creating persistent identity. Unsupported semantic symbols fail typed rather than silently changing meaning.

LaTeX export should render the v0.5 integral example as a stable semantic projection containing an integral, limits, bound variable and power expression; exact surface byte equality with any legacy source is not required.

MathML export must distinguish presentation projection from semantic completeness and return an explicit fidelity record.

- [ ] **Step 3: Keep import classification candidate-only**

No LaTeX/MathML parser result is committed in D-Math. Import helper only describes candidate authority/fidelity boundary.

- [ ] **Step 4: Verify MATH-026..029 execute through production adapter functions**

- [ ] **Step 5: Commit**

```text
feat: add Native Math projection adapters
```

---

### Task 6: Add authority-gated Native Math service and hidden EveGlyph bridge

**Files:**
- Create `packages/ascs-math/src/service.mjs`.
- Test `packages/ascs-math/test/service.test.mjs`.
- Modify `apps/eveglyph-editor/src/ascs/runtime-bridge.js`.
- Create `apps/eveglyph-editor/test/ascs-native-math-bridge.test.mjs`.
- Modify `apps/eveglyph-editor/ASCS_OVERLAY.json`.
- Modify `tests/test_product_convergence.py`.

**Interfaces:**
- Produces safe Editor facade method:

```ts
createNativeMathService(workspaceBridge): {
  inspect(persistentId): object,
  validate(persistentId): Promise<object>,
  projectLatex(persistentId): object,
  projectMathML(persistentId): object,
  edit(persistentId, { math, baseWorkspaceRevision, authority }): Promise<object>
}
```

- [ ] **Step 1: Write product bridge RED test first**

Require `globalThis.EveGlyphASCS.createNativeMathService` to exist and explicitly require it not to expose parser/CAS/prover/trusted-mutation primitives.

- [ ] **Step 2: Implement package service**

`edit()` must:

```text
validate candidate Native Math intrinsic
→ canonicalize profile-local layout
→ call existing bridge/runtime editIntrinsic
→ existing authority/base/hash/atomic-swap pipeline
```

Invalid candidate objects fail before canonical mutation. Stale base remains typed conflict through the existing runtime.

- [ ] **Step 3: Add safe bridge registration**

Expose only the safe service factory. Do not expose raw `WorkspaceRuntime`, `commitExtensionMutation`, parser/CAS/prover handles, or automatic migration.

- [ ] **Step 4: Advance explicit product overlay**

Authorize only the exact new bridge test and deliberate bridge modification. All other upstream drift remains fail-closed.

- [ ] **Step 5: Run current EveGlyph regressions**

```bash
npm ci
node --test test/ascs-runtime-bridge.test.mjs
node --test test/ascs-persistent-bridge.test.mjs
node --test test/ascs-native-math-bridge.test.mjs
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

- [ ] **Step 6: Commit**

```text
feat: bridge Native Math into EveGlyph safely
```

---

### Task 7: Final 30-vector conformance, parity metadata, exact-head backup and PR closure

**Files:**
- Modify `tools/product_convergence.py`.
- Create `docs/product-convergence/MILESTONE_D_MATH_CANONICAL_INPUTS.md`.
- Create `docs/product-convergence/MILESTONE_D_MATH_VALIDATION.md`.
- Create `.github/workflows/milestone-d-math-backup.yml`.

**Interfaces:**
- Produces final PR evidence and downloadable exact-head backup.

- [ ] **Step 1: Add generic frozen-vector gate**

One test must load all 30 frozen vectors and execute each through `executeMathConformanceVector()`. Assert IDs remain unique and every production result satisfies the frozen expected contract.

- [ ] **Step 2: Advance parity metadata**

Move `native_math` out of future milestones and record a concrete ASCS capability path. Keep `native_glyph` and `agent_mcp_authority_rebinding` future.

- [ ] **Step 3: Add exact-head backup workflow**

Before packaging, rerun:

```text
canonical preservation
ASCS v1 validator
v0.5 validate_v05.py
Milestone B/C runtime regression
Native Math tests including 30/30 vectors
EveGlyph B/C/D bridge tests
publication 22/22
build
dynamic logic
dynamic rendering
product convergence
```

Backup package must include:

```text
repository/
BACKUP_MANIFEST.json
SHA256SUMS.txt
PR.patch
RESTORE.md
ARTIFACT_SHA256.txt (outside the inner ZIP)
```

- [ ] **Step 4: Remove any construction-only write workflows before final head**

Final validation workflows are read-only except artifact upload.

- [ ] **Step 5: Freeze final head and perform exact-head verification**

Do not modify source after final evidence head unless CI exposes a blocker.

- [ ] **Step 6: Download backup artifact and independently verify**

Verify archive SHA-256, ZIP integrity, all internal checksums, manifest base/head/PR identity, snapshot file/byte counts and payload tree hash.

- [ ] **Step 7: Scope audit**

PR changed-file list must contain zero paths under `canonical/`, `provenance/`, or `releases/`.

- [ ] **Step 8: Update PR body and mark Ready for Review**

Do not merge without explicit user authorization.

---

## Plan Self-Review

- Spec coverage: Native Math candidate profile, numerics, graph/binding, result states, evidence, equality, rewrites, revision-aware addressing, adapter fidelity, LaTeX/MathML projections, legacy coexistence, candidate authority, Editor bridge and backup are each mapped to a concrete task.
- Placeholder scan: no TBD/TODO/"similar to" implementation gaps remain.
- Type consistency: `validateNativeMathObject`, `executeMathConformanceVector`, projection APIs and `createNativeMathService` are defined once and reused consistently.
- Scope: Native Glyph is intentionally excluded from this plan and begins only after D-Math merge; MCP/Connector security remains Milestone E upstream/rebinding work.
