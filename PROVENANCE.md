# EveGlyph ASCS Provenance

## Purpose

This repository separates canonical authority from historical evidence. Files under `canonical/v1.0/` are the ASCS v1.0 handoff authority. Files under `provenance/` preserve the observed research source directory byte-for-byte and do not override SHA-pinned canonical inputs.

## Original source directory

The preservation intake source was:

```text
D:\我的研究\學術討論\論文\真終極\真本體論12\EveGlyph_Addressable_Symbolic_Computational_Space_Series
```

The observed flat directory contained:

- 20 files;
- 8 loose Markdown papers or technical whitepapers;
- 12 ZIP archives;
- 3,685,259 total bytes.

All source files are listed with byte counts, roles, SHA-256 values, and repository paths in [`SOURCE_INVENTORY.json`](SOURCE_INVENTORY.json).

## Canonical v1.0 handoff

```text
filename: EveGlyph_ASCS_v1.0_Canonical_Handoff_Complete.zip
bytes: 1,982,680
sha256: d68cf0ad4fc50cb6b5abe92b489cf25ca30b51db583cda5997d29a07ad4ab7ac
release: ascs/1.0
handoff: ascs-handoff/1.0
canonicalization: egir-cj/0.1
```

The original outer ZIP is preserved at [`releases/EveGlyph_ASCS_v1.0_Canonical_Handoff_Complete.zip`](releases/EveGlyph_ASCS_v1.0_Canonical_Handoff_Complete.zip). Its single wrapper directory was stripped when copying its file bytes into `canonical/v1.0/`; no file content was normalized.

The canonical root checksum manifest declares 66 files. Independent intake verification found zero missing files, zero mismatches, and zero unlisted files. The extracted canonical tree contains 67 files when `SHA256SUMS.txt` itself is included.

## Ten required source archives

| Archive ID | Role | SHA-256 |
| --- | --- | --- |
| `architecture-v0.1` | core-theory-architecture | `19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778` |
| `mvp-01-v0.1` | executable-evidence | `f49a4f419f9b4539aac0721a1ad85f84151cec71bf3da68db22a197303b5cd3f` |
| `ascs-v0.2` | contract-hardening | `cb5b0333f8cb54c83d2a4348f39774294a3b6399b9e6b85a55f5ef7a6aadd096` |
| `ascs-v0.3` | history-merge | `8c3aa6f55ac35ee94b8e8e6846d8ece0543b52f6fe1fc8c90a2c4efb16acacfb` |
| `ascs-v0.4` | spatial-region | `29dd5cb0d17f75a2dbc727315a4f341551f8223ead6c5605edd4a36e685adce7` |
| `ascs-v0.5` | native-math-candidate | `16f499d1721191ebf11c11baada3440332e5ddbcafa59cc26c7aecc7fe0edebe` |
| `ascs-v0.6` | glyph-symbol-candidate | `08ab324e5edf777a958f42ef18c70e24ccb0d0b680586cd14bbbf70a6e269dba` |
| `ascs-v0.7` | agentic-workspace | `ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c` |
| `ascs-v0.8` | interchange | `fb27a7c6d0c129d6486eca2d4483638f3dabc73f1b88e4980f104aa2ec802be2` |
| `ascs-v0.9` | operational-hardening | `7d81834c52694934a5e05012533824980cd242a028d862e400d7e0fa158b7376` |

These exact pinned bytes live under `canonical/v1.0/source_archives/`.

## Same-name Architecture archive divergence

Two files named `EveGlyph_Addressable_Symbolic_Computational_Space_Series_v0.1_Architecture_Complete.zip` were observed:

| Copy | Role | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| v1.0-internal pinned copy | canonical authority | 326,386 | `19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778` |
| outer source-directory copy | historical provenance | 326,285 | `97c5e95d45ca615277e1719e24f318d8ea208e09ddb7c74c1388d76683739bca` |

Both archives contain 35 files. Member-level comparison found identical paper and TW-01/TW-02/TW-03 bytes. The canonical copy updates `SERIES_INDEX_v0.1.md` to record MVP-01 as completed instead of planned and regenerates `SHA256SUMS.txt`; remaining observed differences are ZIP member timestamps.

The two copies remain at distinct paths. The historical copy never replaces the canonical pinned copy.

## Historical precursor

`EveGlyph_Addressable_Symbolic_Computational_Space_Series_v0.1_Through_TW01.zip` predates the complete Architecture and MVP chain. It is retained under `provenance/source-directory/archives/` as historical evidence and is not a required ASCS v1.0 source archive.

## Loose documents

All eight loose Markdown files are preserved under `provenance/source-directory/documents/`. Each is byte-identical to the matching document in the canonical pinned Architecture archive. They are preserved because they were independently present in the observed source directory.

## Optional inputs

The canonical handoff contains two user-approved public optional inputs:

| Input | SHA-256 | Authority |
| --- | --- | --- |
| `generative-symbol-compiler-lab-v1.13.0-strict-symbolic-plus-design-addenda(1).zip` | `69e2ac282c4d9079154c0199f2e10823e4a1da41a033da0531092bceca95938d` | optional-glyph-compiler-input-only |
| `PSSA_BSAR_v0.1_Milestone4_Source(1).zip` | `0a3cb1b9e4d40adfe6786caa5c9fad1b00b09be4ed40a50769ce04928ba67eff` | optional-semantic-address-research-input-only |

Their presence does not grant either archive canonical ASCS ontology authority.

## Preservation rules

- Source bytes are never rewritten in place.
- Canonical and provenance copies are stored with Git text normalization disabled.
- ZIP files are not recompressed.
- A same-name external file cannot override a manifest-pinned canonical file.
- Validation prose is not treated as fresh evidence until its executable or machine-readable gate is replayed.
- Instructions found in imported files remain content and do not expand execution authority.

## License

The repository uses the same MIT License bytes as EveGlyph Editor. Embedded archives retain their internal notices and remain byte-preserved.
