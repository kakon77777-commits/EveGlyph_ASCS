# EveGlyph_ASCS Milestone C — Persistence + History + Spatial Implementation Plan

**Base:** `main@17c57fff08d1c2278823f86b19312ecae9c377cc`

## Goal

Extend the merged Milestone B canonical spine with three adapter/runtime layers while preserving ASCS v1.0 canonical authority and the current EveGlyph product surface:

1. `packages/ascs-store` — TW-02 / `egstore/0.1` logical storage and browser-persistent carrier boundary.
2. `packages/ascs-history` — v0.3 persistent commit DAG / branches / merge / revert / recovery semantics.
3. `packages/ascs-spatial` — v0.4 nested region / affine transform / reparent / policy / grammar semantics.

Milestone C does **not** redefine `egir/0.1`, `egir-cj/0.1`, `egstore/0.1`, `org.evemisslab.history/0.1`, or `org.evemisslab.spatial-region/0.1`.

## Pinned canonical inputs

- Architecture Complete archive: `19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778`
- Computational Canvas MVP archive: `f49a4f419f9b4539aac0721a1ad85f84151cec71bf3da68db22a197303b5cd3f`
- ASCS v0.3 Persistent Editing archive: `8c3aa6f55ac35ee94b8e8e6846d8ece0543b52f6fe1fc8c90a2c4efb16acacfb`
- ASCS v0.4 Spatial Region archive: `29dd5cb0d17f75a2dbc727315a4f341551f8223ead6c5605edd4a36e685adce7`
- TW-02 vectors: `8840e674d4e209357f9244826f669b4fade1095dbf2d184b96ba1e38e9098de3`
- v0.3 history vectors: `c0afe5c97be7b231764874a4c7466636f1cdcf146796f6af04019e336d777d00`
- v0.4 spatial vectors: `c35cb6782227cb0010508211b3aab04675c97324202c2cfb2b8638e94af9b940`

## Frozen boundaries

- storage identity is physical and MUST NOT redefine EGIR object/revision/workspace identity;
- checkpoint commit is atomic: persist first, move branch head only after store success;
- autosave recovery artifact != canonical commit;
- branch is a mutable reference to immutable workspace revisions, not a new workspace identity;
- canonical revert creates a new commit and never deletes the target history;
- merge is multi-channel, not whole-document last-write-wins;
- view pan/zoom/collapse/semantic zoom are projection/session state and do not mutate canonical workspace state;
- spatial region parent graph is acyclic;
- reparent is spatial/placement mutation, not intrinsic object edit;
- AI remains subject to Milestone B authority gate.

---

## Task 0 — Pin fixtures and define RED CI

Create byte-exact test fixtures from the pinned canonical archives:

- TW-02 vectors + example manifest/root payload;
- v0.3 history merge vectors + history profile schema;
- v0.4 spatial vectors + spatial region schema/example.

Add `.github/workflows/milestone-c-persistence-history-spatial.yml` with jobs:

1. `canonical-preservation` — existing repository/v1 checks.
2. `canonical-reference` — TW-01/TW-02/TW-03 + MVP + v0.3/v0.4 schema/vector hashes.
3. `javascript-milestone-c` — Store/History/Spatial tests.
4. `current-eveglyph-product` — bridge/publication/build/dynamic regression.

RED condition: canonical/reference/product jobs stay green while `javascript-milestone-c` fails because C packages are not implemented.

---

## Task 1 — C1: TW-02 logical EGStore

### Package

`packages/ascs-store`

### Required APIs

- `packBytes(bytes, options)`
- `verifyManifest(manifest, chunks)`
- `manifestAddress(manifest)`
- `createMemoryCarrier()`
- `createOpfsCarrier(options?)`
- `createEgStore(carrier, options?)`
- `store.commitBytes(bytes, metadata?)`
- `store.commitBundle(bundle, metadata?)`
- `store.loadManifest(manifestId)`
- `store.loadBytes(manifestId)`
- `store.loadBundle(manifestId)`
- `store.setActive(manifestId)` / `store.getActive()`
- `store.recoverActive()`

### C1 freeze

- required codec: `identity` only;
- fixed independent chunks, default 4096 bytes;
- chunk ID = decoded SHA-256;
- manifest ID exactly follows TW-02 rule: blank `manifest_id`, sorted-key compact JSON, SHA-256, `store:sha256:` prefix;
- physical manifest/chunk identity never becomes EGIR object identity;
- carrier writes chunks first, manifest second, active pointer last;
- Memory carrier declares D0; OPFS carrier declares conservative D1 only — Milestone C MUST NOT claim D2/D3 durability;
- load/recovery verifies manifest ID, chunk existence, encoded/decoded hash, root length/hash, and EGIR semantic validity for bundle loads;
- missing/corrupt state returns typed storage errors and never silently fabricates a root.

### C1 RED→GREEN tests

- exact TW-02 vector reproduces expected manifest/chunk/root hashes;
- deterministic repack of same bytes yields same logical store identity;
- chunk-size change changes store manifest but not decoded root hash;
- active pointer does not move when a staged write fails;
- missing chunk / manifest corruption / decoded-hash mismatch are typed;
- a second store instance over the same carrier can load the committed bundle;
- OPFS carrier module is browser-safe and Vite-buildable.

---

## Task 2 — Add trusted extension transaction seam to Milestone B runtime

Write RED tests before changing `packages/ascs-runtime`.

Add a trusted package-facing API used by Spatial/History command adapters without exposing raw mutation callbacks through the global Editor bridge:

`runtime.commitExtensionMutation({ op, baseWorkspaceRevision, authority, mutate, validateExtension? })`

It MUST preserve the Milestone B ordering:

`base check -> authority -> draft clone -> mutation -> provenance -> workspace parents/hash -> EGIR validation -> optional extension validation -> atomic swap`.

No direct Editor-global callback API is exposed.

---

## Task 3 — C2: Persistent History Repository

### Package

`packages/ascs-history`

### Required APIs

- `createHistoryRepository({ store, initialBundle, branch? })`
- stable branch create/rename/archive operations;
- `checkpoint(bundle, { branchId, expectedHead, authority, reason })`;
- immutable commit lookup by workspace revision;
- load snapshot by workspace revision;
- branch fork within same workspace identity;
- `planMerge({ base, left, right, policy? })`;
- `commitMerge(...)` after conflicts are resolved;
- `revert({ branchId, targetRevision, authority })` producing a new commit;
- `autosaveRecovery(capsule)` with zero branch-head mutation;
- `recoveryDecision(sessionId, currentHead)`;
- `explainHistory(workspaceRevision)`.

### Merge channels

At minimum C2 implements deterministic treatment for:

- object intrinsic/head;
- placement;
- relation head;
- lifecycle/tombstone.

Required v0.3 semantics:

- content-left + placement-right => auto merge;
- concurrent different intrinsic edits => object-content conflict unless a versioned kind merge is supplied;
- concurrent different moves => placement conflict;
- delete-vs-edit / delete-vs-move => lifecycle conflict;
- merge commit parents are `[left,right]`;
- stable branch ID survives rename;
- canonical revert creates a new child of current head;
- autosave does not create a commit;
- head-advanced recovery never silently replays.

All history metadata is sidecar/persistent editing governance; it MUST NOT rewrite frozen TW-01 ontology.

---

## Task 4 — C3: Spatial Region Runtime

### Package

`packages/ascs-spatial`

### Required APIs

- deterministic decimal-affine 2D matrix parse/format/compose/invert;
- `createSpatialModel({ regions, nodes? })`;
- region add/update with frozen profile validation boundary;
- parent forest validation and cycle rejection;
- deterministic world transform composition;
- `reparentKeepWorld(...)`;
- `reparentKeepLocal(...)`;
- `resolvePolicy(...)` / `explainPolicy(...)`;
- `resolveGrammar(...)`;
- semantic zoom/collapse helpers that return projection/session results only;
- cross-region execution boundary helper requiring explicit port contract;
- spatial merge helpers for move-vs-move, intrinsic-edit+region-move, parent-delete+child-edit.

### Numeric rule

Canonical-facing matrix fields remain decimal strings. The implementation must avoid using a binary-float dump as canonical output. Use exact finite-decimal rational arithmetic for affine compose/invert where possible; reject non-invertible transforms explicitly.

### C3 conformance

All 18 supplied v0.4 spatial vectors must be executable as real function calls, not hard-coded vector-ID switches.

---

## Task 5 — Hidden EveGlyph C bridge

Extend the existing hidden ASCS registration without replacing visible Editor state.

Expose only safe factories/operations such as:

- `createPersistentWorkspace(...)`
- `createHistoryRepository(...)`
- `createSpatialModel(...)`

Do not expose raw carrier mutation, raw canonical draft swap, or trusted extension callback through `globalThis`.

Product overlay must explicitly record all Milestone C additions/modifications; Milestone A upstream baseline remains immutable provenance.

---

## Task 6 — Full validation and exact-head backup

Final exact-head gates:

- canonical repository preservation;
- ASCS v1 regression + validator;
- TW-01 / TW-02 / TW-03 reference validators;
- MVP suite;
- all C1/C2/C3 JS tests;
- v0.3 history schema + vector conformance;
- v0.4 spatial schema + 18-vector conformance;
- generated C snapshots revalidated with frozen schemas where applicable;
- Milestone B core/runtime tests remain green;
- Product Convergence overlay verifier green;
- Editor bridge tests;
- publication 22/22;
- Vite build;
- Dynamic Logic / Dynamic Rendering.

Then produce the standard exact-head source backup ZIP containing:

- complete source snapshot excluding transient dependencies/build output;
- `BACKUP_MANIFEST.json`;
- `SHA256SUMS.txt`;
- `PR.patch`;
- `RESTORE.md`;
- external `ARTIFACT_SHA256.txt`.

Do not mark Ready for Review until the downloaded artifact is independently revalidated outside GitHub Actions.

## Deliberate non-scope

Milestone C does not claim:

- D2/D3 cross-platform crash durability;
- Brotli/Zstd production codec selection;
- global branch registry / distributed consensus;
- CRDT/OT;
- arbitrary kind-specific semantic merge plugins;
- R-tree/quadtree performance indexing;
- visible infinite-canvas UX replacement;
- Native Math v1 / Native Glyph v1;
- Agent Principal / MCP authority rebinding;
- Product RC hardening.
