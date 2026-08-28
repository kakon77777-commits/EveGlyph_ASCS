from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path, PurePosixPath

SECURITY_UPSTREAM_REPOSITORY = "kakon77777-commits/eveglyph-editor"
SECURITY_UPSTREAM_COMMIT = "061a57ebd3f86dd6df83e6ff8472f5e194c567e5"
SECURITY_UPSTREAM_TREE = "664934916c950303ad7e9d166f7aa36a07ac4c57"
SECURITY_SCHEMA = "eveglyph-ascs-security-upstream/1.0"
SECURITY_AUTHORITY = "implementation-reference-only"
HISTORICAL_PRODUCT_BASELINE_COMMIT = "c3258a2f461d5af5a69c879891b485ccf0f02635"
EXPECTED_PARENTS = [
    "5405255f0eb527ca3ae848477b1be328f9f69153",
    "2ac9dfdeaabc629ef0564eaf78a84f4b5226561b",
]
REQUIRED_ROLES = {
    "capability-control-plane",
    "credential-custody",
    "delegation",
    "connector",
    "ingress",
    "physical-sandbox",
    "security-verifier",
}
EXPECTED_FIX_IDS = {
    "windows-named-pipe-framing",
    "sandbox-entrypoint-bypass",
    "prototype-chain-capability-lookup",
    "wildcard-segment-boundary",
    "google-export-bounded-stream",
    "delegation-sensitive-result-filter",
    "delegated-credential-id-redaction",
}
E0_COMMANDS = {
    "npm run test:capabilities",
    "npm run test:credential-broker",
    "npm run test:github-connector",
    "npm run test:google-connector",
    "npm run test:mcp-delegation",
    "npm run test:publication",
    "npm run build",
    "npm run verify:dynamic-logic",
    "npm run verify:dynamic-rendering",
}
E5_DEFERRED_COMMANDS = {
    "npm run test:wasmtime-sandbox",
    "npm run verify:wasmtime-sandbox",
}
HEX40_RE = re.compile(r"^[0-9a-f]{40}$")


def security_manifest_path(repo: Path) -> Path:
    return repo / "docs" / "product-convergence" / "MILESTONE_E0_SECURITY_UPSTREAM.json"


def load_security_manifest(repo: Path) -> dict:
    return json.loads(security_manifest_path(repo).read_text(encoding="utf-8"))


def _safe_path(value: object) -> bool:
    if not isinstance(value, str) or not value or "\\" in value:
        return False
    path = PurePosixPath(value)
    return not path.is_absolute() and "." not in path.parts and ".." not in path.parts


def validate_security_manifest(manifest: dict) -> list[str]:
    errors: list[str] = []
    if not isinstance(manifest, dict):
        return ["manifest must be an object"]

    expected_metadata = {
        "schema": SECURITY_SCHEMA,
        "repository": SECURITY_UPSTREAM_REPOSITORY,
        "commit": SECURITY_UPSTREAM_COMMIT,
        "git_tree": SECURITY_UPSTREAM_TREE,
        "authority": SECURITY_AUTHORITY,
        "historical_product_baseline_commit": HISTORICAL_PRODUCT_BASELINE_COMMIT,
        "reported_upstream_full_test_count": 135,
    }
    for key, expected in expected_metadata.items():
        if manifest.get(key) != expected:
            errors.append(f"{key}: expected {expected!r}, got {manifest.get(key)!r}")

    if manifest.get("merge_parents") != EXPECTED_PARENTS:
        errors.append("merge_parents must exactly match the pinned reviewed merge parents in order")

    files = manifest.get("files")
    if not isinstance(files, list) or not files:
        errors.append("files must be a non-empty list")
        files = []

    paths: list[str] = []
    blobs: list[str] = []
    roles: set[str] = set()
    for index, row in enumerate(files):
        if not isinstance(row, dict):
            errors.append(f"files[{index}] must be an object")
            continue
        path = row.get("path")
        blob = row.get("git_blob")
        size = row.get("bytes")
        role = row.get("role")
        if not _safe_path(path):
            errors.append(f"files[{index}].path is unsafe: {path!r}")
        else:
            paths.append(path)
        if not isinstance(blob, str) or not HEX40_RE.fullmatch(blob):
            errors.append(f"files[{index}].git_blob must be a lowercase 40-hex Git object id")
        else:
            blobs.append(blob)
        if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
            errors.append(f"files[{index}].bytes must be a positive integer")
        if not isinstance(role, str) or role not in REQUIRED_ROLES:
            errors.append(f"files[{index}].role is unknown: {role!r}")
        else:
            roles.add(role)

    if paths != sorted(paths):
        errors.append("file paths must be sorted")
    if len(paths) != len(set(paths)):
        errors.append("file paths must be unique")
    if len(blobs) != len(set(blobs)):
        errors.append("selected file git_blob values must be unique")
    missing_roles = sorted(REQUIRED_ROLES - roles)
    if missing_roles:
        errors.append(f"missing required role classes: {', '.join(missing_roles)}")

    fixes = manifest.get("reviewed_fixes")
    if not isinstance(fixes, list):
        errors.append("reviewed_fixes must be a list")
        fixes = []
    fix_ids: list[str] = []
    for index, row in enumerate(fixes):
        if not isinstance(row, dict):
            errors.append(f"reviewed_fixes[{index}] must be an object")
            continue
        fix_id = row.get("id")
        commit = row.get("commit")
        evidence_path = row.get("evidence_path")
        if not isinstance(fix_id, str) or not fix_id:
            errors.append(f"reviewed_fixes[{index}].id must be non-empty")
        else:
            fix_ids.append(fix_id)
        if not isinstance(commit, str) or not HEX40_RE.fullmatch(commit):
            errors.append(f"reviewed_fixes[{index}].commit must be a lowercase 40-hex commit id")
        if not _safe_path(evidence_path):
            errors.append(f"reviewed_fixes[{index}].evidence_path is unsafe")
    if fix_ids != sorted(fix_ids):
        errors.append("reviewed_fixes must be sorted by id")
    if len(fix_ids) != len(set(fix_ids)):
        errors.append("reviewed fix ids must be unique")
    if set(fix_ids) != EXPECTED_FIX_IDS:
        errors.append("reviewed fix id set does not match the seven reviewed security fixes")

    commands = manifest.get("verification_commands")
    if not isinstance(commands, list):
        errors.append("verification_commands must be a list")
        commands = []
    seen_commands: set[str] = set()
    e0_seen: set[str] = set()
    e5_seen: set[str] = set()
    for index, row in enumerate(commands):
        if not isinstance(row, dict):
            errors.append(f"verification_commands[{index}] must be an object")
            continue
        command = row.get("command")
        phase = row.get("phase")
        if not isinstance(command, str) or not command.startswith("npm run "):
            errors.append(f"verification_commands[{index}].command must be an explicit npm run command")
            continue
        if command in seen_commands:
            errors.append(f"duplicate verification command: {command}")
        seen_commands.add(command)
        if phase == "E0-reference-ci":
            e0_seen.add(command)
        elif phase == "E5-physical-runtime":
            e5_seen.add(command)
        else:
            errors.append(f"verification_commands[{index}].phase is unsupported: {phase!r}")
        if command not in E0_COMMANDS | E5_DEFERRED_COMMANDS:
            errors.append(f"verification command is not pinned by E0 design: {command}")
    if e0_seen != E0_COMMANDS:
        errors.append("E0-reference-ci command set is incomplete or changed")
    if e5_seen != E5_DEFERRED_COMMANDS:
        errors.append("E5-physical-runtime deferred command set is incomplete or changed")

    return errors


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


def verify_upstream_checkout(repo: Path, upstream_checkout: Path) -> dict:
    manifest = load_security_manifest(repo)
    manifest_errors = validate_security_manifest(manifest)
    file_errors: list[str] = []
    verified_files = 0
    head = tree = ""
    parents: list[str] = []
    checkout_errors: list[str] = []

    try:
        head = _git(upstream_checkout, "rev-parse", "HEAD")
        tree = _git(upstream_checkout, "rev-parse", "HEAD^{tree}")
        parents = _git(upstream_checkout, "show", "-s", "--format=%P", "HEAD").split()
    except RuntimeError as exc:
        checkout_errors.append(str(exc))
        return {
            "ok": False,
            "head": head,
            "tree": tree,
            "parents": parents,
            "file_errors": file_errors,
            "manifest_errors": manifest_errors,
            "checkout_errors": checkout_errors,
            "verified_files": verified_files,
        }

    if head != manifest.get("commit"):
        checkout_errors.append(f"HEAD mismatch: expected {manifest.get('commit')}, got {head}")
    if tree != manifest.get("git_tree"):
        checkout_errors.append(f"tree mismatch: expected {manifest.get('git_tree')}, got {tree}")
    if parents != manifest.get("merge_parents"):
        checkout_errors.append(f"parent mismatch: expected {manifest.get('merge_parents')}, got {parents}")

    for row in manifest.get("files", []):
        path = row.get("path")
        if not _safe_path(path):
            continue
        try:
            blob = _git(upstream_checkout, "rev-parse", f"HEAD:{path}")
        except RuntimeError as exc:
            file_errors.append(f"{path}: {exc}")
            continue
        if blob != row.get("git_blob"):
            file_errors.append(f"{path}: blob expected {row.get('git_blob')}, got {blob}")
            continue
        # Size is read from the Git object store (`cat-file -s <blob>`), not
        # `Path.stat().st_size` on the working-tree file. A working-tree read
        # reflects whatever the local checkout's line-ending settings did
        # (Windows checkouts with core.autocrlf=true rewrite LF -> CRLF on
        # checkout, adding one byte per line) even though the blob hash check
        # above already proves the *content* is byte-identical to what was
        # pinned. Reading size from the same blob object the hash came from
        # keeps this check meaningful and platform-independent instead of
        # false-failing every file on any checkout that normalizes line
        # endings — reproduced empirically: every one of the 34 pinned files
        # failed this check by an amount exactly equal to its own line count.
        try:
            size = int(_git(upstream_checkout, "cat-file", "-s", blob))
        except (RuntimeError, ValueError) as exc:
            file_errors.append(f"{path}: cannot read blob size: {exc}")
            continue
        if size != row.get("bytes"):
            file_errors.append(f"{path}: bytes expected {row.get('bytes')}, got {size}")
            continue
        verified_files += 1

    ok = not (manifest_errors or checkout_errors or file_errors)
    return {
        "ok": ok,
        "head": head,
        "tree": tree,
        "parents": parents,
        "file_errors": file_errors,
        "manifest_errors": manifest_errors,
        "checkout_errors": checkout_errors,
        "verified_files": verified_files,
    }


def _print_result(result: dict, as_json: bool) -> None:
    if as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print("PASS" if result.get("ok") else "FAIL")
        for key, value in result.items():
            if key != "ok":
                print(f"{key}: {value}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Verify the pinned EveGlyph security implementation reference.")
    sub = parser.add_subparsers(dest="command", required=True)

    manifest_parser = sub.add_parser("verify-manifest")
    manifest_parser.add_argument("--repo", default=".")
    manifest_parser.add_argument("--json", action="store_true")

    checkout_parser = sub.add_parser("verify-checkout")
    checkout_parser.add_argument("--repo", default=".")
    checkout_parser.add_argument("--upstream-checkout", required=True)
    checkout_parser.add_argument("--json", action="store_true")

    args = parser.parse_args(argv)
    repo = Path(args.repo).resolve()

    if args.command == "verify-manifest":
        manifest = load_security_manifest(repo)
        errors = validate_security_manifest(manifest)
        result = {"ok": not errors, "errors": errors}
    else:
        result = verify_upstream_checkout(repo, Path(args.upstream_checkout).resolve())

    _print_result(result, args.json)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
