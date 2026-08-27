# EveGlyph ASCS Milestone A Product Baseline & Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the exact current EveGlyph product surface into EveGlyph_ASCS as a SHA-pinned vendored snapshot, prove product parity without changing ASCS canonical semantics, and deliver both a GitHub PR and independently restorable exact-head backup artifact.

**Architecture:** `canonical/v1.0/`, `provenance/`, and `releases/` remain semantic/evidence authority and are byte-preserved. The current EveGlyph Editor `main @ c3258a2f461d5af5a69c879891b485ccf0f02635` is imported under `apps/eveglyph-editor/` as implementation input only. Root-level Python tooling records lineage, verifies the vendored tree, runs parity/canonical-preservation gates, and produces backup metadata without giving the imported Editor canonical authority.

**Tech Stack:** Python 3.11+, Node.js 20+, npm lockfile installs, Vite, GitHub Actions, existing EveGlyph JavaScript tests, ASCS canonical validators.

**Spec:** `docs/superpowers/specs/2026-08-27-eveglyph-ascs-product-convergence-design.md`

## Global Constraints

- `canonical/v1.0/`, `provenance/`, and `releases/` are not rewritten by Milestone A.
- ASCS semantic authority remains `canonical/v1.0/`; the imported editor is implementation input only.
- Current product baseline is exactly `kakon77777-commits/eveglyph-editor@c3258a2f461d5af5a69c879891b485ccf0f02635`.
- Historical handoff implementation input remains recorded as `55a2ad77f3131f717cf73992cc2550e4c3a864bb`.
- The editor import excludes `.git/`, `node_modules/`, `dist/`, caches, `tmp/`, transient outputs, and local secrets.
- No product implementation writes directly to `main`; implementation occurs on an isolated branch.
- Existing editor tests/build/Dynamic Logic/Dynamic Rendering/MCP publication behavior must remain green.
- Every Ready-for-Review implementation head requires a downloadable source-backup ZIP with manifest, checksums, patch, restore instructions, and external archive SHA-256.
- A PR is not merged unless explicitly authorized.

---

### Task 1: Baseline Lineage Contract

**Files:**
- Create: `docs/product-convergence/MILESTONE_A_BASELINE.md`
- Create: `apps/eveglyph-editor/UPSTREAM_BASELINE.json`
- Create: `tests/test_product_convergence.py`
- Create: `tools/product_convergence.py`

**Interfaces:**
- Consumes: ASCS repo root and vendored editor directory path.
- Produces: `load_baseline_manifest(repo: Path) -> dict`, `inventory_tree(root: Path, exclusions: set[str]) -> list[dict]`, `verify_baseline(repo: Path) -> dict`.

- [ ] **Step 1: Write the failing lineage tests**

Create `tests/test_product_convergence.py` with tests asserting:

```python
from pathlib import Path
import json

from tools.product_convergence import load_baseline_manifest, verify_baseline

REPO = Path(__file__).resolve().parents[1]


def test_baseline_manifest_pins_current_and_historical_editor_commits():
    manifest = load_baseline_manifest(REPO)
    assert manifest["upstream_repository"] == "kakon77777-commits/eveglyph-editor"
    assert manifest["upstream_commit"] == "c3258a2f461d5af5a69c879891b485ccf0f02635"
    assert manifest["handoff_historical_commit"] == "55a2ad77f3131f717cf73992cc2550e4c3a864bb"
    assert manifest["authority"] == "implementation-input-only"


def test_baseline_verifier_rejects_missing_or_changed_vendored_files():
    result = verify_baseline(REPO)
    assert result["ok"] is True
    assert result["unexpected"] == []
    assert result["missing"] == []
    assert result["mismatched"] == []
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
python -B -m unittest tests.test_product_convergence -v
```

Expected: FAIL because `tools.product_convergence` and/or baseline manifest do not exist.

- [ ] **Step 3: Implement minimal lineage/inventory tooling**

Create `tools/product_convergence.py` with:

```python
from __future__ import annotations

import hashlib
import json
from pathlib import Path

DEFAULT_EXCLUDED_NAMES = {
    ".git", "node_modules", "dist", "tmp", ".cache", "coverage", ".DS_Store"
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_baseline_manifest(repo: Path) -> dict:
    path = repo / "apps" / "eveglyph-editor" / "UPSTREAM_BASELINE.json"
    return json.loads(path.read_text(encoding="utf-8"))


def inventory_tree(root: Path, exclusions: set[str] | None = None) -> list[dict]:
    excluded = exclusions or DEFAULT_EXCLUDED_NAMES
    rows = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(root)
        if any(part in excluded for part in rel.parts):
            continue
        if rel.as_posix() == "UPSTREAM_BASELINE.json":
            continue
        rows.append({
            "path": rel.as_posix(),
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        })
    return rows


def verify_baseline(repo: Path) -> dict:
    manifest = load_baseline_manifest(repo)
    root = repo / "apps" / "eveglyph-editor"
    actual = {row["path"]: row for row in inventory_tree(root)}
    expected = {row["path"]: row for row in manifest["files"]}
    missing = sorted(set(expected) - set(actual))
    unexpected = sorted(set(actual) - set(expected))
    mismatched = sorted(
        path for path in set(actual) & set(expected)
        if actual[path]["bytes"] != expected[path]["bytes"]
        or actual[path]["sha256"] != expected[path]["sha256"]
    )
    return {
        "ok": not (missing or unexpected or mismatched),
        "missing": missing,
        "unexpected": unexpected,
        "mismatched": mismatched,
        "files": len(actual),
        "bytes": sum(row["bytes"] for row in actual.values()),
    }
```

`UPSTREAM_BASELINE.json` is generated from the exact imported snapshot and must contain repository/commit/authority/exclusions plus per-file `path`, `bytes`, and `sha256` records.

- [ ] **Step 4: Run test to verify GREEN after Task 2 import exists**

Run:

```bash
python -B -m unittest tests.test_product_convergence -v
```

Expected: PASS once the vendored tree and generated manifest from Task 2 exist.

- [ ] **Step 5: Commit**

```bash
git add tools/product_convergence.py tests/test_product_convergence.py docs/product-convergence/MILESTONE_A_BASELINE.md apps/eveglyph-editor/UPSTREAM_BASELINE.json
git commit -m "feat: define ASCS product baseline lineage contract"
```

---

### Task 2: Vendored Current EveGlyph Snapshot

**Files:**
- Create: `apps/eveglyph-editor/**` from upstream commit `c3258a2f461d5af5a69c879891b485ccf0f02635`
- Modify/Create: `apps/eveglyph-editor/UPSTREAM_BASELINE.json`

**Interfaces:**
- Consumes: exact GitHub source archive for `kakon77777-commits/eveglyph-editor@c3258a2f...`.
- Produces: self-contained editor source tree and deterministic inventory consumed by Task 1 and CI.

- [ ] **Step 1: Materialize the exact upstream source archive**

Use the immutable commit archive, not moving `main`:

```text
https://codeload.github.com/kakon77777-commits/eveglyph-editor/zip/c3258a2f461d5af5a69c879891b485ccf0f02635
```

Extract to a temporary directory outside `canonical/`.

- [ ] **Step 2: Apply the explicit exclusion policy**

Exclude only:

```text
.git/
node_modules/
dist/
tmp/
.cache/
coverage/
.DS_Store
```

Do not omit tracked runtime assets, fonts, examples, tests, workflows, package files, MCP files, or documentation merely to reduce archive size.

- [ ] **Step 3: Copy the resulting source tree to `apps/eveglyph-editor/`**

The vendored tree must retain upstream relative paths exactly beneath the new app root.

- [ ] **Step 4: Generate `UPSTREAM_BASELINE.json`**

Required shape:

```json
{
  "schema": "eveglyph-ascs-upstream-baseline/1.0",
  "upstream_repository": "kakon77777-commits/eveglyph-editor",
  "upstream_commit": "c3258a2f461d5af5a69c879891b485ccf0f02635",
  "handoff_historical_commit": "55a2ad77f3131f717cf73992cc2550e4c3a864bb",
  "authority": "implementation-input-only",
  "exclusions": [".git", "node_modules", "dist", "tmp", ".cache", "coverage", ".DS_Store"],
  "files": []
}
```

Populate `files` from `inventory_tree()`.

- [ ] **Step 5: Verify imported tree deterministically**

Run:

```bash
python -B -m unittest tests.test_product_convergence -v
python -B tools/product_convergence.py verify --repo . --json
```

Expected: no missing/unexpected/mismatched files.

- [ ] **Step 6: Commit the vendored baseline**

```bash
git add apps/eveglyph-editor
git commit -m "data: vendor current EveGlyph product baseline"
```

---

### Task 3: Product Parity Manifest and Harness

**Files:**
- Create: `docs/product-convergence/MILESTONE_A_PARITY.json`
- Create: `docs/product-convergence/MILESTONE_A_PARITY.md`
- Modify: `tools/product_convergence.py`
- Modify: `tests/test_product_convergence.py`

**Interfaces:**
- Consumes: vendored app files/package scripts and baseline manifest.
- Produces: `collect_parity(repo: Path) -> dict` and a machine-readable capability matrix.

- [ ] **Step 1: Add failing parity tests**

Add tests requiring these capabilities to be discovered as present:

```python
REQUIRED = {
    "markdown_editing",
    "live_preview",
    "file_tree_tabs",
    "encoding_io",
    "diff_review",
    "agent_ui",
    "dynamic_logic",
    "dynamic_rendering",
    "typst_pdf_publication",
    "mcp_publication",
    "remote_mcp",
    "real_corpus_publication_tests",
}


def test_current_editor_required_parity_capabilities_are_present():
    parity = collect_parity(REPO)
    assert set(parity["required_capabilities"]) == REQUIRED
    assert all(parity["capabilities"][name]["present"] for name in REQUIRED)
```

- [ ] **Step 2: Run test to verify RED**

```bash
python -B -m unittest tests.test_product_convergence -v
```

Expected: FAIL because `collect_parity()` does not exist.

- [ ] **Step 3: Implement evidence-based parity detection**

`collect_parity()` must inspect exact evidence paths/scripts rather than return hard-coded `true`. Minimum evidence map:

```python
CAPABILITY_EVIDENCE = {
    "markdown_editing": ["src/editor.js"],
    "live_preview": ["src/preview.js"],
    "file_tree_tabs": ["src/files.js"],
    "encoding_io": ["src/encoding.js"],
    "diff_review": ["src/diff.js"],
    "agent_ui": ["src/agent.js"],
    "dynamic_logic": ["src/dynamiclogic"],
    "dynamic_rendering": ["scripts/verify_dynamic_rendering.mjs"],
    "typst_pdf_publication": ["src/publication/node-renderer.js", "src/typstconvert.js"],
    "mcp_publication": ["mcp-publication.js"],
    "remote_mcp": ["mcp-server-remote.js"],
    "real_corpus_publication_tests": ["test/publication-real-corpus-compat.test.mjs"],
}
```

If exact upstream paths differ, use the real vendored paths discovered during implementation and encode those exact paths in both code and parity documentation.

- [ ] **Step 4: Generate machine/readable parity reports**

`MILESTONE_A_PARITY.json` records each capability, evidence paths, presence, and verification command. `MILESTONE_A_PARITY.md` summarizes current-EveGlyph parity and lists ASCS-only capabilities as future milestones rather than false PASS claims.

- [ ] **Step 5: Run parity tests to GREEN**

```bash
python -B -m unittest tests.test_product_convergence -v
python -B tools/product_convergence.py parity --repo . --json
```

Expected: all required current-product capabilities present.

- [ ] **Step 6: Commit**

```bash
git add tools/product_convergence.py tests/test_product_convergence.py docs/product-convergence/MILESTONE_A_PARITY.json docs/product-convergence/MILESTONE_A_PARITY.md
git commit -m "test: add current EveGlyph product parity harness"
```

---

### Task 4: Canonical-Preservation + Product CI

**Files:**
- Create: `.github/workflows/product-convergence.yml`
- Modify: `docs/product-convergence/MILESTONE_A_BASELINE.md`

**Interfaces:**
- Consumes: ASCS preservation verifier, product convergence tool, vendored app package scripts.
- Produces: CI with separate canonical and product jobs; product success cannot mask canonical failure.

- [ ] **Step 1: Define the canonical-preservation job**

Use Python without bytecode writes:

```yaml
- run: python -B tools/ascs_repo.py verify --repo . --json
- run: python -B canonical/v1.0/machine/tests/test_validate_v10.py
- run: python -B canonical/v1.0/machine/tools/validate_v10.py --json
- run: python -B -m unittest tests.test_product_convergence -v
- run: python -B tools/product_convergence.py verify --repo . --json
- run: python -B tools/product_convergence.py parity --repo . --json
```

- [ ] **Step 2: Define the product job in `apps/eveglyph-editor`**

Use Node 20 and exact lockfile install:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: npm
    cache-dependency-path: apps/eveglyph-editor/package-lock.json
- run: npm ci
  working-directory: apps/eveglyph-editor
- run: npm run test:publication
  working-directory: apps/eveglyph-editor
- run: npm run build
  working-directory: apps/eveglyph-editor
- run: npm run verify:dynamic-logic
  working-directory: apps/eveglyph-editor
- run: npm run verify:dynamic-rendering
  working-directory: apps/eveglyph-editor
```

`test:publication` already includes MCP publication E2E and the PR #6 real-corpus compatibility tests at this baseline.

- [ ] **Step 3: Run equivalent local gates where available**

```bash
python -B tools/ascs_repo.py verify --repo . --json
python -B canonical/v1.0/machine/tests/test_validate_v10.py
python -B canonical/v1.0/machine/tools/validate_v10.py --json
python -B -m unittest tests.test_product_convergence -v
cd apps/eveglyph-editor
npm ci
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

- [ ] **Step 4: Commit CI**

```bash
git add .github/workflows/product-convergence.yml docs/product-convergence/MILESTONE_A_BASELINE.md
git commit -m "ci: gate ASCS product convergence and canonical preservation"
```

---

### Task 5: Exact-Head Verification and Review Evidence

**Files:**
- Create: `docs/product-convergence/MILESTONE_A_VALIDATION.md`
- Modify only if verification reveals a reproducible defect: the smallest affected implementation/test file.

**Interfaces:**
- Consumes: final candidate branch head and CI/local outputs.
- Produces: exact-head validation record suitable for PR body and backup manifest.

- [ ] **Step 1: Verify branch scope**

Confirm changed paths are limited to design/plan docs, `apps/eveglyph-editor/`, product-convergence docs/tooling/tests, and CI. Confirm `canonical/`, `provenance/`, and `releases/` have no byte changes.

- [ ] **Step 2: Run fresh exact-head canonical gates**

```bash
python -B tools/ascs_repo.py verify --repo . --json
python -B canonical/v1.0/machine/tests/test_validate_v10.py
python -B canonical/v1.0/machine/tools/validate_v10.py --json
python -B -m unittest tests.test_product_convergence -v
python -B tools/product_convergence.py verify --repo . --json
python -B tools/product_convergence.py parity --repo . --json
```

- [ ] **Step 3: Run fresh exact-head product gates**

```bash
cd apps/eveglyph-editor
npm ci
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

Record exact pass counts, warnings, Node/npm versions, branch head SHA, and upstream baseline SHA in `MILESTONE_A_VALIDATION.md`.

- [ ] **Step 4: Commit validation evidence**

```bash
git add docs/product-convergence/MILESTONE_A_VALIDATION.md
git commit -m "docs: record Milestone A convergence validation"
```

- [ ] **Step 5: Re-run the final gates after the evidence commit**

The evidence commit changes the head; therefore rerun the canonical/product gates or rely on a fresh exact-head GitHub Actions run for the evidence commit before declaring Ready for Review.

---

### Task 6: Backup Artifact and Pull Request Closure

**Files/Artifacts:**
- Generate outside the repository: `EveGlyph_ASCS_Milestone_A_<head-sha8>_source-backup.zip`
- Generate outside the repository: `ARTIFACT_SHA256.txt`
- ZIP payload includes: repository source snapshot, `BACKUP_MANIFEST.json`, `SHA256SUMS.txt`, `PR.patch`, `RESTORE.md`.

**Interfaces:**
- Consumes: exact final branch head, base SHA, PR patch, validation results.
- Produces: independently restorable downloadable source backup and Ready-for-Review PR.

- [ ] **Step 1: Open the implementation PR as Draft once branch content exists**

Title:

```text
feat: converge ASCS with current EveGlyph product baseline
```

Base: `main`. Head: Milestone A implementation branch.

- [ ] **Step 2: Build the exact-head source snapshot**

Download/materialize the exact branch head, excluding only `.git`, runtime caches, `node_modules`, transient build outputs, and local secrets. Do not omit tracked canonical/provenance/release evidence.

- [ ] **Step 3: Generate payload checksums and manifest**

`SHA256SUMS.txt` covers every restorable payload file. `BACKUP_MANIFEST.json` records repository/base/head/PR/upstream baseline/canonical release/exclusions/file counts/bytes/verification summary and a deterministic `payload_tree_sha256` computed over sorted `path + NUL + sha256 + NUL + bytes` records.

- [ ] **Step 4: Add `PR.patch` and `RESTORE.md`**

`RESTORE.md` must explain both restore paths:

```text
A. Extract snapshot and use directly.
B. Clone EveGlyph_ASCS at the recorded base SHA and apply PR.patch, then verify against SHA256SUMS.txt.
```

- [ ] **Step 5: Create the ZIP and external archive checksum**

After ZIP bytes are final, compute SHA-256 and write it to `ARTIFACT_SHA256.txt` beside the ZIP. Do not place the ZIP's own hash inside a file that is part of the ZIP.

- [ ] **Step 6: Verify backup restoration metadata**

At minimum:

```bash
unzip -t EveGlyph_ASCS_Milestone_A_<head-sha8>_source-backup.zip
sha256sum -c ARTIFACT_SHA256.txt
```

Also verify the extracted `SHA256SUMS.txt` against the snapshot payload.

- [ ] **Step 7: Update PR body with exact-head evidence and backup identity**

Include final head SHA, CI run, canonical gate results, product test/build results, upstream baseline, file counts, and backup archive SHA-256. Do not claim merged-main backup yet.

- [ ] **Step 8: Mark Ready for Review only after exact-head CI and backup verification are green**

- [ ] **Step 9: Deliver the downloadable ZIP and checksum to the user**

The response must include sandbox download links for the ZIP (and optional checksum/report files) plus the archive SHA-256.

---

## Plan Self-Review

- Spec coverage: baseline lineage, vendored import, parity, canonical preservation, product gates, PR discipline, exact-head verification, and mandatory downloadable backup all have explicit tasks.
- Placeholder scan: no TBD/TODO/"implement later" steps remain.
- Type/interface consistency: `load_baseline_manifest`, `inventory_tree`, `verify_baseline`, and `collect_parity` are defined once and reused consistently.
- Scope: Milestone A imports/pins/proves current product surface only; it does not implement EGIR/EGCR/EGStore kernel semantics from Milestone B.
