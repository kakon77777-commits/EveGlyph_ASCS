# Milestone C — Canonical Inputs and Authority Boundary

Milestone C implements Persistence + History + Spatial as product/runtime engineering over frozen ASCS inputs. It does not redefine `canonical/v1.0/`, `provenance/`, or `releases/`.

## Base

- repository: `kakon77777-commits/EveGlyph_ASCS`
- Milestone B merged base: `17c57fff08d1c2278823f86b19312ecae9c377cc`
- EveGlyph product provenance baseline: `kakon77777-commits/eveglyph-editor@c3258a2f461d5af5a69c879891b485ccf0f02635`

## Pinned source archives

- Architecture Complete SHA-256: `19a510cebcbe1d1b0e7c3134d99c88eebf98dd20385863ba71850aaf09ca7778`
- Computational Canvas MVP SHA-256: `f49a4f419f9b4539aac0721a1ad85f84151cec71bf3da68db22a197303b5cd3f`
- ASCS v0.3 Persistent Editing SHA-256: `8c3aa6f55ac35ee94b8e8e6846d8ece0543b52f6fe1fc8c90a2c4efb16acacfb`
- ASCS v0.4 Spatial Region SHA-256: `29dd5cb0d17f75a2dbc727315a4f341551f8223ead6c5605edd4a36e685adce7`

Pinned fixture identities:

- TW-02 vectors SHA-256: `8840e674d4e209357f9244826f669b4fade1095dbf2d184b96ba1e38e9098de3`
- History merge vectors SHA-256: `c0afe5c97be7b231764874a4c7466636f1cdcf146796f6af04019e336d777d00`
- Spatial conformance vectors SHA-256: `c35cb6782227cb0010508211b3aab04675c97324202c2cfb2b8638e94af9b940`

## C1 — EGStore

Implementation profile remains `egstore/0.1` compatible at the logical-store layer:

- content-addressed chunks
- manifest identity and root payload hash
- active-pointer-last commit ordering
- typed corruption/recovery outcomes
- Memory carrier = D0
- OPFS carrier = D1

Milestone C does not claim D2/D3 durability.

## C2 — Persistent History

History follows `org.evemisslab.history/0.1` behavior:

- immutable commit DAG
- stable branch identity independent of branch name
- checkpoint advances branch head only after snapshot persistence
- autosave/recovery state is not a canonical commit
- intrinsic and spatial/placement changes remain separate merge channels
- same-channel divergence becomes a first-class conflict
- merge commits preserve both branch parents
- revert creates a new child commit; it does not erase history

## C3 — Spatial Region

Spatial behavior follows `org.evemisslab.spatial-region/0.1`:

- nested regions and local coordinate frames
- local-to-parent affine transforms
- `keep-world` and `keep-local` reparent semantics
- region-cycle rejection
- semantic zoom/collapse/view state is non-authoritative session state
- deterministic inherited policy and grammar behavior
- explicit cross-region relation/execution boundaries

Affine arithmetic uses exact finite-decimal/BigInt-rational intermediate representation. Binary floating-point strings are not promoted into canonical-facing spatial values.

## Trusted extension boundary

Milestone B's staged transaction semantics remain authoritative. Spatial/history extensions may use the trusted extension seam internally, but the EveGlyph global product API does not expose arbitrary mutate callbacks.

The product facade may expose safe factories and typed operations, but must not expose:

- raw EGStore carrier instances
- raw `createEgStore`
- raw `createMemoryCarrier` / `createOpfsCarrier`
- `commitExtensionMutation`
- arbitrary canonical mutation callbacks

## Product overlay

`UPSTREAM_BASELINE.json` remains the immutable upstream provenance snapshot. Milestone C evolves the product only through `ASCS_OVERLAY.json`; the baseline is not regenerated to erase divergence history.
