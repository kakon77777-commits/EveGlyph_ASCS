# Milestone A Product Convergence Validation

**Milestone:** A — Current EveGlyph Product Baseline Import & Parity Harness

**Validated candidate head before this evidence commit:** `a34be96b9fe3ddd00dda471dbdead0002a520cf7`

**ASCS base:** `24176a9776c941c2f28af1138dd439455ec71de6`

**Current EveGlyph baseline:** `kakon77777-commits/eveglyph-editor@c3258a2f461d5af5a69c879891b485ccf0f02635`

**Historical handoff implementation input:** `55a2ad77f3131f717cf73992cc2550e4c3a864bb`

## Candidate result

PASS.

## Baseline import

Import workflow run `33049781088` completed successfully and produced commit `f7848213ee63ed5dfd21bb939c2a2336abbcfee2`.

- vendored files: 146
- vendored bytes: 29,829,456
- payload tree SHA-256: `f6b1c31eb730df67f84273a063676c3b6ccb08bb05aa22319c0a08192e826697`
- missing: 0
- unexpected: 0
- mismatched: 0
- authority: `implementation-input-only`

A second import run `33049927235` also completed successfully, confirming the pinned import is stable.

## Canonical-preservation gates

Product Convergence run `33049927244`, job `canonical-preservation`: PASS.

Environment:
- Ubuntu 24.04.4 LTS
- Python 3.13.15
- jsonschema 4.26.0

Results:
- repository preservation: PASS
- canonical checksums: 66 / 66
- canonical extraction: 67 expected / 67 actual; 0 missing, extra, unsafe, or mismatched
- architecture authority divergence check: PASS
- ASCS v1 regression: 6 / 6 PASS
- ASCS v1 validator: PASS
- source archives: 10
- profiles: 42
- handoff vectors: 20
- validator errors: 0
- product-convergence tests: 6 / 6 PASS
- vendored baseline verification: PASS
- product parity verification: PASS

## Current EveGlyph product gates

Product Convergence run `33049927244`, job `current-eveglyph-product`: PASS.

Environment:
- Node.js 20.20.2
- npm 10.8.2
- EveGlyph package 0.5.0

Results:
- `npm ci`: PASS
- publication tests: 22 / 22 PASS
- Vite build: PASS (367 modules transformed)
- Dynamic Logic: PASS
- Dynamic Rendering: PASS

The publication suite includes MCP artifact retrieval, Traditional Chinese headless PDF rendering, publication preflight/profile/artifact coverage, and the real-corpus compatibility regressions introduced after CSM Paper 00.

## Parity result

All required current-EveGlyph evidence surfaces are present: Markdown editing, live preview, file tree/tabs, encoding-aware I/O, diff review, agent UI, Dynamic Logic, Dynamic Rendering, Typst/PDF publication, MCP publication, remote MCP, and real-corpus publication compatibility tests.

ASCS-only canonical capabilities remain future milestones and are not claimed as implemented by Milestone A.

## Exact-head rule

This evidence file changes the branch head. A fresh Product Convergence run must pass on the resulting exact head before the PR can be marked Ready for Review and before the final backup archive is produced.
