# v0.9 Resource & Performance Classes

Performance is measured against a pinned environment and dataset. A latency target is **not** a semantic validity rule.

## P0 — Conformance

Correctness only. No latency claim. Used by reference validators and migrations.

## P1 — Local Interactive

Target use: ordinary local authoring workspace.

Reference targets:

- viewport/session frame: p95 $\leq 16.7$ ms on declared environment;
- exact local identity resolution: p95 $\leq 20$ ms;
- small canonical move/edit transaction: p95 $\leq 100$ ms;
- large/expensive operations MAY defer, stream, or run as explicit task.

Hard resource limits remain separately configured and MUST return typed failure instead of uncontrolled memory/process growth.

## P2 — Authoring Medium

Target use: large knowledge/canvas workspace requiring virtualization and partial materialization.

Reference targets:

- virtualized pan/zoom: p95 $\leq 33.3$ ms;
- local identity resolution: p95 $\leq 50$ ms;
- initial full-world materialization is NOT required; visible-region correctness is.

## P3 — Stress Observed

No universal latency pass threshold. The run must terminate or degrade in a controlled way, record resource metrics, and never mutate canonical semantics merely to meet a benchmark.

## Mandatory benchmark dimensions

Storage-oriented tests preserve TW-02 dimensions:

$$
(CR,RA,WA,MR,DR,T_e,T_d,M_{peak}).
$$

Runtime tests add command latency percentiles, materialized-node count, cache hit/miss, resolver stages, and external-effect task timing when relevant.
