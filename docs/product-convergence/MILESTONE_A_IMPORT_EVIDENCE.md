# Milestone A Baseline Import Evidence

**Imported upstream:** `kakon77777-commits/eveglyph-editor@c3258a2f461d5af5a69c879891b485ccf0f02635`  
**Historical handoff implementation input:** `55a2ad77f3131f717cf73992cc2550e4c3a864bb`  
**Import commit:** `f7848213ee63ed5dfd21bb939c2a2336abbcfee2`  
**Authority:** implementation input only

## Import execution

GitHub Actions run `33049781088` (`Milestone A Import Baseline`) completed successfully. The runner:

1. checked out the ASCS implementation branch;
2. checked out the immutable EveGlyph commit `c3258a2f461d5af5a69c879891b485ccf0f02635`;
3. vendored the tracked product surface under `apps/eveglyph-editor/` with only the approved transient exclusions;
4. generated the baseline inventory and parity reports;
5. committed the generated snapshot back to the implementation branch.

All six core import steps completed successfully.

## Vendored payload identity

- files: **146**
- bytes: **29,829,456**
- payload tree SHA-256: `f6b1c31eb730df67f84273a063676c3b6ccb08bb05aa22319c0a08192e826697`
- generated baseline schema: `eveglyph-ascs-upstream-baseline/1.0`
- default exclusions: `.git`, `node_modules`, `dist`, `tmp`, `.cache`, `coverage`, `.DS_Store`

`UPSTREAM_BASELINE.json` stores per-file path, byte count, and SHA-256 evidence for the vendored product surface.

## Product parity discovery

The generated parity report found all required current-EveGlyph capability evidence present:

- Markdown editing
- live preview
- file tree / tabs
- encoding-aware I/O
- diff review
- agent UI
- Dynamic Logic
- Dynamic Rendering
- Typst/PDF publication
- MCP publication
- remote MCP
- real-corpus publication compatibility tests

ASCS-only canonical capabilities remain future milestones and are not claimed as implemented by Milestone A.

## Canonical boundary

The import workflow writes only product implementation input and generated product-convergence evidence. `canonical/v1.0/`, `provenance/`, and `releases/` are not migration targets in Milestone A.
