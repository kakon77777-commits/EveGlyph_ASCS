# Milestone D-Math Canonical Inputs

**Implementation base:** `main@08133a2b794e242723c4c3f6618de2a8d78ad84f`  
**Approved design commit:** `e942a0bc1fec2838579ffcdddddc8bafffb7d30d`  
**Candidate profile:** `ncm/1.0-candidate.1`

## Frozen v0.5 source

Archive:

`canonical/v1.0/source_archives/EveGlyph_ASCS_v0.5_Native_Math_Round_Complete.zip`

SHA-256:

`16f499d1721191ebf11c11baada3440332e5ddbcafa59cc26c7aecc7fe0edebe`

The committed reference lineage is machine-readable at:

`packages/MILESTONE_D_MATH_REFERENCE_LINEAGE.json`

It pins eight byte-identical frozen files, including the Native Math candidate schema, transform/evidence schema, conformance-vector schema, all 30 vectors and the four supplied examples.

## Frozen conformance contract

- vector profile: `org.evemisslab.math-conformance-vectors/0.1`
- vector count: **30**
- vector IDs must remain unique
- v0.5 `validate_v05.py` remains an independent reference gate
- JavaScript conformance must execute each operation through production functions; returning the frozen `expected` payload directly is forbidden

## Authority boundary

`ncm/1.0-candidate.1` is a candidate profile. A valid candidate object is not a canonical mutation by itself.

```text
candidate math
→ Native Math validation/canonical ordering
→ explicit ASCS authority + base revision
→ existing WorkspaceRuntime edit transaction
→ new canonical revision
```

LaTeX and MathML are projection/export surfaces in D-Math. Parser/CAS/prover output remains candidate-only and receives no automatic canonical authority.

Legacy `ncm/0.1` remains loadable under its own semantics; migration is explicit and optional.

`canonical/`, `provenance/` and `releases/` are not implementation output targets.
