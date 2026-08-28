# Milestone D-Glyph Canonical Inputs

**Base:** `main@050c2fb2568034222c4e9c854c5c5b52c4ba8786`  
**Authority:** `canonical/v1.0/` remains read-only semantic authority.

## Frozen v0.6 input

Archive:

`canonical/v1.0/source_archives/EveGlyph_ASCS_v0.6_Glyph_Symbol_Round_Complete.zip`

SHA-256:

`08ab324e5edf777a958f42ef18c70e24ccb0d0b680586cd14bbbf70a6e269dba`

Candidate profiles:

- `glyph/1.0-candidate.1`
- `glyph-family/1.0-candidate.1`
- `glyph-binding/1.0-candidate.1`
- `gsc-assetsymbol-bridge/1.0-candidate.1`

Conformance profile:

`glyph-conformance-vectors/0.6`

Frozen vectors: **30**.

Committed byte-pinned fixtures and per-file SHA-256 values are recorded in:

`packages/MILESTONE_D_GLYPH_REFERENCE_LINEAGE.json`

## Preserved boundaries

```text
Character != Glyph != Semantic Symbol != Behavior
Raster Source != Exact Carry != Geometry != Topology != Part Graph
Intrinsic Glyph != Semantic Binding != Execution Permission
Math Operator Identity != Glyph Identity
```

Unicode, OpenType, SVG, accessibility output, renderer targets and GSC AssetSymbol are adapters/projections. They do not define persistent Glyph identity.

Imported SVG/font/raster data has no executable behavior by default. Behavior binding requires a declared `runtime.execute` capability, while actual capability authorization remains external runtime policy.

Legacy `glyph/0.1` remains loadable under its own semantics. Candidate enrichment is explicit and revision-producing rather than a silent reinterpretation.
