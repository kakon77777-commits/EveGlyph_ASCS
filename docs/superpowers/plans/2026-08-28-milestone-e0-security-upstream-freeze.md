# Milestone E0 Security Upstream Reference Freeze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze the reviewed EveGlyph security implementation upstream at `kakon77777-commits/eveglyph-editor@061a57ebd3f86dd6df83e6ff8472f5e194c567e5` as a machine-verifiable implementation reference without changing ASCS canonical authority or current product/security behavior.

**Architecture:** E0 adds an explicit security-upstream manifest and verifier beside the existing product-convergence evidence. The historical `apps/eveglyph-editor/UPSTREAM_BASELINE.json` and `ASCS_OVERLAY.json` remain authoritative for the original product lineage and are not regenerated. CI checks the pinned upstream commit/tree and selected security file Git blobs in an isolated checkout, runs the reviewed non-Wasmtime security/product commands at that exact pin, and produces an exact-head backup; later E slices consume this frozen reference but do not treat it as ontology.

**Tech Stack:** Python 3.13, Git CLI, GitHub Actions, Node.js 20/npm, existing `tools/product_convergence.py` and unittest suite, JSON manifests.

**Spec:** `docs/superpowers/specs/2026-08-28-milestone-e-authority-convergence-design.md`

## Global Constraints

- ASCS implementation base before E0: `main@3590b11b6d1304292181394034d9c4114ec777f9`.
- Approved design commit: `dec29c38eb75ba203e3824dd8e18918e93ea1403`.
- Security upstream repository: `kakon77777-commits/eveglyph-editor`.
- Security upstream commit: `061a57ebd3f86dd6df83e6ff8472f5e194c567e5`.
- Security upstream Git tree: `664934916c950303ad7e9d166f7aa36a07ac4c57`.
- Reviewed merge parents at the pinned upstream head: `5405255f0eb527ca3ae848477b1be328f9f69153` and `2ac9dfdeaabc629ef0564eaf78a84f4b5226561b`.
- Historical product baseline remains `c3258a2f461d5af5a69c879891b485ccf0f02635`; do not regenerate `apps/eveglyph-editor/UPSTREAM_BASELINE.json`.
- `apps/eveglyph-editor/ASCS_OVERLAY.json` remains based on the historical product baseline; E0 must not reinterpret it as being based on the new security upstream.
- `canonical/`, `provenance/`, and `releases/` are read-only in E0.
- E0 is reference/lineage only: no capability behavior changes, no credential/runtime integration, no provider write APIs, no new canonical mutation path.
- The upstream implementation is `implementation-reference-only`; it cannot redefine frozen v0.7/v0.9 or `egir-cj/0.1` semantics.
- Do not vendor the whole upstream repository into ASCS. Pin selected security paths by exact Git blob SHA and byte size.
- Construction-only workflows are not allowed in the final E0 head. Final workflows must use read-only repository permissions except artifact upload.
- RED must prove the new security-upstream contract is absent while A/B/C/D/product regressions remain green.
- Every E slice receives an exact-head source backup before Ready for Review and a merged-main backup only after explicit merge authorization.

---

## File Structure

### New files

- `docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.json` — machine-readable pin for upstream repo/commit/tree, reviewed merge parents, selected security file blob map, reviewed security-fix evidence, and upstream verification command contract.
- `docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.md` — human-readable interpretation of the manifest and explicit statement that the old product baseline is not replaced.
- `tools/security_upstream.py` — offline manifest validator plus local-checkout verifier; contains no network fetch logic and never mutates the upstream checkout.
- `tests/test_security_upstream.py` — E0 RED/GREEN unit contracts for manifest identity, path safety, required component classes, fix evidence, and historical-lineage separation.
- `.github/workflows/milestone-e0-security-upstream.yml` — read-only E0 CI that creates an isolated pinned upstream checkout, verifies tree/blob identity, runs the pinned non-Wasmtime security/product command set, and reruns ASCS regressions.
- `.github/workflows/milestone-e0-security-upstream-backup.yml` — exact-head E0 backup gate.

### Modified files

- `tools/product_convergence.py` — expose the frozen security-upstream reference in parity output without changing `UPSTREAM_COMMIT` or historical baseline verification.
- `tests/test_product_convergence.py` — prove Product Convergence reports the new reference while the historical product baseline/overlay remain unchanged.

No production file under `packages/` or `apps/eveglyph-editor/src/`, `server/`, MCP files, connector files, credential files, or sandbox files changes in E0.

---

### Task 1: RED contract for a second, non-authoritative upstream lineage

**Files:**
- Create: `tests/test_security_upstream.py`
- Modify: `tests/test_product_convergence.py`

**Interfaces:**
- Consumes: existing `load_baseline_manifest(REPO)`, `load_overlay_manifest(REPO)`, and `collect_parity(REPO)` from `tools/product_convergence.py`.
- Produces test expectations for `load_security_manifest(repo: Path) -> dict`, `validate_security_manifest(manifest: dict) -> list[str]`, and a parity field `security_upstream_reference` introduced in Tasks 2–3.

- [ ] **Step 1: Create the failing E0 manifest contract test**

Create `tests/test_security_upstream.py` with the exact initial tests below. They intentionally import functions that do not exist yet:

```python
import unittest
from pathlib import Path

from tools.security_upstream import (
    SECURITY_UPSTREAM_COMMIT,
    SECURITY_UPSTREAM_REPOSITORY,
    SECURITY_UPSTREAM_TREE,
    load_security_manifest,
    validate_security_manifest,
)

REPO = Path(__file__).resolve().parents[1]


class SecurityUpstreamTests(unittest.TestCase):
    def test_manifest_pins_reviewed_security_upstream_without_authority(self):
        manifest = load_security_manifest(REPO)
        self.assertEqual(manifest["schema"], "eveglyph-ascs-security-upstream/1.0")
        self.assertEqual(manifest["repository"], SECURITY_UPSTREAM_REPOSITORY)
        self.assertEqual(manifest["commit"], SECURITY_UPSTREAM_COMMIT)
        self.assertEqual(manifest["git_tree"], SECURITY_UPSTREAM_TREE)
        self.assertEqual(manifest["authority"], "implementation-reference-only")
        self.assertEqual(
            manifest["merge_parents"],
            [
                "5405255f0eb527ca3ae848477b1be328f9f69153",
                "2ac9dfdeaabc629ef0564eaf78a84f4b5226561b",
            ],
        )

    def test_manifest_is_structurally_valid_and_has_unique_safe_paths(self):
        manifest = load_security_manifest(REPO)
        self.assertEqual(validate_security_manifest(manifest), [])
        paths = [row["path"] for row in manifest["files"]]
        self.assertEqual(paths, sorted(set(paths)))
        self.assertTrue(all(not path.startswith("/") and ".." not in Path(path).parts for path in paths))

    def test_manifest_pins_all_required_security_component_classes(self):
        manifest = load_security_manifest(REPO)
        roles = {row["role"] for row in manifest["files"]}
        self.assertTrue({
            "capability-control-plane",
            "credential-custody",
            "delegation",
            "connector",
            "ingress",
            "physical-sandbox",
            "security-verifier",
        }.issubset(roles))

    def test_reviewed_fix_evidence_is_explicit(self):
        manifest = load_security_manifest(REPO)
        fix_ids = {row["id"] for row in manifest["reviewed_fixes"]}
        self.assertEqual(fix_ids, {
            "windows-named-pipe-framing",
            "sandbox-entrypoint-bypass",
            "prototype-chain-capability-lookup",
            "wildcard-segment-boundary",
            "google-export-bounded-stream",
            "delegation-sensitive-result-filter",
            "delegated-credential-id-redaction",
        })


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Add a Product Convergence RED assertion without changing historical expectations**

Append one test to `tests/test_product_convergence.py`:

```python
    def test_security_upstream_reference_is_additive_not_a_baseline_rewrite(self):
        baseline = load_baseline_manifest(REPO)
        overlay = load_overlay_manifest(REPO)
        parity = collect_parity(REPO)
        self.assertEqual(baseline["upstream_commit"], "c3258a2f461d5af5a69c879891b485ccf0f02635")
        self.assertEqual(overlay["base_upstream_commit"], "c3258a2f461d5af5a69c879891b485ccf0f02635")
        self.assertEqual(
            parity["security_upstream_reference"]["commit"],
            "061a57ebd3f86dd6df83e6ff8472f5e194c567e5",
        )
        self.assertEqual(parity["security_upstream_reference"]["authority"], "implementation-reference-only")
```

- [ ] **Step 3: Run the new focused tests and prove RED**

Run:

```bash
python -B -m unittest tests.test_security_upstream -v
python -B -m unittest tests.test_product_convergence.ProductConvergenceTests.test_security_upstream_reference_is_additive_not_a_baseline_rewrite -v
```

Expected RED:

- `tests.test_security_upstream` fails with `ModuleNotFoundError: No module named 'tools.security_upstream'`.
- Product Convergence focused test fails because `security_upstream_reference` is absent.
- Existing `python -B -m unittest tests.test_product_convergence -v` continues to pass except for the intentionally added E0 assertion.

- [ ] **Step 4: Commit RED evidence**

```bash
git add tests/test_security_upstream.py tests/test_product_convergence.py
git commit -m "test: define E0 security upstream lineage contract"
```

---

### Task 2: Machine-readable security upstream manifest and offline verifier

**Files:**
- Create: `docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.json`
- Create: `tools/security_upstream.py`
- Test: `tests/test_security_upstream.py`

**Interfaces:**
- Produces constants:
  - `SECURITY_UPSTREAM_REPOSITORY = "kakon77777-commits/eveglyph-editor"`
  - `SECURITY_UPSTREAM_COMMIT = "061a57ebd3f86dd6df83e6ff8472f5e194c567e5"`
  - `SECURITY_UPSTREAM_TREE = "664934916c950303ad7e9d166f7aa36a07ac4c57"`
- Produces `security_manifest_path(repo: Path) -> Path`.
- Produces `load_security_manifest(repo: Path) -> dict`.
- Produces `validate_security_manifest(manifest: dict) -> list[str]`.
- Produces `verify_upstream_checkout(repo: Path, upstream_checkout: Path) -> dict` returning at minimum `ok`, `head`, `tree`, `parents`, `file_errors`, `manifest_errors`, `verified_files`.
- CLI:
  - `python -B tools/security_upstream.py verify-manifest --repo . --json`
  - `python -B tools/security_upstream.py verify-checkout --repo . --upstream-checkout /tmp/eveglyph-security-upstream --json`

- [ ] **Step 1: Write the manifest with exact immutable identity and selected component map**

Create `docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.json` with this top-level structure and exact fixed identity values:

```json
{
  "schema": "eveglyph-ascs-security-upstream/1.0",
  "repository": "kakon77777-commits/eveglyph-editor",
  "commit": "061a57ebd3f86dd6df83e6ff8472f5e194c567e5",
  "git_tree": "664934916c950303ad7e9d166f7aa36a07ac4c57",
  "authority": "implementation-reference-only",
  "merge_parents": [
    "5405255f0eb527ca3ae848477b1be328f9f69153",
    "2ac9dfdeaabc629ef0564eaf78a84f4b5226561b"
  ],
  "historical_product_baseline_commit": "c3258a2f461d5af5a69c879891b485ccf0f02635",
  "reported_upstream_full_test_count": 135,
  "files": [],
  "reviewed_fixes": [],
  "verification_commands": []
}
```

Populate `files` from `git ls-tree -r -l 061a57eb...` using exact Git blob SHA and byte size for the following required path classes. Keep rows sorted by `path`; each row is `{ "path", "git_blob", "bytes", "role" }`.

Required capability/control-plane paths:

```text
src/capabilities/model.js
src/capabilities/session.js
src/capabilities/registry.js
src/capabilities/profiles.js
src/capabilities/mcp-map.js
src/capabilities/document-runtime.js
```

Required credential/delegation paths:

```text
server/credentials/memory-broker.js
server/credentials/persistent-broker.js
server/credentials/system-keyring-vault.js
server/credentials/delegation-broker.js
server/credentials/delegation-ipc.js
server/credentials/delegation-ipc-client.js
server/connectors/delegated-contracts.js
server/connectors/delegation-runtime.js
```

Required connector paths:

```text
server/connectors/github-app.js
server/connectors/github-service.js
server/connectors/google-oauth.js
server/connectors/google-drive-service.js
```

Required ingress paths:

```text
mcp-server.js
mcp-server-remote.js
mcp-server-factory.js
mcp-tools.js
mcp-connectors.js
vite-agent-bridge.js
```

Required physical-sandbox paths:

```text
server/sandbox/document-wasm-service.js
server/sandbox/limits.js
server/sandbox/wasi-import-policy.js
server/sandbox/wasmtime-runtime.js
mcp-wasm-sandbox.js
```

Required verification paths:

```text
scripts/verify_credential_boundary.mjs
scripts/verify_mcp_delegation_boundary.mjs
scripts/verify_wasmtime_sandbox_boundary.mjs
package.json
package-lock.json
```

Populate `reviewed_fixes` as sorted objects containing at least `id`, `commit`, and `evidence_path`. Use these exact ids/commits:

```text
windows-named-pipe-framing            67a07ab5dc144518c33087d5718436e6e1512879
google-export-bounded-stream           f3b8f4fc0dfb74ccca0b650ae79a7c0caa741a42
prototype-chain-capability-lookup      ee7b65a7a12a97076a3da72687f69e4e07e4798a
wildcard-segment-boundary               ee7b65a7a12a97076a3da72687f69e4e07e4798a
sandbox-entrypoint-bypass               75fa2e0e3421e7462fa032c3f1bd3c8f4837724a
delegation-sensitive-result-filter     094cee69413ea9a05c29de73549936984b525a9a
delegated-credential-id-redaction      ffe7f3b91dd20ada44dfbebdefd6345c02a4de8a
```

Use the corresponding regression test path as `evidence_path` (`test/delegation-ipc.test.mjs`, `test/google-drive-connector.test.mjs`, `test/capability-foundation.test.mjs`, `test/mcp-capability-sandbox.test.mjs`, `test/mcp-delegated-connectors.test.mjs` as appropriate). A commit may support more than one fix id.

Populate `verification_commands` exactly from the pinned upstream `package.json` for the non-Wasmtime E0 runnable gate:

```text
npm run test:capabilities
npm run test:credential-broker
npm run test:github-connector
npm run test:google-connector
npm run test:mcp-delegation
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

Also record but do not execute in E0 final CI:

```text
npm run test:wasmtime-sandbox
npm run verify:wasmtime-sandbox
```

with `phase = "E5-physical-runtime"` so E0 cannot overclaim physical Wasmtime revalidation.

- [ ] **Step 2: Implement strict manifest validation**

Create `tools/security_upstream.py` with this responsibility split:

```python
from pathlib import Path, PurePosixPath
import argparse, json, subprocess

SECURITY_UPSTREAM_REPOSITORY = "kakon77777-commits/eveglyph-editor"
SECURITY_UPSTREAM_COMMIT = "061a57ebd3f86dd6df83e6ff8472f5e194c567e5"
SECURITY_UPSTREAM_TREE = "664934916c950303ad7e9d166f7aa36a07ac4c57"
SECURITY_SCHEMA = "eveglyph-ascs-security-upstream/1.0"
EXPECTED_PARENTS = [
    "5405255f0eb527ca3ae848477b1be328f9f69153",
    "2ac9dfdeaabc629ef0564eaf78a84f4b5226561b",
]


def security_manifest_path(repo: Path) -> Path:
    return repo / "docs" / "product-convergence" / "MILESTONE_E0_SECURITY_UPSTREAM.json"


def load_security_manifest(repo: Path) -> dict:
    return json.loads(security_manifest_path(repo).read_text(encoding="utf-8"))


def _safe_path(value: object) -> bool:
    if not isinstance(value, str) or not value or "\\" in value:
        return False
    path = PurePosixPath(value)
    return not path.is_absolute() and "." not in path.parts and ".." not in path.parts
```

`validate_security_manifest()` must reject:

- wrong schema/repository/commit/tree/authority;
- wrong or reordered merge parent list;
- any unsafe, duplicate, or unsorted file path;
- duplicate `git_blob`/path row shape errors;
- malformed SHA-1 Git object ids (exactly 40 lowercase hex chars);
- non-positive byte sizes;
- missing required role classes;
- duplicate or missing reviewed-fix ids;
- any verification command not beginning with one of the explicitly pinned `npm run ...` scripts;
- missing `reported_upstream_full_test_count = 135`.

Return a list of human-readable error strings; do not throw for ordinary manifest validation failures.

- [ ] **Step 3: Implement local-checkout verification without network logic**

Use a tiny subprocess helper:

```python
def _git(checkout: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(checkout), *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"git {' '.join(args)} failed")
    return proc.stdout.strip()
```

`verify_upstream_checkout()` must:

1. call `validate_security_manifest()`;
2. require `git rev-parse HEAD` == pinned commit;
3. require `git rev-parse HEAD^{tree}` == pinned tree;
4. require `git show -s --format=%P HEAD` split exactly equals `merge_parents`;
5. for each manifest file require `git rev-parse HEAD:<path>` == `git_blob`;
6. require the on-disk file byte size == manifest `bytes`;
7. return a JSON-serializable result with no secret contents and no file bodies.

Do not shell out through `shell=True`; all arguments are a list.

- [ ] **Step 4: Add CLI dispatch**

Implement:

```text
verify-manifest --repo <path> [--json]
verify-checkout --repo <path> --upstream-checkout <path> [--json]
```

Exit status is `0` only when the selected verification result has `ok: true`; otherwise `1`. `--json` prints one JSON object suitable for CI logs.

- [ ] **Step 5: Run focused tests**

```bash
python -B -m unittest tests.test_security_upstream -v
python -B tools/security_upstream.py verify-manifest --repo . --json
```

Expected: all `tests.test_security_upstream` tests PASS and verifier returns `{"ok": true, ...}`.

- [ ] **Step 6: Commit the manifest/verifier slice**

```bash
git add docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.json tools/security_upstream.py tests/test_security_upstream.py
git commit -m "feat: freeze reviewed EveGlyph security upstream reference"
```

---

### Task 3: Product Convergence lineage integration and human evidence document

**Files:**
- Modify: `tools/product_convergence.py`
- Modify: `tests/test_product_convergence.py`
- Create: `docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.md`

**Interfaces:**
- Consumes `load_security_manifest(repo)` and `validate_security_manifest(manifest)` from Task 2.
- Extends `collect_parity(repo)` with `security_upstream_reference` only; it MUST NOT modify `UPSTREAM_REPOSITORY`, `UPSTREAM_COMMIT`, baseline-manifest validation, or overlay-base validation.

- [ ] **Step 1: Write the Product Convergence expectation first**

Extend the focused E0 test from Task 1 to assert the full additive shape:

```python
        security = parity["security_upstream_reference"]
        self.assertEqual(security["repository"], "kakon77777-commits/eveglyph-editor")
        self.assertEqual(security["commit"], "061a57ebd3f86dd6df83e6ff8472f5e194c567e5")
        self.assertEqual(security["git_tree"], "664934916c950303ad7e9d166f7aa36a07ac4c57")
        self.assertEqual(security["authority"], "implementation-reference-only")
        self.assertTrue(security["manifest_valid"])
```

Run only this test and confirm RED because `collect_parity()` has not been extended yet.

- [ ] **Step 2: Implement additive parity reporting**

At the top of `tools/product_convergence.py`, import:

```python
from tools.security_upstream import load_security_manifest, validate_security_manifest
```

Inside `collect_parity(repo)`, load the E0 manifest and add this top-level report field without changing existing capability keys:

```python
security_manifest = load_security_manifest(repo)
security_errors = validate_security_manifest(security_manifest)

# in returned dict
"security_upstream_reference": {
    "repository": security_manifest["repository"],
    "commit": security_manifest["commit"],
    "git_tree": security_manifest["git_tree"],
    "authority": security_manifest["authority"],
    "reported_upstream_full_test_count": security_manifest["reported_upstream_full_test_count"],
    "manifest_valid": not security_errors,
    "manifest_errors": security_errors,
},
```

Do not replace the existing top-level `upstream_commit`, which continues to report historical product baseline `c3258a2...`.

- [ ] **Step 3: Add human-readable E0 evidence**

Create `docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.md` containing these explicit statements:

```markdown
# Milestone E0 Security Upstream Reference Freeze

- Historical product baseline remains `c3258a2f461d5af5a69c879891b485ccf0f02635`.
- Historical ASCS product overlay remains based on that baseline.
- Reviewed security implementation reference is separately pinned at `061a57ebd3f86dd6df83e6ff8472f5e194c567e5`, tree `664934916c950303ad7e9d166f7aa36a07ac4c57`.
- Authority: implementation reference only; it does not redefine `canonical/v1.0/`, v0.7/v0.9 profiles, or `egir-cj/0.1`.
- Upstream reported 135/135 tests after the reviewed Wasmtime merge; E0 reruns the non-Wasmtime security/product command contract. Exact physical Wasmtime 48.0.0 revalidation belongs to E5.
- E0 changes no capability, credential, connector, MCP, sandbox, or canonical mutation behavior.
```

Include a table mapping the seven reviewed fixes to their commit and regression test path from the JSON manifest.

- [ ] **Step 4: Run Product Convergence and regression tests**

```bash
python -B -m unittest tests.test_product_convergence -v
python -B -m unittest tests.test_security_upstream -v
python -B tools/product_convergence.py verify --repo . --json
python -B tools/product_convergence.py parity --repo . --json
python -B canonical/v1.0/machine/tests/test_validate_v10.py
python -B canonical/v1.0/machine/tools/validate_v10.py --json
```

Expected: all PASS; parity JSON contains both historical `upstream_commit = c3258a2...` and additive `security_upstream_reference.commit = 061a57eb...`.

- [ ] **Step 5: Commit Product Convergence integration**

```bash
git add tools/product_convergence.py tests/test_product_convergence.py docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.md
git commit -m "docs: bind E0 security reference into product convergence"
```

---

### Task 4: Read-only E0 CI with isolated pinned upstream checkout

**Files:**
- Create: `.github/workflows/milestone-e0-security-upstream.yml`

**Interfaces:**
- Consumes Task 2 CLI and manifest.
- Produces GitHub Actions evidence that the exact upstream commit/tree/blob map and runnable E0 verification command contract pass without modifying either repository.

- [ ] **Step 1: Add the E0 workflow with read-only permissions**

Create `.github/workflows/milestone-e0-security-upstream.yml` with:

```yaml
name: Milestone E0 Security Upstream Freeze

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
```

Gate jobs to the E0 branch name `workbench/milestone-e0-security-upstream-freeze`.

- [ ] **Step 2: Add `ascs-reference` job**

The job uses Python 3.13 and runs:

```bash
python -B tools/ascs_repo.py verify --repo . --json
python -B canonical/v1.0/machine/tests/test_validate_v10.py
python -B canonical/v1.0/machine/tools/validate_v10.py --json
python -B -m unittest tests.test_security_upstream -v
python -B -m unittest tests.test_product_convergence -v
python -B tools/security_upstream.py verify-manifest --repo . --json
python -B tools/product_convergence.py verify --repo . --json
python -B tools/product_convergence.py parity --repo . --json
```

Expected: PASS. This job proves E0 did not modify canonical inputs and did not rewrite historical product lineage.

- [ ] **Step 3: Add isolated `pinned-upstream` job**

Use a checkout directory outside the ASCS worktree:

```bash
UP=/tmp/eveglyph-security-upstream
rm -rf "$UP"
git init "$UP"
git -C "$UP" remote add origin https://github.com/kakon77777-commits/eveglyph-editor.git
git -C "$UP" fetch --depth=1 origin 061a57ebd3f86dd6df83e6ff8472f5e194c567e5
git -C "$UP" checkout --detach FETCH_HEAD
python -B tools/security_upstream.py verify-checkout --repo . --upstream-checkout "$UP" --json
```

The verifier must report exact head `061a57eb...`, tree `664934...`, exact merge parents, and zero file errors before npm runs.

- [ ] **Step 4: Run the E0 upstream command contract at the pinned checkout**

Use Node.js 20. In `/tmp/eveglyph-security-upstream` run exactly:

```bash
npm ci
npm run test:capabilities
npm run test:credential-broker
npm run test:github-connector
npm run test:google-connector
npm run test:mcp-delegation
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

Do not install/run Wasmtime in E0. The manifest records `test:wasmtime-sandbox` and `verify:wasmtime-sandbox` as E5 physical-runtime obligations. E0 documentation must not claim it independently reran the upstream 135-test total.

- [ ] **Step 5: Add current ASCS A/B/C/D product regression job**

Run the same stable regression surfaces already used in D closure:

```bash
node --test packages/ascs-core/test/*.test.mjs packages/ascs-runtime/test/*.test.mjs packages/ascs-store/test/*.test.mjs packages/ascs-history/test/*.test.mjs packages/ascs-spatial/test/*.test.mjs
node --test packages/ascs-math/test/*.test.mjs
node --test packages/ascs-glyph/test/*.test.mjs
cd apps/eveglyph-editor
npm ci
node --test test/ascs-runtime-bridge.test.mjs test/ascs-persistent-bridge.test.mjs test/ascs-native-math-bridge.test.mjs test/ascs-native-glyph-bridge.test.mjs
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

Expected: PASS. E0 must not add a new Editor bridge.

- [ ] **Step 6: Run workflow on the E0 PR and capture GREEN evidence**

Required GREEN shape:

```text
ascs-reference       PASS
pinned-upstream      PASS
ascs-product-regress PASS
```

If any existing A/B/C/D/product regression fails, E0 is blocked; do not weaken the gate.

- [ ] **Step 7: Commit final read-only CI**

```bash
git add .github/workflows/milestone-e0-security-upstream.yml
git commit -m "ci: verify E0 pinned security upstream"
```

---

### Task 5: E0 exact-head source backup and Ready-for-Review closure

**Files:**
- Create: `.github/workflows/milestone-e0-security-upstream-backup.yml`
- Modify only if evidence text needs final exact-head ids: `docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.md`

**Interfaces:**
- Consumes the final E0 PR head after Tasks 1–4 are GREEN.
- Produces `EveGlyph_ASCS_Milestone_E0_<sha8>_source-backup.zip` plus `ARTIFACT_SHA256.txt`.

- [ ] **Step 1: Add read-only exact-head backup workflow**

Use the established D backup pattern with:

```yaml
name: Milestone E0 Security Upstream Backup
on:
  pull_request:
    branches: [main]
permissions:
  contents: read
```

The job must check out `${{ github.event.pull_request.head.sha }}` exactly and verify it equals `git rev-parse HEAD` before any packaging.

Before packaging, rerun:

```bash
python -B tools/ascs_repo.py verify --repo . --json
python -B canonical/v1.0/machine/tests/test_validate_v10.py
python -B canonical/v1.0/machine/tools/validate_v10.py --json
python -B -m unittest tests.test_security_upstream tests.test_product_convergence -v
python -B tools/security_upstream.py verify-manifest --repo . --json
python -B tools/product_convergence.py verify --repo . --json
python -B tools/product_convergence.py parity --repo . --json
node --test packages/ascs-core/test/*.test.mjs packages/ascs-runtime/test/*.test.mjs packages/ascs-store/test/*.test.mjs packages/ascs-history/test/*.test.mjs packages/ascs-spatial/test/*.test.mjs packages/ascs-math/test/*.test.mjs packages/ascs-glyph/test/*.test.mjs
```

Then rerun the current Editor bridge/publication/build/dynamic gates in `apps/eveglyph-editor`.

- [ ] **Step 2: Package a restorable exact-head source tree**

Package the full repo excluding only:

```text
.git
node_modules
dist
tmp
.cache
coverage
.DS_Store
```

Include adjacent package files:

```text
BACKUP_MANIFEST.json
SHA256SUMS.txt
PR.patch
RESTORE.md
```

`BACKUP_MANIFEST.json` must include:

```json
{
  "schema": "eveglyph-ascs-source-backup/1.0",
  "repository": "kakon77777-commits/EveGlyph_ASCS",
  "milestone": "E0-security-upstream-freeze",
  "branch": "workbench/milestone-e0-security-upstream-freeze",
  "base_sha": "3590b11b6d1304292181394034d9c4114ec777f9",
  "design_commit": "dec29c38eb75ba203e3824dd8e18918e93ea1403",
  "security_upstream_commit": "061a57ebd3f86dd6df83e6ff8472f5e194c567e5",
  "security_upstream_tree": "664934916c950303ad7e9d166f7aa36a07ac4c57"
}
```

Also include the actual final `head_sha`, PR number, snapshot counts, payload-tree SHA-256, and verification fields. Do not hard-code an unknown future PR number or head SHA in source before the PR exists; derive them from the GitHub event environment inside the workflow.

- [ ] **Step 3: Validate the backup inside the workflow**

After ZIP creation:

- reopen ZIP and require `ZipFile.testzip() is None`;
- verify `ARTIFACT_SHA256.txt` with `sha256sum -c`;
- verify all internal `SHA256SUMS.txt` entries;
- require manifest `head_sha` equals the exact PR head used for checkout.

- [ ] **Step 4: Perform an independent post-download verification**

Download the Actions artifact into a separate environment and independently recompute:

```text
archive SHA-256
ZIP integrity
snapshot file count
snapshot byte count
payload tree SHA-256
all internal checksums
manifest base/head/milestone/security-upstream identity
```

Only after this independent verification may the PR body say `Ready for Review`.

- [ ] **Step 5: Final scope audit**

List PR changed filenames and require:

- zero changes under `canonical/`, `provenance/`, `releases/`;
- zero changes under `packages/` and `apps/eveglyph-editor/src/`, `server/`, MCP files, connector runtime files, credential runtime files, and sandbox runtime files;
- `apps/eveglyph-editor/UPSTREAM_BASELINE.json` unchanged;
- `apps/eveglyph-editor/ASCS_OVERLAY.json` unchanged;
- all construction-only workflows absent.

- [ ] **Step 6: Mark PR Ready, but do not merge**

PR evidence must state:

```text
E0 changes lineage/reference only.
Historical product baseline remains c3258a2...
Reviewed security reference is separately pinned at 061a57eb... / tree 664934...
Pinned non-Wasmtime upstream security/product contract PASS.
A/B/C/D/current product regressions PASS.
No authority behavior changed.
No merge without explicit user authorization.
```

- [ ] **Step 7: Commit backup gate**

```bash
git add .github/workflows/milestone-e0-security-upstream-backup.yml docs/product-convergence/MILESTONE_E0_SECURITY_UPSTREAM.md
git commit -m "ci: add E0 exact-head backup gate"
```

---

## Plan Self-Review Results

### Spec coverage

- E0 exact upstream repo/commit/tree freeze: Tasks 2 and 4.
- File/hash import map: Task 2.
- Reviewed seven-fix evidence map: Task 2.
- Current upstream security/product verification contract: Tasks 2 and 4.
- Historical product baseline not rewritten: Tasks 1 and 3.
- Product-convergence lineage extension: Task 3.
- RED/reference gate before implementation: Task 1.
- No authority behavior change / no provider writes / no canonical mutation changes: Global Constraints and Tasks 4–5 scope audits.
- Cross-milestone A/B/C/D/product regression: Tasks 4 and 5.
- Exact-head backup / independent verification / no merge without authorization: Task 5.

### Placeholder scan

No `TBD`, `TODO`, "implement later", unspecified error handling, or unbound interface remains. The only values intentionally derived at execution time are the future PR number and exact final E0 head SHA; the backup workflow is explicitly instructed to derive them from GitHub event metadata rather than hard-code placeholders.

### Type/interface consistency

- `load_security_manifest(repo)` and `validate_security_manifest(manifest)` are defined in Task 2 and consumed unchanged in Task 3.
- `verify_upstream_checkout(repo, upstream_checkout)` is defined in Task 2 and consumed unchanged by Task 4.
- `security_upstream_reference` is introduced once in Task 3 and used by the Task 1/3 Product Convergence test.
- Historical `UPSTREAM_COMMIT` remains `c3258a2...` everywhere; the new security commit has separate constant/manifest names and cannot silently replace it.
