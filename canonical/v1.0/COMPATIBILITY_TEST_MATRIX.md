# Compatibility Test Matrix — ASCS v1.0

## 1. Core Cross-Version Matrix

| Source | Reader/Runtime | Expected |
|---|---|---|
| `egir/0.1` | v1 product runtime | Exact / Backward |
| `ncm/0.1` | v1 math subsystem | Exact baseline |
| `ncm/1.0-candidate.1` | runtime without candidate support | Preserve-only or Reject if critical |
| `ncm/1.0-candidate.1` | candidate-aware runtime | Validate + execute supported subset |
| `glyph/0.1` | v1 glyph subsystem | Exact baseline |
| `glyph/1.0-candidate.1` | baseline-only reader | Preserve-only / non-execute |
| v0.3 history extensions | v1 runtime | Understand or preserve safely |
| v0.4 spatial extensions | v1 runtime | Understand or preserve safely |
| v0.7 agent records | non-agent reader | Preserve, never execute |
| v0.8 adapter result | core runtime | Candidate/import evidence only |
| v0.9 operational records | offline core | Preserve; unavailable ops do not corrupt workspace |

---

## 2. Identity Stability Tests

| Operation | Persistent ID | Content Address | Object Revision | Workspace Revision |
|---|---|---|---|---|
| pan/zoom | same | same | same | same |
| pure move | same | same | same | new |
| edit intrinsic | same | new | new | new |
| clone | new | may same | new lineage | new |
| physical relocate | same | same | same | same canonical workspace |
| recompress store | same | same | same | same canonical workspace |
| branch | same workspace identity | unchanged objects until edits | DAG diverges | branch heads differ |
| workspace fork | new workspace identity | object content may match | lineage policy explicit | new workspace lineage |

---

## 3. Authority Tests

| Input | Must not happen |
|---|---|
| spatial proximity | auto explicit relation |
| AI semantic suggestion | auto identity merge |
| direct agent mode | bypass validation/capability |
| imported glyph | auto execution permission |
| imported PDF/SVG | claim recovered canonical source without evidence |
| DOI/DID/SWHID resolve | auto local ID binding |
| old mutable alias | become immutable citation |
| resolver success | grant write/execute |

---

## 4. Failure-State Compatibility

Implementation 必須保留 typed distinctions：

```text
Resolved
Multiple
Unresolved
Unavailable
Unauthorized
Invalid
Stale
Conflict
MissingChunk
HashMismatch
MissingDependency
UnsupportedProfile
ResourceLimitExceeded
EffectUnknown
```

不得為了 API 簡單把以上全部壓成 `false` 或 generic exception。

---

## 5. Adapter Round-Trip Tests

至少覆蓋：

- EGIR JSON -> EGIR JSON canonical state；
- EGIR -> CBOR -> EGIR；
- EGIR -> identity EGStore -> EGIR；
- EGIR -> compressed EGStore -> EGIR；
- recognized Markdown subset -> EGIR -> Markdown；
- NCM subset -> LaTeX/MathML/OpenMath projection；
- GSC AssetSymbol -> glyph bridge；
- external reference resolve without identity binding。

每一條都要聲明 fidelity / round-trip class，不允許 generic `success=true`。

---

## 6. RC Compatibility Minimum

Release candidate 至少必須重跑：

1. TW-01/02/03 reference validators；
2. MVP E2E golden path；
3. v0.3/v0.4 vectors；
4. v0.5–v0.9 validators；
5. v1.0 handoff validator；
6. one real existing Markdown workspace import dry-run；
7. one crash/recovery scenario；
8. one migration + rollback rehearsal。
