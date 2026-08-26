# MVP-01 → Product Migration Map

## 1. Migration Strategy

MVP-01 是 executable evidence，不是 production architecture 的完整實作。

推薦：**strangler / adapter migration**。

$$
CurrentSurface\rightarrow CanonicalCore\rightarrow ReplaceInternalsIncrementally.
$$

---

## 2. MVP Module Map

| MVP v0.1 artifact | Proven claim | Product target | Action |
|---|---|---|---|
| `canonical.py` | deterministic EGIR hash/core | canonical package/service | preserve semantics, rewrite quality allowed |
| `runtime.py` | transaction + stale conflict | EGCR command service | expand, do not bypass |
| `storage.py` | identity/Brotli repackage | EGStore provider layer | generalize providers |
| `math_runtime.py` | native derivative without LaTeX reparse | math backend interface | replace with richer NCM/CAS adapter |
| candidate tests | candidate/promotion boundary | relation authority service | preserve boundary |
| glyph tests | glyph needs explicit operator binding | glyph/binding registry | expand v0.6 profiles |
| HTTP app/server | command surface proof | product IPC/service API | replace transport freely |
| vanilla Canvas UI | live drag/pan/zoom proof | Editor/Canvas product UI | replace freely |
| demo E2E | cross-layer vertical slice | CI acceptance suite | preserve as golden scenario |

---

## 3. Existing EveGlyph Editor Map

Current Editor capabilities that SHOULD be retained as product surface during migration:

- Markdown editing；
- live preview；
- encoding-aware file I/O；
- file tree / tabs；
- diff review；
- agent activity/review UI；
- `.eveglyph/` workspace support；
- World Studio / specialized preview surfaces where still useful；
- MCP/remote adapter UX where security policy permits。

Capabilities that MUST be reclassified behind ASCS contracts:

- file path -> physical locator, not persistent identity；
- `S` singleton -> session/UI facade, not canonical state；
- git diff -> legacy file-agent review adapter, not canonical revision ontology；
- Markdown/LaTeX -> import/export/projection adapters；
- `.eveglyph/context-pack.json` -> v0.7 context adapter input, not prompt-as-canonical-state；
- local agent mode -> Agent Principal/Run/Proposal/Capability pipeline；
- monitor JSONL -> telemetry backend, not provenance authority。

---

## 4. Recommended Product Boundary

```text
EveGlyph UI / Editor
        |
        v
Session Facade / View Model
        |
        v
ASCS Runtime Command API
        |
  +-----+--------------------+
  |                          |
  v                          v
EGIR Core                 Derived Services
  |                      spatial index / render / search
  v
EGStore Provider
  |
  +-- local files / DB / object store / codecs
```

Agents、format adapters、CAS、GSC、MCP 都透過明確 ports 接到 Runtime Command API，不直接改 storage bytes。

---

## 5. Migration Phases

### Phase A — Canonical Core In Parallel

先不改 UI。新增 canonical core，讓一個 hidden/advanced workspace 可以 round-trip TW-01 minimal fixture 與 MVP final fixture。

### Phase B — Command Boundary

把 Canvas move/edit/clone、relation promotion、math execution 全部改走 runtime transaction。

### Phase C — Editor Adapter

Markdown file 編輯先繼續存在，但 save 變成 adapter import/proposal/commit path；不要一次要求所有文件原生 EGIR authoring。

### Phase D — Persistent History / Spatial Regions

加入 v0.3/v0.4，讓 workspace 具備真正 commit DAG、branch/merge、nested regions。

### Phase E — Native Math / Glyph

逐步讓 math/glyph object 使用 candidate v1 profiles；舊 `ncm/0.1` / `glyph/0.1` 同時可讀。

### Phase F — Agent Contract

現有 CLI agent 包成 v0.7 adapter。保留 diff review UX，但 canonical commit authority 改由 runtime 控制。

### Phase G — Interchange / Operations

最後補完整 format adapter matrix、external references、resource/security/recovery/release gates。

---

## 6. Migration Success Condition

Migration 完成不是「舊 code 全刪掉」，而是：

$$
\boxed{
AllCanonicalMutation\rightarrow ASCSRuntimeTransaction
}
$$

且所有 legacy / external surface 都只是 adapter，而不是權威捷徑。
