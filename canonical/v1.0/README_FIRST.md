# EveGlyph ASCS v1.0 — README FIRST

**Release:** `ascs/1.0`  
**Handoff contract:** `ascs-handoff/1.0`  
**Date:** 2026-08-25  
**Status:** Canonical Architecture & Local Implementation Handoff Freeze

---

## 1. 這一包是什麼

這不是另一份概念草稿，也不是要求你重新設計 EveGlyph。

這是一個 **可脫離聊天記憶使用的 canonical handoff package**。它把以下三條已完成工作鏈固定在同一個入口下：

$$
\text{Core Theory / Architecture}
+\text{Executable MVP Evidence}
+\text{v0.2--v0.9 Hardening Freezes}
\rightarrow
\text{ASCS v1.0 Handoff}
$$

本包的目的只有一個：

> 本地工程師或本地 AI 可以只靠這個 package、pin 住的 source archives 與 implementation input commits 開始正式工程化，而不必重建聊天上下文。

---

## 2. v1.0 的「1.0」代表什麼

`ascs/1.0` 是 **umbrella architecture / handoff stability**，不是把所有 component profile 強制改名成 `/1.0`。

因此以下 baseline 仍保留原 ID：

```text
egir/0.1
egir-cj/0.1
egstore/0.1
egcr/0.1
ncm/0.1
glyph/0.1
```

而已完成設計 freeze、但仍刻意保留 candidate 身分的 profile，例如：

```text
ncm/1.0-candidate.1
glyph/1.0-candidate.1
agent-principal/1.0-candidate.1
adapter-profile/1.0-candidate.1
```

**不得因 umbrella release 升到 v1.0 就無 migration 直接刪掉 `candidate` 字樣。**

若未來正式升成 stable component profile，必須依 v0.2 compatibility contract 做 explicit versioning / migration / conformance review。

---

## 3. 第一個 30 分鐘應該做什麼

1. 讀完本文件。
2. 讀 `CANONICAL_AUTHORITY_MAP.md`。
3. 讀 `NO_SILENT_CHANGE_REGISTER.md`。
4. 執行：

```bash
python machine/tests/test_validate_v10.py
python machine/tools/validate_v10.py --json
```

5. 確認 `source_archives/` 內 10 個 pinned ZIP 全部 hash / ZIP integrity PASS。
6. 解壓 `architecture-v0.1` 與 `mvp-01-v0.1` source archive。
7. 重跑 TW-01 / TW-02 / TW-03 reference validators 與 MVP 26 tests。
8. 再讀 `LOCAL_IMPLEMENTATION_HANDOFF.md` 與 `PRIORITIZED_IMPLEMENTATION_BACKLOG.md`。
9. **不要先重構 UI、不要先換資料格式、不要先把 candidate profile 改名。**

---

## 4. Canonical authority 順序

當文件、程式、聊天敘述彼此看起來衝突時，依序處理：

1. 對應 layer 的原始 normative freeze 文件；
2. 同 release archive 中的 schema / conformance vector / reference validator；
3. v1.0 的 authority / version / no-silent-change map；
4. MVP、Editor、adapter 或其他 implementation code；
5. 聊天內容、README 摘要與口頭印象。

也就是：

$$
\boxed{\text{Specification Authority}
\neq\text{Implementation Accident}}
$$

---

## 5. Source archives

| ID | Archive | Role | SHA-256 |
|---|---|---|---|
| `architecture-v0.1` | `EveGlyph_Addressable_Symbolic_Computational_Space_Series_v0.1_Architecture_Complete.zip` | core-theory-architecture | `19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778` |
| `mvp-01-v0.1` | `EveGlyph_Computational_Canvas_MVP_v0.1.zip` | executable-evidence | `f49a4f419f9b4539aac0721a1ad85f84151cec71bf3da68db22a197303b5cd3f` |
| `ascs-v0.2` | `EveGlyph_ASCS_v0.2_Contract_Hardening_Round_Complete.zip` | contract-hardening | `cb5b0333f8cb54c83d2a4348f39774294a3b6399b9e6b85a55f5ef7a6aadd096` |
| `ascs-v0.3` | `EveGlyph_ASCS_v0.3_Persistent_Editing_Round_Complete.zip` | history-merge | `8c3aa6f55ac35ee94b8e8e6846d8ece0543b52f6fe1fc8c90a2c4efb16acacfb` |
| `ascs-v0.4` | `EveGlyph_ASCS_v0.4_Spatial_Region_Round_Complete.zip` | spatial-region | `29dd5cb0d17f75a2dbc727315a4f341551f8223ead6c5605edd4a36e685adce7` |
| `ascs-v0.5` | `EveGlyph_ASCS_v0.5_Native_Math_Round_Complete.zip` | native-math-candidate | `16f499d1721191ebf11c11baada3440332e5ddbcafa59cc26c7aecc7fe0edebe` |
| `ascs-v0.6` | `EveGlyph_ASCS_v0.6_Glyph_Symbol_Round_Complete.zip` | glyph-symbol-candidate | `08ab324e5edf777a958f42ef18c70e24ccb0d0b680586cd14bbbf70a6e269dba` |
| `ascs-v0.7` | `EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip` | agentic-workspace | `ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c` |
| `ascs-v0.8` | `EveGlyph_ASCS_v0.8_Interchange_Round_Complete.zip` | interchange | `fb27a7c6d0c129d6486eca2d4483638f3dabc73f1b88e4980f104aa2ec802be2` |
| `ascs-v0.9` | `EveGlyph_ASCS_v0.9_Productization_Hardening_Round_Complete.zip` | operational-hardening | `7d81834c52694934a5e05012533824980cd242a028d862e400d7e0fa158b7376` |

這些 archive 是 v1.0 handoff 的 evidence chain。不要修改後仍沿用原 hash 或原 release 名稱。

---

## 6. Recommended implementation inputs

### EveGlyph Editor

```text
repository: kakon77777-commits/eveglyph-editor
branch: main
pinned commit: 55a2ad77f3131f717cf73992cc2550e4c3a864bb
```

用途：現有產品 UI、Markdown workflow、file bridge、diff review、agent integration 的 **implementation input**。

它不是 canonical semantic authority。

### UTF-8X

```text
repository: kakon77777-commits/utf-8x
branch: main
pinned commit: c4bfd2b48688c99053e062d149d41baf34d84930
```

用途：TW-02 之下的 optional storage / representation research input。

它不是 EGIR identity source，也不是 mandatory storage backend。

### Optional local inputs

`optional_inputs/` 另外附：

- GSC v1.13 strict-symbolic source archive；
- PSSA-BSAR Milestone 4 research source archive。

它們分別支援 glyph bridge 與 semantic-address research lineage，但都不是 ASCS v1.0 核心 ontology 的替代品。

---

## 7. 不要做 Big-Bang Rewrite

建議路線是：

$$
\text{Current Editor}
\rightarrow
\text{Canonical Core Service}
\rightarrow
\text{Adapter-backed Migration}
\rightarrow
\text{Product Replacement Where Useful}
$$

而不是：

$$
\text{Delete Current Editor}
\rightarrow
\text{Rewrite Everything}
$$

現有 Markdown editor、preview、file browser、diff UI、agent UI、encoding support 都可以先留著；先把 canonical truth 從 file/UI singleton 中抽出，建立 EGIR / transaction / authority boundary，再逐步讓現有表面改成 adapter。

---

## 8. v1.0 絕對核心

以下內容不能「因為工程方便」而偷偷改：

- persistent identity 不等於 content hash；
- object 不等於 revision；
- intrinsic content 不等於 Canvas placement；
- canonical state 不等於 session overlay / derived cache；
- candidate 不等於 authoritative relation；
- resolve 不等於 authorize；
- computed 不等於 verified / proved；
- legacy import 不取得 canonical authority；
- external reference 不自動變成本地 identity；
- unknown external effect 不自動重試；
- `egir-cj/0.1` 行為不在原 ID 下修改；
- profile meaning 不在相同 ID 下修改。

完整表見 `NO_SILENT_CHANGE_REGISTER.md`。

---

## 9. 下一步

本 package 完成後，研究／規格階段到此停止。

接下來的工作是 **implementation**，而不是繼續增加 v1.1、v1.2 概念文件。

第一個 implementation milestone 應該是：

> 在新的工程 branch / worktree 中，讓現有 Editor 可以讀取並操作一個通過 TW-01 / v1.0 validators 的 canonical EGIR workspace，同時保持現有使用者表面可用。

具體順序見 `PRIORITIZED_IMPLEMENTATION_BACKLOG.md`。
