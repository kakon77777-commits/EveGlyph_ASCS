# Milestone C — Persistence + History + Spatial Validation Contract

This document defines the stable validation contract for Milestone C. Exact final-head workflow IDs and backup archive hash are recorded in PR #3 and in the backup manifest so this document does not create a post-validation head change.

## Required preservation gates

- repository preservation: PASS
- ASCS v1 regression: PASS
- ASCS v1 validator: PASS
- `canonical/`, `provenance/`, `releases/`: no Milestone C semantic mutation
- product baseline lineage + explicit ASCS overlay: PASS

## Required reference gates

- TW-01 validator: PASS
- TW-02 validator: PASS
- TW-03 validator: PASS
- Computational Canvas MVP suite: PASS
- pinned v0.3 history fixture identity: PASS
- pinned v0.4 spatial fixture/schema identity: PASS

## Required JavaScript runtime gates

The combined Milestone B + C Node test command must pass:

```text
packages/ascs-core/test/*.test.mjs
packages/ascs-runtime/test/*.test.mjs
packages/ascs-store/test/*.test.mjs
packages/ascs-history/test/*.test.mjs
packages/ascs-spatial/test/*.test.mjs
```

Milestone C requires coverage of:

- exact TW-02 manifest/chunk identity
- store recovery and corruption classification
- active-pointer-last failure safety
- trusted extension transaction atomicity
- persistent branch identity
- checkpoint persistence ordering
- autosave != canonical commit
- 12/12 frozen history merge vectors
- merge-parent preservation
- canonical revert as a child commit
- 18/18 frozen spatial conformance vectors
- nested exact affine transforms
- keep-world / keep-local reparent
- region cycle rejection
- session-only view/collapse/semantic zoom behavior

## Required EveGlyph product gates

- Milestone B hidden canonical bridge regression: PASS
- Milestone C safe persistence bridge: PASS
- unsafe raw store/carrier/trusted-mutation primitives absent from `globalThis.EveGlyphASCS`
- publication tests: PASS
- Vite production build: PASS
- Dynamic Logic regression: PASS
- Dynamic Rendering regression: PASS

## Backup gate

Before PR #3 may become Ready for Review, an exact-head source backup must be generated after all verification gates pass. It must contain:

- `repository/`
- `BACKUP_MANIFEST.json`
- `SHA256SUMS.txt`
- `PR.patch`
- `RESTORE.md`

The archive SHA-256 is emitted outside the archive as `ARTIFACT_SHA256.txt`. The downloaded archive must be independently revalidated before delivery.

## Deliberate non-scope

Milestone C does not claim:

- D2/D3 crash/power-loss durability guarantees
- distributed/multi-device synchronization
- Native Math v1
- Native Glyph v1
- Agent Principal / MCP authority rebinding
- visible history/spatial UX replacement
- product RC security/performance hardening
