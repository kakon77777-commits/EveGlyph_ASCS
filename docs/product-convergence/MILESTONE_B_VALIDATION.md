# Milestone B — Canonical Spine Validation

**Milestone:** `B-canonical-spine`  
**Base:** `5844692bf00b7650d67fa1fe744ca0f790f9e4b9`  
**PR:** #2  
**Final exact-head evidence:** recorded in PR body and the exact-head backup manifest after all source changes stop.

## RED-first evidence

The canonical/runtime tests and Milestone B CI were introduced before production `packages/ascs-core/src/` and `packages/ascs-runtime/src/` existed.

At RED head `1c5d348a8a4bcb436da05c8e7e8f83a509fc6e32`, Milestone B workflow run `33052535062` showed the intended split:

- canonical preservation: PASS;
- canonical reference / TW-01 / TW-03 / MVP: PASS;
- current EveGlyph product: PASS;
- new JavaScript canonical spine: FAIL because production modules were intentionally absent.

This establishes that the new contracts were active gates rather than post-hoc tests.

## Canonical core acceptance

Final verification must prove:

1. exact `egir-cj/0.1` canonical UTF-8 vector;
2. exact TW-01 SHA-256 vector;
3. exact math content address;
4. exact math revision ID;
5. exact relation content address;
6. exact relation revision ID;
7. exact workspace revision;
8. float rejection;
9. unsafe structural-integer rejection;
10. Unicode scalar sequence preservation without normalization;
11. UUIDv7 48-bit timestamp/version/variant behavior;
12. typed cross-record content/revision/workspace failures.

The JavaScript implementation must not replace the Python/frozen validators; both must remain gates.

## Runtime transaction acceptance

The runtime must prove:

```text
move:
  persistent identity unchanged
  object revision unchanged
  content address unchanged
  workspace revision changed

edit:
  persistent identity unchanged
  content address changed
  revision changed
  old head is the new revision parent

clone:
  persistent identity changed
  equal intrinsic content may keep the same content address

stale base:
  typed Conflict
  zero canonical mutation
```

Canonical mutation is staged and the runtime state pointer is swapped only after draft validation succeeds.

## Authority acceptance

Frozen TW-01 actor types remain:

```text
human | ai | system | importer
```

Milestone B does not add an `agent` canonical actor type. EveGlyph Agent is an adapter/product concept projected to canonical `ai` provenance.

Runtime commit authority:

- `human + explicit`: allowed;
- `ai + approved-proposal`: allowed;
- `system + policy-authorized`: allowed;
- `ai` direct/explicit without approved proposal: denied before mutation.

## Frozen-schema cross-check

The JavaScript runtime generates complete canonical bundles after:

- move;
- edit;
- clone.

CI then validates those generated snapshots against the exact TW-01 Draft 2020-12 schema extracted from the SHA-pinned Architecture archive. All three must have zero schema errors.

## Reference gates

Every final head must independently pass:

- ASCS repository preservation verifier;
- ASCS v1.0 6-test regression suite;
- ASCS v1.0 validator;
- pinned TW-01 reference validator;
- pinned TW-03 reference validator;
- pinned Computational Canvas MVP 26-test suite;
- JavaScript core/runtime tests;
- generated-runtime TW-01 schema validation.

## Product gates

The hidden Editor bridge must load the exact TW-01 fixture and route mutation through `WorkspaceRuntime` while preserving the move invariant.

The current EveGlyph product surface must also retain:

- `npm ci` from the pinned lockfile;
- publication tests (22/22 or higher);
- Vite build;
- Dynamic Logic verification;
- Dynamic Rendering verification.

## Product-lineage gate

Milestone A's `UPSTREAM_BASELINE.json` remains immutable provenance for `eveglyph-editor@c3258a2f...`.

Milestone B uses `ASCS_OVERLAY.json` to enumerate its product divergence explicitly. Verification fails on any added, deleted, or byte-modified upstream path not covered by that overlay.

## Scope gate

A final changed-file audit must show no ordinary implementation changes under:

- `canonical/`;
- `provenance/`;
- `releases/`.

Milestone B does not claim persistent EGStore, history/merge, nested spatial regions, Native Math v1, Native Glyph v1, Agent Principal/MCP authority rebinding, or product RC closure.

## Backup gate

Before Ready for Review, the exact PR head must produce:

```text
EveGlyph_ASCS_Milestone_B_<head-sha8>_source-backup.zip
```

containing:

- complete restorable source snapshot excluding transient dependency/build directories;
- `BACKUP_MANIFEST.json`;
- `SHA256SUMS.txt`;
- `PR.patch`;
- `RESTORE.md`;
- external `ARTIFACT_SHA256.txt`.

The backup workflow must rerun canonical, reference, runtime, schema, bridge, publication, build, and dynamic gates before packaging.
