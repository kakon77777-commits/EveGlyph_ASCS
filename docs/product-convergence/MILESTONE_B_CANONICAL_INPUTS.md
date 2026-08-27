# Milestone B — Canonical Spine Inputs and Boundaries

**Milestone:** `B-canonical-spine`  
**Implementation base:** `main@5844692bf00b7650d67fa1fe744ca0f790f9e4b9`  
**Canonical authority:** unchanged `canonical/v1.0/`

## Pinned canonical inputs

Milestone B implements frozen behavior rather than redefining it.

| Input | SHA-256 | Role |
| --- | --- | --- |
| `EveGlyph_Addressable_Symbolic_Computational_Space_Series_v0.1_Architecture_Complete.zip` | `19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778` | TW-01 / TW-02 / TW-03 architecture and machine contracts |
| `EveGlyph_Computational_Canvas_MVP_v0.1.zip` | `f49a4f419f9b4539aac0721a1ad85f84151cec71bf3da68db22a197303b5cd3f` | executable reference evidence |
| `minimal_workspace.egir.json` | `0d9cb28fc8c6f9d6e56c99729b14ce9cf873afe7e0f09940298e8ba459f9b78e` | exact TW-01 minimal fixture |
| `tw01_vectors.json` | `9043e8002069fc294c125379964d984f0110f27cbf0c500fb1691243dddbe16a` | exact TW-01 canonicalization/hash vectors |

The two TW-01 test fixtures were copied byte-for-byte from the pinned Architecture archive and are recorded by `packages/ascs-core/test/fixtures/REFERENCE_LINEAGE.json`.

## Frozen EGIR-CJ contract

Milestone B retains `egir-cj/0.1` exactly:

- UTF-8;
- object keys sorted by Unicode code-point lexical order;
- array order preserved except where an enclosing hash preimage explicitly sorts a semantic set;
- structural numbers must be integers within `[-9007199254740991, 9007199254740991]`;
- floats are forbidden in hash preimages;
- Unicode scalar sequences are preserved without NFC/NFKC normalization;
- compact canonical JSON bytes feed SHA-256.

The implementation is browser-compatible and uses Web Crypto rather than a Node-only hashing API.

## Frozen identity / revision boundaries

Milestone B preserves:

```text
persistent identity != content address
object != revision
intrinsic object state != Canvas placement
canonical state != session/cache/view state
```

The runtime's move/edit/clone behavior is therefore:

```text
move  -> workspace revision changes; object revision/content remain equal
edit  -> persistent identity remains; content/revision change; old head becomes parent
clone -> persistent identity changes; intrinsic content may remain equal
stale base -> typed Conflict; zero canonical mutation
```

## Authority correction discovered during implementation

TW-01's canonical event actor type is:

```text
human | ai | system | importer
```

It is **not** `agent`.

EveGlyph's product-level Agent concept is therefore projected into canonical provenance as `actor.type = "ai"`. Milestone B does not modify the frozen actor enumeration.

The current runtime commit gate accepts:

```text
human + explicit
ai + approved-proposal
system + policy-authorized
```

An AI/Agent without an approved proposal is denied before draft mutation. `importer` remains a valid canonical provenance actor type but is not granted ordinary mutation authority by this runtime path.

## Product-lineage overlay

Milestone A recorded the original EveGlyph implementation input in `apps/eveglyph-editor/UPSTREAM_BASELINE.json`.

Milestone B intentionally evolves that product surface. It does **not** regenerate the upstream manifest. Instead `apps/eveglyph-editor/ASCS_OVERLAY.json` explicitly records the allowed divergence:

- add `src/ascs/register.js`;
- add `src/ascs/runtime-bridge.js`;
- add `test/ascs-runtime-bridge.test.mjs`;
- modify `src/main.js` only to load the hidden ASCS registration seam.

All non-overlay upstream paths remain byte-checked against the original Milestone A inventory.

## Hidden Editor bridge

The existing Editor UI and filesystem/Markdown state remain legacy/product surfaces. Milestone B adds:

```text
globalThis.EveGlyphASCS.createCanonicalWorkspaceBridge(...)
```

The bridge delegates canonical operations to `WorkspaceRuntime`; it does not reclassify the existing `S` singleton, file path, Git diff, Markdown source, or UI state as canonical authority.

No visible Editor UX replacement is part of Milestone B.

## Explicit non-scope

Milestone B does not claim completion of:

- persistent EGStore providers / crash-safe store commit;
- persistent history DAG / branch / merge / revert;
- nested spatial region semantics;
- `ncm/1.0-candidate.1` Native Math;
- `glyph/1.0-candidate.1` Native Glyph;
- Agent Principal / MCP authority rebinding;
- product RC / operational hardening.

Those remain later milestones.
