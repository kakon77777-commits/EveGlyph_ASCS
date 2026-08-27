# EveGlyph ASCS Product Convergence Design

**Date:** 2026-08-27  
**Repository:** `kakon77777-commits/EveGlyph_ASCS`  
**Design branch:** `design/product-convergence-v1`  
**Status:** Written design for review; high-level direction approved in chat  
**Canonical authority:** `canonical/v1.0/` remains authoritative and byte-preserved

---

## 1. Goal

Bring **EveGlyph_ASCS** to at least the practical product maturity of the current EveGlyph Editor while preserving the ASCS v1.0 canonical authority model.

The target is not a second independent editor rewrite. The target architecture is:

```text
Current EveGlyph product surface
        +
ASCS canonical kernel/runtime
        =
EveGlyph_ASCS product
```

The convergence success condition is:

```text
EveGlyph_ASCS product capability >= current EveGlyph product capability
```

while every canonical mutation is mediated by the ASCS runtime transaction boundary.

---

## 2. Authority and baseline discipline

### 2.1 Canonical semantics

`canonical/v1.0/`, its machine contracts, validators, frozen profiles, source archives, and no-silent-change rules are the semantic authority.

Implementation code must not redefine:

- persistent identity;
- object/revision separation;
- canonicalization/hash domains;
- candidate versus authoritative relations;
- resolve versus authorize;
- computed versus verified/proved;
- canonical versus session/cache state;
- external-effect retry semantics;
- profile meanings under an unchanged profile ID.

### 2.2 Product implementation baseline

The v1.0 handoff records the historical implementation input:

```text
kakon77777-commits/eveglyph-editor
main @ 55a2ad77f3131f717cf73992cc2550e4c3a864bb
```

For product convergence, the selected **current product baseline** is explicitly newer:

```text
kakon77777-commits/eveglyph-editor
main @ c3258a2f461d5af5a69c879891b485ccf0f02635
```

This newer baseline includes the merged MCP Publication Runtime and first real-corpus publication compatibility closure.

This is an **implementation baseline update only**. It does not modify ASCS canonical authority. The relationship between the handoff-pinned editor commit and the selected convergence baseline must be recorded in a machine-readable lineage manifest.

---

## 3. Migration strategy

Use **strangler / adapter migration**, never a big-bang rewrite.

```text
Existing Editor surface
        ↓
Session Facade / View Model
        ↓
ASCS Runtime Command API
        ↓
EGCR transaction / authority
        ↓
EGIR canonical state
        ↓
EGStore persistence
```

Markdown, LaTeX, Typst, PDF, HTML, SVG, file paths, Git diffs, MCP, CAS/provers, and external references remain adapters/projections/services rather than canonical ontology.

The existing editor surface is preserved as long as it remains useful. Product replacement happens only where the ASCS kernel provides a better authoritative implementation.

---

## 4. Repository shape

Recommended convergence layout:

```text
EveGlyph_ASCS/
├─ canonical/v1.0/              # read-only semantic authority
├─ provenance/                  # preserved historical evidence
├─ releases/                    # preserved release archives
├─ docs/
│  └─ product-convergence/
├─ apps/
│  └─ eveglyph-editor/          # vendored current EveGlyph product surface
├─ packages/
│  ├─ ascs-core/
│  ├─ ascs-runtime/
│  ├─ ascs-store/
│  ├─ ascs-history/
│  ├─ ascs-spatial/
│  ├─ ascs-math/
│  ├─ ascs-glyph/
│  ├─ ascs-agent/
│  ├─ ascs-interchange/
│  └─ ascs-ops/
├─ tests/
│  ├─ conformance/
│  ├─ product-parity/
│  └─ e2e/
└─ tools/
```

The exact directory names are implementation choices, not canonical contracts.

### 4.1 Why vendored snapshot, not Git submodule

The initial editor import should be a **SHA-pinned vendored snapshot**, excluding `.git`, caches, temporary output, and `node_modules`.

Reasons:

- self-contained checkout;
- easier offline/local-Agent operation;
- easier reproducible backup ZIPs;
- fewer connector/submodule failure modes;
- exact file inventory can be hashed and audited.

A manifest such as `apps/eveglyph-editor/UPSTREAM_BASELINE.json` must record repository, selected SHA, historical handoff SHA, import time, exclusions, and file/inventory hashes.

---

## 5. Milestones

### Milestone A — Product Surface Convergence

Import current EveGlyph product surface and establish parity harnesses before changing canonical internals.

Retain at minimum:

- Markdown editing;
- live preview;
- tabs/file tree;
- encoding-aware I/O;
- diff review;
- agent/review UI;
- Dynamic Logic and dynamic rendering;
- Typst/PDF publication;
- MCP and remote MCP;
- real-corpus publication compatibility from EveGlyph PR #6.

**First implementation PR:**

> `Current EveGlyph Product Baseline Import & Parity Harness`

Acceptance:

1. ASCS canonical/provenance/release bytes remain unchanged.
2. Imported editor baseline is exactly attributable to `c3258a2f...`.
3. `npm ci` succeeds in the imported app.
4. Publication tests pass at the imported baseline count or higher.
5. Build passes.
6. Dynamic Logic verification passes.
7. Dynamic Rendering verification passes.
8. MCP publication E2E remains available.
9. A parity manifest records capabilities and verification evidence.
10. A downloadable backup artifact is produced for the exact PR head.

### Milestone B — Canonical Spine

Implement the minimum ASCS product kernel:

- EGIR object/revision/relation/event/address types;
- `egir-cj/0.1` canonicalization;
- hash domains;
- workspace revision;
- typed conflict;
- transaction service;
- authority gate;
- editor bridge.

Vertical slice:

```text
UI edit
→ ASCS command
→ base revision
→ validation/authority
→ new revision
→ commit event
→ EGStore
→ close/reopen
→ stable identity
```

### Milestone C — Persistence, History, Spatial

Integrate:

- EGStore providers;
- atomic manifest commit/recovery;
- commit DAG;
- branch/merge/conflict/revert;
- checkpoints/recovery capsules;
- nested regions/local frames;
- deterministic transform composition;
- semantic zoom and spatial policies.

### Milestone D — Native Math and Glyph

Move canonical math/glyph semantics away from syntax-as-authority.

Native Math includes expression graphs, binders, assumptions, constraints, units, transform/equality/evidence records, CAS/prover adapters, and LaTeX/MathML/OpenMath projection/import.

Native Glyph includes family/variant identity, geometry/topology/part graphs, renderer profiles, semantic binding authority, GSC bridge, and Unicode/font adapters.

LaTeX remains an interchange/projection target, not the canonical math world.

### Milestone E — Agent, MCP, Publication Rebinding

Rebind existing product capabilities to ASCS authority:

```text
Task
→ Context Pack
→ Agent Run
→ Proposal
→ Validate
→ Authorize
→ Review
→ Commit
```

No model/provider/CLI/MCP path may directly mutate canonical storage.

Publication remains non-destructive and projection-oriented. Existing MCP publication tools are retained and progressively pointed at ASCS-backed sources/objects where appropriate.

### Milestone F — Product Parity Closure / RC

Complete:

- security/keychain migration;
- default-deny operational policy;
- resource budgets;
- observability redaction;
- explain APIs;
- recovery automation;
- benchmark/soak suites;
- migration tooling;
- release manifests/SBOM/checksums;
- rollback automation;
- UX convergence.

---

## 6. Product parity contract

Maintain a machine-readable parity matrix between current EveGlyph and EveGlyph_ASCS.

Minimum dimensions:

```text
Capability                         Current EveGlyph   EveGlyph_ASCS
-----------------------------------------------------------------
Markdown editing                   required           required
Preview                            required           required
File tree / tabs                   required           required
Encoding support                   required           required
Diff review                        required           required
Agent UI                           required           required
Dynamic Logic                      required           required
Dynamic Rendering                  required           required
Typst/PDF publication              required           required
MCP publication                    required           required
Remote MCP                         required           required
Real-corpus publication            required           required
Canonical persistent identity      n/a                ASCS-only
Revision graph                     n/a                ASCS-only
Native Math                        n/a                ASCS-only
Native Glyph                       n/a                ASCS-only
Spatial canonical model            n/a                ASCS-only
Authority transactions             n/a                ASCS-only
```

A milestone cannot claim product convergence if it silently removes a required current-EveGlyph capability.

---

## 7. CI and validation model

Every product PR must run two independent classes of gates.

### 7.1 Canonical preservation gates

- repository preservation verifier;
- v1.0 regression validator;
- TW-01/TW-02/TW-03 validators where applicable;
- source-archive hash/ZIP integrity checks;
- no-silent-change guard;
- canonical tree byte-diff guard for PRs that should not modify authority evidence.

Use `python -B` or equivalent no-write execution for checksum-pinned canonical directories.

### 7.2 Product gates

- package install from lockfile;
- editor/product tests;
- publication tests;
- build;
- Dynamic Logic;
- Dynamic Rendering;
- MCP E2E;
- milestone-specific ASCS tests;
- parity harness.

A green implementation test cannot override a failed canonical preservation gate.

---

## 8. Backup and downloadable artifact contract

**PR is not the sole delivery mechanism.** Every implementation milestone must produce independent downloadable artifacts.

### 8.1 Mandatory PR-final-head backup

Before a PR is declared Ready for Review, produce:

```text
EveGlyph_ASCS_<milestone>_<head-sha8>_source-backup.zip
```

The ZIP must contain a restorable source snapshot for the exact PR head plus:

```text
BACKUP_MANIFEST.json
SHA256SUMS.txt
PR.patch
RESTORE.md
```

`BACKUP_MANIFEST.json` records at minimum:

- repository;
- branch;
- PR number when available;
- base SHA;
- head SHA;
- ASCS canonical release/profile reference;
- current EveGlyph upstream baseline where relevant;
- creation timestamp;
- included/excluded path policy;
- file count/total bytes;
- deterministic payload-tree digest;
- verification commands/results.

`SHA256SUMS.txt` records the hashes of the files carried inside the backup payload. The ZIP archive's own SHA-256 is computed **after** packaging and therefore is not embedded as a self-referential field inside the ZIP.

The delivery directory must additionally contain:

```text
ARTIFACT_SHA256.txt
```

which records the final ZIP filename and archive SHA-256.

### 8.2 Mandatory merged-main backup

If the PR is merged, produce a second backup corresponding to the actual merge commit:

```text
EveGlyph_ASCS_<milestone>_<merge-sha8>_merged-main-backup.zip
```

This prevents a valid PR-head backup from being mistaken for the final integrated state.

The merged-main ZIP receives its own adjacent `ARTIFACT_SHA256.txt` or uniquely named equivalent.

### 8.3 Default exclusions

Ordinary source backups exclude:

- `.git/`;
- `node_modules/`;
- caches;
- `tmp/`;
- transient build output;
- local secrets;
- generated QA artifacts not required for restoration.

Canonical/provenance/release evidence already tracked by the repository remains included unless the artifact is explicitly documented as a delta-only package.

### 8.4 Portable bundles

Executable portable runtime bundles are **separate artifacts**, created only when the milestone requires offline execution without package installation. They do not replace the source backup.

### 8.5 Delivery requirement

The implementation turn is not complete until the user receives a downloadable sandbox link for the backup artifact(s), the adjacent artifact-checksum file(s), and the archive SHA-256 values in the response.

---

## 9. Branch and PR discipline

- No product implementation directly on `main`.
- One coherent milestone/closure per branch/PR.
- PR numbers are assigned by GitHub and are not used as stable milestone identifiers in design contracts.
- Record exact base and final head SHA.
- Test-first for defects and contract changes.
- Do not mark Ready for Review without fresh exact-head verification.
- Do not merge unless explicitly authorized.
- After merge, verify `main` points to the reported integration commit before producing the merged-main backup.

---

## 10. Deliberate non-goals

This convergence project does **not**:

- rewrite EveGlyph UI from scratch;
- redefine ASCS v1.0 semantics for convenience;
- silently promote candidate profiles;
- make Markdown/LaTeX/PDF canonical ontology;
- require every legacy Markdown file to become native EGIR immediately;
- delete useful legacy UX before an ASCS-backed replacement is proven;
- treat CAS/prover success as automatic EveGlyph proof authority;
- allow Agent/MCP convenience paths to bypass authorization.

---

## 11. Stop rules

Stop ordinary implementation and open an explicit architecture/migration issue if work requires changing:

- `egir-cj/0.1` meaning;
- identity definition;
- hash preimages/domains;
- candidate authority semantics;
- evidence semantics;
- external-effect retry semantics;
- the semantics of an existing profile ID.

Implementation convenience is not sufficient justification for a silent semantic change.

---

## 12. Immediate next step after written-spec approval

Create a detailed implementation plan for:

> **Milestone A — Current EveGlyph Product Baseline Import & Parity Harness**

That plan will define the exact import inventory, exclusion rules, lineage manifest, CI/parity harness, and PR-final-head backup generation workflow before product code is copied.