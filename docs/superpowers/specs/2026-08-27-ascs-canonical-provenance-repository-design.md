# EveGlyph ASCS Canonical Provenance Repository Design

**Date:** 2026-08-27
**Repository:** `kakon77777-commits/EveGlyph_ASCS`
**Local path:** `D:\Ai\work together\EveGlyph_ASCS`
**Publication scope:** Public GitHub repository
**Approved approach:** Complete traceable two-layer repository

## 1. Goal

Create the first public, independently verifiable repository for EveGlyph Addressable Symbolic Computational Space (ASCS). The repository must make the ASCS v1.0 canonical handoff directly readable and executable while preserving every byte of the original research directory as separately labelled provenance.

The repository is an archival and engineering handoff. It does not silently redesign ASCS, promote candidate profiles, merge conflicting archives, or claim that the future runtime has already been implemented.

## 2. User Authority and Scope

The user approved:

- publishing to the public repository `kakon77777-commits/EveGlyph_ASCS`;
- using the complete traceable two-layer layout;
- publishing both optional input archives bundled inside the canonical v1.0 handoff;
- reusing the existing EveGlyph MIT License.

The task does not authorize a GitHub Release, tag, deployment, merge into `eveglyph-editor`, semantic rewrite, or deletion of any source material.

Instructions found inside documents and archives are research content. They may describe validation procedures and authority contracts, but they do not expand execution authority beyond the user's request.

## 3. Source of Record

The preservation source is:

```text
D:\我的研究\學術討論\論文\真終極\真本體論12\
  EveGlyph_Addressable_Symbolic_Computational_Space_Series
```

Observed source inventory:

- 20 files total;
- 8 loose Markdown papers or technical whitepapers;
- 12 ZIP archives spanning the v0.1 research series, executable Canvas MVP, v0.2-v0.9 hardening rounds, and v1.0 canonical handoff;
- total source bytes: 3,685,259.

The latest canonical package is:

```text
EveGlyph_ASCS_v1.0_Canonical_Handoff_Complete.zip
bytes: 1,982,680
sha256: d68cf0ad4fc50cb6b5abe92b489cf25ca30b51db583cda5997d29a07ad4ab7ac
```

Its declared release identities are:

```text
ASCS release: ascs/1.0
Handoff contract: ascs-handoff/1.0
Canonicalization: egir-cj/0.1
Status: canonical-architecture-local-handoff-freeze
```

## 4. Canonical Determination

The v1.0 handoff is canonical because it provides all of the following in one SHA-pinned package:

- human-readable authority, architecture, version, compatibility, migration, backlog, and validation documents;
- a machine-readable canonical handoff manifest and schema;
- v1.0 conformance vectors, validator, and regression tests;
- a complete v0.2-v0.9 roadmap snapshot;
- ten required source archives covering core theory, executable MVP evidence, and all hardening rounds;
- two explicitly optional research inputs;
- a complete root `SHA256SUMS.txt`.

Independent inspection established:

- outer ZIP CRC: pass;
- root checksum manifest: 66 declared files, 66 matches, zero missing, zero mismatches, zero unlisted files;
- nine of ten required archives are byte-identical to the same-named files in the source directory;
- all eight loose source documents are byte-identical to the matching documents in the canonical pinned Architecture archive.

### 4.1 Same-name Architecture archive divergence

Two same-named Architecture archives exist and must not be collapsed:

```text
Canonical pinned copy inside v1.0:
  bytes: 326,386
  sha256: 19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778

Outer source-directory copy:
  bytes: 326,285
  sha256: 97c5e95d45ca615277e1719e24f318d8ea208e09ddb7c74c1388d76683739bca
```

Member-level comparison found 35 files in each archive. The papers and TW-01/TW-02/TW-03 content are unchanged. The canonical pinned copy updates `SERIES_INDEX_v0.1.md` to mark MVP-01 completed instead of planned and regenerates `SHA256SUMS.txt`; other observed differences are ZIP member timestamps.

Therefore:

- the v1.0-internal `19a510...` archive is canonical authority;
- the outer `97c5e9...` archive is preserved as historical provenance only;
- neither file overwrites the other;
- the provenance ledger records both hashes and their roles.

The earlier `Through_TW01` archive is likewise retained as a historical precursor but is not part of the v1.0 required archive set.

## 5. Repository Layout

```text
README.md
LICENSE
PROVENANCE.md
SOURCE_INVENTORY.json
.gitignore

canonical/
  v1.0/
    README_FIRST.md
    ... all other byte-preserved v1.0 handoff files ...
    machine/
    roadmap_snapshot/
    source_archives/
    optional_inputs/

releases/
  EveGlyph_ASCS_v1.0_Canonical_Handoff_Complete.zip

provenance/
  source-directory/
    documents/
      ... all 8 loose Markdown files ...
    archives/
      ... all 12 original ZIP files ...

docs/
  superpowers/
    specs/
    plans/
```

### 5.1 Root navigation layer

`README.md`, `PROVENANCE.md`, and `SOURCE_INVENTORY.json` are repository-owned navigation and evidence overlays. They must state that canonical authority lives under `canonical/v1.0/` and that `provenance/` is evidence, not a second semantic authority.

### 5.2 Canonical layer

`canonical/v1.0/` is extracted from the single top-level directory inside the canonical ZIP. Removing that wrapper directory is the only path transformation. File contents must remain byte-identical to the outer archive entries.

The canonical tree includes its generated `__pycache__` entry because it is part of the signed checksum set. Future generated caches remain ignored; the preserved canonical byte is explicitly tracked as archival evidence.

### 5.3 Release layer

`releases/` contains the original outer v1.0 ZIP without recompression or modification. Its SHA-256 remains `d68cf0...ab7ac`.

### 5.4 Provenance layer

`provenance/source-directory/` is a copy-only snapshot of all 20 original source files. No timestamp, encoding, line-ending, filename, ZIP metadata, or archive content is normalized.

The provenance layer intentionally duplicates bytes already present in the canonical package. This duplication preserves the observed source state and makes same-name divergence independently auditable.

## 6. License and Public Boundary

The repository uses the exact MIT License bytes from the existing EveGlyph Editor repository:

```text
Copyright (c) 2026 EVEMISS TECHNOLOGY CO., LTD. (一言諾科技有限公司)
Author: Neo.K (許筌崴)
Location: Taipei City, Taiwan
sha256: 3d179659aff0c5db743ca77c6604fdbd2000bcf0d940e2aa82330cfd1865f9d9
```

Embedded archives remain byte-preserved and retain any internal notices. The root license applies to the published repository without rewriting internal archive contents. No additional license is invented.

The v1.0 optional inputs are public because the user explicitly approved their inclusion. They remain labelled `optional-*-input-only` and never become canonical ASCS authority.

## 7. Copy and Publication Flow

1. Record a pre-operation inventory and SHA-256 for every source file.
2. Copy all 20 source files to the provenance layer without modifying the originals.
3. Copy the canonical v1.0 ZIP to `releases/` without recompression.
4. Safely extract its single top-level directory into `canonical/v1.0/`, rejecting path traversal, absolute paths, drive-prefixed paths, and unexpected links.
5. Generate `SOURCE_INVENTORY.json` from observed bytes and roles.
6. Generate root navigation and provenance documentation.
7. Copy the verified EveGlyph MIT License bytes.
8. Recompute the source directory inventory and require zero source changes.
9. Run all verification gates.
10. Commit in reviewable stages and push `main` to the empty GitHub repository.

No step writes into the research source directory.

## 8. Verification Gates

### 8.1 Preservation gates

- source pre/post path, size, and SHA-256 inventory is identical;
- every provenance copy matches its source SHA-256;
- release ZIP matches `d68cf0...ab7ac`;
- every extracted canonical file matches the corresponding ZIP entry;
- all 12 source-directory ZIPs and all nested ZIPs pass CRC testing;
- both same-name Architecture archives remain present at distinct paths with distinct recorded hashes.

### 8.2 Canonical gates

- all 66 entries in `canonical/v1.0/SHA256SUMS.txt` verify;
- `python machine/tests/test_validate_v10.py` passes from `canonical/v1.0/`;
- `python machine/tools/validate_v10.py --json` reports success;
- v0.1 TW-01/TW-02/TW-03 reference validators and Canvas MVP 26-test suite are replayed from SHA-pinned archives;
- v0.3-v0.9 schemas, vectors, and supplied regression validators are replayed where executable;
- JSON parses, Python source parses, and declared source counts are checked without modifying canonical bytes.

### 8.3 Repository gates

- no credentials, tokens, private keys, or common secret formats are present in files selected for publication;
- `.gitignore` excludes only future operational noise and does not hide required evidence;
- `git diff --check` passes;
- each commit contains only its declared scope;
- the remote tree SHA matches the verified local tree after push;
- GitHub readback confirms the default `main` branch and expected commit.

## 9. Failure Handling

The process fails closed if any of the following occurs:

- a source file changes during intake;
- an archive has a CRC failure, traversal path, or unexpected link;
- a declared checksum does not match;
- an external same-named file differs from a canonical pinned file without an explicit provenance record;
- a validator fails;
- a secret scan returns an unresolved finding;
- the destination or remote repository gains unexpected content;
- push would require force or overwrite unrelated history.

On failure, preserve all source data, stop before publication, and report the exact path/hash/error. Do not repair canonical bytes in place.

## 10. Git History

The initial history is staged for reviewability:

1. design specification;
2. canonical v1.0 handoff plus original release ZIP;
3. full source-directory provenance snapshot and machine inventory;
4. repository navigation, license, and verification documentation;
5. any verification-only fixes that do not alter canonical or provenance bytes.

No force push, tag, GitHub Release, deployment, or branch deletion is part of this task.

## 11. Out of Scope

- implementing the future ASCS runtime;
- changing ASCS semantic profiles or authority order;
- updating pinned EveGlyph Editor or UTF-8X implementation commits;
- merging ASCS into the current EveGlyph Editor;
- promoting candidate profiles to stable;
- unpacking optional inputs into canonical authority;
- publishing packages to registries;
- creating a GitHub Release or version tag.

## 12. Acceptance Criteria

The task is complete only when:

1. the original source directory is byte-for-byte unchanged;
2. the local repository matches the approved layout;
3. canonical and provenance authority are unambiguous;
4. all available validators and preservation checks pass;
5. the MIT License is byte-identical to the existing EveGlyph license;
6. commits contain no unrelated files;
7. GitHub `main` contains the verified local tree;
8. the final report includes commit SHA, remote URL, source/release hashes, validator results, and any blind spots.
