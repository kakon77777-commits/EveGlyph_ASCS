# Milestone D — Native Glyph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the frozen ASCS v0.6 Glyph / Symbol candidate profiles as typed native symbolic services with geometry/topology/parts/family/binding/renderer/GSC semantics, safe projection adapters, and an authority-gated EveGlyph product bridge.

**Architecture:** Add a focused `packages/ascs-glyph` package on top of already-merged ASCS A/B/C + D-Math. Glyph intrinsic state remains distinct from semantic binding, execution permission, Canvas placement, Unicode/OpenType identity and renderer output. SVG/Unicode/OpenType/GSC are adapters/projections; semantic and behavior bindings are separate records and only committed through existing ASCS authority.

**Tech Stack:** Node.js 20 ESM, string/BigInt deterministic numerics, Python 3.13 + `jsonschema` for frozen v0.6 reference validation, Vite/EveGlyph current browser surface.

**Spec:** `docs/superpowers/specs/2026-08-28-milestone-d-native-math-glyph-design.md`

## Global Constraints

- Base: `main@050c2fb2568034222c4e9c854c5c5b52c4ba8786`.
- `canonical/`, `provenance/`, `releases/` are read-only semantic authority.
- Frozen v0.6 archive SHA-256: `08ab324e5edf777a958f42ef18c70e24ccb0d0b680586cd14bbbf70a6e269dba`.
- Frozen vector profile: `glyph-conformance-vectors/0.6`; exactly **30** unique vectors.
- Candidate profiles: `glyph/1.0-candidate.1`, `glyph-family/1.0-candidate.1`, `glyph-binding/1.0-candidate.1`, `gsc-assetsymbol-bridge/1.0-candidate.1`.
- Legacy `glyph/0.1` remains separate; enrichment is explicit and creates a new revision.
- Character != Glyph != Semantic Symbol != Behavior.
- Raster carry != geometry != topology != part graph.
- Glyph identity does not depend on Unicode, OpenType glyph ID, source path, renderer output or Canvas placement.
- Imported SVG/font/raster data receives no executable behavior by default.
- Behavior binding requires declared `runtime.execute`; runtime capability still comes from session policy, not glyph content.
- Component references pin immutable glyph revisions; recursive expansion is bounded and cycle-checked.
- Native Math semantic operator identity remains a semantic-symbol ref, never a glyph revision.
- Every implementation PR requires exact-head CI and a downloadable exact-head backup before Ready for Review.

---

## File Structure

Create:

- `packages/ascs-glyph/package.json`
- `packages/ascs-glyph/src/scalar.mjs` — canonical decimal-string grammar.
- `packages/ascs-glyph/src/model.mjs` — glyph intrinsic validation/canonical ordering.
- `packages/ascs-glyph/src/geometry.mjs` — path state machine, exact carry and component expansion safety.
- `packages/ascs-glyph/src/structure.mjs` — topology, part graph, ports and typed equality helpers.
- `packages/ascs-glyph/src/family.mjs` — family axes/topology policy/variant validation.
- `packages/ascs-glyph/src/binding.mjs` — semantic/Unicode/OpenType/behavior binding authority.
- `packages/ascs-glyph/src/adapters.mjs` — safe SVG/accessibility projections, renderer profile and GSC bridge.
- `packages/ascs-glyph/src/service.mjs` — authority-gated glyph service.
- `packages/ascs-glyph/src/index.mjs`
- `packages/ascs-glyph/test/fixtures/*` — byte-identical v0.6 schemas/vectors/examples.
- `packages/ascs-glyph/test/*.test.mjs`
- `packages/MILESTONE_D_GLYPH_REFERENCE_LINEAGE.json`
- `apps/eveglyph-editor/test/ascs-native-glyph-bridge.test.mjs`
- `.github/workflows/milestone-d-native-glyph.yml`
- `.github/workflows/milestone-d-glyph-backup.yml`
- `docs/product-convergence/MILESTONE_D_GLYPH_CANONICAL_INPUTS.md`
- `docs/product-convergence/MILESTONE_D_GLYPH_VALIDATION.md`

Modify:

- `apps/eveglyph-editor/src/ascs/runtime-bridge.js`
- `apps/eveglyph-editor/src/ascs/register.js`
- `apps/eveglyph-editor/ASCS_OVERLAY.json`
- `tests/test_product_convergence.py`
- `tools/product_convergence.py`

---

### Task 1 — Pin v0.6 inputs and establish RED lineage

**Produces:** exact fixtures, lineage manifest, Draft PR and intended RED split.

- [ ] Copy byte-for-byte from v0.6:
  - all six schemas;
  - `glyph_conformance_vectors.json`;
  - six examples including generated GSC AssetSymbol v0.7;
  - record bytes/SHA-256 in `MILESTONE_D_GLYPH_REFERENCE_LINEAGE.json`.
- [ ] Write `red-contracts.test.mjs` that imports planned public APIs while `src/` is absent.
- [ ] Assert vector profile `glyph-conformance-vectors/0.6`, 30 unique IDs and candidate profile strings.
- [ ] Add read-only CI that runs canonical preservation, v0.6 `validate_v06.py`, `test_validate_v06.py`, B/C/D-Math regressions and current EveGlyph product gates before Native Glyph tests.
- [ ] Open Draft PR. Intended RED shape:

```text
canonical preservation        PASS
v0.6 reference + negatives   PASS
B/C/D-Math + EveGlyph        PASS
Native Glyph JS              FAIL: production entrypoint absent
```

Commit: `test: define Native Glyph candidate contracts`

---

### Task 2 — Implement canonical scalar, geometry and intrinsic glyph validation

**Produces:**

```ts
validGlyphScalar(value: string): boolean
validateGlyphPath(path): {ok:boolean, errors:string[]}
validateExactCarry(carry): {ok:boolean, errors:string[]}
validateComponentGraph(glyph, options?): {ok:boolean, errors:string[]}
expandComponents(rootRef, resolver, {maxDepth,maxPrimitives}): object
canonicalizeGlyphObject(glyph): object
validateGlyphObject(glyph): {ok:boolean, errors:Array<{code:string,...}>}
```

- [ ] RED tests require canonical decimals: reject exponent notation, `-0`, meaningless trailing zero and non-string numerics.
- [ ] RED path tests: first command MUST be `M`; `Z` MUST be final; command coordinates must be canonical scalars.
- [ ] RED exact-carry tests require palette index validity and exact sequential full-canvas RUN coverage.
- [ ] RED component tests require sorted unique IDs and immutable revision pins; self/cyclic expansion rejects.
- [ ] RED intrinsic validator covers dangling topology/part refs, hole ownership, part edges, ports and family numeric parameters.
- [ ] Implement minimal GREEN with no visual simplification/winding rewrite/topology inference.
- [ ] Verify frozen custom derivative glyph example passes.

Commit: `feat: implement Native Glyph geometry kernel`

---

### Task 3 — Implement topology, part graph, family, renderer and equality domains

**Produces:**

```ts
validateTopology(glyph): object
validatePartGraph(glyph): object
validateGlyphFamily(family): object
validateRendererProfile(profile): object
classifyGlyphEquality(a,b,context): object
semanticZoomProjectionIdentity(glyphRef, z1, z2): {same_identity:true}
```

- [ ] RED topology tests distinguish committed topology from skeleton hints.
- [ ] RED part tests prove structural tags do not become semantic authority.
- [ ] RED family tests require sorted unique axes, continuous min/default/max validity and listed defaults for discrete/categorical axes.
- [ ] RED family tests require explicit `invariant | variant-allowed` topology policy.
- [ ] RED renderer tests require fidelity in `exact | structural | visual | lossy | unknown`; renderer output never alters glyph identity.
- [ ] RED equality tests separate carry / geometry / topology / part / family / semantic equality from persistent identity.
- [ ] Implement GREEN and validate frozen family + renderer examples.

Commit: `feat: add Glyph structure family and equality semantics`

---

### Task 4 — Implement binding authority, GSC bridge and import security

**Produces:**

```ts
validateGlyphBinding(binding): object
promoteBindingCandidate(candidate, authority): object
revokeBinding(binding, authority): object
validateGscBridge(bridge, sourceAsset): object
classifySvgImport(svgText): object
projectGlyphToSvg(glyph, options?): {source:string, fidelity:string, authority:'projection-only'}
projectGlyphAccessibility(glyph, bindings?): object
executeGlyphConformanceVector(vector): object
```

- [ ] RED semantic binding tests: candidate is non-authoritative until explicit promotion.
- [ ] RED behavior binding tests: `runtime.execute` declaration required, but binding alone still does not grant execution.
- [ ] RED Unicode tests allow zero, one or many code points without altering glyph identity.
- [ ] RED OpenType tests require `font_digest + glyph_id`; GlyphID is local to that font, not global identity.
- [ ] RED SVG import tests classify scripts/event handlers/external resource loading as non-executable/unsafe data; never inherit DOM/script behavior.
- [ ] RED GSC tests require strict-source-blind v0.7, source artifact SHA, carry-lossless palette/RUN preservation, `semantic_claim=false`.
- [ ] RED accessibility tests work for custom non-Unicode glyph via binding/description/structure.
- [ ] Implement all 30 frozen vectors through category-specific production functions; dispatcher MUST NOT return the frozen expectation directly.

Commit: `feat: add Glyph binding and adapter boundaries`

---

### Task 5 — Integrate Native Math semantic-symbol binding without identity collapse

**Produces:**

```ts
bindGlyphToMathSymbol(glyphRef, {registry,symbol,version}, provenance): object
validateMathGlyphBinding(binding): object
```

- [ ] RED test: custom derivative glyph binds to `{registry:'eg-math-core', symbol:'derivative', version:1}`.
- [ ] Assert glyph persistent/revision identity is unchanged by binding promotion.
- [ ] Assert Native Math operator identity is semantic symbol ref, not glyph revision.
- [ ] Assert two different glyphs may bind to same math symbol while remaining distinct glyph identities.
- [ ] Implement through binding layer only; do not modify `packages/ascs-math` canonical semantics.

Commit: `feat: bind Glyph projections to Native Math symbols`

---

### Task 6 — Add authority-gated Glyph service and hidden EveGlyph bridge

**Produces:**

```ts
createNativeGlyphService(workspaceBridge): {
  inspect,
  validate,
  projectSvg,
  projectAccessibility,
  edit,
  createBindingCandidate,
  promoteBinding,
  revokeBinding
}
```

- [ ] RED service test: legacy `glyph/0.1` inspects without silent reinterpretation.
- [ ] RED edit test: invalid candidate fails before workspace mutation.
- [ ] RED edit test: valid intrinsic edit goes through existing `editIntrinsic`; stale base preserves typed Conflict.
- [ ] RED binding test: semantic/behavior relation operations remain outside intrinsic geometry hash.
- [ ] RED product bridge requires `globalThis.EveGlyphASCS.createNativeGlyphService`.
- [ ] Product facade MUST NOT expose raw renderer DOM injection, SVG script execution, font-program execution, trusted mutation callback, raw `WorkspaceRuntime`, parser/recognizer authority or capability grants.
- [ ] Update `ASCS_OVERLAY.json` explicitly for D-Glyph product differences.
- [ ] Run Vite build + B/C/D-Math bridges + publication/dynamic regression.

Commit: `feat: bridge Native Glyph through ASCS authority runtime`

---

### Task 7 — Final parity, exact-head backup and PR closure

- [ ] Move `native_glyph` from future capability metadata to completed ASCS capability; only Agent/MCP authority rebinding remains future in this design sequence.
- [ ] Write canonical-input and validation evidence docs.
- [ ] Delete all construction-only write workflows before final head.
- [ ] Add exact-head backup workflow that independently reruns:

```text
canonical v1 preservation
v0.6 validator + negative validator suite
B/C/D-Math regressions
Native Glyph tests + 30/30 vectors
all Editor B/C/D-Math/D-Glyph bridges
publication 22/22
Vite build
dynamic logic/rendering
product convergence
```

- [ ] Backup contains `repository/`, `BACKUP_MANIFEST.json`, `SHA256SUMS.txt`, `PR.patch`, `RESTORE.md`, external `ARTIFACT_SHA256.txt`.
- [ ] Download artifact to a separate environment and independently verify ZIP integrity, every internal checksum, manifest exact head/base/PR identity, payload tree hash and file/byte counts.
- [ ] Audit changed paths: zero under `canonical/`, `provenance/`, `releases/`.
- [ ] Update PR final evidence and mark Ready for Review.
- [ ] Do **not** merge without explicit user authorization.
