# EveGlyph_ASCS Milestone D — Native Math + Native Glyph Design

**Status:** Design candidate for implementation planning  
**Base:** `main@08133a2b794e242723c4c3f6618de2a8d78ad84f`  
**Canonical authority:** `canonical/v1.0/` remains read-only semantic authority.  
**Product rule:** existing EveGlyph product behavior remains available; ASCS adds typed native symbolic services without reinterpreting legacy documents.

---

## 1. Goal

Milestone D moves EveGlyph_ASCS from generic addressable objects into two native symbolic domains already frozen in the ASCS v1.0 handoff:

1. **Native Math** based on `ncm/1.0-candidate.1` from ASCS v0.5.
2. **Native Glyph / Symbol** based on `glyph/1.0-candidate.1` and companion candidate profiles from ASCS v0.6.

The result is not a new LaTeX engine, CAS, font engine, or SVG editor. It is a typed ASCS semantic/runtime layer in which LaTeX, MathML, SVG, Unicode, OpenType and future renderers are projections or adapters rather than canonical identity.

The milestone preserves the already-merged A/B/C invariants:

```text
persistent identity != content hash
object != revision
canonicalization != semantic simplification
candidate != authority
credential != authority
Canvas placement != intrinsic content
computed != proved
renderer != identity
```

---

## 2. Canonical inputs

### v0.5 Native Math

Archive:

`canonical/v1.0/source_archives/EveGlyph_ASCS_v0.5_Native_Math_Round_Complete.zip`

SHA-256:

`16f499d1721191ebf11c11baada3440332e5ddbcafa59cc26c7aecc7fe0edebe`

Frozen machine evidence includes:

- `native-math-object-v1-candidate.schema.json`
- `math-transform-evidence.schema.json`
- `math-conformance-vectors.schema.json`
- `native_math_conformance_vectors.json` — exactly **30 vectors**
- `validate_v05.py`
- native integral / transform / equality / adapter-fidelity examples

Canonical profile:

`ncm/1.0-candidate.1`

### v0.6 Glyph / Symbol

Archive:

`canonical/v1.0/source_archives/EveGlyph_ASCS_v0.6_Glyph_Symbol_Round_Complete.zip`

SHA-256:

`08ab324e5edf777a958f42ef18c70e24ccb0d0b680586cd14bbbf70a6e269dba`

Frozen machine evidence includes:

- `glyph-object-v1-candidate.schema.json`
- `glyph-family-v1-candidate.schema.json`
- `glyph-binding-evidence.schema.json`
- `glyph-renderer-profile.schema.json`
- `gsc-assetsymbol-bridge.schema.json`
- `glyph-conformance-vectors.schema.json`
- `glyph_conformance_vectors.json` — exactly **30 vectors**
- `validate_v06.py`
- `test_validate_v06.py` — four negative validator regressions
- custom derivative glyph / family / binding / renderer / GSC bridge examples

Canonical profiles:

```text
glyph/1.0-candidate.1
glyph-family/1.0-candidate.1
glyph-binding/1.0-candidate.1
glyph-renderer/1.0-candidate.1
```

No implementation may rewrite these frozen inputs or silently change their meaning.

---

## 3. Architectural approaches considered

### Approach A — separate native domain packages with typed product services — **selected**

```text
ascs-core/runtime/history/store
        ↑
   ascs-math        ascs-glyph
        ↑                ↑
 projection adapters / typed Editor services
```

Advantages:

- preserves v0.5 and v0.6 as independently testable domains;
- keeps math semantics separate from glyph identity/geometry;
- lets Glyph explicitly reference Native Math semantic symbols without making glyph identity define math operator identity;
- gives each domain its own frozen-vector gate and exact-head backup;
- avoids coupling security/connector work into symbolic semantics.

### Approach B — one combined `ascs-symbolic` package

Rejected because it would blur math expression semantics, glyph geometry/topology, semantic binding and renderer concerns into one large module. It would also make later independent migration or replacement harder.

### Approach C — implement Native Math/Glyph directly inside EveGlyph Editor

Rejected because the Editor is a product surface, not semantic authority. It would recreate the architectural mistake ASCS is explicitly designed to avoid: UI/rendering choices becoming ontology.

---

## 4. Delivery decomposition

Milestone D is one conceptual milestone but two sequential engineering slices.

### D-Math — first PR

Build Native Math core, conformance, projections and a hidden typed EveGlyph service. Merge before starting D-Glyph.

### D-Glyph — second PR

Build Glyph/Symbol core, family/binding/renderer contracts, safe SVG/accessibility projections and a hidden typed EveGlyph service on top of the merged D-Math main.

Each PR MUST independently provide:

- RED→GREEN evidence;
- exact-head CI;
- canonical-preservation checks;
- current EveGlyph product regression checks;
- exact-head downloadable source backup ZIP;
- merged-main backup after authorized merge.

This split follows the frozen canonical progression `v0.5 → v0.6` and reduces failure scope.

---

# Part I — D-Math

## 5. Native Math semantic kernel

Create `packages/ascs-math/` as the runtime implementation of the frozen candidate profile. It MUST implement the small structural kernel rather than enumerating mathematical domains as core node types.

Required supported structural concepts include the v0.5 candidate node families needed by the frozen examples/vectors:

```text
free-ref
bound-ref
integer
rational
decimal-exact
number-approx
apply
binder
sequence
matrix
piecewise
quantity
external-ref
hole
```

Domain operator meaning MUST come from semantic symbol references, not visible glyph/name text.

The package MUST keep these records distinct:

```text
expression graph
environment / declarations
assumptions
constraints
type/domain assertions
unit/dimension assertions
numeric policy
presentation
evidence
result state
execution profile
```

## 6. Math validation and exact numerics

The JavaScript implementation MUST reproduce the semantics exercised by all 30 frozen v0.5 vectors.

Required invariants include:

- unbounded integers represented independently of host integer width;
- rationals reduced with positive denominator;
- `decimal-exact` represented as exact coefficient + base-10 exponent, not IEEE binary float;
- approximate numerics explicitly carry precision/error semantics;
- graph IDs unique and references non-dangling;
- expression graph acyclic;
- free declaration identity separate from display name;
- bound references structural rather than name-bound;
- alpha-equivalence first-class;
- substitution capture-avoiding;
- unknown type/domain is legal;
- assumptions != constraints;
- unit/dimension mismatch fails before numeric combination;
- undefined / conditional / unresolved / unevaluated remain distinct typed states.

The core validator MUST validate the full candidate object and return typed issues rather than generic booleans.

## 7. Evidence, equality and transforms

Implement typed validation and helper semantics for the frozen v0.5 evidence contracts.

Evidence classes remain:

```text
assumed
computed
verified
proved
heuristic
external
```

`proved` MUST require proof/certificate + verifier/theory evidence. Backend success text alone is insufficient.

Equality classes remain:

```text
surface
structural
alpha
definitional
theorem
approximate
```

No API may return an authoritative equality result without an explicit equality class.

Transformation records MUST preserve revision-aware input/output subaddresses, rule semantic reference, conditions, evidence class, backend identity and node mapping status.

Milestone D-Math validates and constructs transform/equality/fidelity evidence. It does **not** implement a universal CAS or proof orchestration engine.

## 8. Math projection adapters

D-Math implements deterministic **export/projection** adapters for a supported structural subset:

```text
Native Math → LaTeX projection
Native Math → MathML projection
```

These are projections, not identity.

Every projection result MUST carry the multidimensional fidelity record:

```text
semantics
binding
conditions
presentation
provenance
```

with values from:

```text
exact
preserved-subset
approximated
dropped
unknown
not-applicable
```

D-Math deliberately does not claim general semantic LaTeX import. The existing EveGlyph LaTeX/Typst publication path remains available as a presentation workflow. Future import may create **candidate** NCM, never committed semantics by parsing alone.

Projection failure MUST be typed, e.g. unsupported node/operator/presentation rather than silently changing meaning.

## 9. Math legacy coexistence

`ncm/0.1` remains loadable under its original semantics.

D-Math MUST distinguish:

```text
ncm/0.1
ncm/1.0-candidate.1
```

and MUST NOT silently reinterpret legacy bytes as the candidate profile.

No mandatory migration is introduced. Any future enrichment migration must be explicit, revision-creating and provenance-preserving.

## 10. D-Math runtime integration

Native Math is intrinsic object content and therefore integrates with the already-merged WorkspaceRuntime through typed operations.

A typed Math service may internally call the trusted extension transaction seam, but the product/global API MUST NOT expose:

- raw `commitExtensionMutation`;
- arbitrary mutate callbacks;
- raw EGStore/carrier;
- a way for a parser/CAS/AI result to bypass authority.

Safe service responsibilities:

```text
validate Native Math candidate
inspect profile / result state / evidence
evaluate frozen conformance semantics
project supported subset to LaTeX
project supported subset to MathML
edit a math object's intrinsic state through base-revision + authority transaction
```

Any candidate produced by AI/parser/CAS remains candidate-only until:

```text
Proposal → Validation → Authority → Commit
```

The service MUST preserve `object kind = math` and use existing persistent identity / revision semantics. Editing a math intrinsic creates a new revision while retaining persistent identity.

## 11. D-Math product bridge

Extend the hidden EveGlyph ASCS bridge rather than the visible Editor UX.

Proposed safe global factory:

```text
EveGlyphASCS.createNativeMathService(...)
```

The factory exposes typed validation/projection/edit methods only. It does not replace the existing Markdown editor, publication runtime or Typst renderer.

No visible Native Math editor UI is required in D-Math. The first acceptance criterion is a real typed runtime seam, not a new toolbar.

---

# Part II — D-Glyph

## 12. Glyph structural kernel

Create `packages/ascs-glyph/` on top of the merged D-Math main.

The core separates:

```text
Character
Glyph persistent identity
Geometry
Topology
Part graph
Family / variant
Semantic Symbol
Behavior binding
Renderer profile
Canvas placement
```

These categories MUST NOT collapse into one another.

In particular:

```text
MathOperatorIdentity != GlyphIdentity
GlyphIdentity != Unicode code point
GlyphIdentity != OpenType GlyphID
Renderer != identity authority
Canvas placement != glyph intrinsic geometry
semantic binding != geometry hash
behavior binding != semantic representation
```

## 13. Geometry and topology

Implement the frozen v0.6 candidate structural rules needed by examples and 30 vectors:

- canonical decimal grammar;
- path primitive validation and command sequencing;
- component instances with immutable revision pinning;
- exact carry representation;
- unique/sorted geometry/topology/part IDs;
- dangling-reference rejection;
- topology owner/hole consistency;
- component-cycle detection;
- expansion depth and primitive budgets;
- part graph and port/attachment references;
- family axes/value constraints;
- topology policy for families.

Geometry canonicalization is representation normalization only. It MUST NOT auto-beautify, rewrite winding, merge similar curves, modify topology or inject recognizer semantics.

## 14. Glyph semantic and behavior binding

Semantic binding is first-class and candidate-gated.

A recognizer/AI may produce a candidate binding, but only explicit authority promotion creates committed semantics.

The v0.6 binding profile must be validated, including required capabilities for executable behavior.

Executable behavior MUST NOT gain authority from the glyph itself. A binding that invokes runtime behavior must explicitly require the corresponding capability such as `runtime.execute`.

D-Glyph MAY use the existing trusted transaction seam internally to promote/revoke a typed binding relation, but MUST NOT expose raw relation mutation or arbitrary canonical callbacks through the product API.

## 15. Native Math ↔ Glyph boundary

D-Glyph may bind a glyph to a Native Math semantic symbol reference, for example a derivative operator.

The binding establishes representation semantics but never changes the canonical operator identity stored in the Native Math expression graph.

Therefore multiple glyphs/notations may represent one math symbol, and one glyph may have ambiguous candidate semantic interpretations until promoted.

## 16. Glyph projection adapters

D-Glyph implements safe deterministic projections, not general-purpose imported document execution.

Required first projections:

```text
Native Glyph → SVG data projection
Native Glyph → accessibility/fallback text projection
```

SVG output is generated from validated canonical geometry. Imported SVG script/event-handler behavior, external resource loading and DOM execution are not part of the glyph model.

Renderer profile identity/version, target, fidelity, determinism and fallback behavior are explicit records.

Unicode/OpenType mappings are adapters. Missing Unicode assignment does not make a custom glyph invalid or unaddressable.

D-Glyph validates the frozen GSC AssetSymbol bridge profile and source-hash/fidelity claims, but does not reimplement the entire GSC compiler.

## 17. Glyph equality and merge channels

Equality MUST remain typed:

```text
exact-carry
geometry
topological
part-structural
family-coordinate
semantic
```

None is persistent-identity equality.

Merge semantics preserve domain separation:

```text
geometry
topology
part graph
family binding
render hints
semantic relation layer
Canvas placement
```

Geometry conflicts and semantic binding conflicts remain separate conflict domains.

## 18. Glyph legacy coexistence

`glyph/0.1` remains valid and is never silently reinterpreted as `glyph/1.0-candidate.1`.

No mandatory migration is introduced. Explicit enrichment preserves persistent identity while normally creating a different intrinsic content hash/revision.

## 19. D-Glyph product bridge

Extend the hidden EveGlyph ASCS bridge with a safe typed factory:

```text
EveGlyphASCS.createGlyphService(...)
```

Safe responsibilities:

```text
validate glyph/family/binding/renderer candidates
project validated glyph geometry to SVG
produce accessibility projection
edit glyph intrinsic state through ASCS transaction authority
create binding candidates
promote/revoke bindings through typed authority-gated operations
```

The global facade MUST NOT expose raw carrier/store, arbitrary trusted mutation callbacks, font parser execution, SVG DOM execution or unscoped behavior execution.

No full visible vector-glyph editor is required in D-Glyph.

---

## 20. Security and MCP boundary

Milestone D deliberately does **not** duplicate the security stack currently being developed in the original `eveglyph-editor` repository.

The original EveGlyph line currently prototypes:

```text
Capability Sandbox
→ Credential Broker
→ GitHub / Google provider connectors
→ later MCP credential delegation / sandbox hardening
```

ASCS Milestone D imports none of that unfinished stacked-PR code.

D preserves the future rebinding rule:

```text
credential != identity != capability != authority != canonical mutation permission
```

Native Math/Glyph services must already use ASCS authority transactions for canonical writes. When the original security stack is later stabilized and imported, provider/MCP capabilities will be rebound to ASCS principals and transactions in a separate Milestone E.

No D code receives OAuth tokens, provider credentials, connector clients or secret broker handles.

---

## 21. Testing strategy

### Canonical/reference gates

Every D PR must keep existing A/B/C gates green and additionally run:

D-Math:

```text
v0.5 archive SHA pin
validate_v05.py --json
v0.5 schema/example validation
30/30 frozen math vectors through JS production semantics
```

D-Glyph:

```text
v0.6 archive SHA pin
validate_v06.py --json
test_validate_v06.py
v0.6 schema/example validation
30/30 frozen glyph vectors through JS production semantics
```

### Runtime gates

D-Math must prove at least:

- exact integer/rational/decimal behavior;
- alpha-equivalence/capture-avoidance semantics;
- typed result/evidence/equality behavior;
- projection fidelity records;
- legacy profile non-reinterpretation;
- math intrinsic edit preserves persistent identity and creates a new revision;
- stale base / denied authority leaves canonical state unchanged.

D-Glyph must prove at least:

- custom non-Unicode glyph is persistent/addressable;
- renderer/Canvas changes do not alter intrinsic identity where prohibited;
- geometry/topology edits create revisions;
- component cycles/malformed paths fail closed;
- binding candidate has no authority;
- promoted binding uses typed authority;
- executable binding requires capability declaration;
- safe SVG projection contains no script/external execution surface;
- math semantic ref and glyph identity remain distinct;
- legacy profile coexistence.

### Product regression gates

Both PRs must continue to pass:

```text
existing ASCS A/B/C tests
existing Editor ASCS bridges
EveGlyph publication 22/22
Vite production build
Dynamic Logic
Dynamic Rendering
Product Convergence / overlay lineage
```

The original EveGlyph connector PR #7/#8/#9 tests are not copied into ASCS D because those branches are not yet canonical ASCS product input.

---

## 22. Product overlay discipline

`UPSTREAM_BASELINE.json` remains the immutable original EveGlyph provenance snapshot.

D advances only `ASCS_OVERLAY.json` with explicit added/modified paths. All other upstream drift remains fail-closed.

The product bridge is an implementation overlay; it does not become canonical semantic authority.

---

## 23. Backup and integration contract

Each D slice follows the existing hard delivery rule.

Before Ready for Review:

```text
exact PR head
→ all required verification PASS
→ source-backup ZIP
→ BACKUP_MANIFEST.json
→ SHA256SUMS.txt
→ PR.patch
→ RESTORE.md
→ external ARTIFACT_SHA256.txt
→ local independent revalidation
```

After explicit merge authorization:

```text
merge commit
→ verify main HEAD / parents / Git tree
→ merged-main backup
→ independent SHA/tree validation
```

A PR is never treated as the sole recovery artifact.

---

## 24. Explicit non-goals

Milestone D does not implement:

- a universal CAS;
- a universal proof language or prover;
- unrestricted semantic LaTeX import;
- a full MathML/OpenMath/OMDoc/SMT-LIB importer stack;
- a full font/OpenType parser;
- arbitrary SVG import/DOM execution;
- a replacement for GSC compiler internals;
- visible full-feature Native Math/Glyph editing UX;
- OAuth, credential broker or provider connectors;
- remote MCP OAuth/security rebinding;
- Agent Principal / MCP authority convergence;
- promotion of candidate profiles to v1.0 final.

---

## 25. Acceptance state after Milestone D

After D-Math + D-Glyph are merged, ASCS product capability metadata should read approximately:

```text
canonical persistent identity          PASS
authority transactions                 PASS
persistent EGStore                     PASS
revision/history graph                 PASS
spatial canonical model                PASS
persistent Editor bridge               PASS
Native Math candidate runtime          PASS
LaTeX/MathML math projections          PASS
Native Glyph candidate runtime         PASS
Glyph family/binding model             PASS
safe SVG/accessibility projections     PASS

future:
Agent/MCP security authority rebinding
visible native symbolic UX
candidate → v1.0 promotion work
```

The defining architecture is then:

```text
ASCS canonical objects
      │
      ├── Native Math semantics ──→ LaTeX / MathML projections
      │
      └── Native Glyph semantics ─→ SVG / accessibility projections

All canonical writes
      ↓
ASCS authority + transaction + revision + history
```

LaTeX, SVG, Unicode and renderer formats remain output/interchange dialects rather than the canonical world.
