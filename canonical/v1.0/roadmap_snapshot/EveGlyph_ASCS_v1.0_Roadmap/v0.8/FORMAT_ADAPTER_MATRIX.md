# v0.8 Format Adapter Matrix

| Format | Role | Baseline | Import ceiling | Default round-trip | Canonical identity preservation | Main diagnostic boundary |
|---|---|---|---|---|---|---|
| Markdown | legacy-document | CommonMark 0.31.2 | candidate-only | semantic-equivalent for declared subset | No | dialect/extensions |
| LaTeX | semantic-math | eg-latex-subset/1 | candidate-only | semantic-equivalent for mapped subset | No | unknown macros/environments |
| MathML | semantic-math | MathML 4 WD 2026-06-04 / Core CR 2025-06-24 | candidate-only | semantic-equivalent for supported semantics | No | presentation vs content |
| OpenMath | semantic-math | 2.0r2 | candidate-only | semantic-equivalent | No | unknown content dictionary |
| SVG | visual-asset | SVG2 profile | candidate-only | presentation-equivalent | No | geometry is not semantics |
| Raster | visual-asset | PNG/JPEG/WebP profiles | candidate-only | presentation-equivalent / one-way-import | No | visual-only by default |
| PDF | static-projection | ISO 32000-2:2020 | projection-only | one-way-export | No | static artifact is not inverse |
| EGIR JSON | carrier | egir/0.1 | preserve-canonical | byte-exact / canonical-state | Yes | must pass EGIR validation |
| CBOR | carrier | RFC 8949 profile | preserve-canonical | canonical-state | Yes after decode validation | carrier bytes differ from semantic state |
| UTF-8X | carrier | legacy research adapter | preserve-canonical after decode validation | canonical-state | Yes after decode validation | deterministic decode required |
