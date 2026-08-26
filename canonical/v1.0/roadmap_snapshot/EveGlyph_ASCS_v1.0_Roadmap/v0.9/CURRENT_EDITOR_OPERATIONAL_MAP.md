# Current EveGlyph Editor → v0.9 Operational Map

The current editor remains a useful prototype baseline; v0.9 classifies which pieces can migrate directly and which cannot satisfy a production profile unchanged.

| Current behavior | v0.9 classification | Handoff action |
|---|---|---|
| localhost Vite bridge + Host/Origin checks | development ingress boundary | keep for dev; production desktop/runtime needs stronger process/app boundary |
| `resolveInside` workspace confinement | capability/path confinement primitive | preserve and test with canonical capability scope |
| local CLI agent auto-approve | external-effect executor | keep only behind v0.7 capability + review/policy + hard resource limits |
| 180-second agent timeout | hard runtime budget precedent | move into versioned resource budget profile |
| git snapshot/diff Accept/Reject | legacy review adapter | preserve as compatibility UI; disclose destructive reset/clean loss set before reject |
| `.eveglyph/rules.md` elevated prompt authority | legacy context directive | migrate to v0.7 typed context source + explicit workspace trust/approval |
| API keys in localStorage plaintext | prototype-only secret handling | **not production-conformant**; move to OS keychain / external secret provider |
| remote MCP loopback + bearer token | authenticated transport adapter | keep adapter-neutral; add rate/resource/audit scope for production remote use |
| local JSONL monitor (5 MB rotation) | telemetry prototype | keep optional, add redaction/retention/schema and OTel-compatible exporter adapter |
| monitor failure ignored | correct observability failure isolation | preserve: telemetry outage cannot break editor |

The product migration must not treat the current filesystem/git state as canonical ASCS identity. It remains an adapter until EGIR/EGStore-backed product implementation lands.
