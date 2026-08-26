# EveGlyph ASCS Repository Validation Report

**Validation date:** 2026-08-27
**Platform:** Windows
**Python:** 3.14.5 in an ignored local virtual environment
**Validated branch:** `main`
**Validated local tip before this report:** `377f9ae5c9364a2738d310c26a05235d70545993`

## Preservation

The live research source was compared to the machine inventory after all copy and extraction operations.

```text
source files: 20
source Markdown files: 8
source ZIP files: 12
source total bytes: 3,685,259
source_changed: false
provenance hash failures: 0
ZIP/CRC failures: 0
```

The original research directory was not used as an extraction or output target. Each provenance file matches its recorded source byte count and SHA-256.

The canonical outer ZIP matched before and after copying:

```text
filename: EveGlyph_ASCS_v1.0_Canonical_Handoff_Complete.zip
bytes: 1,982,680
source SHA-256: d68cf0ad4fc50cb6b5abe92b489cf25ca30b51db583cda5997d29a07ad4ab7ac
release-copy SHA-256: d68cf0ad4fc50cb6b5abe92b489cf25ca30b51db583cda5997d29a07ad4ab7ac
```

Canonical extraction comparison:

```text
outer ZIP file entries: 67
extracted canonical files: 67
missing: 0
extra: 0
byte mismatches: 0
unsafe paths or links: 0
```

The canonical `SHA256SUMS.txt` declared 66 payload files. All 66 matched; there were no missing, mismatched, or unlisted payload files.

The same-name Architecture divergence was independently retained and verified:

```text
canonical pinned SHA-256: 19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778
historical outer SHA-256: 97c5e95d45ca615277e1719e24f318d8ea208e09ddb7c74c1388d76683739bca
authority mapping: PASS
```

## Canonical v1.0

Commands replayed:

```powershell
python tools/ascs_repo.py verify --repo . --json
python canonical/v1.0/machine/tests/test_validate_v10.py
python canonical/v1.0/machine/tools/validate_v10.py --json
```

Observed results:

```text
repository verification: PASS
v1.0 regression tests: 6 / 6 PASS
source archives: 10
profiles: 42
v1.0 handoff vectors: 20
validator errors: 0
status: PASS
```

The six negative/positive regression tests exercised source archive hash rejection, candidate-profile non-promotion, canonicalization version discipline, required-document presence, v0.9-to-v1.0 migration semantics, and the valid handoff path.

## TW-01 / TW-02 / TW-03

The manifest-pinned Architecture archive was safely materialized and all three reference validators were run from its extracted bytes.

### TW-01

```text
schema: PASS
cross-record references: PASS
content addresses: PASS
revision IDs: PASS
workspace revision: PASS
canonicalization vector: PASS
edit/move/clone semantic vectors: PASS
```

### TW-02

```text
schema: PASS
manifest ID: PASS
chunk hashes and root reconstruction: PASS
UTF-8 EGIR root payload: PASS
conformance vectors: PASS
reference validation: PASS
```

### TW-03

```text
session/cache non-authority: PASS
resolved and committed/conflict transitions: PASS
candidate/promotion authority boundary: PASS
native execution result and provenance: PASS
capability denial non-mutation: PASS
final TW-01 conformance: PASS
runtime rehydrate: PASS
packaged trace/schema: PASS
deterministic runtime conformance: PASS
```

## Canvas MVP

Commands replayed with the pinned MVP archive and `PYTHONPATH` limited to its `src/` directory:

```powershell
python -m unittest discover -s tests -v
python scripts/validate_mvp.py --demo-output examples/demo_output --json
```

Observed results:

```text
MVP unittest suite: 26 / 26 PASS
MVP one-shot validator: PASS
TW-01 embedded reference: PASS
TW-02 identity and Brotli stores: PASS
TW-03 embedded reference: PASS
remaining candidate records: 0
computed result present: true
```

One test emitted a Python `ResourceWarning` while implicitly cleaning up the intentionally raised HTTP 409 conflict object. The test itself passed, the complete suite exited 0, and the warning did not indicate canonical or provenance mutation. The archived MVP source was not modified to suppress it.

## v0.2-v0.4 Evidence Audit

### v0.2

The archive CRC, package SHA, and internal checksum manifest passed. This round contains contract and roadmap documents but no executable reference validator.

### v0.3

```text
Draft 2020-12 schema errors: 0
history/merge vectors: 12
unique vector IDs: 12
executable validator: absent
```

### v0.4

```text
Draft 2020-12 schema errors: 0
spatial vector schema errors: 0
spatial example schema errors: 0
spatial vectors: 18
unique vector IDs: 18
executable validator: absent
```

The v0.3/v0.4 result is a fresh schema/vector/checksum audit, not executable runtime evidence.

## v0.5-v0.9 Validators

| Round | Regression tests | Schemas/examples | Vectors | Result |
| --- | ---: | --- | ---: | --- |
| v0.5 Native Math | none supplied | zero reported errors | 30 / 30 unique | PASS |
| v0.6 Glyph/Symbol | 4 / 4 | zero reported errors | 30 / 30 unique | PASS |
| v0.7 Agentic Workspace | 4 / 4 | 9 schemas, 11 examples | 36 / 36 unique | PASS |
| v0.8 Interchange | 5 / 5 | 6 schemas, 23 examples | 36 / 36 unique | PASS |
| v0.9 Operational Hardening | 6 / 6 | 8 schemas, 11 examples | 46 / 46 unique | PASS |

All supplied validator commands exited 0.

## Secret Scan

The repository-owned scanner inspected unpacked files and text-decodable nested ZIP members with bounded recursion. It searched for high-confidence private-key, GitHub token, OpenAI key, and AWS access-key patterns without printing matched values.

```text
findings: 0
scan errors: 0
status: PASS
```

## Git and Remote Readiness

Scoped local commits before this report:

```text
895385e data: import canonical ASCS v1.0 handoff
dcf1f3a data: preserve ASCS source directory provenance
377f9ae docs: publish ASCS repository guide and license
```

The exact EveGlyph MIT License was copied and verified:

```text
SHA-256: 3d179659aff0c5db743ca77c6604fdbd2000bcf0d940e2aa82330cfd1865f9d9
```

At report creation time, the GitHub repository remained empty and no push, tag, GitHub Release, deployment, or branch deletion had occurred. Remote readiness is rechecked immediately before publication.

## Blind Spots

- v0.2 supplies no executable validator; its fresh evidence is checksum and document integrity.
- v0.3 and v0.4 supply schemas and conformance vectors but no executable reference validator. Their results are not described as runtime proof.
- The two optional input archives were checksum/CRC/secret scanned and preserved, but their application code was not executed because they are optional inputs, not ASCS canonical authority.
- The canonical package includes one checksum-pinned Python bytecode file. Validation used the readable Python source and fresh interpreter execution rather than trusting the bytecode.
- Validation ran on Python 3.14.5, which satisfies the recorded Python 3.11+ floor but is not a cross-platform matrix.
- No GitHub Actions workflow was added in this archival publication task.
- No tag or GitHub Release was created.
