# Validation, Benchmark & Release Gates — ASCS v1.0

## Gate 0 — Source Integrity

Required：

- UTF-8 canonical text source；
- LF-only；
- no disallowed control characters；
- JSON parse；
- Python/JS syntax where applicable；
- SHA-256 manifests；
- ZIP integrity。

Failure = release artifact invalid。

---

## Gate 1 — Schema / Structural

- JSON Schema Draft 2020-12；
- required IDs / profile versions；
- no unknown critical extensions；
- typed addresses / records。

Schema valid 不代表 semantic conformant。

---

## Gate 2 — Semantic / Hash

- content address recompute；
- revision address recompute；
- workspace revision recompute；
- parent/reference existence；
- identity/content separation；
- authority boundary；
- binder/scope/evidence checks；
- candidate profile invariants。

---

## Gate 3 — Runtime Transaction

至少包含：

- move；
- edit；
- clone；
- stale conflict；
- relation candidate / promotion；
- native execution；
- capability denial non-mutation；
- serialize / rehydrate。

---

## Gate 4 — History / Spatial

- branch / merge；
- conflict object；
- revert；
- crash recovery；
- nested transform；
- KeepWorld / KeepLocal；
- spatial candidate authority；
- layout/execution graph separation。

---

## Gate 5 — Math / Glyph

- NCM scope/equality/evidence；
- exact/approx separation；
- computed / verified / proved separation；
- glyph family/variant；
- GSC bridge fidelity；
- glyph binding requires explicit authority。

---

## Gate 6 — Agent / Interchange

- principal != model/session；
- context pack hash pins；
- base revision；
- capability；
- direct mode boundary；
- external-effect replay policy；
- fidelity report；
- external reference non-authority。

---

## Gate 7 — Operational

- default-deny；
- secret redaction；
- hard/soft resource budget behavior；
- crash/recovery matrix；
- ExplainResolution/Mutation/Execution；
- migration dry-run；
- rollback target；
- telemetry failure isolation。

---

# Benchmark Classes

Benchmark 不是「跑得快」的單一數字。

## Storage

$$
(CR,RA,WA,MR,DR,T_e,T_d,M_{peak}).
$$

## Canvas

至少量測：

- objects / regions count；
- viewport materialization latency；
- pan/zoom frame budget；
- spatial parse latency；
- cache rebuild time。

## Runtime

- command validation latency；
- commit latency；
- conflict detection latency；
- reopen/rehydrate time。

## Agent

- context-pack bytes；
- proposal validation time；
- commit/review overhead；
- external-effect rate/error class。

## Math / Glyph

- graph size；
- backend execution time；
- proof/validation time；
- glyph compile/render time；
- cache hit/miss。

所有 benchmark 都要記錄 hardware/runtime/profile/version；不能把不同環境數字混成同一條 regression baseline。

---

# Product Release Gate

任何 product RC 要同時具備：

```text
[ ] source integrity
[ ] all required conformance suites
[ ] migration dry-run
[ ] backup/checkpoint plan
[ ] recovery tests
[ ] security policy tests
[ ] resource budget tests
[ ] benchmark report
[ ] compatibility matrix
[ ] release manifest
[ ] SHA-256 artifact manifest
[ ] rollback target
[ ] release notes with known limitations
```

只要 rollback target 或 migration evidence 缺失，就不能因為「功能都能用」而升 production release。
