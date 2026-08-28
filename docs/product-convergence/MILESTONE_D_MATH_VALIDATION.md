# Milestone D-Math Validation Contract

Milestone D-Math is accepted only when the same exact PR head satisfies all gates below.

## RED → GREEN lineage

### Core RED

Workflow run `33155320154` proved the initial intended split:

- canonical preservation: PASS
- frozen v0.5 reference: PASS
- Milestone B/C + current EveGlyph regression: PASS
- Native Math JavaScript: FAIL because production `packages/ascs-math/src/index.mjs` was intentionally absent

### Service / product bridge RED

Workflow run `33156689145` on test-first head `ba0fc251794317dcbc08c905eb38d4697eec0de4` proved:

- canonical preservation: PASS
- frozen v0.5 reference: PASS
- existing Milestone B/C runtime: PASS
- Native Math JavaScript: FAIL because `service.mjs` was intentionally absent
- EveGlyph product regression: FAIL because `createNativeMathService` was intentionally not registered

### Functional GREEN before closure metadata

Workflow run `33156793674` on head `eceb2394438fa03cd12ff0e2f998e2877a9a0487` passed all four D-Math jobs:

- canonical preservation: PASS
- v0.5 reference: PASS
- Native Math package tests: PASS
- B/C + EveGlyph product regression, including D bridge: PASS

The closure head is still required to rerun these gates after parity metadata, documentation and the backup workflow are added.

## Required final gates

- repository preservation
- ASCS v1 regression: 6/6
- ASCS v1 validator
- product overlay lineage and parity
- v0.5 archive SHA pin
- v0.5 `validate_v05.py`
- all 30 frozen Native Math vectors through production semantics
- complete Native Math package suite
- Milestone B/C runtime regression
- Editor B bridge
- Editor C persistent bridge
- Editor D Native Math bridge
- EveGlyph publication: 22/22
- Vite production build
- Dynamic Logic
- Dynamic Rendering
- exact-head source backup creation and independent post-download verification

## Semantic acceptance

The final runtime must preserve:

```text
exact integer/rational/decimal != binary floating approximation
free declaration identity != visible symbol name
bound binding slot != free declaration identity
computed != proved
approximate equality != theorem equality
subexpression address = revision + node
LaTeX/MathML projection != canonical identity
candidate profile != canonical mutation authority
ncm/0.1 != ncm/1.0-candidate.1
```

No parser, CAS, prover, or product facade receives a raw trusted mutation callback.
