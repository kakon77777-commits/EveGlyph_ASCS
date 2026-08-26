# v0.9 Observability & Explainability Contract

EveGlyph distinguishes **telemetry** from **explanation evidence**.

$$
Telemetry\neq CanonicalState.
$$

Telemetry may be dropped, sampled, exported, rotated, or unavailable without changing workspace semantics. Explanation records, by contrast, reconstruct why a specific resolver/mutation/execution decision was reached from canonical/provenance evidence.

## ExplainResolution

Must expose: parsed reference type, namespace/base context, resolver policy/version, candidates, evidence, ambiguity/failure reason, authorization boundary when physical locator visibility is restricted.

## ExplainMutation

Must expose: actor/principal, command, base workspace revision, preconditions, validation gates, capabilities, conflict/rebase decision, resulting revisions/events, and any external effect intents.

## ExplainExecution

Must expose: input revisions, operator/binding resolution, assumptions/constraints, backend/version, capabilities, result identity/revision, conditions, evidence class (`computed`, `verified`, `proved`, etc.), and external effects if present.

## Telemetry export

OpenTelemetry-compatible trace/metric/log export MAY be implemented, but is not canonical. Export failure MUST NOT block normal local editing. Secret redaction and declared retention are mandatory production properties.
