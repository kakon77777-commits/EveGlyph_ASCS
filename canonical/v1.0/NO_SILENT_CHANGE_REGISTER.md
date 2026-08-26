# No-Silent-Change Register — ASCS v1.0

## 1. Purpose

本文件是本地實作最重要的 change-control guard。

如果改動落在「禁止 silent change」欄位，工程師必須至少做其中一項：

1. 新 profile / schema version；
2. 新 predicate/operator/capability ID；
3. 新 canonicalization version；
4. 顯式 migration；
5. 若無安全路徑，直接判定 incompatible。

---

## 2. MUST NOT Silent Change

| Contract | Forbidden silent change | Required response |
|---|---|---|
| Persistent ID | 改成 content hash / path / DB row ID | new identity scheme + migration |
| Revision | 允許 immutable revision 被覆寫 | new revision semantics |
| Content hash | 修改 intrinsic preimage | new hash domain/profile |
| `egir-cj/0.1` | 改 key ordering / number lowering / Unicode treatment | new canonicalization ID |
| Workspace revision | 把 viewport/cache 加進 canonical hash | new workspace profile |
| Address types | 把 semantic/spatial/physical 混成單一 locator | new address profile |
| Candidate relation | 讓 candidate 直接進 execution | authority-profile change |
| Resolve | Resolve success 自動授權 | security/authority profile change |
| History | Undo 直接抹除 committed history | history profile change |
| Merge | 全域 last-write-wins 取代 domain merge | merge profile change |
| Spatial | screen/view coordinates 變 canonical world coordinates | spatial profile change |
| Reparent | 混淆 KeepWorld / KeepLocal | spatial profile change |
| Math | LaTeX 字串重新成為唯一 canonical math source | NCM profile change |
| Evidence | computed 自動升 proved | evidence profile change |
| Glyph | Unicode code point / font GlyphID 成為 global identity | glyph profile change |
| Glyph behavior | 圖形外觀自動取得 execution permission | binding/authority change |
| Agent identity | model/provider/session ID 取代 principal | agent profile change |
| Direct mode | direct 可 bypass validation/capability/base revision | review/authority change |
| Legacy import | import artifact 自稱 canonical authority | adapter profile change |
| External reference | DOI/DID/SWHID resolve 後自動變 local ID | federation profile change |
| External effect | unknown outcome 自動 retry | operational policy change |
| Resource hard limit | 超限後 silent degrade 到不同語義 | budget profile change |
| Release rollback | immutable revision rebind 到舊 bytes | forbidden; create new pointer/manifest |
| Telemetry | telemetry 成 canonical truth | observability profile change |
| Profile ID | 相同 ID 重新定義任何以上語義 | forbidden |

---

## 3. Allowed Implementation Changes

以下通常可替換，只要 conformance observable behavior 不變：

- UI framework；
- Canvas rendering library；
- GPU / CPU renderer；
- in-memory data structure；
- SQLite/PostgreSQL/object-store backend；
- Brotli/Zstd/identity/UTF-8X physical codec；
- R-tree/B-tree/LSM/vector index；
- CAS/prover library；
- AI model/provider/CLI；
- MCP/HTTP/CLI adapter；
- telemetry backend；
- local process supervisor；
- packaging/build system；
- cache eviction policy；
- prefetch strategy。

這些修改仍要通過 regression tests，但不必為純 implementation detail 製造 canonical migration。

---

## 4. Change Decision Procedure

對任何 proposed change：

```text
1. Does it change canonical bytes for the same abstract state?
2. Does it change identity/revision/hash meaning?
3. Does it change authority or capability meaning?
4. Does it change equality/evidence semantics?
5. Does it change external effect/retry semantics?
```

任一答案為 yes，就不能當普通 refactor。

建立 ADR / migration issue，指出 affected profile、old/new vectors、migration fidelity、rollback path，再動 implementation。
