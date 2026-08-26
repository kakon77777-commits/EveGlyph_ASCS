# TW-02｜UTF-8 / UTF-8X Compatibility & Storage Architecture v0.1

**English Title:** UTF-8 / UTF-8X Compatibility & Storage Architecture v0.1: EGIR Carriers, Chunking, Compression, Deduplication, Random Access, Integrity, Recovery, and Migration

**作者：** Neo.K  
**機構：** EveMissLab / 一言諾科技有限公司  
**版本：** v0.1  
**日期：** 2026-08-24  
**文件類型：** 技術白皮書 / Normative Technical Specification  
**系列定位：** EveGlyph Addressable Symbolic Computational Space Series — TW-02  
**前置規格：** Paper 00–05 ASCS v0.1 Core Theory Freeze；TW-01 EveGlyph Symbol IR Specification v0.1

---

## Canonical Source Note

本文件以 UTF-8 Markdown 保存正式規格原稿。數學 source 僅使用 `$...$` 與 `$$...$$` 作為 canonical delimiter。

TW-01 已經凍結 EGIR abstract model、persistent identity、revision、content address、relation、placement、event/provenance 與 `EGIR-CJ/0.1` canonicalization。TW-02 **不得重新定義那些語義**。本文件只回答：相同 EGIR state 應如何被落地為可攜、可驗證、可分塊、可壓縮、可索引、可隨機讀取、可復原與可遷移的 storage representation。

因此：

$$
\text{EGIR identity semantics}
\neq
\text{storage chunk identity}
\neq
\text{compressed representation}
\neq
\text{physical locator}.
$$

本文件將 EveGlyph 的儲存層稱為 **EGStore**。EGStore v0.1 是 TW-01 EGIR 之下的 physical/storage architecture，不是新的 Unicode encoding form，也不是對 UTF-8 標準的修改。

---

# 1. 規格目的

ASCS 的上層世界允許一個 persistent object 在不改 identity 的情況下被編輯、移動畫布位置、搬移實體 storage、建立新 revision，或以不同 projection 呈現。若 storage layer 再度把 file path、compression stream、chunk boundary 或 UTF-8X physical region 當成 object identity，Paper 01–05 的分層就會被破壞。

TW-02 的主要目的因此是建立：

$$
\boxed{
\text{Stable EGIR Semantics}
+
\text{Replaceable Physical Representations}
}
$$

並凍結下列工程問題：

1. UTF-8 JSON 如何作為 mandatory portable carrier；
2. binary / CBOR carrier 如何在不改 identity 的情況下加入；
3. EGIR payload 如何切 chunk；
4. chunk 如何 content-address 與去重；
5. compression codec 如何被版本化；
6. UTF-8X 如何降回 optional / experimental region representation；
7. random access 如何量測，而不是只用 compression ratio 評價；
8. manifest、checksum、cryptographic hash 如何分工；
9. corruption、partial loss、missing dictionary 如何 recovery；
10. physical migration、replication、garbage collection 如何不改 persistent identity；
11. AI 如何參與 encoding policy，但不能參與 deterministic decode；
12. Windows/POSIX durability 差異如何被 profile 化，而不是偷偷假定單一平台。

---

# 2. UTF-8 的位置：保留規範錨點，不再負責所有內部任務

Unicode 17.0 仍將 UTF-8 定義為以 8-bit code unit 為基礎、ASCII-transparent 的 variable-width encoding form。TW-02 不修改 UTF-8，也不建立私有 UTF-8 byte sequence。

對 TW-01 portable JSON carrier：

$$
B_{json}=UTF8(JSON(EGIR)).
$$

任何宣稱為 `application/json`、`.json` 或一般 UTF-8 text 的輸出 MUST 是標準 UTF-8 bytes。

UTF-8 的角色是：

- portable human-inspectable carrier；
- canonical source/document transport substrate；
- JSON/Markdown/adapter text substrate；
- cross-tool compatibility anchor。

UTF-8 **不是**：

- arbitrary glyph ontology；
- object identity system；
- semantic address system；
- compression algorithm；
- spatial address；
- executable graph。

因此未來 EveGlyph 擴張不需要「修改 UTF-8」。需要擴張的是 EGIR 與 storage/runtime layers。

---

# 3. UTF-8X 的重新定位

## 3.1 既有研究資產

現有 UTF-8X repo 的設計核心已經非常接近 TW-02 所需要的 physical-layer discipline：以 UTF-8 為 anchor，允許 per-region codecs、block manifest、dictionary、hash、streaming、random-access intent，且 AI 可以選策略但 decoder 不依賴 AI。

目前公開工程基線走到 v0.22。repo 重現報告已確認：

- 核心 round-trip 命題在已測 codec / block-size 組合中逐位元通過；
- 小 block size 會被 header/index overhead 壓垮；
- 既有白皮書要求的普通 gzip/Brotli/Zstd 對照與 random-access amplification 曾有未完成量測；
- Windows baseline 暴露出 `fsync`、open handle、mmap cleanup 等 POSIX assumptions；
- 實作已從 encoding container 延伸到 B+ tree、LSM、transparency log 等更大的 storage/governance系統。

這些結果不應被丟掉，而應成為 TW-02 的工程經驗。

## 3.2 不直接把舊 `.u8x` 升格為 EGIR canonical container

TW-02 v0.1 **不**宣告歷史 `.u8x` v0.22 格式就是新的 EGStore canonical container，原因有三個：

1. TW-01 的 object/revision/address semantics 是在 UTF-8X v0.22 之後才正式凍結；
2. 舊 UTF-8X 同時承擔文字表示、chunk、storage、index 與後續治理功能，邊界已膨脹；
3. EGIR 必須能使用 identity/raw、Brotli、Zstd、CBOR、UTF-8X 或未來 codec，而不是被一種 research container 綁死。

因此 v0.1 採：

$$
\boxed{
\text{EGIR}
\rightarrow
\text{EGStore}
\rightarrow
\{identity, Brotli, Zstd, SharedBrotli, UTF8X, future\}
}
$$

歷史 UTF-8X 成為 **optional region codec / nested carrier / research profile**。

---

# 4. EGStore 四層模型

EGStore 定義四層：

## Layer S0 — EGIR Semantic Layer

由 TW-01 定義：

$$
W_{EGIR}.
$$

## Layer S1 — Portable Payload Layer

例如：

$$
P=UTF8(JSON(W_{EGIR})).
$$

或未來 deterministic CBOR representation。

## Layer S2 — Chunk / Representation Layer

$$
P
\xrightarrow{Chunk}
(c_1,c_2,\ldots,c_n)
\xrightarrow{Codec_i}
(e_1,e_2,\ldots,e_n).
$$

## Layer S3 — Physical Store Layer

將 encoded chunks、manifest、index、dictionary 存入：

- directory store；
- packed file；
- object store；
- database/blob store；
- remote cache；
- archive；
- UTF-8X region store。

最重要的不變量：

$$
S3\text{ migration}
\not\Rightarrow
S0\text{ identity mutation}.
$$

---

# 5. EGStore Manifest

v0.1 定義 machine-readable manifest profile：

```text
store_version = "egstore/0.1"
```

reference schema：

```text
TW-02_Support/schemas/eveglyph-storage-manifest.schema.json
```

Manifest 至少包含：

- `store_version`；
- `manifest_id`；
- `egir_version`；
- `root_payload`；
- `chunking`；
- `codecs`；
- `chunks`；
- optional `dictionaries`；
- optional `indexes`；
- `limits`；
- `generator`；
- `extensions`。

`manifest_id` 是 **storage manifest identity**，不是 TW-01 workspace revision。

因此：

$$
A^{workspaceVer}
\neq
A^{storeManifest}.
$$

同一 workspace revision 用不同 chunk size 或不同 codec 打包，manifest ID 可以不同，但 EGIR workspace revision MUST 保持一致。

---

# 6. Root Payload

EGStore v0.1 的最小 payload 是一份完整 EGIR UTF-8 JSON bundle。

定義：

$$
P_{root}=B_{EGIR}.
$$

Root payload record 必須包含：

- media type；
- decoded byte length；
- decoded SHA-256；
- ordered chunk IDs。

重建條件：

$$
P'_{root}=D(e_1)\Vert D(e_2)\Vert\cdots\Vert D(e_n).
$$

並要求：

$$
|P'_{root}|=L_{root},
$$

$$
SHA256(P'_{root})=H_{root}.
$$

若 root payload 是 TW-01 EGIR JSON，重建後還必須通過 TW-01 schema + semantic/hash validation。

---

# 7. Chunk Identity

## 7.1 Raw decoded chunk identity

每個 chunk 的權威 storage-level content ID 定義在 **decoded raw bytes** 上：

$$
h_i=SHA256(c_i).
$$

$$
ChunkID_i=\text{chunk:sha256:}h_i.
$$

這個決策非常重要，因為同一 raw chunk 可以被不同 codec 表示：

$$
E_{brotli}(c_i)\neq E_{zstd}(c_i),
$$

但：

$$
ChunkID(c_i)
$$

仍然相同。

因此 dedup identity 不被 compression choice 污染。

## 7.2 Encoded physical hash

Encoded payload 另外保存：

$$
h_i^{enc}=SHA256(e_i).
$$

它用於檢測 physical corruption、cache mismatch 或 mirror mismatch。

所以：

$$
DecodedContentHash
\neq
EncodedBlobHash.
$$

---

# 8. Chunking Profiles

Chunk boundary 影響 compression、dedup、random access、metadata overhead 與 update amplification，因此 **chunking 是 storage policy，不是 object ontology**。

## 8.1 `fixed-v1`

定義固定 byte size：

$$
C_s(P)=
(P[0:s],P[s:2s],\ldots).
$$

優點：

- 簡單；
- deterministic；
- 易於 streaming / random seek；
- reference implementation 容易跨語言。

缺點：

- insertion 可能造成後續 boundary 全部位移；
- dedup 對插入/刪除較弱。

TW-02 example store 使用 $4096$ bytes 只作 conformance vector，不是 production universal optimum。

## 8.2 `structural-v1`

以 EGIR logical records / payload boundaries 切分，例如：

- workspace snapshot；
- object pack；
- large attachment；
- revision batch；
- glyph geometry payload；
- math proof artifact。

優點：語義更新可局部化，方便 object-level fetch。

缺點：若 record size 分布極端，compression 與 RA 可能不均衡。

## 8.3 `cdc-fastcdc-v1-experimental`

Content-Defined Chunking 可以改善插入後的 boundary stability。FastCDC 類方法是成熟 dedup 研究方向，但 TW-02 v0.1 不將其設為 mandatory algorithm。

任何 CDC profile MUST：

- 固定 algorithm version；
- 固定 min/avg/max chunk parameters；
- 固定 cut-point rules；
- 跨 implementation deterministic；
- 另行量測 CPU cost 與 dedup benefit。

## 8.4 Chunk boundary 不進 TW-01 object identity

重新 chunk：

$$
Chunk_{p_1}(P)
\neq Chunk_{p_2}(P)
$$

但若 decoded root payload 相同：

$$
W_{EGIR}^{(1)}=W_{EGIR}^{(2)}.
$$

因此 storage repack 不得生成新的 object/revision identity。

---

# 9. Codec Registry

EGStore codec 是：

$$
E_k:c\rightarrow e,
$$

$$
D_k:e\rightarrow c.
$$

必須滿足：

$$
D_k(E_k(c))=c.
$$

v0.1 定義以下 profile categories。

## 9.1 `identity` — REQUIRED

$$
E(c)=c.
$$

任何 conforming reader MUST 支援。

它是：

- fallback；
- debug profile；
- already-compressed data 的安全選擇；
- corruption/recovery baseline。

## 9.2 `brotli` — OPTIONAL

使用 RFC 7932 compatible Brotli stream。

## 9.3 `zstd` — OPTIONAL

使用 RFC 8878 Zstandard frame。RFC 8878 本身指出 format 不直接企圖提供 random access，因此 EGStore 的 random access 來自 **independent chunk/frame boundaries + index**，而不是把單一巨大 Zstd stream 當可隨機讀取 container。

## 9.4 `shared-brotli` — OPTIONAL / EXPERIMENTAL

可使用 RFC 9841 shared dictionary/framing capabilities。Dictionary identity 必須 content-addressed 且 decode dependency 顯式化。

## 9.5 `utf8x-*` — EXPERIMENTAL

歷史 UTF-8X `.u8x` container 可以包入一個 EGStore chunk 作 nested physical representation，或未來將其 codec 抽出成更輕量 per-chunk codec。

但任何 `utf8x-*` codec 必須：

- 明確 implementation/spec version；
- 保存所有 decode state；
- decoder 不呼叫 AI；
- decoded output 必須逐位元回到 input chunk；
- 不能修改 TW-01 canonical JSON 或 object hashes。

---

# 10. AI-Adaptive Codec Selection

AI 可以分析：

- corpus language distribution；
- repeated phrases；
- workload random/sequential ratio；
- storage/network cost；
- memory limit；
- likely update frequency；
- available codecs/dictionaries。

並提出 plan：

$$
\Pi=
\{(chunk_i,codec_i,dict_i,params_i)\}.
$$

但 plan commit 後 decoder 只讀 manifest：

$$
Decode(Manifest,Chunks)
$$

不得變成：

$$
Decode(AI(prompt,model)).
$$

因此：

$$
\boxed{
AI\text{ may optimize encoding policy, but AI is not part of the decode function.}
}
$$

這繼承舊 UTF-8X 最成熟的一項架構決策。

---

# 11. Compression Ratio 不再是唯一目標

對 encoded size $S_e$ 與 decoded size $S_d$：

$$
CR=\frac{S_e}{S_d}.
$$

$CR$ 越低通常代表壓縮越強，但它不回答：

- 為讀 512 bytes 要解壓多少資料？
- chunk/index metadata 多大？
- 更新 1 KB 會重寫多少 bytes？
- dedup 能省多少？
- decode CPU / memory 多少？
- dictionary retrieval cost 多高？

因此 TW-02 規範任何 adaptive/storage superiority claim 至少報告五組指標。

---

# 12. Read Amplification

對一個 logical read request 長度 $B_q$，實際需要 decode 的 raw chunk bytes 為 $B_d$：

$$
RA_d=\frac{B_d}{B_q}.
$$

若需要讀取 encoded storage bytes $B_e$：

$$
RA_e=\frac{B_e}{B_q}.
$$

另外可以記錄 chunk amplification：

$$
RA_c=N_{chunks\ decoded}.
$$

TW-02 v0.1 要求：

> 任何宣稱「因分塊而更適合隨機存取」的 profile MUST 報告至少 $RA_d$ 或等價可重現 metric。

不能只說「有 block index 所以 random access 比較好」。

---

# 13. Update Amplification

對 logical update 大小 $B_u$，需要重寫的 encoded/metadata bytes 為 $B_w$：

$$
WA=\frac{B_w}{B_u}.
$$

fixed large chunk 通常 compression 好，但 $WA$ 可能高。

CDC/structural chunking 可能降低 update ripple，但 CPU / metadata 會增加。

TW-02 不預設誰必然勝出，要求 benchmark。

---

# 14. Metadata Overhead

令：

$$
M=bytes(manifest)+bytes(index)+bytes(dictionaryMetadata).
$$

則 metadata ratio：

$$
MR=\frac{M}{S_d}.
$$

既有 UTF-8X repo 已經展示 512-byte block 下 overhead 可以完全吃掉 compression benefit，因此 TW-02 profile MUST 報告 $MR$。

對非常小 payload，writer SHOULD 直接選 `identity` 或不分塊，而不是為了「使用 adaptive codec」而產生更大檔案。

---

# 15. Deduplication Metric

對 logical payload 總量 $S_{logical}$ 與 unique decoded chunk bytes $S_{unique}$：

$$
DR=1-\frac{S_{unique}}{S_{logical}}.
$$

也可報：

$$
DedupRatio=\frac{S_{logical}}{S_{unique}}.
$$

去重 MUST 以 decoded chunk content identity 為準，而不是 encoded blob byte equality。

同一 chunk：

$$
identity(c)
\neq brotli(c)
$$

在 physical bytes 上不同，仍應 dedup 到同一 logical chunk identity。

---

# 16. Multi-Objective Cost Function

一個 storage profile 的選擇可以抽象為：

$$
J(\Pi)=
w_s CR
+w_r RA_d
+w_w WA
+w_m MR
+w_t T_{decode}
+w_e T_{encode}
-w_d DR.
$$

權重：

$$
w_*=f(workload,device,latency,budget).
$$

因此不存在單一全域最優 codec/chunk size。

對 archival workload，$w_s$ 可能較高；

對 interactive canvas，$w_r$、$w_t$、$w_w$ 可能更高。

這正是 UTF-8X「區域任務特化」最應被保留的核心思想，但現在它被放入更完整、可證偽的 objective 中。

---

# 17. Reference Benchmark Baseline

TW-02 support package 內含：

```text
TW-02_Support/tools/benchmark_tw02.py
TW-02_Support/BENCHMARK_BASELINE.md
TW-02_Support/benchmark_baseline.json
```

本輪以 Paper 00–05 + TW-01 source 合併為 $300714$ bytes UTF-8 corpus，進行可重現 illustrative benchmark。

讀取模擬：$1000$ 次 random reads，每次 $512$ decoded bytes。

主要結果：

| Chunk | Codec | CR | Mean decoded RA | P95 decoded RA |
|---:|---|---:|---:|---:|
| 4,096 | identity | 1.000000 | 8.8807 | 16.0000 |
| 4,096 | gzip | 0.547982 | 8.9595 | 16.0000 |
| 4,096 | brotli | 0.438796 | 9.0201 | 16.0000 |
| 65,536 | gzip | 0.392951 | 123.8732 | 128.0000 |
| 65,536 | brotli | 0.332339 | 124.0972 | 128.0000 |
| 262,144 | gzip | 0.375131 | 460.0926 | 512.0000 |
| 262,144 | brotli | 0.295264 | 457.3946 | 512.0000 |

這個 baseline **不是 universal performance claim**。它只用來證明 TW-02 的評估方法：同一 corpus 上，較大 independent chunks 可以改善 compression ratio，同時顯著惡化小 random read 的 decoded amplification。

本環境有 Brotli 但無 Python `zstandard`，因此 Zstd 數字未估算、未偽造。

---

# 18. Dictionaries

Dictionary 是 decode dependency，不是隱性環境資訊。

Dictionary record MUST 至少包含：

$$
DictionaryID=Hash(decodedDictionaryBytes).
$$

並保存：

- algorithm/profile；
- length；
- content hash；
- physical locator 或 embedded bytes；
- compatibility version。

如果 dictionary 缺失：

$$
Decode(chunk)
\rightarrow MissingDependency
$$

而不是讓 AI「猜一個近似 dictionary」。

External dictionary MAY 被 cache，但 cache hit 必須重新 hash verification。

---

# 19. Integrity：Checksum、Hash、Semantic Validation 分工

TW-02 明確分三層。

## 19.1 Fast corruption checksum

例如 CRC32C 可用於快速檢查 local block corruption。

它不是 cryptographic identity。

## 19.2 Cryptographic encoded hash

$$
SHA256(e_i)
$$

檢查 physical blob 是否和 manifest 相符。

## 19.3 Decoded content hash

$$
SHA256(c_i)
$$

檢查 decoder output 是否得到預期 raw chunk。

## 19.4 EGIR semantic/revision validation

root payload 重建後再執行 TW-01：

- schema；
- cross-record refs；
- content hash；
- revision hash；
- workspace revision；
- authority rules。

因此：

$$
CRCValid
\not\Rightarrow
ChunkContentValid
\not\Rightarrow
EGIRSemanticValid.
$$

---

# 20. Merkle / Manifest Root

EGStore manifest 自身有：

$$
A^{storeManifest}=Hash(CanonicalManifestWithoutID).
$$

它可作 storage-state integrity root。

但：

$$
A^{storeManifest}
\neq
A^{workspaceVer}.
$$

同一 EGIR workspace revision 可以被重新 chunk/重新壓縮，得到新的 store manifest ID。

這使 physical optimization 可以自由演化，不污染論文中已凍結的 object history。

---

# 21. Index Architecture

EGStore index 分三種。

## 21.1 Logical offset index

$$
offset\rightarrow chunkID.
$$

支援 root payload range reads。

## 21.2 EGIR object/revision index

$$
(persistentID,revisionID)
\rightarrow
payload/chunkRefs.
$$

`structural-v1` profile 特別適合。

## 21.3 Derived acceleration index

例如：

- full-text index；
- semantic vector index；
- spatial R-tree；
- glyph geometry index。

這些都是 rebuildable accelerators：

$$
Index\neq CanonicalTruth.
$$

與 Paper 02 spatial-index non-authority 保持一致。

---

# 22. Random Access Contract

Reader MAY 只 fetch 目標 range 所需 chunks。

對 independent chunk profile：

$$
ReadRange(a,b)
\rightarrow
\{chunk_j\}_{j=m}^{n}.
$$

每個被讀 chunk 必須可獨立完成：

- physical hash verify；
- dictionary dependency resolve；
- decode；
- decoded hash verify。

若 codec 使用跨 chunk hidden state，則不能宣告 `independent=true`。

TW-02 v0.1 reference profile只使用 independent chunks。

---

# 23. Streaming Contract

Streaming reader 可以順序：

$$
manifest\rightarrow chunk_1\rightarrow chunk_2\rightarrow\cdots.
$$

若 manifest 在尾端或需要 upfront index，packed profile 必須提供 bootstrap header / manifest pointer。

Directory store 沒有此限制，manifest 可先讀。

TW-02 不凍結單一 packed-file header；這留給後續 production profile。但任何 packed carrier 必須能明確定位 manifest、版本與 limits。

---

# 24. Directory Store — v0.1 Reference Physical Profile

reference implementation 使用：

```text
example_store/
├─ manifest.json
└─ chunks/
   ├─ <sha256>.bin
   └─ <sha256>.bin
```

優點：

- 容易 debug；
- atomic file operations 容易測試；
- chunk 去重自然；
- 不需要先定義新的 binary pack format。

它不是最終 production requirement。

TW-02/TW-03 未來可新增 single-file pack、SQLite/object store、remote CAS，而不改 EGStore logical manifest semantics。

---

# 25. Atomic Commit

一個 storage commit SHOULD 採：

1. encode/write missing chunks to temporary location；
2. verify encoded hash；
3. durable flush 到 declared durability class；
4. write new manifest temp；
5. verify manifest ID；
6. atomic replace active manifest pointer；
7. update index；
8. background GC unreachable chunks。

在可支援的平台，writer SHOULD 使用 temp + atomic rename/replace pattern。

但 durability 語義 MUST 由 profile 宣告，不能假定所有 OS 的 `fsync`、directory sync、rename、mmap cleanup 行為完全相同。

---

# 26. Durability Classes

TW-02 v0.1 定義概念性 durability classes。

## D0 — Memory / Ephemeral

不承諾 process crash 後存在。

## D1 — Process-Flush

資料已交給 OS/file API，但不承諾 power-loss persistence。

## D2 — Durable-File

盡平台能力將檔案內容/metadata flush 至 durable medium。

## D3 — Durable-Commit

除了 chunks/file data，active manifest pointer / directory metadata 也完成 declared durability procedure。

實作 MUST 說明 Windows/POSIX 實際對應與已知限制。

這是直接吸收 UTF-8X v0.22 Windows `fsync` / open-handle 問題：不要把 POSIX assumption 偽裝成平台中立規格。

---

# 27. Crash Recovery

啟動 recovery：

1. load active manifest；
2. verify manifest ID；
3. verify referenced chunk existence；
4. optionally verify encoded hashes lazily/eagerly；
5. detect orphan temporary manifests/chunks；
6. rebuild derived indexes if needed；
7. expose typed recovery diagnostics。

若 active manifest valid 但一個 chunk missing：

$$
StoreState=Degraded(MissingChunk).
$$

不得 silently 產生空 bytes 或 AI-reconstructed bytes。

---

# 28. Partial Corruption

對 chunk corruption：

$$
SHA256(e_i)\neq manifest.encoded\_sha256.
$$

reader MUST 拒絕該 physical replica。

若有 mirror：

$$
TryReplica(e_i^{(2)}).
$$

只有 decoded content hash 相符才可接受。

若沒有合法 replica，store 可以 partial read 其他 independent chunks，但不得宣告完整 root payload已成功重建。

---

# 29. Replication

一個 chunk ID 可以有多個 locator：

$$
A^{phys}(chunk_i)=\{p_1,p_2,\ldots,p_k\}.
$$

Replica ranking MAY 考慮：

- local/remote；
- latency；
- trust domain；
- freshness；
- cost。

但任何 replica 都必須被 encoded/decoded hash 驗證。

Replica choice 不改 chunk logical identity。

---

# 30. Dedup Store

Chunk store SHOULD 以 decoded `chunk_id` 作 unique key。

寫入相同 chunk：

$$
Put(c_i), Put(c_i)
$$

可以只保留一份 decoded logical content，但 MAY 存多個 encoded variants：

$$
Variant(c_i)=\{identity,brotli,zstd,utf8x\}.
$$

Runtime 可以依 workload 選 variant，但 TW-01 identity 不變。

---

# 31. Garbage Collection

GC 必須從 live manifests / retention roots 標記 reachable chunks：

$$
Reachable=Closure(RootManifests).
$$

只有：

$$
chunk\notin Reachable
$$

且超過 safety retention window，才可刪 physical blob。

Tombstoned object identity 不等於 storage chunk 永遠保留；Paper 01 要求保存 identity history，但大型 content bytes 可以依 policy 回收。

---

# 32. Retention Profiles

可定義：

- `workspace-live`；
- `history-full`；
- `history-windowed`；
- `archive`；
- `cache-only`。

Retention policy MUST 不得修改歷史 revision identity。若 bytes 被 GC，resolver 應回：

$$
KnownRevisionButPayloadUnavailable.
$$

而不是宣稱 revision 不存在。

---

# 33. Encryption Boundary

TW-02 v0.1 不凍結加密格式，但凍結層次：

compression / representation 一般先於 encryption：

$$
c
\xrightarrow{Compress}
e
\xrightarrow{Encrypt}
q.
$$

canonical EGIR content/revision hash 不因 encryption key rotation 改變。

可以另外保存 ciphertext hash：

$$
H(q).
$$

Key metadata / secrets MUST NOT 放進公開 manifest。

---

# 34. UTF-8 Filename / Archive Trap

UTF-8X repo 重放曾經暴露一個非常實際的問題：archive filename encoding metadata 可以錯誤，即使 file contents 本身正確。

因此 EGStore canonical identity MUST NOT 依賴 archive entry display filename。

archive adapter MUST：

- 將 filename 視為 physical locator / metadata；
- 驗證 actual file bytes；
- 對 encoding ambiguity 產生 diagnostic；
- 不以「flag 宣稱 UTF-8」取代 byte validation。

---

# 35. CBOR Compatibility

RFC 8949 CBOR 已提供 deterministic encoding requirements 的標準基礎。TW-02 允許未來 `egir-cbor/0.x` carrier，但需滿足：

$$
Decode_{CBOR}(Encode_{CBOR}(W))\equiv_{EGIR}W.
$$

重要的是：CBOR bytes 本身不重新定義 TW-01 content address。

也就是：

$$
Hash(JSONCarrier)
$$

與：

$$
Hash(CBORCarrier)
$$

可以是不同 physical artifact hash；

但兩者解碼後的 EGIR object/revision/content identities 必須一致。

---

# 36. Standard Codec Boundaries

TW-02 不重新定義 Brotli、Zstandard 或 Shared Brotli bitstream。

EGStore 只規範：

- codec profile name/version；
- parameters；
- dictionary reference；
- encoded length/hash；
- decoded length/hash；
- resource limits；
- independent/dependency semantics。

因此安全更新 codec library 不必修改 EGIR object semantics。

---

# 37. Resource Limits

Manifest MUST 定義或被 runtime policy 覆蓋：

- max decoded bytes；
- max chunk count；
- max expansion ratio；
- max dictionary bytes；
- max nesting/dependency depth；
- max per-chunk decode memory；
- max total decode CPU/time policy。

防止：

$$
CompressionBomb,
$$

$$
DictionaryBomb,
$$

$$
RecursiveDependencyBomb.
$$

若 manifest 宣告 limit 超過 runtime policy，reader 應拒絕或要求 explicit authorization。

---

# 38. Dictionary and Dependency Graph Must Be Acyclic or Bounded

若 codec/dictionary 允許 nested dependency：

$$
G_D=(V,E).
$$

v0.1 SHOULD 要求 acyclic dependency graph。

若未來允許 recursion，MUST 有 deterministic depth/resource bound。

解碼器不得在缺依賴時網路搜尋「看起來像的 dictionary」。

---

# 39. Portable vs Local Storage Profiles

## Portable Profile

優先：

- UTF-8 JSON root；
- identity/Brotli/Zstd；
- content-addressed chunks；
- no absolute local path；
- complete manifest；
- all critical dictionaries embedded or content-address-resolvable。

## Local-Optimized Profile

MAY 使用：

- OS-specific mmap；
- local B+ tree/LSM；
- SQLite；
- cache indexes；
- hardware-specific codec acceleration；
- absolute physical locators。

但 export 到 portable profile 必須去除 local-only assumptions。

---

# 40. UTF-8X Experimental Profile

對現有 UTF-8X，TW-02 定義 compatibility rule：

$$
Decode_{u8x}(X)=P
$$

其中 $P$ 可以是 UTF-8 EGIR JSON 或任意 byte-exact chunk。

UTF-8X profile 的 manifest entry 必須至少記錄：

- format/version；
- round-trip mode；
- source decoded hash；
- block/dictionary dependencies；
- implementation compatibility note。

如果使用 legacy v0.22 container，reader MUST 將它視為 nested physical artifact，而不是 EGIR identity source。

---

# 41. UTF-8X Claims after TW-02

從 TW-02 開始，任何 UTF-8X 優勢 claim SHOULD 採：

$$
Benchmark=
(CR,RA,WA,MR,DR,T_e,T_d,M_{peak}).
$$

至少與：

- raw UTF-8/identity；
- gzip baseline；
- Brotli；
- Zstandard（若平台可用）；

在**相同 corpus、相同 block/chunk policy、相同 random-read trace**比較。

如果 UTF-8X 只在某些 workload 贏，也完全成立。其設計價值本來就是 region/workload adaptive，而不是全域壓縮冠軍。

---

# 42. Typed Storage Failure States

EGStore reader MUST 能區分：

- `ManifestInvalid`；
- `ManifestHashMismatch`；
- `MissingChunk`；
- `EncodedHashMismatch`；
- `DecodedHashMismatch`；
- `MissingDictionary`；
- `UnsupportedCodec`；
- `ResourceLimitExceeded`；
- `RootPayloadHashMismatch`；
- `EGIRInvalid`；
- `PermissionDenied`；
- `ReplicaUnavailable`；
- `DurabilityUnknown`。

不能全部 collapse 成 `read error`。

---

# 43. Provenance

Storage transform event 應保存：

$$
StorageEvent=
(inputManifest,
chunkingProfile,
codecProfiles,
outputManifest,
toolVersion,
policy,
actor,
time).
$$

AI-assisted encoding SHOULD 記錄：

- `ai_assisted=true`；
- strategy implementation/model family 可選；
- deterministic final plan；

但不需要將 prompt/token 等敏感內容永久塞進 portable manifest。

---

# 44. Migration

## 44.1 Recompression

$$
Store_{brotli}
\rightarrow
Store_{zstd}
$$

如果 decoded EGIR root 相同：

$$
A^{workspaceVer}_{before}
=
A^{workspaceVer}_{after}.
$$

## 44.2 Rechunking

$$
fixed\ 4KiB
\rightarrow
structural
$$

只改 store manifest/chunk graph。

## 44.3 UTF-8X legacy migration

legacy `.u8x`：

$$
DecodeLegacy
\rightarrow
CanonicalBytes
\rightarrow
Validate
\rightarrow
EGStorePack.
$$

必須先取得可靠 decoded bytes，再建立新 store。不能直接把 old physical hash 當 TW-01 content hash。

---

# 45. Cross-Platform Requirements

TW-02 reference reader/writer MUST NOT 假定：

- POSIX-only writable/read-only `fsync` behavior；
- Unix path separators；
- case-sensitive filesystem；
- rename durability identical across OS；
- mmap file handle lifecycle identical；
- native endianness；
- archive filename encoding metadata 一定正確。

平台差異必須出現在 adapter/durability profile，不進 decoded canonical content。

---

# 46. Reference Example Store

Support package 內含：

```text
TW-02_Support/examples/example_store/
├─ manifest.json
└─ chunks/
   ├─ <sha256>.bin
   └─ <sha256>.bin
```

它將 TW-01 `minimal_workspace.egir.json` 的 $8014$ bytes 用 `fixed-v1` / $4096$ byte chunking 切成兩個 `identity` chunks。

reference validator 驗證：

1. JSON Schema Draft 2020-12；
2. store manifest ID；
3. chunk encoded/decoded hashes；
4. ordered root reconstruction；
5. root SHA-256/length；
6. root UTF-8 JSON 的 `egir/0.1` marker；
7. TW-02 semantic conformance vectors。

---

# 47. Conformance Classes

## 47.1 EGStore Reader

MUST：

- read `identity` codec；
- validate manifest structure；
- verify hashes；
- enforce resource limits；
- reconstruct root payload；
- return typed errors；
- preserve TW-01 identity semantics。

## 47.2 EGStore Writer

另 MUST：

- generate deterministic manifest ID；
- content-address decoded chunks；
- record encoded hashes；
- not overwrite TW-01 content/revision IDs；
- emit storage provenance；
- expose chunking/codec profile。

## 47.3 Adaptive Writer

另 MAY：

- trial codecs；
- use AI/heuristic planner；
- train/use dictionaries；
- benchmark workload。

但 MUST 保存 deterministic final decode plan。

---

# 48. 二十八項 TW-02 Design Freeze

完成本文件後，TW-03 與 MVP-01 不得在未顯式升版的情況下破壞以下決策：

1. UTF-8 保留標準相容錨點，不建立私有 UTF-8 encoding form；
2. EGIR semantics 與 physical store carrier 分離；
3. EGStore manifest identity 與 TW-01 workspace revision 分離；
4. decoded chunk hash 與 encoded blob hash 分離；
5. chunk IDs 以 decoded raw bytes content-address；
6. compression/recompression 不改 TW-01 persistent/content/revision identity；
7. rechunking 不改 TW-01 object/revision identity；
8. `identity` codec 是 v0.1 mandatory fallback；
9. Brotli/Zstd/Shared Brotli 使用既有格式，不由 EveGlyph 重新定義 bitstream；
10. legacy UTF-8X 降為 optional/experimental physical representation profile；
11. AI 可以選 encoding plan，但不得參與 deterministic decode；
12. 所有 decode dependencies 必須 manifest/content-addressed/versioned；
13. random-access superiority claim 必須提供 read-amplification metric；
14. adaptive-storage claim 不得只報 compression ratio；
15. 至少報 CR、RA、metadata overhead，production benchmark SHOULD 再報 WA、dedup、CPU/memory；
16. chunking profile 是 storage policy，不是 ontology；
17. fixed/structural/CDC profiles 必須版本化並 deterministic；
18. index 是 accelerator，不是 canonical truth；
19. checksum、cryptographic blob hash、decoded content hash、EGIR semantic validation 分層；
20. missing/corrupt chunk 不得由 AI 自動虛構修補；
21. replication 必須逐 replica 驗證；
22. physical GC 不得重用/改寫 persistent object identity；
23. payload unavailable 與 revision nonexistent 必須區分；
24. durability class/platform semantics 必須顯式，不假定單一 POSIX 行為；
25. encryption key/ciphertext rotation 不改 EGIR canonical identity；
26. archive filename/path encoding 不得作 object identity authority；
27. CBOR/UTF-8X/new carrier 必須 round-trip 回同一 EGIR abstract state；
28. MVP 必須證明同一 EGIR workspace 可在至少兩種 physical storage representation 間遷移而 object/revision identities 完全不變。

---

# 49. 二十二項 Conformance Tests

## ST1 — Root round-trip

Pack → unpack：

$$
DecodeStore(EncodeStore(W))\equiv_{EGIR}W.
$$

## ST2 — Rechunk identity invariance

用 $4KiB$ 與 $64KiB$ chunking，root EGIR object/revision IDs 必須相同。

## ST3 — Recompression identity invariance

`identity` → `brotli` 後，TW-01 IDs 不變。

## ST4 — Chunk content address

相同 decoded bytes 使用不同 codec，`chunk_id` 相同。

## ST5 — Encoded hash distinction

不同 codec encoded bytes 的 `encoded_sha256` 可以不同。

## ST6 — Physical relocation

搬移 chunk locator 不改 `chunk_id` 或 EGIR IDs。

## ST7 — Missing chunk

reader 回 `MissingChunk`，不得生成 placeholder bytes。

## ST8 — Corrupt encoded blob

encoded hash mismatch 必須在 decode 前或 decode validation 中被拒絕。

## ST9 — Malicious decoder output

即使 encoded hash正確，若 decoded hash錯誤仍必須拒絕。

## ST10 — Missing dictionary

回 `MissingDictionary`，不使用 guessed dictionary。

## ST11 — Resource bomb

超過 expansion/decoded-byte limit 必須拒絕。

## ST12 — Random access metric

benchmark harness 必須能對指定 chunk size/read trace 計算 decoded RA。

## ST13 — Metadata overhead

writer 必須能計算 manifest/index bytes；不得忽略 overhead。

## ST14 — Small-file fallback

若 adaptive encoded result 大於 identity profile且 policy以 size 為主，planner 能退回 identity。

## ST15 — AI-free decode

移除所有 model/network access 後，已 commit store 必須仍可 decode。

## ST16 — Cross-platform path independence

locator path syntax變化不改 root decoded bytes 或 EGIR IDs。

## ST17 — Archive filename ambiguity

filename decode錯誤不得改 bytes-derived identity。

## ST18 — GC safety

reachable chunk 不得被 GC；unreachable chunk可在 policy window 後刪除。

## ST19 — Tombstone payload missing

已知 revision 即使 content bytes被回收，identity/history resolution 仍不得變成 unknown identity。

## ST20 — CBOR/alternate carrier equivalence

若 implementation提供 alternate carrier，decode後 EGIR equality 必須成立。

## ST21 — UTF-8X adapter

legacy/experimental UTF-8X chunk 解碼後必須命中 declared decoded SHA-256。

## ST22 — Durability declaration

writer 必須回報本次 commit 實際達到的 durability class，不可 silent 宣稱最強 durability。

---

# 50. MVP-01 Storage Vertical Slice

MVP 不需要先完成 distributed CAS 或 full UTF-8X v0.22 migration。只需實作：

1. 讀 TW-01 EGIR bundle；
2. 建 `egstore/0.1` manifest；
3. fixed chunking；
4. `identity` codec；
5. optional Brotli codec；
6. decoded/encoded SHA-256；
7. logical-offset index；
8. random range read；
9. repackage identity ↔ Brotli；
10. prove TW-01 object/revision/workspace identities unchanged；
11. simulate corrupted/missing chunk；
12. return typed failure；
13. run benchmark harness；
14. report CR + RA + metadata overhead；
15. expose one experimental UTF-8X adapter later as optional milestone。

MVP 的 storage success condition 是：

$$
\boxed{
\text{Same EGIR World}
+
\text{Different Physical Stores}
+
\text{Same Identities}
}
$$

---

# 51. 與 TW-03 的接口

TW-03 接手：

- live object cache；
- object/revision resolver；
- range-read scheduling；
- spatial prefetch；
- semantic zoom data loading；
- background recompression；
- cache eviction；
- agent/runtime permissions；
- execution scheduler；
- online/offline replica selection；
- UI diagnostics。

TW-03 MAY 根據 viewport/usage 做 adaptive prefetch，但不得把 cache entry 或 spatial index 當 canonical store identity。

---

# 52. 與舊 UTF-8X Repo 的後續工程路線

TW-02 建議未來正式升級 UTF-8X 時不要直接在 v0.22 上無限加功能，而先做三件事。

## 52.1 Extract

將現有 runtime 拆出：

- reversible codec primitives；
- manifest/container parser；
- dictionary logic；
- block index；
- storage/database/governance extensions。

## 52.2 Reclassify

對每個模組標記：

- `codec-layer`；
- `egstore-layer`；
- `runtime-layer`；
- `security/governance-layer`；
- `legacy-only`。

## 52.3 Rebenchmark

修復 Windows portability 後，建立固定 benchmark corpus 和 trace，補齊：

$$
CR,
RA,
WA,
MR,
DR,
T_e,
T_d.
$$

這樣 UTF-8X 才會從「一路長大的研究 container」收斂成可以被 EveGlyph/其他系統真正採用的 storage technology family。

---

# 53. 非主張

TW-02 不主張：

1. UTF-8X 比 Brotli 或 Zstd 普遍壓得更小；
2. 所有資料都應 content-defined chunking；
3. 最大 compression ratio 就是最佳 storage profile；
4. 所有 EGIR 必須使用 `.u8x`；
5. CBOR 應取代 UTF-8 JSON；
6. chunk hash 可以取代 TW-01 object identity；
7. local file path 可以成為 persistent identity；
8. AI 是 decoder 的必要元件；
9. compression dictionary 可以來自未記錄的模型記憶；
10. POSIX durability semantics 可以直接套用 Windows；
11. archive filename metadata 可以被無條件信任；
12. random-access capability 只要「有 index」就已證明；
13. encryption、signature、PKI 已在 TW-02 v0.1 完成。

本文只主張：

> **物理表示可以激進優化，但它必須永遠可回到同一個已驗證的 EGIR semantic state，而且所有 storage trade-off 都必須被量測而不是靠名稱暗示。**

---

# 54. 結論

TW-01 讓 EveGlyph 第一次擁有 machine-verifiable canonical object contract；TW-02 則把這個 contract 從「一份 JSON 檔」提升成真正可演化的 storage architecture。

核心不是建立另一個萬能 container，而是把三件事情分開：

$$
\boxed{
\text{What the object is}
}
$$

由 EGIR 決定；

$$
\boxed{
\text{How the bytes are represented}
}
$$

由 codec/chunk/storage profile 決定；

以及：

$$
\boxed{
\text{Where the physical representation lives}
}
$$

由 physical locator/replica layer 決定。

因此，同一個 mathematical object 可以今天存在 UTF-8 JSON directory store，明天被重新 chunk、Brotli 壓縮、搬到 object store，後天再以 UTF-8X 區域表示快取，而它在 Paper 01/TW-01 意義下仍然是同一個 persistent object lineage 與同一個 immutable revision。

UTF-8X 在這個架構下反而得到更清楚的位置。它不再需要宣稱自己是 UTF-8 replacement，也不必和所有壓縮器拼單一 compression ratio。它真正值得研究的是：

$$
\boxed{
\text{Can region/workload-adaptive reversible representation improve the total storage/compute objective?}
}
$$

而這個 total objective 現在有了可證偽的量測方式：

$$
(CR,RA,WA,MR,DR,T_e,T_d,M_{peak}).
$$

TW-02 至此完成 storage layer freeze。

下一篇 TW-03 不再討論「資料怎麼存」，而要回答：

$$
\boxed{
\text{How does the live Computational Canvas load, resolve, edit, execute, collaborate, and recover over EGIR + EGStore?}
}
$$

---

# References

[1] The Unicode Consortium. *The Unicode Standard, Version 17.0.0*. 2025.

[2] T. Bray. *RFC 8259 — The JavaScript Object Notation (JSON) Data Interchange Format*. 2017.

[3] C. Bormann and P. Hoffman. *RFC 8949 — Concise Binary Object Representation (CBOR)*. STD 94, 2020.

[4] Y. Collet and M. Kucherawy. *RFC 8878 — Zstandard Compression and the `application/zstd` Media Type*. 2021; updated by RFC 9659.

[5] J. Alakuijala and Z. Szabadka. *RFC 7932 — Brotli Compressed Data Format*. 2016.

[6] J. Alakuijala, T. Duong, E. Kliuchnikov, Z. Szabadka, and L. Vandevenne. *RFC 9841 — Shared Brotli Compressed Data Format*. 2025.

[7] Wen Xia, Yukun Zhou, Hong Jiang, Dan Feng, Yu Hua, Yuchong Hu, Yucheng Zhang, and Qing Liu. “FastCDC: a Fast and Efficient Content-Defined Chunking Approach for Data Deduplication.” USENIX ATC 2016.

[8] EveMissLab. *UTF-8X — 區域動態表示架構技術白皮書 v0.1*. 2026.

[9] EveMissLab. *UTF-8X GitHub research engineering baseline v0.22 / BASELINE_REPRODUCTION_REPORT*. 2026.

[10] EveMissLab. *TW-01 — EveGlyph Symbol IR Specification v0.1*. 2026.

[11] EveMissLab. *Paper 00–05 — Addressable Symbolic Computational Space Core Theory Freeze*. 2026.

---

# Appendix A — EGStore Core Formulas

Root payload：

$$
P_{root}=c_1\Vert c_2\Vert\cdots\Vert c_n.
$$

Chunk ID：

$$
ChunkID_i=\text{chunk:sha256:}SHA256(c_i).
$$

Encoded hash：

$$
h_i^{enc}=SHA256(E_k(c_i)).
$$

Read amplification：

$$
RA_d=\frac{B_{decoded}}{B_{requested}}.
$$

Update amplification：

$$
WA=\frac{B_{rewritten}}{B_{logical\ update}}.
$$

Metadata ratio：

$$
MR=\frac{B_{manifest}+B_{index}+B_{metadata}}{B_{decoded}}.
$$

Dedup gain：

$$
DR=1-\frac{B_{unique\ chunks}}{B_{logical}}.
$$

Multi-objective cost：

$$
J(\Pi)=
w_s CR+w_r RA_d+w_w WA+w_m MR+w_tT_d+w_eT_e-w_dDR.
$$

---

# Appendix B — Normative Support Artifacts

TW-02 package 包含：

- `TW-02_Support/schemas/eveglyph-storage-manifest.schema.json`
- `TW-02_Support/examples/example_store/manifest.json`
- `TW-02_Support/examples/example_store/chunks/*.bin`
- `TW-02_Support/conformance/tw02_vectors.json`
- `TW-02_Support/tools/validate_tw02.py`
- `TW-02_Support/tools/benchmark_tw02.py`
- `TW-02_Support/BENCHMARK_BASELINE.md`
- `TW-02_Support/benchmark_baseline.json`
- `TW-02_Support/benchmark_corpus_00-05_TW01.md`

`validate_tw02.py` 是 reference validator，不是唯一允許的 implementation。

任何獨立 implementation 只要在本文定義的 equality / hash / manifest / error semantics 下通過同一 vectors，即可宣告 TW-02 v0.1 compatible storage core。
