from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

UPSTREAM_REPOSITORY = "kakon77777-commits/eveglyph-editor"
UPSTREAM_COMMIT = "c3258a2f461d5af5a69c879891b485ccf0f02635"
HANDOFF_HISTORICAL_COMMIT = "55a2ad77f3131f717cf73992cc2550e4c3a864bb"
BASELINE_SCHEMA = "eveglyph-ascs-upstream-baseline/1.0"

DEFAULT_EXCLUDED_NAMES = {
    ".git",
    "node_modules",
    "dist",
    "tmp",
    ".cache",
    "coverage",
    ".DS_Store",
}

REQUIRED_CAPABILITIES = (
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
)

CAPABILITY_EVIDENCE = {
    "markdown_editing": ("src/editor.js",),
    "live_preview": ("src/preview.js",),
    "file_tree_tabs": ("src/files.js", "src/tabs.js"),
    "encoding_io": ("src/encodingmenu.js", "src/files.js"),
    "diff_review": ("src/diffview.js",),
    "agent_ui": ("src/agent.js",),
    "dynamic_logic": ("src/dynamiclogic",),
    "dynamic_rendering": ("scripts/verify_dynamic_rendering.mjs",),
    "typst_pdf_publication": ("src/publication/node-renderer.js", "src/typstconvert.js"),
    "mcp_publication": ("mcp-publication.js",),
    "remote_mcp": ("mcp-server-remote.js",),
    "real_corpus_publication_tests": ("test/publication-real-corpus-compat.test.mjs",),
}

PRODUCT_VERIFICATION_COMMANDS = {
    "dynamic_logic": "npm run verify:dynamic-logic",
    "dynamic_rendering": "npm run verify:dynamic-rendering",
    "typst_pdf_publication": "npm run test:publication",
    "mcp_publication": "npm run test:publication",
    "real_corpus_publication_tests": "npm run test:publication",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def inventory_tree(root: Path, exclusions: set[str] | None = None) -> list[dict]:
    excluded = exclusions or DEFAULT_EXCLUDED_NAMES
    rows: list[dict] = []
    if not root.exists():
        return rows
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(root)
        if any(part in excluded for part in rel.parts):
            continue
        if rel.as_posix() == "UPSTREAM_BASELINE.json":
            continue
        rows.append(
            {
                "path": rel.as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        )
    return rows


def payload_tree_sha256(rows: list[dict]) -> str:
    h = hashlib.sha256()
    for row in sorted(rows, key=lambda item: item["path"]):
        record = f'{row["path"]}\0{row["sha256"]}\0{row["bytes"]}\0'.encode("utf-8")
        h.update(record)
    return h.hexdigest()


def app_root(repo: Path) -> Path:
    return repo / "apps" / "eveglyph-editor"


def baseline_manifest_path(repo: Path) -> Path:
    return app_root(repo) / "UPSTREAM_BASELINE.json"


def load_baseline_manifest(repo: Path) -> dict:
    return json.loads(baseline_manifest_path(repo).read_text(encoding="utf-8"))


def build_baseline_manifest(repo: Path) -> dict:
    root = app_root(repo)
    rows = inventory_tree(root)
    return {
        "schema": BASELINE_SCHEMA,
        "upstream_repository": UPSTREAM_REPOSITORY,
        "upstream_commit": UPSTREAM_COMMIT,
        "handoff_historical_commit": HANDOFF_HISTORICAL_COMMIT,
        "authority": "implementation-input-only",
        "exclusions": sorted(DEFAULT_EXCLUDED_NAMES),
        "files": rows,
        "file_count": len(rows),
        "total_bytes": sum(row["bytes"] for row in rows),
        "payload_tree_sha256": payload_tree_sha256(rows),
    }


def write_baseline_manifest(repo: Path) -> dict:
    root = app_root(repo)
    root.mkdir(parents=True, exist_ok=True)
    manifest = build_baseline_manifest(repo)
    baseline_manifest_path(repo).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return manifest


def verify_baseline(repo: Path) -> dict:
    manifest = load_baseline_manifest(repo)
    actual = {row["path"]: row for row in inventory_tree(app_root(repo))}
    expected = {row["path"]: row for row in manifest["files"]}
    missing = sorted(set(expected) - set(actual))
    unexpected = sorted(set(actual) - set(expected))
    mismatched = sorted(
        path
        for path in set(actual) & set(expected)
        if actual[path]["bytes"] != expected[path]["bytes"]
        or actual[path]["sha256"] != expected[path]["sha256"]
    )
    metadata_errors = []
    expected_metadata = {
        "schema": BASELINE_SCHEMA,
        "upstream_repository": UPSTREAM_REPOSITORY,
        "upstream_commit": UPSTREAM_COMMIT,
        "handoff_historical_commit": HANDOFF_HISTORICAL_COMMIT,
        "authority": "implementation-input-only",
    }
    for key, value in expected_metadata.items():
        if manifest.get(key) != value:
            metadata_errors.append(f"{key}: expected {value!r}, got {manifest.get(key)!r}")
    rows = list(actual.values())
    actual_tree = payload_tree_sha256(rows)
    if manifest.get("payload_tree_sha256") != actual_tree:
        metadata_errors.append("payload_tree_sha256 mismatch")
    return {
        "ok": not (missing or unexpected or mismatched or metadata_errors),
        "missing": missing,
        "unexpected": unexpected,
        "mismatched": mismatched,
        "metadata_errors": metadata_errors,
        "files": len(actual),
        "bytes": sum(row["bytes"] for row in actual.values()),
        "payload_tree_sha256": actual_tree,
        "upstream_commit": manifest.get("upstream_commit"),
    }


def collect_parity(repo: Path) -> dict:
    root = app_root(repo)
    capabilities: dict[str, dict] = {}
    for name in REQUIRED_CAPABILITIES:
        evidence = list(CAPABILITY_EVIDENCE[name])
        checks = [{"path": path, "exists": (root / path).exists()} for path in evidence]
        capabilities[name] = {
            "present": all(item["exists"] for item in checks),
            "evidence": checks,
            "verification_command": PRODUCT_VERIFICATION_COMMANDS.get(name),
        }
    return {
        "schema": "eveglyph-ascs-product-parity/1.0",
        "upstream_repository": UPSTREAM_REPOSITORY,
        "upstream_commit": UPSTREAM_COMMIT,
        "required_capabilities": list(REQUIRED_CAPABILITIES),
        "capabilities": capabilities,
        "ascs_only_future_milestones": [
            "canonical_persistent_identity",
            "revision_graph",
            "native_math",
            "native_glyph",
            "spatial_canonical_model",
            "authority_transactions",
        ],
        "ok": all(item["present"] for item in capabilities.values()),
    }


def write_parity_reports(repo: Path) -> dict:
    report = collect_parity(repo)
    docs = repo / "docs" / "product-convergence"
    docs.mkdir(parents=True, exist_ok=True)
    (docs / "MILESTONE_A_PARITY.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    lines = [
        "# Milestone A Product Parity",
        "",
        f"**Upstream:** `{UPSTREAM_REPOSITORY}@{UPSTREAM_COMMIT}`",
        "",
        "| Capability | Present | Evidence |",
        "| --- | --- | --- |",
    ]
    for name in REQUIRED_CAPABILITIES:
        item = report["capabilities"][name]
        evidence = ", ".join(f'`{entry["path"]}`' for entry in item["evidence"])
        lines.append(f'| `{name}` | {"PASS" if item["present"] else "FAIL"} | {evidence} |')
    lines.extend(
        [
            "",
            "ASCS-only capabilities remain future milestones in Milestone B and later; Milestone A does not claim them as implemented.",
            "",
        ]
    )
    (docs / "MILESTONE_A_PARITY.md").write_text("\n".join(lines), encoding="utf-8")
    return report


def write_baseline_doc(repo: Path) -> None:
    manifest = load_baseline_manifest(repo)
    docs = repo / "docs" / "product-convergence"
    docs.mkdir(parents=True, exist_ok=True)
    text = f"""# Milestone A Product Baseline

**Selected current product baseline:** `{UPSTREAM_REPOSITORY}@{UPSTREAM_COMMIT}`  
**Historical ASCS handoff input:** `{HANDOFF_HISTORICAL_COMMIT}`  
**Authority:** implementation input only

The vendored snapshot is intentionally newer than the implementation commit pinned by the ASCS v1.0 handoff. This updates only the product implementation baseline; `canonical/v1.0/` remains semantic authority.

Vendored inventory:

- files: {manifest['file_count']}
- bytes: {manifest['total_bytes']}
- payload tree SHA-256: `{manifest['payload_tree_sha256']}`

Default import exclusions: {', '.join(f'`{name}`' for name in manifest['exclusions'])}.
"""
    (docs / "MILESTONE_A_BASELINE.md").write_text(text, encoding="utf-8")


def _emit(data: dict, as_json: bool) -> None:
    if as_json:
        print(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print(data)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="EveGlyph ASCS product convergence tooling")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("generate", "verify", "parity", "reports"):
        p = sub.add_parser(name)
        p.add_argument("--repo", default=".")
        p.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    repo = Path(args.repo).resolve()

    if args.command == "generate":
        manifest = write_baseline_manifest(repo)
        write_baseline_doc(repo)
        report = write_parity_reports(repo)
        data = {"manifest": manifest, "parity": report}
        _emit(data, args.json)
        return 0 if report["ok"] else 1
    if args.command == "verify":
        result = verify_baseline(repo)
        _emit(result, args.json)
        return 0 if result["ok"] else 1
    if args.command == "parity":
        result = collect_parity(repo)
        _emit(result, args.json)
        return 0 if result["ok"] else 1
    if args.command == "reports":
        write_baseline_doc(repo)
        result = write_parity_reports(repo)
        _emit(result, args.json)
        return 0 if result["ok"] else 1
    return 2


if __name__ == "__main__":
    sys.exit(main())
