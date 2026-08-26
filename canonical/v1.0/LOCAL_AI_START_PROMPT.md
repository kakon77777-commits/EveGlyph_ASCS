# Local AI Start Prompt — EveGlyph ASCS v1.0

將以下內容作為本地 AI / workbench 的初始提示詞。它故意要求**先驗證、後實作**。

---

你正在接手 **EveGlyph ASCS v1.0** 的正式工程化。

## Canonical input

以這個 handoff package 為 canonical handoff source。

不要從聊天記憶重新建構架構，不要自行把 candidate profile 升成 stable，不要重新定義 object identity / hash / authority boundary。

先依序讀：

1. `README_FIRST.md`
2. `CANONICAL_AUTHORITY_MAP.md`
3. `VERSION_PROFILE_MATRIX.md`
4. `NO_SILENT_CHANGE_REGISTER.md`
5. `V1.0_CANONICAL_ARCHITECTURE_AND_HANDOFF_FREEZE.md`
6. `LOCAL_IMPLEMENTATION_HANDOFF.md`
7. `PRIORITIZED_IMPLEMENTATION_BACKLOG.md`
8. `VALIDATION_BENCHMARK_RELEASE_GATES.md`
9. `COMPATIBILITY_TEST_MATRIX.md`
10. `machine/canonical_handoff_manifest_v1.0.json`

然後驗證 `source_archives/` 的 SHA-256 與 ZIP integrity。

## Required baseline reproduction

在修改產品 code 前：

- 重跑 `machine/tests/test_validate_v10.py`；
- 重跑 `machine/tools/validate_v10.py --json`；
- 解壓 v0.1 Architecture 與 MVP-01；
- 重跑 TW-01/TW-02/TW-03 validators；
- 重跑 MVP 26 tests；
- 重跑 v0.5–v0.9 validators；
- 重新驗 v0.3/v0.4 schema/vector evidence。

將 reproduction 結果寫入產品 repo，而不是只回報在聊天中。

## Product baseline

優先從：

```text
kakon77777-commits/eveglyph-editor
main @ 55a2ad77f3131f717cf73992cc2550e4c3a864bb
```

建立 isolated branch/worktree。

UTF-8X 只作 optional storage backend input：

```text
kakon77777-commits/utf-8x
main @ c4bfd2b48688c99053e062d149d41baf34d84930
```

## First implementation goal

不要先重寫 UI。

先完成 **Canonical Runtime Bridge**：

- load EGIR；
- recompute TW-01 hashes；
- move/edit/clone/stale conflict；
- persist/reopen EGStore；
- existing Editor surface 可以透過 runtime command 操作 canonical workspace；
- UI session state 不進 canonical hash；
- all baseline validators remain green。

完成這一步後，再按 `PRIORITIZED_IMPLEMENTATION_BACKLOG.md` 推進 P2、P3……。

## Hard invariants

維持：

```text
MODEL != AGENT PRINCIPAL
OBJECT != REVISION
IDENTITY != CONTENT HASH
INTRINSIC != PLACEMENT
CANDIDATE != AUTHORITATIVE
RESOLVE != AUTHORIZE
LAYOUT GRAPH != EXECUTION GRAPH
COMPUTED != VERIFIED != PROVED
LEGACY FORMAT != ONTOLOGY
EXTERNAL REFERENCE != LOCAL IDENTITY
CANONICAL STATE != SESSION/CACHE
```

`direct` agent mode 也不得 bypass base revision、validation、capability 或 policy。

若實作需求看起來必須破壞任何 hard invariant，停止並建立 architecture/migration issue，不自行改規格。

## Engineering style

- incremental replacement；
- TDD / conformance-first；
- deterministic validators；
- explicit migration；
- fail closed on authority/security ambiguity；
- preserve provenance；
- evidence before completion claims。

現在先完成 baseline reproduction，不要直接開始大規模 refactor。
