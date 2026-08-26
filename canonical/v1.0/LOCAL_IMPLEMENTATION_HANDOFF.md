# Local Implementation Handoff — ASCS v1.0

## 1. Mission

把 ASCS v1.0 canonical architecture 工程化到 EveGlyph product，而不重新設計已凍結語義。

第一原則：

> **先重現，再實作；先 core contract，再 UI refactor。**

---

## 2. Required Inputs

### Canonical source archives

使用 `source_archives/`，不要使用聊天貼文當 source。

至少先解壓：

```text
Architecture Complete v0.1
MVP-01 v0.1
v0.2 Contract Hardening
v0.3 History
v0.4 Spatial
v0.5 Math
v0.6 Glyph
v0.7 Agent
v0.8 Interchange
v0.9 Operational
```

### Product implementation baseline

```text
kakon77777-commits/eveglyph-editor
main @ 55a2ad77f3131f717cf73992cc2550e4c3a864bb
```

### Optional storage input

```text
kakon77777-commits/utf-8x
main @ c4bfd2b48688c99053e062d149d41baf34d84930
```

GSC / PSSA optional archives 在 `optional_inputs/`。

---

## 3. Before Writing Code

建立 isolated branch/worktree，例如：

```text
workbench/ascs-v1-product-runtime
```

然後：

1. pin / copy 本 handoff package；
2. 執行 v1.0 validator；
3. 解壓 Architecture + MVP；
4. 重跑 TW-01/02/03 validators；
5. 重跑 MVP 26 tests；
6. 重跑 v0.5–v0.9 validators；
7. 將輸出存成 `docs/ascs/baseline-reproduction.md`；
8. 此時才開始產品 code change。

若 baseline 無法重現，先修 reproducibility / environment，不要直接改 canonical semantics 讓測試變綠。

---

## 4. Recommended Repository Layout

這只是 implementation 建議，不是 canonical ontology：

```text
packages/
  ascs-core/          # IDs, revision, canonicalization, relations, validation
  ascs-store/         # EGStore providers
  ascs-runtime/       # command / transaction / authorization
  ascs-history/       # v0.3
  ascs-spatial/       # v0.4
  ascs-math/          # v0.5 adapter/profile
  ascs-glyph/         # v0.6 adapter/profile
  ascs-agent/         # v0.7
  ascs-interchange/   # v0.8
  ascs-ops/           # v0.9
apps/
  eveglyph-editor/    # existing UI/product surface
```

若現有 repo 不適合 monorepo，可改成 `src/ascs/*`；**檔案位置不是 canonical contract**。

---

## 5. Implementation Rules

### Rule 1 — No hidden mutation

任何 canonical write 必須有 command + base revision + event/provenance。

### Rule 2 — No direct storage authority

UI、agent、adapter、CAS 不得直接改 canonical storage bytes。

### Rule 3 — Validators are gates

Schema 不是完整 validation。Cross-record/hash/authority/evidence checks 必須保留。

### Rule 4 — Candidate profiles coexist

不要用 migration 把全部舊 math/glyph object 一次升到 candidate v1。採 lazy / explicit enrichment。

### Rule 5 — External effect is separate

File/process/network effect 與 canonical commit 的 lifecycle 分離。

### Rule 6 — Product security cannot inherit prototype shortcuts

API key plaintext localStorage、auto-approve agent、destructive reject、raw telemetry 等都依 v0.9 migration map處理。

---

## 6. First Engineering Milestone

**Milestone 1 — Canonical Runtime Bridge**

Goal：現有 Editor 保持可用，但新增一個真正 EGIR-backed workspace mode。

Acceptance criteria：

1. 可以 load TW-01 minimal workspace；
2. object/revision/content hash 重算一致；
3. move 只改 workspace revision；
4. edit 建立新 object revision；
5. stale base 回 typed Conflict；
6. save 到 identity EGStore；
7. reopen 後 identity/revision 不漂移；
8. UI session state 不進 canonical hash；
9. TW-01/TW-02/TW-03 validators 全綠；
10. existing Markdown editing mode 不被破壞。

只有這個 milestone 綠了，再進 v0.3/v0.4 product implementation。

---

## 7. Agent Implementation Rule

Agent integration 只允許：

```text
Task -> Context -> Run -> Proposal -> Validate -> Authorize -> Review -> Commit
```

不允許：

```text
Model output -> write canonical file directly
```

現有 filesystem agent 可以先保留，但它必須成為 adapter；canonical commit 由 runtime transaction 控制。

---

## 8. CAS / Prover Rule

CAS 或 proof backend 可以被替換。

但 backend output 必須攜帶：

- input revision；
- backend/version；
- assumptions/constraints；
- evidence class；
- result provenance。

不能把「SymPy/Mathematica/Lean/其他工具回傳成功」直接等同 EveGlyph proof semantics。

---

## 9. Release Discipline

任何 release candidate 必須：

1. schema/conformance pass；
2. cross-layer E2E pass；
3. migration dry-run pass；
4. recovery tests pass；
5. resource/security gates pass；
6. benchmark class recorded；
7. rollback target exists；
8. release manifest + SHA-256 generated。

---

## 10. When You Must Stop

若你發現需要改：

- `egir-cj/0.1`；
- hash preimage；
- identity definition；
- candidate authority；
- evidence meaning；
- external-effect retry semantics；
- same profile ID 的語義；

**停止普通 implementation。** 建立 architecture/migration issue，說明為什麼 v1.0 contract 不足，再決定新 profile/version。

不要自行「合理化」後繼續。
