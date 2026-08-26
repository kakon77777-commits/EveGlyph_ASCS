# TW-03｜EveGlyph Computational Canvas Runtime Architecture v0.1

**English Title:** EveGlyph Computational Canvas Runtime Architecture v0.1: Transactions, Spatial Parsing, Resolution, Native Execution, Agent Boundaries, Capabilities, Recovery, and Diagnostics

**作者：** Neo.K  
**機構：** EveMissLab / 一言諾科技有限公司  
**版本：** v0.1  
**日期：** 2026-08-24  
**文件類型：** 技術白皮書 / Normative Runtime Architecture Specification  
**系列定位：** EveGlyph Addressable Symbolic Computational Space Series — TW-03  
**前置規格：** Paper 00–05 ASCS v0.1 Core Theory Freeze；TW-01 EveGlyph Symbol IR Specification v0.1；TW-02 UTF-8 / UTF-8X Compatibility & Storage Architecture v0.1

---

## Canonical Source Note

本文件以 UTF-8 Markdown 保存正式規格原稿。數學 source 僅使用 `$...$` 與 `$$...$$` 作為 canonical delimiter。

TW-01 已凍結 EGIR 的 canonical object / revision / relation / address / event semantics；TW-02 已凍結 EGStore 的 physical-storage / chunk / codec / recovery semantics。TW-03 不得重新定義這兩層。TW-03 只回答：**當一個 workspace 已經有可驗證的 EGIR state，並且能由 EGStore 載入與保存後，live runtime 要如何安全地讓人類、AI、Canvas、resolver、compiler 與 execution backend 一起操作它。**

因此：

$$
\text{Runtime State}
\neq
\text{Canonical State}
\neq
\text{UI State}
\neq
\text{External World State}.
$$

本白皮書中的 MUST / MUST NOT / SHOULD / SHOULD NOT / MAY 僅在全大寫時具有規範性。

---

# 摘要

前六篇 ASCS 論文與 TW-01、TW-02 已經把 EveGlyph 未來架構的「世界是什麼」與「世界如何保存」拆開：persistent object 與 revision 分離；數學不再以 LaTeX 字串作唯一 ontology；glyph、geometry、semantics 與 behavior 分離；空間配置透過 transient / candidate / explicit authority boundary 才能成為 syntax；identity/content/semantic/spatial/physical/version address 分層；EGIR 提供可驗證 object contract，而 EGStore 則允許 UTF-8 JSON、chunk、compression、UTF-8X 等 physical representation 在不改變上層 identity 的前提下自由替換。

剩下的關鍵問題是 live runtime。若 runtime 仍把 UI singleton、DOM、screen coordinates、local cache、agent CLI、filesystem diff 或某一次模型輸出當成真正世界狀態，那麼前述分層會在執行階段重新崩塌。反過來，如果所有操作都必須重新序列化整個 workspace 才能進行，系統又無法具備低延遲 Canvas、增量解析、agent collaboration 與 native computation 所需的互動性。

本文提出 **EveGlyph Computational Canvas Runtime, EGCR**。EGCR 的核心不是一個巨大 process，而是一組具有明確 authority boundary 的 runtime services。本文首先把 live state 分成四類：Canonical State、Session Overlay、Derived Cache 與 External Effects。只有 Canonical State 可以透過 EGIR revision / workspace revision 被持久引用；viewport、selection、drag preview、render mesh、spatial index、semantic embedding、compiled execution graph 等均屬可重建的 session/derived state；file process、network request、remote API、shell command 等則屬不可由 workspace rollback 自動撤銷的 external effects。

所有 canonical mutation 必須經過帶有 `base_workspace_revision` 的 command transaction：

$$
\text{Command}
\rightarrow
\text{Resolve}
\rightarrow
\text{Validate}
\rightarrow
\text{Authorize}
\rightarrow
\text{Plan}
\rightarrow
\text{Execute/Derive}
\rightarrow
\text{Commit}
\rightarrow
\text{Persist}
\rightarrow
\text{Publish}.
$$

若 base revision 已過期，runtime 必須回 `Conflict`、建立 branch、rebase 或 merge，而不能 silent last-write-wins。AI agent 預設只能產生 proposal/candidate；candidate 必須經 deterministic validator 與 policy 才能 promotion。Native Math execution 直接消費 NCM object；Custom Glyph 綁定的是 semantic operator identity，而不是 image bytes；Spatial parser 只從 placement snapshot 產生 candidate relation，只有 explicit committed relation 才能進 execution compiler。

本文亦定義 resolver service、Canvas scene/materialization、incremental spatial parsing、execution-graph compilation、capability/permission model、agent bridge、legacy filesystem/git-diff adapter、MCP/CLI/HTTP adapter boundary、offline-first lifecycle、cache invalidation、branch/merge、crash recovery、diagnostics 與 Explainability APIs。MCP 被定位成可替換的 edge protocol，而不是 runtime canonical session；此設計特別避免把外部 protocol 的 session model 綁成 EveGlyph ontology。

本文件附帶一個 deterministic reference runtime conformance harness。它不是 MVP，而是一個純狀態機，用 TW-01 minimal workspace 真正執行 resolve、move、stale-write conflict、AI candidate、candidate promotion、native derivative execution、semantic edit、old-revision resolution 與 capability denial。Reference validator 同時證明：pure move 不改 object revision 與 execution graph、AI proposal 不改 workspace revision、native execution 產生新 result identity 與 provenance、restricted runtime 無法因「已知 object address」而取得 execution capability、最終 bundle 仍通過 TW-01 hash semantics，且 serialize / rehydrate 後 runtime identity 保持一致。

TW-03 完成後，ASCS v0.1 的理論、IR、storage 與 runtime contract 即形成完整 implementation anchor；下一步 MVP-01 不再需要重新討論架構，而只需實作本文定義的最小 vertical slice。

**關鍵詞：** EveGlyph、Computational Canvas、Runtime Transaction、EGIR、EGStore、Spatial Runtime、Native Math Execution、Agent Runtime、Capability Security、MCP Adapter、Local-first、Provenance、Recovery、ExplainExecution

---

# Abstract

The EveGlyph Addressable Symbolic Computational Space separates canonical object semantics from storage representation. The remaining challenge is the live runtime: how can users, agents, spatial parsers, resolvers, and computation backends interact with a workspace without allowing transient UI state, caches, protocol sessions, or model outputs to become hidden sources of canonical truth?

This whitepaper specifies the **EveGlyph Computational Canvas Runtime (EGCR)**. Runtime state is divided into Canonical State, Session Overlay, Derived Cache, and External Effects. Only canonical mutations are committed through version-aware transactions carrying a base workspace revision. Stale mutations must conflict, branch, rebase, or merge; they may not silently overwrite current state. Spatial parsing produces candidates before authority promotion, AI agent outputs remain proposals until validated and authorized, and execution graphs are derived from committed relations rather than screen geometry.

The runtime directly executes Native Computational Mathematics objects, supports glyph-to-operator semantic bindings, uses typed resolver results, and applies explicit capability checks to mutation and execution. The architecture treats filesystem agents and Model Context Protocol as replaceable adapters rather than canonical state authorities. It also specifies local-first loading, incremental materialization, cache invalidation, crash recovery, diagnostics, and explainability traces.

A deterministic reference state-machine harness accompanies this whitepaper to validate the core transactional and authority semantics before the full MVP is implemented.

---

# 1. TW-03 的邊界

## 1.1 本文件負責什麼

TW-03 MUST 定義：

1. runtime state 分類；
2. command / transaction contract；
3. optimistic concurrency；
4. branch / merge boundary；
5. Canvas live materialization；
6. spatial parsing / candidate promotion；
7. resolver service；
8. native computation execution；
9. result/provenance commit；
10. capability / permission；
11. agent bridge；
12. external adapter；
13. local-first lifecycle；
14. cache / index invalidation；
15. recovery / replay；
16. observability / explainability；
17. MVP runtime vertical slice。

## 1.2 本文件不負責什麼

TW-03 不重新定義：

- EGIR persistent ID / revision hash；
- EGIR JSON schema；
- EGIR-CJ canonicalization；
- EGStore chunk content identity；
- UTF-8 / UTF-8X codec bitstream；
- 最終 Canvas renderer；
- 最終 CAS / theorem prover；
- 全球 distributed consensus；
- 特定 CRDT algorithm；
- 特定 MCP SDK；
- 特定 WebAssembly engine；
- 最終 plugin marketplace / governance。

這些可以替換，只要不破壞本文 authority invariants。

---

# 2. 現有 EveGlyph v0.5 的漸進式遷移定位

目前 EveGlyph Editor 已有可用的 Markdown workspace、AI provider、local CLI agent、git snapshot/diff review、World IR、MCP、diagnostics 與 encoding-aware file bridge。其 frontend 使用一個 mutable `S` singleton 保存 UI/workspace session state；local agent 目前則直接在 workspace filesystem 工作，執行前做 git snapshot，完成後由使用者 review diff。

TW-03 不要求一次全部重寫。

## 2.1 `S` 轉為 UI Session Facade

目前 `S` 可以保留，但其角色應改為：

$$
S_{UI}=Projection(RuntimeSession).
$$

也就是它可以保存：

- active tab；
- selected object；
- viewport；
- local preferences；
- current panel；
- transient agent status。

但 MUST NOT 成為 object identity、revision、relation authority 或 execution provenance 的唯一來源。

## 2.2 現有 Git Diff Agent 轉為 Compatibility Adapter

現有流程：

$$
Filesystem
\rightarrow
AgentEdit
\rightarrow
GitDiff
\rightarrow
Accept/Reject.
$$

未來 transitional flow：

$$
FilesystemDiff
\rightarrow
ImportCandidate
\rightarrow
EGIRDiff
\rightarrow
Validate
\rightarrow
RuntimeTransaction
\rightarrow
Commit.
$$

因此現有 agent investment 可以保留，但 filesystem 不再永遠是 canonical ontology。

---

# 3. Runtime 四類狀態

這是 TW-03 最重要的 state boundary。

## 3.1 Canonical State

Canonical State 記為：

$$
C_t=(W_t,O,R,H,E).
$$

至少包括：

- TW-01 workspace revision；
- object records；
- immutable revision records；
- committed relation revisions；
- placements；
- event/provenance records；
- committed policy / configuration objects；
- committed execution results。

只有這一層可被 long-term citation 與 cross-session identity resolution 當作 authoritative state。

## 3.2 Session Overlay

$$
S_t=(viewport,selection,hover,gesture,openPanels,draftInput,localUndoPreview,\ldots).
$$

Session overlay 可以頻繁改變，不要求每次生成 workspace revision。

例如：

$$
Zoom(1.0\rightarrow2.0)
$$

MUST NOT 自動導致：

$$
W_t\rightarrow W_{t+1}.
$$

## 3.3 Derived Cache

$$
D_t=f(C_t,RuntimeProfile).
$$

包括：

- spatial R-tree / quadtree；
- semantic index / embedding；
- render mesh；
- syntax parse cache；
- execution graph；
- dependency index；
- resolved alias cache；
- semantic zoom summaries；
- prefetch plan。

Derived cache MUST 可刪除並重建。

## 3.4 External Effects

$$
X_t=ExternalWorldInteractions.
$$

例如：

- shell process；
- filesystem outside EGStore；
- network request；
- email/API call；
- remote database mutation；
- hardware action。

Canonical rollback：

$$
Rollback(C_{t+1}\rightarrow C_t)
$$

MUST NOT 被宣稱自動等同：

$$
Rollback(X_{t+1}\rightarrow X_t).
$$

外部副作用必須另有 effect/provenance policy。

---

# 4. Runtime Layer Model

EGCR 建議分為九個主要 runtime services：

```text
UI / Canvas / Editor / Agent Clients
                |
        Adapter & Session Layer
                |
      Command / Transaction Gateway
                |
  +-------------+--------------+
  |                            |
Resolver                    Policy/Capability
  |                            |
  +-------------+--------------+
                |
         Canonical State Core
                |
   +------------+-------------+
   |            |             |
Spatial     Execution      Provenance
Engine      Compiler       / Diagnostics
   |            |             |
   +------------+-------------+
                |
            EGStore
```

各層 MUST 可以被單獨測試。

---

# 5. Runtime Session

Session object：

$$
\mathcal S=
(sessionID,workspaceRevision,overlay,caches,capabilities,activeTasks).
$$

Session ID 是 runtime locator，不是 workspace persistent identity。

因此：

$$
SessionID
\neq
WorkspaceID.
$$

同一 workspace 可以同時有多 session；session 消失也不代表 workspace 消失。

---

# 6. Startup / Hydration Pipeline

標準 startup：

$$
EGStore
\rightarrow
ManifestVerify
\rightarrow
RootReconstruct
\rightarrow
TW01Validate
\rightarrow
HydrateCanonicalState
\rightarrow
BuildDerivedIndexes
\rightarrow
OpenSession.
$$

## 6.1 Fail-closed canonical loading

若 storage hash 或 EGIR canonical validation 失敗，runtime MUST NOT 用 AI 猜測修復後直接宣告 workspace 正常載入。

可進入：

$$
DegradedRecoveryMode.
$$

## 6.2 Derived index rebuild

derived index corruption 不應使 canonical workspace identity 失效。

若：

$$
IndexInvalid,
$$

runtime SHOULD：

$$
Discard(Index)
\rightarrow
Rebuild(CanonicalState).
$$

---

# 7. Command Envelope

所有會改 canonical state 的操作 MUST 轉為 Runtime Command。

抽象 command：

$$
Q=(id,type,actor,base,payload,preconditions,effectClass,metadata).
$$

最小 JSON surface 可以是：

```json
{
  "command_id": "urn:uuid:...",
  "type": "move",
  "actor": {"type": "human", "id": "..."},
  "base_workspace_revision": "wrev:sha256:...",
  "payload": {},
  "preconditions": [],
  "requested_effect_class": "canonical-only"
}
```

Read-only resolution command MAY 不提供 base revision，但其 resolution result MUST 記錄實際使用的 workspace snapshot / resolver context，若該資訊會影響結果。

---

# 8. Transaction Pipeline

Canonical mutation MUST 經過：

$$
Q
\xrightarrow{Resolve}
Q_r
\xrightarrow{Validate}
Q_v
\xrightarrow{Authorize}
Q_a
\xrightarrow{Plan}
P
\xrightarrow{Execute/Derive}
\Delta
\xrightarrow{Commit}
C_{t+1}
\xrightarrow{Persist}
Store_{t+1}.
$$

## 8.1 Resolve

解析 object/revision/semantic/spatial refs。

## 8.2 Validate

檢查 schema、type、domain、preconditions、spatial grammar、operator signature、resource bounds。

## 8.3 Authorize

檢查 capability，不能由 resolver success 取代。

## 8.4 Plan

建立 deterministic mutation / execution plan。

## 8.5 Execute / Derive

pure computation 可先產生 deterministic derived result；external effect 則必須依 effect policy。

## 8.6 Commit

產生 object revision、relation revision、event、workspace revision。

## 8.7 Persist

使用 TW-02 durability profile 將新 canonical state durable write。

## 8.8 Publish

最後更新 derived indexes、UI subscription 與 agent observers。

---

# 9. Optimistic Concurrency

任何 canonical write command MUST 指定：

$$
base=W_b.
$$

若目前：

$$
W_{current}\neq W_b,
$$

runtime MUST NOT silent overwrite。

合法結果：

- `Conflict`；
- `BranchCreated`；
- `RebaseRequired`；
- `MergeRequired`。

預設 MVP 採最簡單策略：

$$
StaleWrite\rightarrow Conflict.
$$

---

# 10. Branch / Merge

Paper 01 已允許 revision DAG。Runtime MUST 保留：

$$
v_0\rightarrow v_a,
$$

$$
v_0\rightarrow v_b.
$$

merge：

$$
Merge(v_a,v_b,policy)\rightarrow v_m.
$$

TW-03 不規定所有 object kind 共用一種 merge algorithm。

建議：

- text：text/AST-aware merge；
- math：semantic-tree merge；
- placement：spatial merge policy；
- relation：typed-edge merge；
- glyph：part/geometry merge；
- unknown kind：explicit conflict。

---

# 11. Resolver Service

Resolver 是獨立 service：

$$
Resolve(A,Context,Policy)
\rightarrow
ResolutionResult.
$$

它至少處理：

- identity；
- version；
- content；
- semantic；
- spatial；
- physical；
- alias；
- subobject；
- external adapter refs。

Resolver MUST 回 typed result：

- `Resolved`；
- `Multiple`；
- `Unresolved`；
- `Tombstoned`；
- `Unavailable`；
- `Unauthorized`；
- `Invalid`；
- `Stale`。

## 11.1 ExplainResolution

Runtime SHOULD 提供：

$$
ExplainResolution(ref)
\rightarrow
(trace,namespace,policy,evidence,snapshot).
$$

AI semantic match MUST 顯示 candidate evidence，而不能直接偽裝成 persistent ID lookup。

---

# 12. Canvas Materialization

Canonical Canvas state 由：

$$
P_t=Placements(W_t)
$$

建立 live scene：

$$
Scene_t=Materialize(P_t,ObjectHeads,ProjectionProfile).
$$

Scene graph 是 derived state，不是 canonical identity。

## 12.1 Viewport

$$
View_t=(camera,zoom,visibleRegion).
$$

Viewport 只決定 materialization/prefetch，不改 object identity。

## 12.2 Large workspace

Runtime SHOULD 支援 region/tile-aware lazy materialization：

$$
LoadVisible(V_t)
\subset
LoadAll(W_t).
$$

但任何 lazy omission 必須只是「尚未 materialize」，不能被解讀成 object 不存在。

---

# 13. Spatial Index

Spatial index：

$$
I_s=f(P_t).
$$

可以是：

- R-tree；
- quadtree；
- BVH；
- spatial hash；
- tile map。

它 MUST 可刪除重建，且不同 index packing 不能改 spatial semantics。

---

# 14. Gesture / Transient Transaction

Pointer drag：

$$
BeginGesture
\rightarrow
Update^{*}
\rightarrow
EndGesture.
$$

`Update` 只改 Session Overlay。

`EndGesture` 才可以產生：

$$
MoveCommand(base=W_t).
$$

這避免每一個 pointer frame 都產生 workspace revision。

---

# 15. Spatial Parse Runtime

對 committed / transaction snapshot：

$$
S_p=Snapshot(P_t,RegionProfile,GrammarVersion).
$$

parser：

$$
Parse(S_p)
\rightarrow
Candidates.
$$

Candidates 存在 candidate ledger，不得直接進 committed relations。

---

# 16. Candidate Ledger

Candidate ledger 可以 persistent，但不屬 authoritative workspace relation heads。

Candidate state：

$$
K=(candidateID,type,payload,source,confidence,createdAt).
$$

候選可以來自：

- spatial parser；
- AI agent；
- importer；
- recognizer；
- semantic resolver；
- conflict resolver suggestion。

Promotion：

$$
Promote(K,Authority)
\rightarrow
CommittedRevision.
$$

Promotion MUST 產生 provenance event。

---

# 17. Layout Graph 與 Execution Graph

Layout graph：

$$
G_L=(V,E_L).
$$

Execution graph：

$$
G_X=Compile(W_t,OperatorRegistry,ExecutionProfile).
$$

預設：

$$
G_L\neq G_X.
$$

Pure move 若沒有 committed structural change，MUST 滿足：

$$
Hash(G_X)_{before}=Hash(G_X)_{after}.
$$

附帶 reference harness 實際驗證此條件。

---

# 18. Execution Compiler

Compiler 只消費：

- explicit committed relation；
- committed operator binding；
- current object revisions；
- declared execution profile；
- validated scopes/policies。

它不得直接消費：

- hover；
- transient proximity；
- uncommitted AI suggestion；
- viewport；
- raw renderer pixels。

Compiler output 是 derived execution IR，可 cache：

$$
G_X=f(C_t).
$$

---

# 19. Execution Graph Cache

Execution graph cache key SHOULD 至少依賴：

$$
K_X=
Hash(
relevantRevisionIDs,
relationRevisionIDs,
operatorRegistryVersion,
executionProfile
).
$$

因此純 placement move 可以不 invalidate math graph；semantic relation/operator change 則必須 invalidate。

---

# 20. Native Math Runtime

TW-03 Runtime MUST 能直接執行 Paper 03 / TW-01 `ncm/0.1` object。

標準 contract：

$$
Eval(M,Context,Policy)
\rightarrow
(Result,DerivedState,Provenance,Status).
$$

MVP core 至少支援：

- symbol；
- integer/rational；
- add；
- multiply；
- power；
- derivative of a minimal polynomial subset。

Canonical path MUST NOT 是：

$$
NCM
\rightarrow
LaTeX
\rightarrow
Parser
\rightarrow
Execution.
$$

---

# 21. Computed Result Identity

Pure computation 通常產生新 result object：

$$
O_r=Eval(O_i).
$$

預設：

$$
A^{id}(O_r)\neq A^{id}(O_i).
$$

並以 event / derivedFrom provenance 連結。

若 operation 明確是 edit/rewrite existing object，才沿同 persistent lineage 產生新 revision。

---

# 22. Evidence Class

Runtime execution provenance SHOULD 保存：

$$
EvidenceClass
\in
\{computed,verified,proved,assumed,heuristic,external\}.
$$

`computed` 不得被 UI 偷換成 `proved`。

---

# 23. Glyph Runtime

Paper 04 glyph object 的：

- geometry；
- topology；
- part graph；
- semantic bindings；
- renderer profile；
- behavior binding

必須保持分層。

## 23.1 Visual binding

$$
represents(g,operator).
$$

Runtime 執行的是 operator semantic binding，不是 glyph pixel buffer。

## 23.2 Imported behavior

Imported glyph / composite MUST 預設：

$$
BehaviorEnabled=false.
$$

直到 capability/policy 明確授權。

---

# 24. Operator Registry

Runtime SHOULD 有 versioned registry：

$$
Registry_{op}:
SemanticOperatorID
\rightarrow
ImplementationSet.
$$

Implementation record 至少包含：

- operator semantic ID；
- implementation ID/version；
- accepted types；
- effect class；
- determinism class；
- capabilities；
- resource limits；
- provenance/evidence behavior。

同一 semantic operator 可以有多個 backend，但 backend selection 必須進 execution provenance。

---

# 25. Determinism Classes

TW-03 定義：

## `pure-deterministic`

相同 canonical input + backend/version + policy 應得到相同 canonical output。

## `seeded-deterministic`

需要 explicit seed：

$$
Output=f(Input,Seed).
$$

Seed MUST 進 provenance。

## `nondeterministic-observed`

例如 wall clock / hardware / external system。Result MUST 標為 observation，不可用 deterministic hash claim 假裝重現。

## `external-effecting`

會改變 workspace 外部世界，必須額外 capability 與 effect log。

---

# 26. External Effects

對外部副作用：

$$
Intent
\rightarrow
Authorize
\rightarrow
EffectAttempt
\rightarrow
ObservedOutcome
\rightarrow
ProvenanceCommit.
$$

Runtime MUST 不宣稱 workspace rollback 能撤銷已送出的 email、已呼叫的 remote API 或已修改的外部 service。

可使用 typed status：

- `EffectSucceeded`；
- `EffectFailed`；
- `EffectUnknown`；
- `EffectCancelledBeforeStart`。

---

# 27. Capability Model

知道 address 不等於可以執行。

$$
Resolve(A)=Resolved
$$

不推出：

$$
CanExecute(A).
$$

TW-03 v0.1 建議 capability namespace：

- `workspace.read`；
- `workspace.write`；
- `object.write`；
- `candidate.write`；
- `relation.promote`；
- `runtime.execute`；
- `external.file.read`；
- `external.file.write`；
- `external.process.spawn`；
- `external.network`；
- `agent.propose`；
- `agent.commit`。

MVP 不需要實作完整 capability-token cryptography，但 MUST 實際 enforcement。

---

# 28. Capability Scope

Capability SHOULD 可被限制在：

$$
Capability=(action,workspace,objectSet,region,tool,effectClass,expiry,policy).
$$

例如 AI 可以：

$$
agent.propose
$$

但沒有：

$$
relation.promote.
$$

這使「可建議」與「可改世界」分離。

---

# 29. Sandbox Profiles

Runtime backend MAY 使用：

- OS process sandbox；
- container；
- WebAssembly sandbox；
- WASI capability-oriented environment；
- remote isolated worker。

WebAssembly 本身提供 sandboxed module execution primitives，但真正可存取的 files/network/clocks 等仍受 embedder/WASI policy 控制。因此 TW-03 不把「Wasm」當成自動安全保證；它只是可用 sandbox backend之一。

---

# 30. Agent Runtime Boundary

AI agent 不直接等於 runtime authority。

預設：

$$
AgentOutput
\rightarrow
Proposal/Candidate.
$$

只有 policy 明確授權，agent 才可提出 canonical transaction；即使如此，runtime 仍 MUST 做：

- base revision check；
- schema/type validation；
- capability check；
- hash recomputation；
- effect classification。

模型 output 永遠不能取代 validator。

---

# 31. Agent Modes

建議保留與現有 EveGlyph 接近的三種 mode，但重新定義 authority：

## Suggest

$$
Agent\rightarrow Text/Candidate.
$$

不改 canonical state。

## Patch

$$
Agent\rightarrow ProposedTransaction
\rightarrow Review/Policy
\rightarrow Commit.
$$

## Direct

只代表 policy 可自動批准某些低風險 transaction；仍不允許 bypass runtime validation。

因此 `direct` 不等於「agent 直接改 DB bytes」。

---

# 32. Legacy File-Agent Adapter

現有 CLI agent 以 filesystem 為工作面。TW-03 將其正式包成：

$$
LegacyFileAgentAdapter.
$$

流程：

1. runtime/materializer export compatibility workspace；
2. snapshot base；
3. agent 在 restricted folder 工作；
4. collect filesystem diff；
5. importer 轉成 EGIR candidate mutations；
6. validate；
7. review / policy；
8. runtime commit；
9. regenerate compatibility files if needed。

如此可以漸進遷移，不要求 agent ecosystem 立刻理解 EGIR。

---

# 33. Filesystem 不再是唯一 Canonical Truth

在 transitional editor 中，Markdown files 仍可以是 important adapter source；但當 workspace 切換到 EGIR-native mode 後：

$$
Files=Projection/Adapter(EGIR).
$$

若 user 明確選擇 `file-authoritative compatibility mode`，runtime 必須將其標為 profile，而不能同時宣稱 EGIR 與 file tree 都是無衝突的唯一 canonical truth。

---

# 34. MCP Adapter

MCP SHOULD 被視為 edge adapter，而不是 EGCR internal ontology。

截至 2026-07-28 的 MCP specification 已轉向 stateless protocol core，並加入 extensions / tasks / authorization hardening；這進一步支持 TW-03 的設計：**protocol session lifecycle 不應被用作 EveGlyph workspace identity 或 transaction authority。**

MCP adapter 可以映射：

- `resources/read` → resolver / projection read；
- `tools/call` → runtime command request；
- Tasks extension → long-running runtime job handle；
- authorization → external protocol access gate。

但任何 MCP request 若改 canonical state，仍 MUST 帶入/解析 base workspace revision 或等價 precondition。

## 34.1 Current deprecation isolation

因 MCP protocol 本身仍在快速演化，Runtime core MUST 不依賴已被 protocol deprecate 的特定 feature 才能正常運作。MCP SDK / version negotiation 位於 adapter layer。

---

# 35. CLI / HTTP / MCP 同權威模型

CLI、HTTP、MCP、desktop UI、local plugin 只是不同 transport：

$$
Transport
\rightarrow
RuntimeCommand.
$$

不存在：

$$
MCPCommandAuthority
>
UICommandAuthority.
$$

真正 authority 由 capability/policy 決定。

---

# 36. Local-first Runtime

EGCR core SHOULD 在沒有 network 的情況下支援：

- open EGStore；
- resolve local IDs/revisions；
- edit Canvas；
- native deterministic math；
- local glyph render/binding；
- branch/history；
- local agent adapter if executable exists；
- save/recover。

Network 是 optional external capability，不是 workspace survival condition。

---

# 37. Semantic Zoom Runtime

Projection：

$$
View=\Pi(Object,Zoom,Context).
$$

遠距離可以只載入：

- title；
- bounding box；
- icon/glyph summary；
- relation count。

近距離再載：

- full math graph；
- full text；
- glyph parts；
- proof/result detail。

不同 semantic zoom projection MUST 保持同 persistent identity。

---

# 38. Incremental Loading

Runtime MAY 將 canonical workspace materialized subset 寫為：

$$
M_t\subseteq C_t.
$$

對未 materialize object，resolver 可以知道 identity/head metadata，但 payload 暫未 fetch。

這個狀態應回：

$$
KnownButNotMaterialized.
$$

而不是 `Unresolved`。

---

# 39. Prefetch

Prefetch 可以使用：

- viewport velocity；
- region adjacency；
- relation neighborhood；
- execution dependency；
- user history；
- AI prediction。

但 prefetch 只是 performance policy：

$$
PrefetchDecision
\not\Rightarrow
CanonicalRelation.
$$

---

# 40. Cache Invalidation

Derived cache key SHOULD 使用 immutable revision/content/workspace IDs。

例如 math evaluation cache：

$$
K_{eval}=
Hash(
inputRevision,
backendVersion,
policy,
assumptions
).
$$

Canvas move 若 math revision 未變，不應 invalidate pure math result cache。

---

# 41. Semantic Index

Embedding / ANN index：

$$
I_{sem}=f(C_t,ModelVersion,IndexProfile).
$$

它可以失效、重建、升級模型。

Embedding vector MUST NOT 成為 persistent identity。

模型升級：

$$
I_{sem}^{v_1}\neq I_{sem}^{v_2}
$$

不改 object identity。

---

# 42. Collaboration

TW-03 v0.1 採 serverless / single-user local-first 也能成立的 core；collaboration 是後續加層。

Collaboration protocol 必須交換：

- base revision；
- command/proposal；
- author/actor；
- resulting revisions；
- conflicts/branches。

它不應只傳「目前畫面最後長什麼樣」。

---

# 43. No Silent Last-Writer-Wins for Canonical State

對 canonical semantic mutation，TW-03 禁止無條件 last-writer-wins。

LWW MAY 用於：

- local cursor；
- viewport；
- transient presence；
- noncanonical UI preference。

但不能默認用於 theorem content、operator semantics、relation predicate、persistent identity mapping。

---

# 44. Runtime Task Model

長任務：

$$
Task=(id,type,inputSnapshot,status,cancelPolicy,resultRefs,trace).
$$

status 可為：

- `queued`；
- `running`；
- `waiting-external`；
- `completed`；
- `failed`；
- `cancelled`；
- `unknown-external-effect`。

Task handle 是 runtime locator，不是 result object identity。

---

# 45. Cancellation

Cancellation semantics MUST 區分：

- pure compute before commit：可直接丟棄；
- canonical commit already durable：需要新 revert transaction；
- external effect started：可能無法撤回。

因此：

$$
CancelTask
\neq
RollbackWorld.
$$

---

# 46. Crash Recovery

Runtime crash 後 startup：

1. TW-02 manifest / chunk validate；
2. reconstruct latest durable EGIR state；
3. TW-01 full validation；
4. detect incomplete temp commit；
5. discard/rebuild derived caches；
6. reopen session；
7. classify external tasks as recoverable / unknown / failed。

Derived cache loss MUST 不影響 canonical identity。

---

# 47. Event Replay

Event ledger 可用於 diagnostics / audit / partial reconstruction，但 **canonical state 的真值仍由 committed revisions/workspace revision + validation 決定**。

若 event replay 與 canonical snapshot 不一致：

$$
IntegrityFault.
$$

不能偷偷選「看起來比較合理」的一邊。

---

# 48. Diagnostics

Runtime SHOULD 產生 structured trace，至少能回答：

- 哪個 command？
- 哪個 base revision？
- 誰提出？
- 哪個 capability 被檢查？
- 解析到哪個 target？
- 哪個 validator？
- 產生哪些 revision/event？
- 哪個 backend？
- 何種 evidence class？
- 有無 external effect？
- 為何 conflict / deny / fail？

---

# 49. Explain APIs

建議三個高階 debug API：

$$
ExplainMutation(commandID),
$$

$$
ExplainResolution(reference),
$$

$$
ExplainExecution(resultID).
$$

這些輸出是 diagnostics projection，不必全部進 canonical content hash。

---

# 50. Typed Runtime Result

Runtime command 結果 SHOULD 使用明確類別：

- `Committed`；
- `CandidateRecorded`；
- `Resolved`；
- `Multiple`；
- `Unresolved`；
- `Conflict`；
- `Unauthorized`；
- `Invalid`；
- `Unsupported`；
- `ResourceLimitExceeded`；
- `ExecutionFailed`；
- `ExternalEffectUnknown`；
- `Degraded`。

UI 不得把所有 failure 只顯示成 `Error` 後丟掉原因。

---

# 51. Prompt Injection / Workspace Instruction Boundary

現有 EveGlyph 會將 workspace `.eveglyph/rules.md` 等內容注入 agent context。未來 runtime SHOULD 把 standing workspace policy 與普通 document content 分離。

建議：

$$
WorkspacePolicyObject
\neq
DocumentText.
$$

來自 import、網頁、PDF、Markdown、AI output 的文字預設都是 data，不得因內容寫著「忽略規則」就取得 policy authority。

---

# 52. Secrets

API key、token、private credential MUST 放 secure local credential store / OS secret store，MUST NOT 存入：

- EGIR intrinsic content；
- public event metadata；
- portable EGStore manifest；
- AI trace export。

Runtime event 可以保存 secret reference / provider ID，但不是 secret value。

---

# 53. Import Security

任何外部 import：

$$
Bytes
\rightarrow
Parse
\rightarrow
CandidateObject
\rightarrow
Validate
\rightarrow
Commit.
$$

不得：

$$
Import
\rightarrow
Execute.
$$

這對 glyph behavior、code object、MCP tool descriptor、World IR、external plugin 都適用。

---

# 54. Extension Registry

Runtime SHOULD 分開 registry：

- object kind registry；
- renderer registry；
- spatial grammar registry；
- operator registry；
- resolver adapter registry；
- storage codec registry；
- agent adapter registry；
- export/import adapter registry。

Unknown extension 可保存，但不能自動執行。

---

# 55. Extension Compatibility

Extension manifest SHOULD 宣告：

$$
Extension=(id,version,capabilities,objectKinds,commands,effectClasses,dependencies).
$$

Runtime MUST 可以在 extension 缺失時至少保留 unknown EGIR data；若操作需要缺失 extension，回 `Unsupported` 而不是 destructive downgrade。

---

# 56. Runtime Performance Model

TW-03 不凍結固定毫秒 SLA，但要求量測：

- startup/hydration time；
- command validation time；
- workspace commit latency；
- spatial parse latency；
- index rebuild time；
- range-fetch bytes；
- execution compile time；
- execution time；
- cache hit ratio；
- peak memory；
- visible-object materialization count。

Performance optimization 不得透過繞過 canonical validation取得。

---

# 57. Incremental Invalidations

每個 derived subsystem SHOULD 宣告 dependency function：

$$
Deps(cacheKey)=\{revision/address/profile\}.
$$

Runtime commit 後只 invalidate 受影響 cache：

$$
Invalidate(\Delta C).
$$

例如純 move：

- invalidate spatial index region；
- invalidate Canvas scene transform；
- 不 invalidate math content hash；
- 不 invalidate pure math result cache；
- 不 invalidate unrelated glyph compiler cache。

---

# 58. Transaction Atomicity

一個 canonical transaction 在 logical level MUST 是：

$$
AllOrNothing.
$$

若 validation fail，不能留下半個 object revision 已被 workspace head 指向。

TW-02 physical persistence MAY 有 temp blobs，但 active manifest pointer 切換必須遵守其 atomic commit profile。

---

# 59. Pure Computation Commit Pattern

Pure compute 建議：

1. pin input revision；
2. authorize execute；
3. compute in sandbox/backend；
4. validate output；
5. construct result object/revision；
6. verify current base/precondition；
7. commit result + event + workspace revision；
8. persist。

如果第 6 步 base 已變，可：

- conflict；
- commit detached result；
- revalidate against new base；

由 policy 決定，但不得 silent attach 到錯誤 base。

---

# 60. External Effect Commit Pattern

External effect 建議：

1. validate intent；
2. capability check；
3. optionally commit durable intent record；
4. perform external action；
5. observe result；
6. commit outcome event；
7. classify uncertainty。

若 process 在 4–5 中間 crash，runtime MAY 只能知道：

$$
EffectUnknown.
$$

這比假裝 failed/succeeded 更正確。

---

# 61. Reference Runtime Harness

本封裝包含：

```text
TW-03_Support/tools/reference_runtime.py
TW-03_Support/tools/validate_tw03.py
TW-03_Support/conformance/tw03_vectors.json
TW-03_Support/schemas/eveglyph-runtime-trace.schema.json
TW-03_Support/examples/runtime_trace.json
TW-03_Support/examples/runtime_final.egir.json
```

Reference runtime 是 deterministic state machine，不是產品 MVP。

它目前實際執行：

1. identity/version resolution；
2. Canvas move；
3. stale-base conflict；
4. AI relation candidate；
5. candidate promotion；
6. Native Math derivative；
7. semantic edit；
8. old revision resolution；
9. capability denial；
10. serialize / rehydrate。

---

# 62. Reference Harness 已驗證的核心事實

對 TW-01 minimal workspace，fresh run 證明：

## 62.1 Session/cache non-authority

修改 viewport zoom 與 derived semantic cache：

$$
W_{before}=W_{after}.
$$

## 62.2 Move

純 move：

$$
ObjectRevision_{before}=ObjectRevision_{after},
$$

且：

$$
ExecutionGraph_{before}=ExecutionGraph_{after}.
$$

Workspace revision 則改變。

## 62.3 Stale write

使用舊 base revision 再 move：

$$
Result=Conflict.
$$

Canonical state 不變。

## 62.4 Agent proposal

AI relation proposal：

$$
Result=CandidateRecorded,
$$

且 workspace revision 不變。

## 62.5 Promotion

Explicit promote 後才建立 persistent relation object/revision 與新 workspace revision。

## 62.6 Native execution

對 $x^2$ 執行 derivative，reference runtime 產生新 result object，其 evidence class 為 `computed`，backend `eg-math-core/0.1`，並保存 source revision provenance。

## 62.7 Edit

將原 object exponent $2$ 改成 $3$：

$$
A^{id}_{before}=A^{id}_{after},
$$

$$
A^{content}_{before}\neq A^{content}_{after},
$$

$$
A^{ver}_{before}\neq A^{ver}_{after}.
$$

## 62.8 Historical resolution

舊 revision 即使不再是 head，仍可被 version address resolve。

## 62.9 Capability denial

只有 `resolve` capability 的 session 嘗試 native execution：

$$
Result=Unauthorized.
$$

Workspace 不變。

## 62.10 Rehydrate

Final EGIR serialize / reload 後 workspace revision、execution graph derivation 與 TW-01 hash semantics 全部維持。

---

# 63. Conformance Classes

## Runtime Reader

MUST：

- load TW-01/TW-02 validated state；
- build session overlay；
- build/discard derived caches；
- resolve typed references；
- preserve unknown extension data。

## Transaction Runtime

另 MUST：

- require base revision on canonical writes；
- detect conflict；
- validate/authorize；
- produce event/revision/workspace commit；
- persist via EGStore；
- never use model output as hash authority。

## Computational Runtime

另 MUST：

- compile explicit execution structure；
- run at least one native NCM path；
- generate result/provenance；
- enforce execution capability；
- classify determinism/effect class。

## Agentic Runtime

另 MUST：

- separate proposal from authority；
- pin base revision；
- enforce adapter capabilities；
- surface conflicts；
- retain agent provenance without storing secrets。

---

# 64. 三十二項 TW-03 Design Freeze

完成本文件後，MVP-01 不得在未顯式升版的情況下破壞：

1. Canonical State、Session Overlay、Derived Cache、External Effects 四類分離；
2. UI singleton / DOM / viewport 不得作 canonical authority；
3. derived spatial/semantic/render/execution cache 必須可重建；
4. canonical mutation 必須走 runtime command/transaction；
5. canonical write 必須 pin `base_workspace_revision` 或等價 precondition；
6. stale canonical write 不得 silent overwrite；
7. default stale policy 可為 `Conflict`；
8. branch/merge 保留 Paper 01 DAG semantics；
9. Resolver 與 capability/permission 分離；
10. resolver failure/result 必須 typed；
11. pure gesture update 不產生每幀 workspace revision；
12. spatial parse 只產生 candidate，除非 explicit promotion；
13. candidate ledger 與 authoritative relation heads 分離；
14. layout graph 與 execution graph 分離；
15. pure move 不改 execution graph；
16. execution compiler 只消費 committed/validated dependencies；
17. Native Math 直接執行 NCM，不以 LaTeX reparse 作 canonical path；
18. computed result 預設建立新 result identity + provenance；
19. computed 與 proved evidence 分離；
20. glyph renderer / image bytes 不直接具有 execution authority；
21. imported behavior 預設 disabled；
22. operator implementation/backend selection 必須進 provenance；
23. determinism / seed / nondeterminism / external-effect classes分離；
24. successful resolution 不授予 execute capability；
25. AI agent output 預設是 proposal/candidate；
26. `direct` agent mode 不能 bypass validator/capability/base check；
27. legacy filesystem/git agent 只能作 compatibility adapter；
28. MCP/CLI/HTTP/UI 是 transport adapter，不是 canonical authority；
29. runtime core 不依賴特定外部 protocol session lifecycle；
30. crash/recovery 可丟 derived cache，但不能竄改 canonical hashes；
31. secrets 不進 portable canonical provenance；
32. MVP 必須通過 TW-01/TW-02/TW-03 三層 validator 與 reference semantics。

---

# 65. 二十八項 Runtime Conformance Tests

## RT1 — Session overlay

Zoom/selection change 不改 workspace revision。

## RT2 — Derived cache

清空 semantic/spatial cache 不改 canonical state。

## RT3 — Move

純 move 改 workspace revision，不改 object revision。

## RT4 — Move/exec independence

純 move 不改 execution graph hash。

## RT5 — Stale base

舊 base canonical write 回 `Conflict`。

## RT6 — No partial write

Conflict 後 workspace 不變。

## RT7 — Agent proposal

AI proposal 只進 candidate layer。

## RT8 — Candidate no authority

Candidate 不出現在 explicit relation heads。

## RT9 — Promotion

Promotion 才建立 relation object/revision/event。

## RT10 — Promotion provenance

Committed relation 可追溯 candidate / actor / event。

## RT11 — Resolve identity

Persistent ID resolve 到 object lineage。

## RT12 — Resolve old version

非 head old revision 仍可 resolve。

## RT13 — Resolve/capability separation

可 resolve object 不代表可 execute。

## RT14 — Native math direct

$x^2$ derivative 不經 canonical LaTeX parse-back。

## RT15 — Result identity

Execution result 使用新 persistent identity。

## RT16 — Result provenance

Result 保留 input revision/backend/evidence class。

## RT17 — Edit continuity

Semantic edit 保持 persistent identity。

## RT18 — Edit revision change

Edit 產生新 content/revision address。

## RT19 — UI transport equality

相同 command 經不同 transport adapter 不改 authority semantics。

## RT20 — Unknown extension

可保存但不可 auto-execute。

## RT21 — Imported glyph behavior

Import 後 behavior disabled until authorize。

## RT22 — Resource limit

超限 execution 回 typed result，不 half-commit。

## RT23 — Cancel pure task

commit 前 cancel 不產生 canonical output。

## RT24 — External-effect uncertainty

effect outcome 不確定時不得偽裝成功/失敗。

## RT25 — Rehydrate

Serialize / reload 保持 workspace/revision identities。

## RT26 — Derived rebuild

刪 index 後可由 canonical state 重建。

## RT27 — Storage repackage

TW-02 physical representation 改變不改 runtime canonical state。

## RT28 — Full validation

Final committed EGIR bundle重新通過 TW-01 content/revision/workspace hash validation。

---

# 66. MVP-01 Runtime Vertical Slice

MVP-01 不需要一次完成大型協作平台。只要實作一條完整 vertical slice。

## 66.1 Startup

- open `egstore/0.1`；
- reconstruct EGIR；
- run TW-01/TW-02 validators；
- materialize session。

## 66.2 Canvas

- infinite/pannable canvas；
- text/math/glyph/operator nodes；
- persistent placement；
- transient drag；
- semantic zoom minimum two levels。

## 66.3 Transactions

- move；
- edit；
- clone；
- candidate relation；
- promote；
- conflict on stale base。

## 66.4 Native Math

建立：

$$
f(x)=x^2.
$$

執行：

$$
D_x(f)=2x.
$$

Result 以新 object + provenance commit。

## 66.5 Custom Glyph

畫/載入一個 glyph，建立 semantic binding：

$$
represents(g_D,DerivativeOperator).
$$

將 glyph 放到 math/canvas flow 後，經 explicit binding 執行同一 derivative operator。

## 66.6 Agent

至少一個 agent proposal path：

$$
Agent
\rightarrow
Candidate
\rightarrow
Review/Policy
\rightarrow
Commit.
$$

## 66.7 Storage

將同一 final workspace 以 identity 与 Brotli EGStore representation 重新 pack，證明 TW-01 identities 不變。

---

# 67. MVP 成功定義

MVP 成功不以 UI 華麗程度判定，而以：

$$
\boxed{
\text{One Canonical EGIR World}
+
\text{Live Canvas}
+
\text{Transactional Mutation}
+
\text{Native Execution}
+
\text{Agent Candidate Boundary}
+
\text{Replaceable Storage}
}
$$

全部成立。

---

# 68. Migration Roadmap from EveGlyph v0.5

## Phase M0 — Compatibility Baseline

保持現有 Markdown editor / filesystem workspace / agent diff review。

## Phase M1 — EGIR Sidecar Runtime

新增 runtime process/library，可 import existing Markdown/world data，建立 EGIR shadow state；尚不取代現有 editor。

## Phase M2 — Canvas Native Session

Canvas 直接讀 EGIR；Markdown tab 變成 projection/editor adapter之一。

## Phase M3 — Transaction Authority

所有 canonical edits 都走 Runtime Command；filesystem agent diff 經 adapter import。

## Phase M4 — Native Math / Glyph Execution

加入 NCM evaluator 與 custom glyph binding。

## Phase M5 — EGStore Native Persistence

EGIR/EGStore 成為 native workspace；legacy file tree 可 export/materialize。

此順序允許漸進替換，而不是 big-bang rewrite。

---

# 69. Current MCP Migration Note

目前 EveGlyph 已存在 MCP server。未來升級時 SHOULD 將現有 MCP tools 改成呼叫 runtime service，而不是直接擁有另一份 filesystem state machine。

例如：

```text
MCP read_file
    -> Compatibility Projection Service

MCP validate_world_ir
    -> Runtime Validator

MCP evaluate_aimdc
    -> Runtime Execution Adapter

future MCP mutate_object
    -> Runtime Command Gateway
```

這避免 Browser UI、MCP server、CLI agent 各自維護不同 canonical truth。

---

# 70. 非主張

TW-03 不主張：

1. `S` singleton 必須立刻刪除；
2. Git diff review 應被丟棄；
3. 所有 agent 必須原生理解 EGIR；
4. MCP 必須成為 EveGlyph 唯一 protocol；
5. WebAssembly 是唯一 sandbox；
6. 所有 operation 都必須同步；
7. 所有 derived cache 都要 persistent；
8. 所有 collaboration 都要 CRDT；
9. 所有 runtime command 都需要人工確認；
10. 所有 external effect 都能 rollback；
11. UI 必須一次顯示整個無限 workspace；
12. AI 可以替代 deterministic validator；
13. native execution 等於 formal proof；
14. runtime 能保證外部 OS/process/network 完美安全。

本文只主張：

> **live system 必須清楚知道什麼是 canonical truth、什麼只是 transient/derived state、誰有權改 canonical truth，以及任何 mutation / execution 為何被允許。**

---

# 71. 完整 v0.1 架構閉環

至 TW-03，整個 ASCS v0.1 可表示為：

$$
\boxed{
\text{Paper 00--05}
\rightarrow
\text{TW-01 EGIR}
\rightarrow
\text{TW-02 EGStore}
\rightarrow
\text{TW-03 EGCR}
}
$$

其中：

$$
\text{Theory}
\rightarrow
\text{Canonical IR}
\rightarrow
\text{Physical Store}
\rightarrow
\text{Live Runtime}.
$$

這四層互相依賴，但不互相偷換。

---

# 72. 結論

EveGlyph 從 Markdown editor 升級成 Addressable Symbolic Computational Workspace，真正困難的地方不是把 Canvas 畫出來，也不是加一個 AI chat panel，而是讓一個 live system 在高頻互動、AI proposal、native computation、storage optimization 與 external integration 同時存在時，仍然知道「什麼才是真的」。

如果 viewport 是 truth，zoom 就改世界。

如果 spatial index 是 truth，換 R-tree packing 就改世界。

如果 model output 是 truth，生成式猜測就會變成 relation authority。

如果 filesystem 是唯一 truth，native object identity 最終還是被 path 綁住。

如果 protocol session 是 truth，外部 protocol 改版就會改 workspace ontology。

如果 execution result 只有螢幕上的文字，便無法可靠知道 input revision、backend、assumption 與 evidence class。

TW-03 因此建立最後一道分層：

$$
\boxed{
Canonical
\neq
Session
\neq
Derived
\neq
External.
}
$$

所有真正 mutation 進入：

$$
\boxed{
Command
\rightarrow
Resolve
\rightarrow
Validate
\rightarrow
Authorize
\rightarrow
Commit
\rightarrow
Persist.
}
$$

所有 AI、spatial parser、recognizer 的不確定輸出先進 candidate layer；所有可執行結構由 committed relation 與 versioned operator binding 編譯；所有 result 都有 identity 與 provenance；所有 stale mutation 都必須 conflict/branch/merge；所有 transport protocol 都只是 runtime adapter。

至此，Paper 00–05、TW-01、TW-02、TW-03 已經足以成為未來正式升級 `eveglyph-editor` 與 `utf-8x` 的 canonical architecture anchor。

下一步不應再寫第四篇架構白皮書。

下一步就是：

$$
\boxed{
MVP\text{-}01
\;—\;
EveGlyph\ Computational\ Canvas\ v0.1
}
$$

用真正可以執行、失敗、衝突、復原與被測試的系統，證明前九份正式文件不是只有理論上的漂亮分層。

---

# References

[1] EveMissLab. *Paper 00 — From Linear Documents to Addressable Symbolic Computational Spaces*. v0.1, 2026.

[2] EveMissLab. *Paper 01 — Addressable Symbolic Object Model*. v0.1, 2026.

[3] EveMissLab. *Paper 02 — Spatial Syntax and Infinite Canvas Computation*. v0.1, 2026.

[4] EveMissLab. *Paper 03 — Native Computational Mathematics Beyond LaTeX*. v0.1, 2026.

[5] EveMissLab. *Paper 04 — Generative Glyph and Symbol Compilation*. v0.1, 2026.

[6] EveMissLab. *Paper 05 — Multi-Layer Addressing for Computational Documents*. v0.1, 2026.

[7] EveMissLab. *TW-01 — EveGlyph Symbol IR Specification v0.1*. 2026.

[8] EveMissLab. *TW-02 — UTF-8 / UTF-8X Compatibility & Storage Architecture v0.1*. 2026.

[9] EveMissLab. *EveGlyph Editor* public repository, current v0.5-era architecture baseline, 2026.

[10] Model Context Protocol Core Maintainers. *Model Context Protocol Specification 2026-07-28*. 2026.

[11] Model Context Protocol Core Maintainers. *The 2026-07-28 Specification*. Official MCP project blog, 28 July 2026.

[12] WebAssembly Community Group / W3C. *WebAssembly Core Specification / WebAssembly Specifications*. Wasm 3.0 generation documentation, 2026.

[13] WebAssembly Project. *WebAssembly Security*. Sandbox and embedder security model documentation.

[14] W3C. *PROV-O: The PROV Ontology*. W3C Recommendation, 2013.

[15] K. Davis, B. Peabody, and P. Leach. *RFC 9562 — Universally Unique IDentifiers (UUIDs)*. 2024.

---

# Appendix A — Runtime Formal Summary

$$
RuntimeState=(C,S,D,X).
$$

$$
C=CanonicalState.
$$

$$
S=SessionOverlay.
$$

$$
D=DerivedCache.
$$

$$
X=ExternalEffects.
$$

$$
Q=(id,type,actor,base,payload,preconditions,effectClass,metadata).
$$

$$
Q
\rightarrow
Resolve
\rightarrow
Validate
\rightarrow
Authorize
\rightarrow
Plan
\rightarrow
Execute
\rightarrow
Commit
\rightarrow
Persist.
$$

$$
G_X=Compile(C,OperatorRegistry,ExecutionProfile).
$$

$$
Eval(M,Context,Policy)
\rightarrow
(Result,DerivedState,Provenance,Status).
$$

$$
Resolve(A,Context,Policy)
\rightarrow
ResolutionResult.
$$

$$
AgentOutput
\rightarrow
Candidate
\rightarrow
Promotion
\rightarrow
CommittedRevision.
$$

---

# Appendix B — Normative Support Artifacts

本白皮書包含：

- `TW-03_Support/schemas/eveglyph-runtime-trace.schema.json`
- `TW-03_Support/conformance/tw03_vectors.json`
- `TW-03_Support/examples/runtime_trace.json`
- `TW-03_Support/examples/runtime_final.egir.json`
- `TW-03_Support/tools/reference_runtime.py`
- `TW-03_Support/tools/validate_tw03.py`
- `TW-03_Support/README.md`

`reference_runtime.py` 只是一個 deterministic conformance state machine，不是 MVP，也不代表最終 implementation language / process architecture。任何未來 runtime implementation 只要遵守 Paper 00–05、TW-01、TW-02、TW-03 invariants，並能通過等價 conformance vectors，即可採用不同語言、資料庫、renderer、scheduler、agent protocol 與 sandbox backend。
