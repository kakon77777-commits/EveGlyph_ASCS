# EveGlyph ASCS

EveGlyph Addressable Symbolic Computational Space (ASCS) v1.0 is a canonical architecture and local implementation handoff for addressable symbolic objects, computational canvas semantics, persistent revisions, native math and glyph objects, agentic workspaces, interchange, and operational hardening.

## Start here

1. Read [`canonical/v1.0/README_FIRST.md`](canonical/v1.0/README_FIRST.md).
2. Read [`canonical/v1.0/CANONICAL_AUTHORITY_MAP.md`](canonical/v1.0/CANONICAL_AUTHORITY_MAP.md).
3. Read [`PROVENANCE.md`](PROVENANCE.md) before selecting any historical archive.
4. Run the verification commands below.

## Authority boundary

`canonical/v1.0/` is canonical authority. `provenance/` is byte-preserved historical evidence and never overrides a SHA-pinned canonical source archive. Implementation code and informal discussion do not silently redefine canonical semantics.

## Repository layout

- `canonical/v1.0/` - exact extracted ASCS v1.0 canonical handoff.
- `releases/` - exact original v1.0 outer ZIP.
- `provenance/source-directory/` - byte-preserved snapshot of all 20 source-directory files.
- `SOURCE_INVENTORY.json` - machine-readable source roles, sizes, and hashes.
- `tools/ascs_repo.py` - preservation, verification, audit, and secret-scan tooling.
- `VALIDATION_REPORT.md` - fresh local validation evidence.

## Verify

```powershell
python tools/ascs_repo.py verify --repo . --json
python canonical/v1.0/machine/tests/test_validate_v10.py
python canonical/v1.0/machine/tools/validate_v10.py --json
```

## Version scope

`ascs/1.0` is an umbrella architecture and handoff stability release. Component profiles retain their recorded stable, candidate, or frozen-extension identities. The repository does not silently promote candidate profiles or reinterpret canonical semantics.

## License

MIT License. See [`LICENSE`](LICENSE).
