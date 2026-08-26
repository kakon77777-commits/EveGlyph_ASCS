# Prioritized Implementation Backlog — ASCS v1.0

本 backlog 以「先建立不可替代的 canonical spine，再增加可替換能力」排序。

---

# P0 — Reproducibility & Contract CI

## P0.1 Pin handoff package
- 將 v1.0 manifest/hash 存入產品 repo 的 docs / CI artifact。
- Acceptance: fresh checkout 可以驗證所有 pinned source archives。

## P0.2 Cross-release validation job
- 執行 TW-01/02/03、MVP、v0.5–v0.9 validators。
- Acceptance: CI 對同一 release evidence 產生 deterministic PASS。

## P0.3 No-silent-change CI guard
- 對 canonicalization/profile IDs 建 golden registry。
- Acceptance: 同 ID schema/hash semantics 被修改時 CI fail。

---

# P1 — Canonical Core

## P1.1 EGIR core data types
- object / revision / relation / event / address records。

## P1.2 Canonicalization + hash domains
- 完整實作 `egir-cj/0.1`。
- Acceptance: TW-01 vectors exact pass。

## P1.3 Cross-record validator
- parent refs、content/revision/workspace hash、tombstone、authority。

## P1.4 Runtime transaction service
- base revision pin、Conflict、commit event、persist hook。

## P1.5 Existing Editor bridge
- 讓 Editor UI 可以讀/寫 canonical runtime，而不是直接 authoritative mutation。

---

# P2 — EGStore / Persistence

## P2.1 identity provider
## P2.2 Brotli provider
## P2.3 range read / index
## P2.4 atomic manifest commit
## P2.5 crash recovery
## P2.6 optional UTF-8X provider adapter

Acceptance: 同 EGIR state 在至少兩種 physical store 下 identities 完全不變。

---

# P3 — History / Merge

## P3.1 persistent commit DAG
## P3.2 branch / workspace fork
## P3.3 domain-separated merge
## P3.4 first-class conflict object
## P3.5 canonical revert
## P3.6 autosave draft / checkpoint / recovery capsule

Acceptance: v0.3 vectors + crash/session recovery suite pass。

---

# P4 — Nested Spatial Canvas

## P4.1 region objects / local frames
## P4.2 deterministic transform composition
## P4.3 KeepWorld / KeepLocal reparent
## P4.4 policy inheritance
## P4.5 semantic zoom projection
## P4.6 local grammar parser -> candidates
## P4.7 execution graph compiler boundary

Acceptance: v0.4 vectors pass；pure view transform / pure move 不污染 object intrinsic state。

---

# P5 — Native Math

## P5.1 read both `ncm/0.1` and `ncm/1.0-candidate.1`
## P5.2 expression graph + binders
## P5.3 exact/approx numeric model
## P5.4 assumptions/constraints/units
## P5.5 transform/equality/evidence records
## P5.6 CAS adapter
## P5.7 proof-backend adapter
## P5.8 LaTeX/MathML/OpenMath projection/import

Acceptance: v0.5 validator + Native Math E2E；canonical path不依賴 LaTeX reparse。

---

# P6 — Glyph / Symbol

## P6.1 glyph v1 candidate reader/writer
## P6.2 family/variant model
## P6.3 geometry/topology/part graph
## P6.4 renderer profiles
## P6.5 semantic binding authority
## P6.6 GSC v1.13 bridge
## P6.7 font/Unicode adapters

Acceptance: v0.6 validator；visual import 不授權 execution；GSC carry-lossless fixture pass。

---

# P7 — Agentic Workspace

## P7.1 Agent Principal registry
## P7.2 Context Pack compiler
## P7.3 Run / Proposal records
## P7.4 capability engine
## P7.5 review policy compiler
## P7.6 external-effect record/replay policy
## P7.7 filesystem agent adapter
## P7.8 MCP / HTTP / CLI adapters

Acceptance: v0.7 validator；direct 不 bypass authority；model/provider 可替換不改 principal identity。

---

# P8 — Interchange

## P8.1 Markdown
## P8.2 LaTeX
## P8.3 MathML/OpenMath
## P8.4 SVG/Raster
## P8.5 PDF projection
## P8.6 JSON/CBOR/UTF-8X carrier
## P8.7 URI/DOI/DID/SWHID external references
## P8.8 fidelity / roundtrip reporting

Acceptance: v0.8 validator；legacy import 預設 candidate；external ref 不 auto-bind identity。

---

# P9 — Product Hardening

## P9.1 OS keychain / secret handling
## P9.2 default-deny operational policy
## P9.3 resource budgets
## P9.4 observability redaction
## P9.5 Explain APIs
## P9.6 recovery matrix automation
## P9.7 benchmark harness
## P9.8 migration tooling
## P9.9 signed/checksummed release artifacts
## P9.10 rollback automation

Acceptance: v0.9 validator + security/recovery/performance release gate。

---

# P10 — Product RC

## P10.1 UX convergence
- 將 existing Editor 與 Canvas/runtime 整合成使用者可理解的產品 surface。

## P10.2 Import real-world workspaces
- legacy Markdown workspace migration dry-run。

## P10.3 Long-run soak
- history growth、crash、reopen、agent runs、large workspace。

## P10.4 RC compatibility matrix
- old fixtures / candidate profiles / adapters / stores。

## P10.5 Release candidate
- release manifest、SBOM、benchmark、rollback、migration report。

---

## Stop Rule

P0–P10 是 implementation backlog，不是新的 ontology roadmap。

如果某 task 真的需要 canonical semantic change，先從 backlog 退出，開 explicit profile/version design issue。
