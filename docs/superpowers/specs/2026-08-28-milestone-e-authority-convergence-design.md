# EveGlyph_ASCS Milestone E — Authority Convergence Design

**Status:** Design candidate for implementation planning  
**ASCS base:** `main@3590b11b6d1304292181394034d9c4114ec777f9`  
**Security upstream reference:** `kakon77777-commits/eveglyph-editor@061a57ebd3f86dd6df83e6ff8472f5e194c567e5`  
**Security upstream Git tree:** `664934916c950303ad7e9d166f7aa36a07ac4c57`  
**Canonical authority:** `canonical/v1.0/` remains read-only semantic authority.  
**Product rule:** battle-tested EveGlyph security/runtime code is an implementation upstream, not ASCS ontology or canonical authority.

---

## 1. Goal

Milestone E converges the already-merged ASCS identity, transaction, persistence, history, spatial, Native Math and Native Glyph layers with the now-mature EveGlyph security/runtime line.

The new upstream EveGlyph main already contains, after local security review and fixes:

- provider-neutral capability sandbox foundation;
- GitHub OAuth + capability-gated read-only repository connector;
- Google OAuth + capability-gated read-only Drive connector;
- OS-keyring-backed persistent credential broker with fail-closed behavior;
- one-use / short-lived credential delegation tickets;
- delegated read-only MCP connector operations;
- localhost/Vite product bridges;
- stdio MCP and remote HTTP MCP;
- Wasmtime 48.0.0 physical document sandbox;
- security boundary verification scripts and regression tests;
- reviewed fixes for Windows named-pipe framing, sandbox bypass, prototype-chain capability lookup, unsafe wildcard matching, Google export buffering, credential-shaped result filtering and delegated-result credential-id disclosure.

Upstream main `061a57eb...` records **135/135 tests passing** plus build and dynamic verification after the Wasmtime merge.

Milestone E does **not** copy this runtime into ASCS unchanged. It rebinds it to the frozen ASCS v0.7 agent/authority/effect model and v0.9 recovery/operational model so that:

```text
credential != identity
identity != capability
capability != delegation ticket
delegation ticket != canonical mutation authority
transport authentication != principal
agent output != proposal
proposal != approval
approval != commit
unknown external effect != failed effect
compensation != rollback
```

The final result is a single authority architecture in which MCP, HTTP, CLI, OAuth, connectors, local agents and Wasmtime are adapters or execution runtimes behind ASCS principal, run, capability, proposal, effect and review semantics.

---

## 2. Authoritative inputs

### 2.1 ASCS v1.0 handoff

`canonical/v1.0/` remains immutable authority.

The v1.0 handoff pins, among others:

```text
agent-principal/1.0-candidate.1
agent-context-pack/1.0-candidate.1
agent-run/1.0-candidate.1
agent-proposal/1.0-candidate.1
capability-grant/1.0-candidate.1
agent-review-policy/1.0-candidate.1
external-effect/1.0-candidate.1
agent-adapter/1.0-candidate.1
```

### 2.2 ASCS v0.7 Agentic Workspace

Archive:

`canonical/v1.0/source_archives/EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip`

SHA-256:

`ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c`

This is the frozen semantic source for Principal, Context Pack, Run, Proposal, Capability Grant, Review, External Effect and Agent Adapter behavior.

### 2.3 ASCS v0.9 Productization / Operational Hardening

Archive:

`canonical/v1.0/source_archives/EveGlyph_ASCS_v0.9_Productization_Hardening_Round_Complete.zip`

SHA-256:

`7d81834c52694934a5e05012533824980cd242a028d862e400d7e0fa158b7376`

This is the frozen operational source for recovery, resource budgets, explainability and the rule that uncertain external effects are reconciled rather than blindly replayed.

### 2.4 EveGlyph security implementation upstream

Repository:

`kakon77777-commits/eveglyph-editor`

Pinned implementation reference:

`061a57ebd3f86dd6df83e6ff8472f5e194c567e5`

Git tree:

`664934916c950303ad7e9d166f7aa36a07ac4c57`

Important reviewed lineage includes:

- `5405255f...` — merged capability sandbox + GitHub/Google connectors + credential vault + MCP delegation with local security fixes;
- `2ac9dfde...` — Wasmtime physical document sandbox implementation;
- `061a57eb...` — reviewed Wasmtime merge to current main.

This upstream is **implementation evidence only**. It cannot redefine the frozen v0.7/v0.9 profiles.

---

## 3. Architectural approaches considered

### Approach A — import EveGlyph security runtime as ASCS authority

Rejected.

The upstream runtime has excellent implementation boundaries, but `CapabilitySession`, OAuth identities, bearer tokens, credential handles and delegation tickets are runtime constructs. Promoting them directly to canonical ASCS identity/authority would collapse distinctions already frozen in v0.7.

### Approach B — reimplement security independently inside ASCS

Rejected.

This would create two diverging security systems and throw away battle-tested implementation work, including the local security fixes and real Wasmtime tests.

### Approach C — **selected: canonical ASCS authority + battle-tested runtime rebinding**

```text
ASCS durable authority truth
    Principal / Run / Proposal / Grant / Effect / Review
                      ↓ compile / bind
EveGlyph security runtime
    CapabilitySession / Credential Broker / Delegation / Connectors / Sandbox
                      ↓
Transport + provider adapters
    MCP / HTTP / CLI / GitHub / Google / Wasmtime
```

Advantages:

- preserves frozen ASCS semantics;
- reuses reviewed security implementation;
- keeps secrets and transport state outside canonical EGIR;
- supports future write connectors without redesigning the authority model;
- preserves current product behavior through adapters rather than a Big-Bang rewrite.

---

## 4. Decision 1 — complete external-effect contract, read-only implementation first

Milestone E canonical/runtime contracts MUST support the full effect classes already frozen in v0.7:

```text
external-read
external-write
external-process
external-network
```

The implementation delivered in the early E slices only enables the currently reviewed provider surfaces:

- GitHub read-only repository contents;
- Google Drive metadata list;
- Google Drive exact-file read / Google Docs export;
- Wasmtime bounded document execution;
- existing workspace/filesystem operations through governed adapter paths.

No GitHub/Google provider write API is added merely to prove the contract.

The design MUST nevertheless support future external writes, unknown outcomes, replay policy, reconciliation and compensation without changing Principal / Grant / Effect ontology later.

---

## 5. Decision 2 — Principal model

### 5.1 Durable execution identity

All authority-bearing autonomous execution MUST resolve to an existing frozen `AgentPrincipal`.

Frozen principal classes remain sufficient:

```text
ai-agent
automation
hybrid-agent
```

Milestone E does not introduce a Universal Principal v2.

### 5.2 Controller and external identities remain separate

```text
Human / Organization / System
= controller / issuer / reviewer
!= AgentPrincipal

Provider / Model
= AgentRun binding/provenance
!= Principal

MCP client / HTTP request / CLI process
= transport or adapter context
!= Principal

GitHub / Google OAuth identity
= connected external identity
!= Principal

Credential handle
= secret-custody reference
!= identity
!= capability

Delegation ticket
= short-lived operation authority
!= identity
!= durable grant
```

OAuth authentication MUST never synthesize canonical authority.

A connector or background service that requires autonomous execution is represented by an explicit installation/runtime `automation` principal; it is never inferred from a token string, process id, socket id, OAuth `sub`, MCP session or cwd.

---

## 6. Decision 3 — three-layer authority model

Authority is layered and one-way:

```text
Layer 1 — Durable Authority
ASCS CapabilityGrant
        ↓ compile
Layer 2 — Runtime Enforcement View
EveGlyph CapabilitySession
        ↓ narrow
Layer 3 — Delegated Operation Authority
short-lived Delegation Ticket
        ↓
Credential use / provider operation
```

No lower layer can create or expand an upper-layer authority.

### 6.1 Durable CapabilityGrant

`capability-grant/1.0-candidate.1` remains the source of durable scope-aware authority.

A runtime must be able to identify at least:

```text
grant id
subject principal
capability
effect class
scope / resource constraints
conditions
issuer/controller
policy revision
validity window
provenance
```

Milestone E MUST NOT silently change the frozen profile. Runtime-only fields such as EveGlyph `once/session/workspace/until/persistent` lifetimes are represented by additive binding records when needed.

Proposed additive implementation profile:

`authority-runtime-binding/1.0-candidate.1`

### 6.2 CapabilitySession

EveGlyph `CapabilitySession` becomes a **compiled runtime view**, not durable authority.

Conceptually:

```text
CapabilitySession = Compile(
  principal,
  run,
  pinned grant set,
  review-policy revision,
  tool-catalog revision,
  runtime-policy revision
)
```

A process restart may destroy/rebuild the session. Rebuilding MUST use the Run's pinned authority inputs, not the newest/widest available grants.

A grant issued after a run started does not silently widen that run.

### 6.3 Delegation ticket

The reviewed EveGlyph delegation ticket remains an opaque, short-lived operation capability.

It is exactly bound to:

```text
provider
operation
capability
resource
actor/principal binding
expiry
remaining uses
```

Raw ticket values are never canonical records. Current upstream behavior of storing only ticket hashes is preserved.

The current in-memory broker relies on synchronous Node run-to-completion for one-use consumption. Milestone E MUST define the delegation-store contract as **atomic compare-and-consume** so that any future async/multi-process store cannot weaken the one-use guarantee. The existing synchronous in-memory broker is a valid adapter implementation of that stronger contract.

---

## 7. Credential custody boundary

Credential availability never implies authority availability.

```text
Credential restored     != Grant restored
OAuth identity restored != Agent authority restored
```

The reviewed OS-keyring broker remains the default secret-custody implementation.

Secrets MUST NOT enter:

```text
EGIR intrinsic content
workspace canonical state
AgentProposal payloads
ExternalEffect records
history snapshots
publication artifacts
MCP results
monitor/audit logs
Git history
```

Canonical/runtime evidence may hold only redacted references/digests such as:

```text
connected_identity_ref
credential_handle_ref
delegation_id
transport credential fingerprint
provider request id
```

Never raw:

```text
access token
refresh token
client secret
Authorization header
delegation ticket
keyring envelope
```

After process restart, provider identity/credential may be restored from the keyring, but connector capability grants and delegation tickets return to zero unless separately reconstructed through their own authority flow.

---

## 8. Decision 4 — External Effect as logical saga / effect ledger

Milestone E MUST NOT claim a distributed transaction between EGStore/WorkspaceRuntime and GitHub, Google, filesystem, CLI processes or arbitrary MCP providers.

```text
Canonical transaction != provider transaction
```

A logical external intent is represented by the frozen `external-effect/1.0-candidate.1` record. Physical attempts and reconciliation are additive evidence.

Proposed additive implementation profiles:

```text
external-effect-attempt/1.0-candidate.1
external-effect-reconciliation/1.0-candidate.1
```

### 8.1 Frozen effect states remain unchanged

```text
intent
authorized
started
succeeded
failed
unknown
cancelled-before-start
```

Reconciliation is an evidence process, not a silent new frozen status.

### 8.2 `failed` and `unknown` are distinct

`failed` requires evidence that the effect did not complete successfully or was explicitly rejected.

If an operation was delivered or may have committed but the result cannot be determined, status is `unknown`.

```text
request sent
provider may have committed
connection lost
no authoritative response
→ unknown
```

Unknown MUST NOT be rewritten to failed merely to make retry convenient.

### 8.3 Replay policies

Frozen replay-policy vocabulary is enforced precisely:

```text
at-most-once
  Once started, never automatic replay after uncertainty.

idempotent
  Replay may occur for the same logical effect only when the adapter/provider
  supplies a real stable idempotency contract and stable idempotency key.

safe-retry
  Automatic retry only after evidence establishes that the prior attempt did
  not apply, or failed before the external commit boundary. Unknown alone is
  insufficient.

manual
  Never automatic replay.
```

### 8.4 Logical effect vs physical attempt

Retries do not create new authority or erase history.

```text
ExternalEffect E
├─ Attempt A1 → unknown
├─ Reconciliation R1 → confirmed-not-applied
└─ Attempt A2 → succeeded
```

Every physical attempt records its own attempt id, authorization evidence, delegation evidence, normalized target, start time, transport observation and outcome.

### 8.5 Reconciliation

Reconciliation may use:

```text
provider read-back
provider request-id lookup
ETag / external revision lookup
idempotency-key lookup
object existence/version check
human confirmation
```

Reconciliation decisions may include:

```text
confirmed-succeeded
confirmed-not-applied
confirmed-diverged
still-unknown
```

An effect remains `unknown` until sufficient evidence resolves reality.

### 8.6 Compensation

Compensation is a new authorized external effect that counteracts an earlier successful effect.

```text
Effect A: succeeded
Effect B: compensates=A
```

Compensation is never rollback and may itself fail or become unknown.

---

## 9. External observations never become canonical truth directly

Current read-only connectors execute:

```text
Principal
→ Run
→ Capability
→ optional Delegation
→ Credential Broker
→ Provider Read
→ ExternalEffect(external-read)
→ Observation
```

A provider result is evidence/observation, not canonical ASCS truth.

If content from GitHub/Drive should enter ASCS:

```text
Observation
→ Candidate / Proposal
→ Validate
→ Authorize
→ Review Policy
→ WorkspaceRuntime Commit
```

A provider callback or MCP tool result MUST NOT directly mutate EGIR.

---

## 10. Decision 5 — unified Ingress Adapter architecture

All request channels are adapters:

```text
MCP stdio
Remote MCP HTTP
Local HTTP/Vite
Local Agent CLI
future SDK/API
```

They first normalize into a common runtime envelope.

Proposed additive implementation profile:

`ingress-binding/1.0-candidate.1`

Conceptual envelope:

```text
IngressEnvelope
├─ ingress_id
├─ adapter_profile
├─ transport_kind
├─ transport_auth evidence
├─ principal binding
├─ workspace scope
├─ run binding
├─ client metadata
├─ normalized request
├─ received_at
└─ policy revision
```

Hard invariant:

```text
TransportAuth != Principal != Grant != OperationAuthority
```

Every authority-bearing ingress follows:

```text
Ingress
→ normalize
→ principal resolution
→ AgentRun
→ authority compilation
→ operation routing
```

### 10.1 Remote MCP compatibility

Current remote MCP bearer-token authentication is retained for compatibility during Milestone E.

It is downgraded semantically to transport authentication for an explicit **Ingress Binding**.

```text
Bearer token
→ authenticate ingress binding
→ resolve principal + workspace scope
→ AgentRun
```

The raw token is secret material and is not the Principal or a CapabilityGrant.

Milestone E does not require immediate OAuth/mTLS/DPoP replacement for remote MCP. Those remain later transport-hardening options.

### 10.2 Stateless transport != stateless ASCS

The current remote MCP creates a fresh server per HTTP request. That does not define AgentRun identity.

```text
MCP session/client id != AgentRun
```

ASCS run/task/proposal ids are durable logical records independent of transport-session lifetime.

### 10.3 Local HTTP

Localhost Host/Origin checks and opened-workspace confinement remain defense-in-depth transport controls.

```text
localhost != authority
confirmed cwd != persistent workspace identity
```

Human direct UI edits may continue to use explicit human authority. Agent/automation operations initiated through the UI resolve an AgentPrincipal and AgentRun.

---

## 11. Decision 6 — unified Proposal / Review / Canonical Mutation path

All Agent-originated or autonomous adapter-mediated canonical mutations are Proposal-first.

```text
Ingress
→ Principal
→ AgentRun
→ AgentProposal
→ deterministic validation
→ capability authorization
→ review-policy evaluation
→ review decision when required
→ CanonicalCommandRouter
→ WorkspaceRuntime
→ commit
```

The existing WorkspaceRuntime remains the only canonical mutation engine. Milestone E does not replace its current sequence:

```text
base revision check
→ authority check
→ clone draft
→ mutate draft
→ provenance event
→ workspace revision/hash
→ canonical validation
→ extension validation
→ atomic swap
```

### 11.1 `direct` mode is not bypass mode

Frozen modes remain semantically distinct:

```text
suggest
  no canonical mutation

patch
  proposal + review required

direct
  proposal + policy-eligible automatic review/approval
```

Even direct mode MUST NOT skip:

- Proposal creation;
- deterministic validation;
- capability authorization;
- exact-base conflict check;
- review-policy evaluation;
- canonical validation;
- WorkspaceRuntime transaction.

### 11.2 Review evidence

The frozen Proposal/Review fields remain unchanged. Rich runtime review evidence is additive.

Proposed implementation profile:

`agent-review-decision/1.0-candidate.1`

A review decision binds at least:

```text
review id
proposal id
policy id + revision
decision
reviewer/controller
reason
validated proposal digest
relevant authority/grant snapshot digest
base workspace revision
timestamp
```

Possible runtime decisions:

```text
approved
rejected
auto-approved
needs-human
```

Approval is invalidated by any material change to commands, target, base revision, required capability or replay policy.

### 11.3 Conflict behavior

A proposal approved against workspace revision W1 cannot be silently recommitted against W2.

On stale base:

```text
proposal → conflicted
```

Any rebase/regeneration creates or updates a proposal with fresh validation and, when policy requires, fresh review.

No blind stale recommit.

---

## 12. Canonical vs external command routing

Proposal commands are separated into two families.

### Canonical commands

```text
edit intrinsic
move object
clone object
relation mutation
Native Math mutation
Native Glyph mutation
history/spatial extension mutation
```

Route:

```text
Proposal
→ Validate
→ Authorize
→ Review
→ CanonicalCommandRouter
→ WorkspaceRuntime
```

### External-effect commands

```text
external-read
external-write
external-process
external-network
```

Route:

```text
Proposal
→ validate intent
→ authorize
→ review
→ ExternalEffect
→ EffectAttempt
→ observe/reconcile
```

External results that should modify canonical state re-enter through Candidate/Proposal. They do not bypass the canonical command router.

---

## 13. Current MCP `write_file` convergence

The MCP tool name MAY remain for compatibility, but its authority semantics change.

Current upstream behavior physically writes after workspace confinement. Milestone E routes it through:

```text
MCP write_file
→ Ingress Adapter
→ workspace.write capability request
→ AgentRun / Proposal
→ review policy
→ ExternalEffect(external-write, workspace-file)
→ governed filesystem write
```

A physical file write is not a canonical EGIR write:

```text
FileWrite != CanonicalWrite
```

If the written file maps to/imports an ASCS object, a separate importer/diff adapter creates a candidate/proposal that then enters the canonical transaction path.

Product compatibility may allow one MCP call to complete the physical file effect automatically when the pinned ingress/review policy permits it; this is still governed authority, not a raw `fs.writeFile()` bypass.

---

## 14. Local Agent / legacy file-agent convergence

Current Claude/Codex/Gemini CLI execution is preserved as a legacy adapter, not promoted to canonical authority.

```text
AgentPrincipal
→ AgentRun
→ model/provider binding
→ FileAgentAdapter
→ ExternalEffect(external-process)
→ filesystem external effects
→ Git/diff adapter
→ AgentProposal
→ deterministic validation
→ review
→ WorkspaceRuntime
```

The existing PatchMD-style snapshot/diff/accept workflow therefore becomes the product implementation of the frozen file-agent migration pattern.

Current UI permission tiers (`cautious`, `standard`, `trusted`) remain useful UX templates and real CLI flag selectors, but they MUST NOT become magical hidden authority enums.

Conceptually:

```text
permission tier
→ capability template compiler
→ explicit scoped grants / operational policy
```

`trusted` does not mean unrestricted ASCS authority.

---

## 15. Wasmtime convergence

The reviewed Wasmtime 48.0.0 runtime remains a physical execution adapter under the capability control plane.

```text
AgentRun
→ execute_wasm_document operation
→ CapabilitySession
→ WasmtimeExecutionAdapter
→ ExternalEffect(external-process)
→ execution evidence
```

The existing physical boundary is preserved:

- only `wasi_snapshot_preview1.fd_read`, `fd_write`, `proc_exit` imports;
- `_start` entrypoint;
- no filesystem preopens;
- no provider credential/env inheritance;
- bounded module/input/output sizes;
- fuel, memory, stack and wall-clock limits;
- exact runtime-version pin;
- stable redacted errors.

Wasmtime success is computation evidence, not canonical commit authority.

Its output may become ephemeral result, candidate, proposal input or validator evidence only.

Milestone E MUST test against the real pinned Wasmtime runtime rather than mocks for the physical-boundary gate.

---

## 16. Binding map from reviewed EveGlyph runtime to ASCS

| EveGlyph upstream component | Milestone E semantic role |
| --- | --- |
| `src/capabilities/model.js` / `session.js` | runtime enforcement view compiled from ASCS grants |
| sandbox profiles / MCP capability map | tool/runtime capability templates, never durable authority by themselves |
| GitHub / Google OAuth | connected external identity establishment only |
| memory/persistent credential broker | secret-custody sidecar |
| OS keyring vault | physical persistent secret store |
| delegation broker | short-lived narrow operation authority; atomic consume contract |
| delegation IPC/client | credential-free process boundary |
| delegated connector runtime | provider-operation adapter behind ASCS Effect/Run evidence |
| GitHub/Google services | current read-only external-read adapters |
| stdio MCP | ingress adapter |
| remote HTTP MCP + bearer token | compatibility transport auth + Principal-aware ingress binding |
| Vite local HTTP | local UI/agent ingress adapter |
| Wasmtime document service/runtime | external-process sandbox adapter |
| Claude/Codex/Gemini local agent | legacy file-agent adapter |
| monitor/security verifiers | runtime evidence / observability inputs |

No row above becomes canonical authority merely because the upstream implementation already enforces security locally.

---

## 17. Package and product boundaries

Milestone E SHOULD reuse the product-convergence package layout rather than introduce a parallel security tree.

### `packages/ascs-agent/`

Owns implementation of frozen v0.7 logical records and orchestration:

- AgentPrincipal;
- Context Pack;
- AgentRun;
- AgentProposal;
- Review Policy / Review Decision;
- proposal digest/invalidation;
- CanonicalCommandRouter;
- legacy Agent Adapter contracts.

### `packages/ascs-ops/`

Owns operational/runtime authority binding:

- capability/runtime binding;
- Authority Compiler;
- Ingress Binding / envelope normalization;
- External Effect ledger;
- EffectAttempt;
- reconciliation;
- replay/idempotency policy enforcement;
- delegation-store atomic contract;
- redacted operational evidence.

### `apps/eveglyph-editor/`

Owns product adapters only:

- reviewed upstream capability/session implementation;
- keyring credential runtime;
- GitHub/Google read-only connectors;
- MCP stdio/remote ingress;
- local Vite ingress;
- Wasmtime physical sandbox;
- local CLI agent adapter;
- user-facing grant/review/connector UX.

Browser global APIs MUST remain safe facades. They MUST NOT expose raw WorkspaceRuntime, secret brokers, keyring objects, raw delegation tickets beyond explicit issuance UX, or trusted arbitrary mutate callbacks.

---

## 18. Canonical provenance without EGIR silent change

Milestone E does not modify `egir/0.1` or `egir-cj/0.1` semantics.

A successful Agent-originated commit MUST be traceable through references/digests to:

```text
workspace revision
event id
proposal id
run id
principal id
grant ids / authority snapshot
review decision / policy revision
adapter + model binding
```

Large authority/review/effect records live in additive sidecars/persisted runtime stores. EGIR event metadata may contain references/digests, not secret-bearing payloads.

---

## 19. Upstream lineage rule

The original product `UPSTREAM_BASELINE.json` is historical provenance and MUST NOT be regenerated merely because EveGlyph upstream advanced.

Milestone E0 introduces a new, explicit security-upstream lineage pin for:

```text
repository = kakon77777-commits/eveglyph-editor
commit = 061a57ebd3f86dd6df83e6ff8472f5e194c567e5
git_tree = 664934916c950303ad7e9d166f7aa36a07ac4c57
```

Only explicitly mapped files/components may be absorbed/rebound. This preserves:

```text
historical product baseline
+
ASCS overlay evolution
+
new reviewed security upstream lineage
```

rather than rewriting history into a new fake baseline.

---

## 20. Sequential delivery — E0 through E7

Milestone E is too large for one PR. It is delivered as eight sequential slices, each merged before the next begins.

### E0 — Security Upstream Reference Freeze

Goal: freeze and verify the new implementation upstream without changing authority behavior.

Deliverables:

- exact upstream repository/commit/tree pin;
- file/hash import map for security modules;
- reviewed security-fix evidence map;
- current upstream test/build evidence contract;
- product-convergence lineage extension that does not rewrite the historical upstream baseline;
- RED/reference gates for later E slices.

No provider write surface. No canonical mutation behavior change.

### E1 — Agent Principal / Run / Proposal / Review Kernel

Goal: implement frozen v0.7 logical agent records in `packages/ascs-agent`.

Deliverables:

- Principal / Context Pack / Run;
- Proposal modes and status machine;
- proposal digest and stale-base behavior;
- review-policy evaluation and additive review-decision evidence;
- frozen v0.7 vectors through generic production semantics;
- no MCP/credential integration yet.

### E2 — Authority Compiler / Capability Runtime Binding

Goal: make ASCS CapabilityGrant the authority source and EveGlyph CapabilitySession the runtime compiled view.

Deliverables:

- grant pinning to runs;
- authority-runtime binding profile;
- capability template compiler;
- compiled canonical mutation authority;
- no client-constructed authority objects;
- once/session expiry semantics without silent durable-grant mutation;
- capability audit evidence bound to principal/run.

### E3 — External Effects + Credential / Delegation / Connector Binding

Goal: rebind reviewed keyring, delegation and read-only connectors to ASCS effect semantics.

Deliverables:

- ExternalEffect ledger;
- EffectAttempt and reconciliation evidence;
- replay policy engine;
- credential references with zero secret leakage;
- atomic delegation-store contract + current broker adapter;
- GitHub/Google read-only adapters;
- restart invariant: credential may restore, grants/tickets do not;
- no provider write API yet.

### E4 — MCP / HTTP Principal-aware Ingress

Goal: route stdio MCP, remote MCP and local HTTP through common ingress/principal/run/authority flow.

Deliverables:

- IngressEnvelope / IngressBinding;
- bearer-token compatibility as transport auth only;
- principal-aware remote-MCP binding;
- MCP tool capability map becomes real enforcement;
- base tool operations routed through authority/effect paths;
- `write_file` compatibility routed as governed filesystem external-write, not canonical bypass;
- delegated connector tools preserve ticket + live-grant + resource-recomputation gates.

### E5 — Wasmtime Execution Evidence Rebinding

Goal: treat Wasmtime as a governed external-process adapter.

Deliverables:

- execution effect/attempt evidence;
- capability evidence bound to run/principal;
- exact Wasmtime 48.0.0 physical tests;
- import denial, fuel, memory, stack, timeout and output-limit evidence;
- no Wasmtime output receives canonical authority automatically.

### E6 — Legacy Local Agent / File Adapter

Goal: converge Claude/Codex/Gemini local-agent workflow with frozen file-agent Proposal semantics.

Deliverables:

- AgentRun binding to model/provider/CLI;
- external-process effect for CLI spawn;
- filesystem changes as external effects;
- git snapshot/diff as proposal-generation adapter;
- cautious/standard/trusted compiled to policy/capability templates;
- Accept/Reject implemented as Review Decision / compensation or discard semantics where applicable;
- canonical import/commit only through CanonicalCommandRouter.

### E7 — Security / Recovery / Observability Closure

Goal: close Milestone E as a productized authority subsystem.

Required gates include:

- frozen v0.7/v0.9 regression;
- A/B/C/D full regression;
- upstream security reference regression;
- 135-test-class EveGlyph security/product gate or stricter equivalent;
- Windows named-pipe delegated IPC regression;
- prototype-chain and wildcard capability regressions;
- Google bounded-stream regression;
- credential redaction / secret-scan gate;
- credential restore with zero restored grants;
- delegation single-use/expiry/resource mismatch gates;
- unknown-effect recovery: no blind replay;
- reconciliation and compensation tests;
- MCP stateless transport vs durable Run tests;
- product publication/build/dynamic parity;
- exact-head backup and merged-main backup.

---

## 21. Required RED → GREEN discipline

Every E slice follows TDD and evidence-first integration:

1. pin exact frozen/reference inputs;
2. write RED contracts before production implementation;
3. verify legacy A/B/C/D/product gates remain green while the new E gate is red for the intended missing behavior;
4. implement the smallest semantic/runtime slice;
5. run focused tests;
6. run full cross-milestone/product regression;
7. source-freeze exact PR head;
8. produce exact-head source backup;
9. mark PR Ready only after independent verification;
10. merge only after explicit user authorization;
11. produce merged-main authority backup.

Construction-only write workflows MUST be removed before final PR head.

---

## 22. Security invariants

The following are hard Milestone E invariants:

```text
OAuth success != connector authorization
Bearer token success != Agent authority
MCP session != Principal
cwd != persistent workspace identity
credential possession != capability
capability != canonical mutation permission
delegation ticket != durable grant
Agent model/provider != Principal
Agent output != Proposal
Proposal != Approval
DirectMode != BypassMode
FileWrite != CanonicalWrite
External observation != canonical truth
Unknown != Failed
Retry != NewAuthority
Compensation != Rollback
Wasmtime success != Canonical Commit
```

Unknown capability/profile/tool ids fail closed.

Resource scopes are normalized by trusted adapters and authority resources are recomputed server-side; caller-declared resource strings are never trusted as authority truth.

Capability checks occur before credential access and before provider network I/O.

No secret value is emitted into canonical/history/audit/product publication/MCP result artifacts.

---

## 23. Non-goals

Milestone E does not require:

- GitHub/Google write connector implementation;
- universal remote-MCP OAuth;
- replacing bearer-token compatibility immediately;
- mTLS/DPoP deployment;
- a universal distributed transaction protocol;
- secrets inside EGIR;
- replacing Wasmtime with VM/container isolation;
- claiming containment after a native/JIT sandbox escape;
- replacing Claude/Codex/Gemini CLI agents;
- turning transport sessions into durable identities;
- rewriting v0.7/v0.9 frozen profiles;
- changing `egir-cj/0.1` behavior;
- Big-Bang replacement of the EveGlyph product.

Future provider writes and stronger remote transport authentication plug into the authority/effect model defined here without changing its core identity or recovery semantics.

---

## 24. Milestone E completion definition

Milestone E is complete when all E0–E7 slices are merged and independently backed up, and the product can demonstrate this end-to-end property:

```text
Any autonomous request
→ known ingress adapter
→ resolved AgentPrincipal
→ pinned AgentRun
→ compiled capability authority
→ proposal/effect intent
→ deterministic validation
→ review policy
→ authorized canonical command or external effect
→ observable outcome / reconciliation
→ provenance linking result back to principal, run, grant and policy
```

while simultaneously proving:

```text
no transport can manufacture identity
no credential can manufacture capability
no ticket can manufacture durable authority
no external result can directly become canonical truth
no Agent can bypass Proposal/Validate/Authorize/Commit
no unknown external effect is blindly replayed
```

That is the Milestone E authority-convergence contract.