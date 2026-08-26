# Version & Profile Matrix — ASCS v1.0

## 1. Umbrella Release

```text
ASCS release = ascs/1.0
Handoff contract = ascs-handoff/1.0
Canonicalization = egir-cj/0.1
Mandatory canonical migration from ascs/0.9 = no
```

v1.0 不要求各 component profile 與 umbrella version 同號。

---

## 2. Profile Matrix

| Layer | Profile ID | v1.0 status | Introduced |
|---|---|---|---|
| ASCS | `ascs/1.0` | umbrella-stable-handoff | v1.0 |
| EGIR | `egir/0.1` | stable-baseline | TW-01 |
| Canonicalization | `egir-cj/0.1` | stable-baseline | TW-01 |
| EGStore | `egstore/0.1` | stable-baseline | TW-02 |
| EGCR | `egcr/0.1` | stable-baseline | TW-03 |
| NCM | `ncm/0.1` | stable-baseline | TW-01/MVP |
| NCM Candidate | `ncm/1.0-candidate.1` | candidate-freeze | v0.5 |
| Math Transform | `org.evemisslab.math-transform/0.1` | candidate-support | v0.5 |
| Math Equality | `org.evemisslab.math-equality/0.1` | candidate-support | v0.5 |
| Glyph | `glyph/0.1` | stable-baseline | TW-01/MVP |
| Glyph Candidate | `glyph/1.0-candidate.1` | candidate-freeze | v0.6 |
| Glyph Family | `glyph-family/1.0-candidate.1` | candidate-freeze | v0.6 |
| Glyph Binding | `glyph-binding/1.0-candidate.1` | candidate-freeze | v0.6 |
| GSC Bridge | `gsc-assetsymbol-bridge/1.0-candidate.1` | candidate-bridge | v0.6 |
| History | `org.evemisslab.history/0.1` | frozen-extension | v0.3 |
| History Conflict | `org.evemisslab.history-conflict/0.1` | frozen-extension | v0.3 |
| Recovery | `org.evemisslab.recovery/0.1` | frozen-extension | v0.3 |
| Spatial Region | `org.evemisslab.spatial-region/0.1` | frozen-extension | v0.4 |
| Spatial Grammar | `org.evemisslab.spatial-grammar/0.1` | frozen-extension | v0.4 |
| Spatial Policy | `org.evemisslab.spatial-policy/0.1` | frozen-extension | v0.4 |
| Semantic Zoom | `org.evemisslab.semantic-zoom/0.1` | frozen-extension | v0.4 |
| Agent Principal | `agent-principal/1.0-candidate.1` | candidate-freeze | v0.7 |
| Agent Context | `agent-context-pack/1.0-candidate.1` | candidate-freeze | v0.7 |
| Agent Run | `agent-run/1.0-candidate.1` | candidate-freeze | v0.7 |
| Agent Proposal | `agent-proposal/1.0-candidate.1` | candidate-freeze | v0.7 |
| Capability Grant | `capability-grant/1.0-candidate.1` | candidate-freeze | v0.7 |
| Agent Review | `agent-review-policy/1.0-candidate.1` | candidate-freeze | v0.7 |
| External Effect | `external-effect/1.0-candidate.1` | candidate-freeze | v0.7 |
| Agent Adapter | `agent-adapter/1.0-candidate.1` | candidate-freeze | v0.7 |
| Adapter Profile | `adapter-profile/1.0-candidate.1` | candidate-freeze | v0.8 |
| Adapter Result | `adapter-result/1.0-candidate.1` | candidate-freeze | v0.8 |
| Fidelity Report | `fidelity-report/1.0-candidate.1` | candidate-freeze | v0.8 |
| External Reference | `external-reference/1.0-candidate.1` | candidate-freeze | v0.8 |
| Roundtrip Report | `roundtrip-report/1.0-candidate.1` | candidate-freeze | v0.8 |
| Operational Policy | `v0.9 operational-policy schema` | pre-v1-operational-freeze | v0.9 |
| Resource Budget | `v0.9 resource-budget schema` | pre-v1-operational-freeze | v0.9 |
| Recovery Profile | `v0.9 recovery-profile schema` | pre-v1-operational-freeze | v0.9 |
| Explain Record | `v0.9 explain-record schema` | pre-v1-operational-freeze | v0.9 |
| Benchmark Profile | `v0.9 benchmark-profile schema` | pre-v1-operational-freeze | v0.9 |
| Release Manifest | `v0.9 release-manifest schema` | pre-v1-operational-freeze | v0.9 |
| Migration Plan | `v0.9 migration-plan schema` | pre-v1-operational-freeze | v0.9 |
| Compatibility Matrix | `v0.9 compatibility-matrix schema` | pre-v1-operational-freeze | v0.9 |

---

## 3. Status Meaning

### `stable-baseline`

已作為 architecture / MVP 的可執行 baseline。修改其既有語義需要新 profile ID 或 migration。

### `frozen-extension`

v0.3 / v0.4 已凍結 extension semantics；本地 implementation 可以實作，但不能在相同 ID 下換一套意思。

### `candidate-freeze`

設計與 machine contract 已凍結到足以工程化，但 component 本身仍保留 candidate 名稱。未來升 stable 必須做 explicit promotion release。

### `pre-v1-operational-freeze`

v0.9 定義產品化 gates。它們是 implementation release discipline，不取代 EGIR ontology。

---

## 4. Version Change Rule

若 semantic meaning、hash preimage、canonicalization、binding authority 或 execution meaning 改變：

$$
OldProfileID
\neq NewProfileID.
$$

若只是 renderer、index、storage backend、agent provider、CAS backend、UI framework 改變，且 canonical observable behavior 不變，則通常不需要 canonical profile migration，但必須通過 conformance regression。
