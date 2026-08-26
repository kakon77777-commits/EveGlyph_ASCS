# v0.9 Recovery & Crash Matrix

| Failure | Canonical source of truth | Automatic action | Human decision |
|---|---|---|---|
| UI/browser crash | committed EGStore + optional recovery capsule | reopen canonical state, discard transient derived cache | restore draft only if capsule is valid |
| runtime process crash | committed EGStore manifest | validate and rebuild caches/indexes | inspect failed external task if any |
| power loss during store write | previous committed manifest | ignore incomplete new manifest/chunks unless commit durability gate passed | none normally |
| corrupt chunk | manifest + verified replicas | reject corrupt replica, try verified replica | recover from backup if no valid replica |
| missing chunk | manifest | enter degraded/unavailable state | restore from backup/replica |
| stale spatial/semantic index | canonical revision pin | rebuild index | none |
| unresolved merge conflict | canonical conflict object | reopen conflict state | resolve explicitly |
| external-effect outcome unknown | effect intent + provenance | **do not replay** | reconcile actual external state |
| interrupted migration | checkpoint + migration plan | resume restart-safe step or rollback | approve lossy/irreversible step |
| bad application release | release manifest | activate verified rollback package | approve rollback when data/schema constraints require |

Recovery MUST prefer explicit `unknown`, `degraded`, or `manual-recovery` over invented data.
