from __future__ import annotations

import argparse
import hashlib
import json
import zipfile
from pathlib import Path
from typing import Any

try:
    from jsonschema import Draft202012Validator
except Exception:  # pragma: no cover
    Draft202012Validator = None

EXPECTED_CANONICALIZATION = "egir-cj/0.1"
EXPECTED_CANDIDATES = {
    "ncm/1.0-candidate.1",
    "glyph/1.0-candidate.1",
    "agent-principal/1.0-candidate.1",
    "adapter-profile/1.0-candidate.1",
}
REQUIRED_NO_SILENT = {
    "persistent identity semantics",
    "content/revision/workspace hash preimages",
    "egir-cj/0.1 behavior",
    "candidate-versus-authoritative relation boundary",
    "canonical-versus-session-versus-derived state boundary",
    "resolve-versus-authorize boundary",
    "computed-versus-verified-versus-proved evidence classes",
    "legacy import cannot claim canonical authority",
    "external reference cannot auto-bind local identity",
    "external effect unknown outcome cannot be silently retried",
    "profile identifier meaning",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def validate_archive_entry(entry: dict[str, Any], archive_dir: Path) -> list[str]:
    errors: list[str] = []
    path = archive_dir / entry.get("filename", "")
    if not path.is_file():
        return [f"missing required source archive: {entry.get('filename')}"]
    if path.stat().st_size != entry.get("bytes"):
        errors.append(f"archive byte length mismatch: {path.name}")
    got = sha256_file(path)
    if got != entry.get("sha256"):
        errors.append(f"archive sha256 mismatch: {path.name}")
    try:
        with zipfile.ZipFile(path) as zf:
            bad = zf.testzip()
            if bad:
                errors.append(f"zip integrity failure {path.name}: {bad}")
    except zipfile.BadZipFile:
        errors.append(f"zip integrity failure: {path.name}")
    return errors


def validate_manifest_data(
    manifest: dict[str, Any],
    package_root: Path,
    *,
    verify_archives: bool = True,
    verify_docs: bool = True,
    verify_schema: bool = False,
) -> list[str]:
    errors: list[str] = []

    if manifest.get("ascs_release") != "ascs/1.0":
        errors.append("ascs_release must remain ascs/1.0")
    if manifest.get("handoff_version") != "ascs-handoff/1.0":
        errors.append("handoff_version must remain ascs-handoff/1.0")
    if manifest.get("canonicalization") != EXPECTED_CANONICALIZATION:
        errors.append("canonicalization must remain egir-cj/0.1; semantic change requires a new identifier")
    if manifest.get("mandatory_canonical_migration_from_ascs_0_9") is not False:
        errors.append("v0.9 -> v1.0 must not introduce mandatory canonical migration")

    archives = manifest.get("source_archives", [])
    archive_ids = [a.get("archive_id") for a in archives if isinstance(a, dict)]
    archive_names = [a.get("filename") for a in archives if isinstance(a, dict)]
    if len(archive_ids) != len(set(archive_ids)):
        errors.append("duplicate source archive_id")
    if len(archive_names) != len(set(archive_names)):
        errors.append("duplicate source archive filename")
    required_roles = {
        "core-theory-architecture", "executable-evidence", "contract-hardening", "history-merge",
        "spatial-region", "native-math-candidate", "glyph-symbol-candidate", "agentic-workspace",
        "interchange", "operational-hardening",
    }
    roles = {a.get("role") for a in archives if isinstance(a, dict)}
    missing_roles = sorted(required_roles - roles)
    if missing_roles:
        errors.append(f"missing source archive roles: {', '.join(missing_roles)}")

    profile_ids = {p.get("profile_id") for p in manifest.get("profiles", []) if isinstance(p, dict)}
    for expected in EXPECTED_CANDIDATES:
        if expected not in profile_ids:
            errors.append(f"candidate profile must retain exact identifier {expected}")
    if "ncm/1.0" in profile_ids and "ncm/1.0-candidate.1" not in profile_ids:
        errors.append("ncm/1.0-candidate.1 cannot be silently promoted to ncm/1.0")
    if "glyph/1.0" in profile_ids and "glyph/1.0-candidate.1" not in profile_ids:
        errors.append("glyph/1.0-candidate.1 cannot be silently promoted to glyph/1.0")

    no_silent = set(manifest.get("no_silent_change", []))
    missing_invariants = sorted(REQUIRED_NO_SILENT - no_silent)
    if missing_invariants:
        errors.append(f"missing no-silent-change invariants: {', '.join(missing_invariants)}")

    authority = manifest.get("authority_order", [])
    if not authority or "chat discussion" not in authority[-1].lower():
        errors.append("chat discussion must remain lowest authority in handoff order")

    if verify_docs:
        for name in manifest.get("required_handoff_documents", []):
            if not (package_root / name).is_file():
                errors.append(f"missing required handoff document: {name}")

    if verify_archives:
        archive_dir = package_root / "source_archives"
        for entry in archives:
            if isinstance(entry, dict):
                errors.extend(validate_archive_entry(entry, archive_dir))
        optional_dir = package_root / "optional_inputs"
        for item in manifest.get("implementation_inputs", []):
            if not isinstance(item, dict) or item.get("kind") != "archive":
                continue
            filename = item.get("filename", "")
            path = optional_dir / filename
            if not path.is_file():
                errors.append(f"missing optional pinned archive: {filename}")
                continue
            if sha256_file(path) != item.get("sha256"):
                errors.append(f"optional archive sha256 mismatch: {filename}")
            try:
                with zipfile.ZipFile(path) as zf:
                    bad = zf.testzip()
                    if bad:
                        errors.append(f"optional zip integrity failure {filename}: {bad}")
            except zipfile.BadZipFile:
                errors.append(f"optional zip integrity failure: {filename}")

    if verify_schema:
        if Draft202012Validator is None:
            errors.append("jsonschema unavailable; cannot verify Draft 2020-12 handoff schema")
        else:
            schema_path = package_root / "machine/schemas/canonical-handoff-manifest.schema.json"
            try:
                schema = json.loads(schema_path.read_text("utf-8"))
                Draft202012Validator.check_schema(schema)
                for e in Draft202012Validator(schema).iter_errors(manifest):
                    errors.append(f"handoff schema: {e.message}")
            except Exception as exc:
                errors.append(f"handoff schema validation failure: {exc}")

    return errors


def validate_vectors(package_root: Path) -> list[str]:
    errors: list[str] = []
    path = package_root / "machine/conformance/v1.0_handoff_vectors.json"
    try:
        obj = json.loads(path.read_text("utf-8"))
    except Exception as exc:
        return [f"cannot read handoff vectors: {exc}"]
    vectors = obj.get("vectors", [])
    ids = [v.get("id") for v in vectors if isinstance(v, dict)]
    if len(vectors) != 20:
        errors.append(f"expected 20 v1.0 conformance vectors, got {len(vectors)}")
    if len(ids) != len(set(ids)):
        errors.append("duplicate v1.0 conformance vector IDs")
    for v in vectors:
        if not isinstance(v, dict) or v.get("expected") is not True:
            errors.append(f"invalid v1.0 conformance vector: {v}")
    return errors


def validate_package(package_root: Path) -> dict[str, Any]:
    manifest_path = package_root / "machine/canonical_handoff_manifest_v1.0.json"
    manifest = json.loads(manifest_path.read_text("utf-8"))
    errors = validate_manifest_data(manifest, package_root, verify_archives=True, verify_docs=True, verify_schema=True)
    errors.extend(validate_vectors(package_root))
    return {
        "status": "PASS" if not errors else "FAIL",
        "ascs_release": manifest.get("ascs_release"),
        "archive_count": len(manifest.get("source_archives", [])),
        "profile_count": len(manifest.get("profiles", [])),
        "vector_count": 20,
        "errors": errors,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    ap.add_argument("--json", action="store_true")
    ns = ap.parse_args()
    result = validate_package(ns.root.resolve())
    if ns.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"ASCS v1.0 handoff validation: {result['status']}")
        print(f"archives={result['archive_count']} profiles={result['profile_count']} vectors={result['vector_count']}")
        for e in result["errors"]:
            print("ERROR:", e)
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
