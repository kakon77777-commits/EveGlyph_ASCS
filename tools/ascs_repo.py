#!/usr/bin/env python3
"""Preservation-first assembly and verification for the EveGlyph ASCS repo."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import shutil
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath


CANONICAL_ARCHIVE = "EveGlyph_ASCS_v1.0_Canonical_Handoff_Complete.zip"
CANONICAL_WRAPPER = "EveGlyph_ASCS_v1.0_Canonical_Handoff"
CANONICAL_SHA256 = "d68cf0ad4fc50cb6b5abe92b489cf25ca30b51db583cda5997d29a07ad4ab7ac"
CANONICAL_BYTES = 1_982_680
EXPECTED_SOURCE_FILES = 20
EXPECTED_MARKDOWN_FILES = 8
EXPECTED_ZIP_FILES = 12
PINNED_ARCHITECTURE_SHA256 = "19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778"
HISTORICAL_ARCHITECTURE_SHA256 = "97c5e95d45ca615277e1719e24f318d8ea208e09ddb7c74c1388d76683739bca"
MAX_ZIP_ENTRIES = 10_000
MAX_ZIP_UNCOMPRESSED_BYTES = 512 * 1024 * 1024
MAX_ZIP_NESTING_DEPTH = 4

ARCHITECTURE_ARCHIVE = (
    "EveGlyph_Addressable_Symbolic_Computational_Space_Series_"
    "v0.1_Architecture_Complete.zip"
)

ARCHIVE_ROLES = {
    "EveGlyph_Addressable_Symbolic_Computational_Space_Series_v0.1_Through_TW01.zip": (
        "historical-precursor"
    ),
    ARCHITECTURE_ARCHIVE: "historical-provenance-divergent",
    "EveGlyph_Computational_Canvas_MVP_v0.1.zip": "executable-evidence",
    "EveGlyph_ASCS_v0.2_Contract_Hardening_Round_Complete.zip": "contract-hardening",
    "EveGlyph_ASCS_v0.3_Persistent_Editing_Round_Complete.zip": "history-merge",
    "EveGlyph_ASCS_v0.4_Spatial_Region_Round_Complete.zip": "spatial-region",
    "EveGlyph_ASCS_v0.5_Native_Math_Round_Complete.zip": "native-math-candidate",
    "EveGlyph_ASCS_v0.6_Glyph_Symbol_Round_Complete.zip": "glyph-symbol-candidate",
    "EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip": "agentic-workspace",
    "EveGlyph_ASCS_v0.8_Interchange_Round_Complete.zip": "interchange",
    "EveGlyph_ASCS_v0.9_Productization_Hardening_Round_Complete.zip": (
        "operational-hardening"
    ),
    CANONICAL_ARCHIVE: "canonical-release",
}

SECRET_PATTERNS = {
    "private-key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "github-token": re.compile(rb"gh[pousr]_[A-Za-z0-9]{36,255}"),
    "openai-key": re.compile(rb"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"),
    "aws-access-key": re.compile(rb"AKIA[0-9A-Z]{16}"),
}


class UnsafeArchiveError(ValueError):
    """Raised when an archive path or type is unsafe to materialize."""


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_role(path: Path) -> str:
    if path.suffix.lower() == ".md":
        return "loose-source-document"
    return ARCHIVE_ROLES.get(path.name, "source-archive")


def build_inventory(source: Path) -> list[dict[str, object]]:
    source = Path(source)
    if not source.is_dir():
        raise FileNotFoundError(f"source directory not found: {source}")
    directories = sorted(p.name for p in source.iterdir() if p.is_dir())
    if directories:
        raise ValueError(f"source must be flat; found directories: {directories}")
    files = sorted((p for p in source.iterdir() if p.is_file()), key=lambda p: p.name)
    markdown = [p for p in files if p.suffix.lower() == ".md"]
    archives = [p for p in files if p.suffix.lower() == ".zip"]
    unexpected = [p.name for p in files if p.suffix.lower() not in {".md", ".zip"}]
    if (
        len(files) != EXPECTED_SOURCE_FILES
        or len(markdown) != EXPECTED_MARKDOWN_FILES
        or len(archives) != EXPECTED_ZIP_FILES
        or unexpected
    ):
        raise ValueError(
            "source inventory mismatch: "
            f"files={len(files)}, markdown={len(markdown)}, zip={len(archives)}, "
            f"unexpected={unexpected}"
        )
    return [
        {
            "relative_path": path.name,
            "kind": "document" if path.suffix.lower() == ".md" else "archive",
            "role": source_role(path),
            "bytes": path.stat().st_size,
            "sha256": sha256_path(path),
        }
        for path in files
    ]


SOURCE_INVENTORY_FIELDS = ("relative_path", "kind", "role", "bytes", "sha256")


def source_inventory_matches(
    live: list[dict[str, object]],
    recorded: list[dict[str, object]],
) -> bool:
    def project(rows: list[dict[str, object]]) -> list[dict[str, object]]:
        return [
            {field: row.get(field) for field in SOURCE_INVENTORY_FIELDS}
            for row in rows
        ]

    return project(live) == project(recorded)


def checked_parts(info: zipfile.ZipInfo) -> tuple[str, ...]:
    normalized = info.filename.replace("\\", "/")
    path = PurePosixPath(normalized)
    parts = path.parts
    mode = (info.external_attr >> 16) & 0xFFFF
    if (
        not parts
        or path.is_absolute()
        or ".." in parts
        or parts[0].endswith(":")
        or stat.S_ISLNK(mode)
    ):
        raise UnsafeArchiveError(info.filename)
    return parts


def _validate_infos(infos: list[zipfile.ZipInfo]) -> None:
    if len(infos) > MAX_ZIP_ENTRIES:
        raise UnsafeArchiveError(f"too many ZIP entries: {len(infos)}")
    total = sum(info.file_size for info in infos if not info.is_dir())
    if total > MAX_ZIP_UNCOMPRESSED_BYTES:
        raise UnsafeArchiveError(f"ZIP uncompressed size exceeds limit: {total}")
    for info in infos:
        checked_parts(info)


def _resolved_child(root: Path, parts: tuple[str, ...]) -> Path:
    resolved_root = root.resolve()
    target = root.joinpath(*parts).resolve()
    if target != resolved_root and resolved_root not in target.parents:
        raise UnsafeArchiveError(str(target))
    return target


def _extract_zip(
    archive: Path,
    destination: Path,
    expected_wrapper: str | None,
) -> list[dict[str, object]]:
    archive = Path(archive)
    destination = Path(destination)
    with zipfile.ZipFile(archive) as handle:
        infos = handle.infolist()
        _validate_infos(infos)
        plans: list[tuple[zipfile.ZipInfo, Path, tuple[str, ...]]] = []
        seen: set[str] = set()
        for info in infos:
            parts = checked_parts(info)
            if expected_wrapper is not None:
                if parts[0] != expected_wrapper:
                    raise UnsafeArchiveError(
                        f"unexpected ZIP wrapper {parts[0]!r}; expected {expected_wrapper!r}"
                    )
                parts = parts[1:]
            if not parts:
                if info.is_dir():
                    continue
                raise UnsafeArchiveError(f"wrapper is a file: {info.filename}")
            target = _resolved_child(destination, parts)
            collision_key = str(target).casefold()
            if collision_key in seen:
                raise UnsafeArchiveError(f"duplicate or case-colliding member: {info.filename}")
            seen.add(collision_key)
            if target.exists():
                raise FileExistsError(target)
            plans.append((info, target, parts))

        destination.mkdir(parents=True, exist_ok=True)
        records: list[dict[str, object]] = []
        for info, target, parts in plans:
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=False)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with handle.open(info) as source, target.open("xb") as output:
                shutil.copyfileobj(source, output, length=1024 * 1024)
            records.append(
                {
                    "relative_path": PurePosixPath(*parts).as_posix(),
                    "bytes": target.stat().st_size,
                    "sha256": sha256_path(target),
                }
            )
        return sorted(records, key=lambda row: str(row["relative_path"]))


def safe_extract_single_wrapper(
    archive: Path,
    destination: Path,
    expected_wrapper: str,
) -> list[dict[str, object]]:
    return _extract_zip(archive, destination, expected_wrapper)


def safe_extract_archive(archive: Path, destination: Path) -> list[dict[str, object]]:
    return _extract_zip(archive, destination, None)


def _normalize_checksum_path(value: str) -> str:
    value = value.replace("\\", "/")
    while value.startswith("./"):
        value = value[2:]
    path = PurePosixPath(value)
    if not path.parts or path.is_absolute() or ".." in path.parts or path.parts[0].endswith(":"):
        raise UnsafeArchiveError(value)
    return path.as_posix()


def verify_sha256sums(root: Path, manifest: Path) -> dict[str, object]:
    root = Path(root)
    manifest = Path(manifest)
    pattern = re.compile(r"^([0-9a-fA-F]{64})\s+\*?(.+)$")
    declared: dict[str, str] = {}
    for raw_line in manifest.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        match = pattern.match(line)
        if not match:
            raise ValueError(f"invalid checksum line: {raw_line!r}")
        rel = _normalize_checksum_path(match.group(2))
        if rel in declared:
            raise ValueError(f"duplicate checksum path: {rel}")
        declared[rel] = match.group(1).lower()

    missing: list[str] = []
    mismatches: list[dict[str, str]] = []
    for rel, expected in sorted(declared.items()):
        path = _resolved_child(root, PurePosixPath(rel).parts)
        if not path.is_file():
            missing.append(rel)
            continue
        actual = sha256_path(path)
        if actual != expected:
            mismatches.append({"path": rel, "expected": expected, "actual": actual})

    manifest_rel = manifest.resolve().relative_to(root.resolve()).as_posix()
    actual_files = {
        path.resolve().relative_to(root.resolve()).as_posix()
        for path in root.rglob("*")
        if path.is_file() and path.resolve().relative_to(root.resolve()).as_posix() != manifest_rel
    }
    unlisted = sorted(actual_files - set(declared))
    return {
        "ok": not missing and not mismatches and not unlisted,
        "declared_count": len(declared),
        "missing": missing,
        "mismatches": mismatches,
        "unlisted": unlisted,
    }


def _zip_report_bytes(data: bytes, label: str, depth: int) -> dict[str, object]:
    if depth > MAX_ZIP_NESTING_DEPTH:
        return {"label": label, "ok": False, "error": "ZIP nesting depth exceeded"}
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as handle:
            infos = handle.infolist()
            unsafe: list[str] = []
            try:
                _validate_infos(infos)
            except (UnsafeArchiveError, ValueError) as exc:
                unsafe.append(str(exc))
            bad_crc = handle.testzip()
            nested: list[dict[str, object]] = []
            if not unsafe:
                for info in infos:
                    if info.is_dir() or not info.filename.lower().endswith(".zip"):
                        continue
                    if depth >= MAX_ZIP_NESTING_DEPTH:
                        nested.append(
                            {
                                "label": f"{label}!{info.filename}",
                                "ok": False,
                                "error": "ZIP nesting depth exceeded",
                            }
                        )
                    else:
                        nested.append(
                            _zip_report_bytes(
                                handle.read(info),
                                f"{label}!{info.filename}",
                                depth + 1,
                            )
                        )
            ok = not unsafe and bad_crc is None and all(bool(row.get("ok")) for row in nested)
            return {
                "label": label,
                "ok": ok,
                "entry_count": len(infos),
                "uncompressed_bytes": sum(i.file_size for i in infos if not i.is_dir()),
                "bad_crc_entry": bad_crc,
                "unsafe_members": unsafe,
                "nested": nested,
            }
    except (zipfile.BadZipFile, OSError, RuntimeError) as exc:
        return {"label": label, "ok": False, "error": f"{type(exc).__name__}: {exc}"}


def verify_zip(path: Path) -> dict[str, object]:
    path = Path(path)
    data = path.read_bytes()
    report = _zip_report_bytes(data, str(path), 0)
    report.update({"bytes": len(data), "sha256": sha256_bytes(data)})
    return report


def _copy_exclusive(source: Path, destination: Path) -> None:
    if destination.exists():
        raise FileExistsError(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    if source.stat().st_size != destination.stat().st_size or sha256_path(source) != sha256_path(destination):
        raise IOError(f"copy verification failed: {source} -> {destination}")


def _json_load(path: Path) -> object:
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def _write_json_exclusive(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write("\n")


def _canonical_manifest(repo: Path) -> dict[str, object]:
    path = repo / "canonical/v1.0/machine/canonical_handoff_manifest_v1.0.json"
    value = _json_load(path)
    if not isinstance(value, dict):
        raise ValueError("canonical handoff manifest is not an object")
    return value


def assemble(source: Path, repo: Path) -> dict[str, object]:
    source = Path(source).resolve()
    repo = Path(repo).resolve()
    pre_inventory = build_inventory(source)
    canonical_source = source / CANONICAL_ARCHIVE
    if canonical_source.stat().st_size != CANONICAL_BYTES:
        raise ValueError("canonical archive byte count mismatch")
    if sha256_path(canonical_source) != CANONICAL_SHA256:
        raise ValueError("canonical archive SHA-256 mismatch")

    canonical_root = repo / "canonical/v1.0"
    release_copy = repo / "releases" / CANONICAL_ARCHIVE
    provenance_root = repo / "provenance/source-directory"
    inventory_path = repo / "SOURCE_INVENTORY.json"
    targets = [canonical_root, release_copy, provenance_root, inventory_path]
    existing = [str(path) for path in targets if path.exists()]
    if existing:
        raise FileExistsError(f"assembly targets already exist: {existing}")

    document_root = provenance_root / "documents"
    archive_root = provenance_root / "archives"
    for record in pre_inventory:
        source_path = source / str(record["relative_path"])
        target_root = document_root if record["kind"] == "document" else archive_root
        _copy_exclusive(source_path, target_root / source_path.name)
    _copy_exclusive(canonical_source, release_copy)
    extracted = safe_extract_single_wrapper(canonical_source, canonical_root, CANONICAL_WRAPPER)

    checksum_report = verify_sha256sums(canonical_root, canonical_root / "SHA256SUMS.txt")
    if not checksum_report["ok"] or checksum_report["declared_count"] != 66:
        raise ValueError(f"canonical checksum verification failed: {checksum_report}")

    manifest = _canonical_manifest(repo)
    architecture_rows = [
        row
        for row in manifest.get("source_archives", [])
        if isinstance(row, dict) and row.get("archive_id") == "architecture-v0.1"
    ]
    if len(architecture_rows) != 1 or architecture_rows[0].get("sha256") != PINNED_ARCHITECTURE_SHA256:
        raise ValueError("canonical Architecture pin mismatch")

    post_inventory = build_inventory(source)
    source_changed = post_inventory != pre_inventory
    if source_changed:
        raise ValueError("source directory changed during assembly")

    files: list[dict[str, object]] = []
    for record in pre_inventory:
        row = dict(record)
        folder = "documents" if record["kind"] == "document" else "archives"
        row["provenance_path"] = f"provenance/source-directory/{folder}/{record['relative_path']}"
        files.append(row)

    inventory = {
        "schema": "eveglyph-ascs-source-inventory/1",
        "source_root": str(source),
        "source_file_count": len(files),
        "source_total_bytes": sum(int(row["bytes"]) for row in files),
        "source_changed": False,
        "canonical_release": {
            "filename": CANONICAL_ARCHIVE,
            "repository_path": f"releases/{CANONICAL_ARCHIVE}",
            "bytes": CANONICAL_BYTES,
            "sha256": CANONICAL_SHA256,
            "extracted_file_count": len(extracted),
            "checksum_entry_count": checksum_report["declared_count"],
        },
        "architecture_archive_divergence": {
            "canonical": {
                "path": f"canonical/v1.0/source_archives/{ARCHITECTURE_ARCHIVE}",
                "sha256": PINNED_ARCHITECTURE_SHA256,
                "role": "canonical-authority",
            },
            "historical": {
                "path": f"provenance/source-directory/archives/{ARCHITECTURE_ARCHIVE}",
                "sha256": HISTORICAL_ARCHITECTURE_SHA256,
                "role": "historical-provenance",
            },
            "content_difference": ["SERIES_INDEX_v0.1.md", "SHA256SUMS.txt"],
        },
        "files": files,
    }
    _write_json_exclusive(inventory_path, inventory)

    verification = verify_repository(repo, source)
    if not verification["ok"]:
        raise ValueError(f"assembled repository verification failed: {verification}")
    return {
        "ok": True,
        "source_files": len(files),
        "source_total_bytes": inventory["source_total_bytes"],
        "source_changed": False,
        "canonical_release_sha256": CANONICAL_SHA256,
        "canonical_checksum_entries": checksum_report["declared_count"],
        "canonical_checksum_problems": 0,
        "canonical_extracted_files": len(extracted),
    }


def _canonical_extraction_report(repo: Path) -> dict[str, object]:
    release = repo / "releases" / CANONICAL_ARCHIVE
    root = repo / "canonical/v1.0"
    expected: dict[str, dict[str, object]] = {}
    unsafe: list[str] = []
    with zipfile.ZipFile(release) as handle:
        infos = handle.infolist()
        try:
            _validate_infos(infos)
        except UnsafeArchiveError as exc:
            unsafe.append(str(exc))
        for info in infos:
            if info.is_dir():
                continue
            parts = checked_parts(info)
            if parts[0] != CANONICAL_WRAPPER or len(parts) < 2:
                unsafe.append(info.filename)
                continue
            rel = PurePosixPath(*parts[1:]).as_posix()
            data = handle.read(info)
            expected[rel] = {"bytes": len(data), "sha256": sha256_bytes(data)}
    actual = {
        path.resolve().relative_to(root.resolve()).as_posix(): {
            "bytes": path.stat().st_size,
            "sha256": sha256_path(path),
        }
        for path in root.rglob("*")
        if path.is_file()
    }
    missing = sorted(set(expected) - set(actual))
    extra = sorted(set(actual) - set(expected))
    mismatches = sorted(path for path in set(expected) & set(actual) if expected[path] != actual[path])
    return {
        "ok": not unsafe and not missing and not extra and not mismatches,
        "expected_files": len(expected),
        "actual_files": len(actual),
        "unsafe": unsafe,
        "missing": missing,
        "extra": extra,
        "mismatches": mismatches,
    }


def _flatten_zip_failures(report: dict[str, object]) -> list[str]:
    failures: list[str] = []
    if not report.get("ok"):
        failures.append(str(report.get("label", "unknown ZIP")))
    for nested in report.get("nested", []):
        if isinstance(nested, dict):
            failures.extend(_flatten_zip_failures(nested))
    return failures


def verify_repository(repo: Path, source: Path | None = None) -> dict[str, object]:
    repo = Path(repo).resolve()
    inventory_path = repo / "SOURCE_INVENTORY.json"
    inventory = _json_load(inventory_path)
    if not isinstance(inventory, dict):
        raise ValueError("SOURCE_INVENTORY.json is not an object")
    records = inventory.get("files")
    if not isinstance(records, list) or len(records) != EXPECTED_SOURCE_FILES:
        raise ValueError("SOURCE_INVENTORY.json does not contain 20 file records")

    release = repo / "releases" / CANONICAL_ARCHIVE
    release_ok = (
        release.is_file()
        and release.stat().st_size == CANONICAL_BYTES
        and sha256_path(release) == CANONICAL_SHA256
    )
    release_zip = verify_zip(release) if release.is_file() else {"ok": False, "label": str(release)}

    provenance_failures: list[str] = []
    for raw_record in records:
        if not isinstance(raw_record, dict):
            provenance_failures.append("invalid inventory row")
            continue
        target = repo / str(raw_record["provenance_path"])
        if (
            not target.is_file()
            or target.stat().st_size != int(raw_record["bytes"])
            or sha256_path(target) != raw_record["sha256"]
        ):
            provenance_failures.append(str(raw_record["relative_path"]))

    zip_failures = _flatten_zip_failures(release_zip)
    for raw_record in records:
        if not isinstance(raw_record, dict) or raw_record.get("kind") != "archive":
            continue
        report = verify_zip(repo / str(raw_record["provenance_path"]))
        zip_failures.extend(_flatten_zip_failures(report))

    canonical_root = repo / "canonical/v1.0"
    checksum_report = verify_sha256sums(canonical_root, canonical_root / "SHA256SUMS.txt")
    extraction_report = _canonical_extraction_report(repo)
    canonical_architecture = canonical_root / "source_archives" / ARCHITECTURE_ARCHIVE
    historical_architecture = (
        repo / "provenance/source-directory/archives" / ARCHITECTURE_ARCHIVE
    )
    divergence_ok = (
        sha256_path(canonical_architecture) == PINNED_ARCHITECTURE_SHA256
        and sha256_path(historical_architecture) == HISTORICAL_ARCHITECTURE_SHA256
    )

    source_changed: bool | None = None
    if source is not None:
        source_changed = not source_inventory_matches(
            build_inventory(Path(source).resolve()),
            records,
        )

    ok = (
        release_ok
        and bool(release_zip.get("ok"))
        and not provenance_failures
        and not zip_failures
        and checksum_report["ok"]
        and checksum_report["declared_count"] == 66
        and extraction_report["ok"]
        and divergence_ok
        and source_changed is not True
    )
    return {
        "ok": ok,
        "release_ok": release_ok,
        "source_changed": source_changed,
        "source_files": len(records),
        "provenance_failures": provenance_failures,
        "zip_failures": sorted(set(zip_failures)),
        "canonical_checksums": checksum_report,
        "canonical_extraction": extraction_report,
        "architecture_divergence_ok": divergence_ok,
    }


def materialize_validation(repo: Path, output: Path) -> dict[str, object]:
    repo = Path(repo).resolve()
    output = Path(output).resolve()
    if output.exists() and any(output.iterdir()):
        raise FileExistsError(f"validation output is not empty: {output}")
    output.mkdir(parents=True, exist_ok=True)
    manifest = _canonical_manifest(repo)
    rows = manifest.get("source_archives")
    if not isinstance(rows, list) or len(rows) != 10:
        raise ValueError("canonical manifest must contain ten source archives")
    materialized: list[dict[str, object]] = []
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("invalid source archive row")
        archive_id = str(row["archive_id"])
        filename = str(row["filename"])
        archive = repo / "canonical/v1.0/source_archives" / filename
        actual = sha256_path(archive)
        if actual != row["sha256"]:
            raise ValueError(f"source archive SHA mismatch: {archive_id}")
        zip_report = verify_zip(archive)
        if not zip_report["ok"]:
            raise ValueError(f"source archive ZIP failure: {archive_id}")
        destination = output / archive_id
        records = safe_extract_archive(archive, destination)
        materialized.append(
            {
                "archive_id": archive_id,
                "filename": filename,
                "sha256": actual,
                "file_count": len(records),
            }
        )
    return {"ok": True, "archive_count": len(materialized), "archives": materialized}


def _vector_rows(value: object) -> list[dict[str, object]]:
    if isinstance(value, dict):
        value = value.get("vectors")
    if not isinstance(value, list) or not all(isinstance(row, dict) for row in value):
        raise ValueError("conformance vectors are not a list of objects")
    return value


def audit_rounds(materialized: Path) -> dict[str, object]:
    try:
        import jsonschema
    except ImportError as exc:
        raise RuntimeError("jsonschema is required for audit-rounds") from exc

    materialized = Path(materialized).resolve()
    v03 = (
        materialized
        / "ascs-v0.3/EveGlyph_ASCS_v0.3_Persistent_Editing_Round_Complete"
        / "EveGlyph_ASCS_v1.0_Roadmap/v0.3/V0.3_Support"
    )
    v04 = (
        materialized
        / "ascs-v0.4/EveGlyph_ASCS_v0.4_Spatial_Region_Round_Complete"
        / "EveGlyph_ASCS_v1.0_Roadmap/v0.4/V0.4_Support"
    )
    history_schema = _json_load(v03 / "schemas/history-profile.schema.json")
    history_vectors = _vector_rows(_json_load(v03 / "conformance/history_merge_vectors.json"))
    spatial_vector_schema = _json_load(v04 / "schemas/spatial-conformance-vectors.schema.json")
    spatial_region_schema = _json_load(v04 / "schemas/spatial-region-profile.schema.json")
    spatial_vectors_doc = _json_load(v04 / "conformance/spatial_conformance_vectors.json")
    spatial_vectors = _vector_rows(spatial_vectors_doc)
    spatial_example = _json_load(v04 / "examples/spatial_region_example.json")

    for schema in (history_schema, spatial_vector_schema, spatial_region_schema):
        jsonschema.Draft202012Validator.check_schema(schema)
    v04_vector_errors = [
        error.message
        for error in jsonschema.Draft202012Validator(spatial_vector_schema).iter_errors(
            spatial_vectors_doc
        )
    ]
    v04_example_errors = [
        error.message
        for error in jsonschema.Draft202012Validator(spatial_region_schema).iter_errors(
            spatial_example
        )
    ]
    history_ids = [str(row.get("id")) for row in history_vectors]
    spatial_ids = [str(row.get("id")) for row in spatial_vectors]
    ok = (
        len(history_ids) == 12
        and len(set(history_ids)) == 12
        and len(spatial_ids) == 18
        and len(set(spatial_ids)) == 18
        and not v04_vector_errors
        and not v04_example_errors
    )
    return {
        "ok": ok,
        "v0.3": {
            "schema_errors": 0,
            "vector_count": len(history_ids),
            "unique_vector_ids": len(set(history_ids)),
            "executable_validator": False,
        },
        "v0.4": {
            "schema_errors": 0,
            "vector_errors": v04_vector_errors,
            "example_errors": v04_example_errors,
            "vector_count": len(spatial_ids),
            "unique_vector_ids": len(set(spatial_ids)),
            "executable_validator": False,
        },
    }


def _scan_payload(data: bytes, location: str, findings: list[dict[str, str]]) -> None:
    for pattern_id, pattern in SECRET_PATTERNS.items():
        if pattern.search(data):
            findings.append({"pattern": pattern_id, "location": location})


def _scan_zip_bytes(
    data: bytes,
    label: str,
    depth: int,
    findings: list[dict[str, str]],
    errors: list[str],
) -> None:
    if depth > MAX_ZIP_NESTING_DEPTH:
        errors.append(f"ZIP nesting depth exceeded: {label}")
        return
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as handle:
            infos = handle.infolist()
            _validate_infos(infos)
            bad_crc = handle.testzip()
            if bad_crc is not None:
                errors.append(f"CRC failure: {label}!{bad_crc}")
                return
            for info in infos:
                if info.is_dir():
                    continue
                payload = handle.read(info)
                location = f"{label}!{info.filename}"
                _scan_payload(payload, location, findings)
                if info.filename.lower().endswith(".zip"):
                    _scan_zip_bytes(payload, location, depth + 1, findings, errors)
    except (UnsafeArchiveError, zipfile.BadZipFile, OSError, RuntimeError) as exc:
        errors.append(f"{label}: {type(exc).__name__}: {exc}")


def secret_scan(repo: Path) -> dict[str, object]:
    repo = Path(repo).resolve()
    findings: list[dict[str, str]] = []
    errors: list[str] = []
    for path in sorted(repo.rglob("*")):
        if not path.is_file():
            continue
        relative = path.resolve().relative_to(repo).as_posix()
        if relative.startswith((".git/", ".venv/", "tmp/")):
            continue
        data = path.read_bytes()
        _scan_payload(data, relative, findings)
        if path.suffix.lower() == ".zip":
            _scan_zip_bytes(data, relative, 0, findings, errors)
    return {
        "ok": not findings and not errors,
        "finding_count": len(findings),
        "findings": findings,
        "errors": errors,
    }


def _print_result(result: dict[str, object], as_json: bool) -> None:
    if as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for key, value in result.items():
            print(f"{key}: {value}")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    assemble_parser = subparsers.add_parser("assemble")
    assemble_parser.add_argument("--source", type=Path, required=True)
    assemble_parser.add_argument("--repo", type=Path, required=True)
    assemble_parser.add_argument("--json", action="store_true")

    verify_parser = subparsers.add_parser("verify")
    verify_parser.add_argument("--repo", type=Path, required=True)
    verify_parser.add_argument("--source", type=Path)
    verify_parser.add_argument("--json", action="store_true")

    materialize_parser = subparsers.add_parser("materialize-validation")
    materialize_parser.add_argument("--repo", type=Path, required=True)
    materialize_parser.add_argument("--output", type=Path, required=True)
    materialize_parser.add_argument("--json", action="store_true")

    audit_parser = subparsers.add_parser("audit-rounds")
    audit_parser.add_argument("--materialized", type=Path, required=True)
    audit_parser.add_argument("--json", action="store_true")

    scan_parser = subparsers.add_parser("secret-scan")
    scan_parser.add_argument("--repo", type=Path, required=True)
    scan_parser.add_argument("--json", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        if args.command == "assemble":
            result = assemble(args.source, args.repo)
        elif args.command == "verify":
            result = verify_repository(args.repo, args.source)
        elif args.command == "materialize-validation":
            result = materialize_validation(args.repo, args.output)
        elif args.command == "audit-rounds":
            result = audit_rounds(args.materialized)
        elif args.command == "secret-scan":
            result = secret_scan(args.repo)
        else:
            raise AssertionError(f"unknown command: {args.command}")
        _print_result(result, args.json)
        return 0 if bool(result.get("ok", True)) else 1
    except Exception as exc:
        error = {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
        _print_result(error, getattr(args, "json", False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
