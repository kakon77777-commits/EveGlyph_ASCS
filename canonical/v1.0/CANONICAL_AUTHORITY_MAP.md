# Canonical Authority Map — ASCS v1.0

## 1. Authority Principle

同一個概念可能同時出現在 paper、schema、reference validator、MVP、Editor UI、adapter 與聊天紀錄中。它們不是同等權威。

$$
\boxed{
NormativeFreeze
> MachineContract
> HandoffIntegrationMap
> Implementation
> Projection
> ChatMemory
}
$$

這裡的 `>` 表示在**語義衝突**時的優先權，而不是文件品質評分。

---

## 2. Layer Authority Table

| Domain | Canonical authority | Machine evidence | Implementation may replace |
|---|---|---|---|
| Object identity / revision | Paper 01 + TW-01 | TW-01 schema/vectors/validator | DB layout, in-memory structs |
| Addressing | Paper 05 + TW-01 | TW-01 typed address records | resolver index/backend |
| Storage | TW-02 | EGStore manifest/vectors/validator | filesystem, DB, object store, codecs |
| Runtime authority | TW-03 | runtime trace/vectors/validator | scheduler, service framework |
| History / merge | v0.3 | history schema/vectors | diff engine, merge implementation |
| Spatial regions | v0.4 | spatial schemas/vectors | Canvas renderer, spatial index |
| Native Math | Paper 03 + v0.5 | NCM schemas/vectors/validator | CAS/prover backend |
| Glyph / Symbol | Paper 04 + v0.6 | glyph schemas/vectors/validator | renderer/font/GPU backend |
| Agent contract | v0.7 | agent schemas/vectors/validator | model, provider, CLI, MCP stack |
| Interchange | v0.8 | adapter schemas/vectors/validator | parser/export libraries |
| Operational hardening | v0.9 | operational schemas/vectors/validator | telemetry/security toolchain |
| v1.0 handoff | v1.0 docs | handoff manifest/vectors/validator | local project structure |

---

## 3. What Is Canonical State

Canonical state 是可以透過 EGIR revision / workspace revision 形成可重現引用的 state。

不是 canonical state 的典型項目：

- viewport；
- cursor / selection；
- hover；
- drag preview；
- render mesh；
- R-tree；
- embedding index；
- CAS cache；
- compiled execution graph cache；
- telemetry buffer；
- model hidden state；
- MCP connection/session metadata。

任何 implementation 若想把這些項目升格 canonical，必須先建立新 profile / migration rationale，而不能只因為「保存起來方便」。

---

## 4. Authority Transitions

合法的 authority transition 必須顯式：

$$
Candidate\rightarrow Validate\rightarrow Authorize\rightarrow Commit.
$$

以下都不是合法 transition：

```text
looks connected -> relation
looks like ∂ -> derivative permission
AI said same concept -> identity merge
DOI/DID resolved -> local identity
file exists -> canonical object
renderer shows equal -> semantic equality
```

---

## 5. Projection Is Not Ontology

Markdown、LaTeX、MathML、SVG、PDF、HTML、Canvas pixels 都是 projection / adapter representation。

$$
ProjectionEquality
\not\Rightarrow IdentityEquality.
$$

同一 canonical object 可以有多個 projection；兩個不同 object 也可能投影成相同字串或像素。

---

## 6. Existing EveGlyph Editor

現有 `eveglyph-editor` 是重要 implementation input，但其 current filesystem / git / UI state 不自動具有 ASCS canonical authority。

漸進式 product migration 應使：

```text
Editor UI
  -> Runtime Command API
  -> EGCR transaction
  -> EGIR commit
  -> EGStore persistence
```

而不是讓 UI singleton 或 Markdown file path 定義 persistent identity。

---

## 7. Chat Memory Rule

本 package 完成後：

> 聊天紀錄只能協助理解歷史，不得作為缺少規格時的秘密 canonical source。

如果 handoff package 與聊天敘述衝突，以 pinned package 為準；若 package 自己內部矛盾，先停止實作並建立 explicit architecture issue，不自行猜一個版本。
