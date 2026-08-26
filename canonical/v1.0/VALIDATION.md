# ASCS v1.0 Validation Report

**Release:** `ascs/1.0`  
**Handoff:** `ascs-handoff/1.0`  
**Validation date:** 2026-08-25  
**Scope:** Canonical architecture / executable evidence / v0.2–v0.9 freeze chain / v1.0 local handoff

---

## 1. Validation Principle

v1.0 does not accept a prior release's written `PASS` statement as sufficient evidence. Where executable validators exist, they were freshly rerun from extracted SHA-pinned source archives. Where a round has schema/vector evidence but no reference Python validator, its Draft 2020-12 schema and vector uniqueness were freshly rechecked.

The evidence classes remain distinct:

```text
normative document
machine-readable schema/vector
reference validator
MVP executable test
upstream/optional implementation input
```

One class does not silently substitute for another.

---

## 2. Source Archive Integrity

The v1.0 manifest pins ten required source archives:

- v0.1 Architecture Complete;
- MVP-01 v0.1;
- v0.2 Contract Hardening;
- v0.3 Persistent Editing;
- v0.4 Spatial Region;
- v0.5 Native Math;
- v0.6 Glyph / Symbol;
- v0.7 Agentic Workspace;
- v0.8 Interchange;
- v0.9 Productization / Operational Hardening.

Fresh audit:

```text
ZIP testzip: PASS for all 10 required archives
Archive SHA-256 vs v1.0 manifest: PASS
Internal SHA256SUMS manifests found in architecture/MVP/v0.2–v0.9: PASS
```

The v0.3–v0.9 release archives' package-level manifests were also used as provenance evidence during extraction/audit.

---

## 3. TW-01 / TW-02 / TW-03 Fresh Validation

### TW-01

```text
PASS: schema
PASS: cross-record references
PASS: content addresses
PASS: revision ids
PASS: workspace revision
PASS: canonicalization vector
PASS: edit/move/clone semantic vectors
```

### TW-02

```text
PASS: schema
PASS: manifest id
PASS: chunk hashes and root reconstruction
PASS: UTF-8 EGIR root payload
PASS: conformance vectors
TW-02 reference validation: PASS
```

### TW-03

```text
PASS: session overlay/cache non-authority
PASS: move + stale conflict
PASS: candidate/promotion authority boundary
PASS: native execution result/provenance
PASS: capability denial non-mutation
PASS: final bundle TW-01 conformance
PASS: runtime rehydrate
PASS: packaged trace/schema
PASS: deterministic runtime conformance
```

---

## 4. MVP-01 Fresh Validation

Full Python unittest discovery was rerun from the pinned MVP archive.

```text
Ran 26 tests
OK
```

The suite covers:

- canonical hash recomputation;
- deterministic key ordering;
- move/edit/clone/stale conflict;
- relation candidate/promotion;
- native derivative;
- glyph binding authority;
- identity/Brotli EGStore round-trip;
- corruption typed error;
- HTTP command surface;
- browser Canvas assets;
- end-to-end serialize/rehydrate;
- self-contained cross-layer validator.

`validate_mvp.py` additionally reran the embedded TW-01 / TW-02 / TW-03 reference validators and returned `PASS`.

---

## 5. v0.3–v0.9 Fresh Freeze Audit

### v0.3 — History / Merge

```text
history-profile Draft 2020-12 schema: PASS
history/merge vectors: 12
unique vector IDs: 12
```

### v0.4 — Spatial Region

```text
Draft 2020-12 schemas: 2 PASS
spatial vectors: 18
unique vector IDs: 18
representative spatial JSON example: PASS
```

### v0.5 — Native Math

```text
object schema errors: 0
object semantic errors: 0
vector schema errors: 0
transform/equality/fidelity example errors: 0
vectors: 30 / 30 unique
status: PASS
```

### v0.6 — Glyph / Symbol

```text
validator regression tests: 4 / 4 PASS
glyph/family/binding/bridge/renderer schema+semantic errors: 0
vectors: 30 / 30 unique
status: PASS
```

### v0.7 — Agentic Workspace

```text
validator regression tests: 4 / 4 PASS
schemas: 9 / 9 PASS
examples: 11 / 11 PASS
vectors: 36 / 36 unique
status: PASS
```

### v0.8 — Interchange

```text
validator regression tests: 5 / 5 PASS
schemas: 6 / 6 PASS
examples: 23 / 23 PASS
vectors: 36 / 36 unique
status: PASS
```

### v0.9 — Operational Hardening

```text
validator regression tests: 6 / 6 PASS
schemas: 8 / 8 PASS
examples: 11 / 11 PASS
vectors: 46 / 46
status: PASS
```

---

## 6. v1.0 TDD Gate

The v1.0 validator was created test-first.

Initial RED state:

```text
ModuleNotFoundError: No module named 'validate_v10'
```

After implementing the minimal validator, all six regression tests passed:

```text
test_archive_hash_mismatch_is_rejected ... ok
test_candidate_profile_cannot_be_silently_promoted ... ok
test_canonicalization_change_under_same_contract_is_rejected ... ok
test_missing_required_handoff_document_is_rejected ... ok
test_v09_to_v10_mandatory_migration_is_rejected ... ok
test_valid_manifest_semantics_pass ... ok

Ran 6 tests
OK
```

The negative tests explicitly prove that v1.0 rejects:

- changing `egir-cj/0.1` under the same handoff contract;
- silently renaming `ncm/1.0-candidate.1` to `ncm/1.0`;
- source archive SHA mismatch / invalid ZIP;
- missing required handoff documentation;
- introducing a mandatory v0.9 -> v1.0 canonical migration.

---

## 7. v1.0 Source Gate

The final human/machine handoff source, excluding generated binary archives and the generated root SHA manifest, is checked for:

- strict UTF-8 decode;
- LF-only line endings;
- no disallowed control characters;
- no accidental tab escapes in newly generated v1.0 source;
- JSON parse;
- Python AST parse;
- Markdown math delimiter discipline;
- no parenthesized/bracket LaTeX delimiter form outside fenced/inline code;
- display/inline dollar delimiter balance.

Expected final source count after this validation file is present:

```text
Markdown: 48
JSON: 3
Python: 2
Total canonical text/source files: 53
```

The roadmap snapshot is included in that text-source audit. Binary source archives and optional research archives are verified by SHA-256 / ZIP integrity instead.

---

## 8. Version / Compatibility Conclusions

Fresh consistency audit found no requirement to reinterpret the existing stable baseline IDs.

```text
ASCS umbrella = ascs/1.0
EGIR = egir/0.1
Canonicalization = egir-cj/0.1
EGStore = egstore/0.1
EGCR = egcr/0.1
Mandatory canonical migration from ascs/0.9 = NO
```

Candidate component profiles retain their exact candidate IDs. v1.0 does not silently promote them.

---

## 9. Implementation Input Pins

The handoff records the following implementation-only Git baselines:

```text
eveglyph-editor main = 55a2ad77f3131f717cf73992cc2550e4c3a864bb
utf-8x main = c4bfd2b48688c99053e062d149d41baf34d84930
```

They are not canonical semantic authority and are not required to reproduce the v1.0 specification evidence itself.

Optional local archives for GSC v1.13 and PSSA-BSAR Milestone 4 are SHA-pinned in the handoff manifest.

---

## 10. Release Gate

v1.0 is eligible for final packaging only if the following are fresh PASS on the final tree:

```text
[ ] v1.0 regression tests
[ ] full v1.0 manifest/schema/archive validation
[ ] final 53-file source gate
[ ] root SHA256SUMS generation + verification
[ ] outer ZIP testzip
[ ] extracted ZIP root SHA256SUMS verification
```

The final packaging step performs these checks again after this document is frozen.
