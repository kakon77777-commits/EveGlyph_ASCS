# Milestone D-Glyph Validation

Milestone D-Glyph implements the frozen ASCS v0.6 candidate Glyph/Symbol contracts without changing `canonical/`, `provenance/`, or `releases/`.

## RED → GREEN lineage

### Core RED

PR #5 initial RED run: `33166324187`.

Expected and observed split:

- canonical preservation — PASS
- v0.6 reference validator + four negative validator regressions — PASS
- Milestone B/C/D-Math + current EveGlyph regression — PASS
- Native Glyph JavaScript — RED because `packages/ascs-glyph/src/index.mjs` was intentionally absent

### Service / product RED

Run `33167150613`.

- canonical preservation — PASS
- v0.6 reference — PASS
- B/C/D-Math runtime — PASS
- Native Glyph JavaScript — RED because `service.mjs` was intentionally absent
- product bridge — RED because `createNativeGlyphService` was intentionally unregistered

## Implemented contract gates

The final candidate must prove:

- exact canonical decimal scalar grammar;
- path command state machine (`M/L/Q/C/Z`);
- exact palette-run carry coverage;
- immutable component revision pins, cycle and expansion-budget rejection;
- committed topology distinct from skeleton hints;
- part graph structural tags distinct from semantic authority;
- family axes and topology policy;
- renderer fidelity without identity authority;
- semantic / Unicode / OpenType / behavior bindings as separate typed relations;
- imported SVG remains inert data and active content is flagged;
- behavior binding declares `runtime.execute` without granting it;
- GSC AssetSymbol v0.7 strict-source-blind carry bridge remains non-semantic;
- accessibility works for custom non-Unicode glyphs;
- Native Math semantic-symbol binding does not collapse Glyph identity;
- all **30/30** frozen v0.6 vectors execute through production invariants;
- invalid intrinsic edits fail before mutation;
- valid edits route through the existing ASCS authority transaction;
- stale base preserves typed Conflict;
- semantic/behavior binding operations remain outside the intrinsic geometry workspace revision;
- the EveGlyph bridge exposes `createNativeGlyphService` without renderer/script/font-program/capability/trusted-mutation shortcuts.

Final exact-head workflow IDs, archive SHA-256, snapshot counts and independent post-download backup verification are recorded in PR #5 after source freeze.
