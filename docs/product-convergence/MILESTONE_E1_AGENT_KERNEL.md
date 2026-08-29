# Milestone E1 — Agent Principal / Run / Proposal / Review Kernel

Milestone E1 implements the logical and audit layer of the approved Milestone E Authority Convergence design. It is intentionally **not** a canonical mutation layer, connector layer, transport layer, or credential layer.

## Authority boundary

The E1 implementation preserves these separations:

```text
Principal != Model Binding != Run != Transport
Context Pack != Prompt
Model Output != Proposal != Validated Command != Commit
Direct != Bypass
```

`packages/ascs-agent` has no `WorkspaceRuntime`, raw canonical mutation callback, credential broker, delegation ticket, MCP server, provider connection, or Wasmtime execution authority. Human direct editing remains an existing runtime path outside E1; agent-originated mutation authority is not introduced until later Milestone E slices.

## Frozen v0.7 lineage

Implementation reference:

- archive: `canonical/v1.0/source_archives/EveGlyph_ASCS_v0.7_Agentic_Workspace_Round_Complete.zip`
- archive SHA-256: `ac8b37e81ad343153f920df18a8b1976a8e091cf5d22fb827feed63c62c9604c`
- frozen vectors: `AG-01` through `AG-36`
- copied reference authority: `implementation-reference-only`

The five frozen schemas, six frozen examples, and the frozen conformance-vector file are preserved as byte-identical physical implementation references. `REFERENCE_BUNDLE.json.gz` preserves the same reference bytes as a compact lineage bundle. CI verifies physical copy = bundle = canonical archive.

## Implemented E1 surfaces

- durable logical `AgentPrincipal` construction and validation;
- deterministic Context Pack identity using existing `egir-cj/0.1` canonical bytes and SHA-256;
- host-derived context trust classification and source/tool freshness evidence;
- terminal frozen `AgentRun` records, with implementation-only active attempt handles;
- `AgentProposal` construction, material digest, explicit lifecycle transitions, stale-base conflict classification, and no silent rebase;
- review-policy evaluation as facts rather than authority;
- additive `agent-review-decision/1.0-candidate.1` evidence bound to exact proposal material, policy revision, authority-pin snapshot, and base revision;
- pure in-memory `AgentKernel` orchestration with clone-returning getters and no canonical runtime access;
- production conformance dispatcher over frozen v0.7 vectors.

## Conformance closure

E1 accounts for all 36 frozen v0.7 vectors without overclaiming:

```text
17 PASS
19 DEFERRED
0 FAIL
```

E1-covered vectors:

```text
AG-01 AG-02 AG-03 AG-04
AG-05 AG-06 AG-07 AG-08 AG-09
AG-11 AG-12 AG-14
AG-17 AG-18
AG-31
AG-33 AG-34
```

Explicit later-slice deferrals:

```text
E2: AG-10 AG-13 AG-15 AG-16 AG-19 AG-20 AG-32 AG-35
E3: AG-21 AG-22 AG-23 AG-24 AG-30
E4: AG-25 AG-26 AG-29
E6: AG-27 AG-28 AG-36
```

`AG-13` remains deferred because its frozen expected result requires explicit capability authorization. E1 tests direct-mode policy eligibility, but E2 owns capability enforcement. E5 has no unique v0.7 vector; its physical Wasmtime evidence remains a separate Milestone E obligation.

The conformance dispatcher uses frozen vectors only for ID/category/premise dispatch. PASS is produced by executable production scenarios and structured observed results; it does not copy `vector.expected` into the result.

## Product boundary

E1 adds no EveGlyph Editor bridge and changes no product runtime behavior. Product Convergence is therefore used as a regression gate rather than being rewritten to claim product integration that does not yet exist.

The reviewed E0 security-upstream reference remains independently pinned at `kakon77777-commits/eveglyph-editor@061a57ebd3f86dd6df83e6ff8472f5e194c567e5`, tree `664934916c950303ad7e9d166f7aa36a07ac4c57`. E1 neither vendors that security runtime nor promotes it to canonical authority.

## Integration policy

E1 is delivered as a reviewable feature branch and PR. The assistant does not merge it. Integration into `main` is controlled by the user/local review workflow.
