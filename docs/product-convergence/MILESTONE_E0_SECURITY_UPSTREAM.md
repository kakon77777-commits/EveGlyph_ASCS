# Milestone E0 Security Upstream Reference Freeze

Milestone E0 adds a second, explicitly non-authoritative implementation reference for the reviewed EveGlyph security/runtime line. It does **not** replace or regenerate the historical product baseline.

- Historical product baseline remains `c3258a2f461d5af5a69c879891b485ccf0f02635`.
- Historical ASCS product overlay remains based on that baseline.
- Reviewed security implementation reference is separately pinned at `061a57ebd3f86dd6df83e6ff8472f5e194c567e5`, tree `664934916c950303ad7e9d166f7aa36a07ac4c57`.
- Authority: `implementation-reference-only`; it does not redefine `canonical/v1.0/`, frozen v0.7/v0.9 profiles, or `egir-cj/0.1`.
- The upstream merge reports 135/135 tests after the reviewed Wasmtime integration. E0 reruns the pinned non-Wasmtime security/product command contract. Exact physical Wasmtime 48.0.0 revalidation belongs to E5.
- E0 changes no capability, credential, connector, MCP, sandbox, or canonical mutation behavior.

## Reviewed security fixes

| Fix | Commit | Regression evidence |
| --- | --- | --- |
| `delegated-credential-id-redaction` | `ffe7f3b91dd20ada44dfbebdefd6345c02a4de8a` | `test/connector-delegation-runtime.test.mjs` |
| `delegation-sensitive-result-filter` | `094cee69413ea9a05c29de73549936984b525a9a` | `test/delegation-ipc.test.mjs` |
| `google-export-bounded-stream` | `f3b8f4fc0dfb74ccca0b650ae79a7c0caa741a42` | `test/google-drive-connector.test.mjs` |
| `prototype-chain-capability-lookup` | `ee7b65a7a12a97076a3da72687f69e4e07e4798a` | `test/capability-foundation.test.mjs` |
| `sandbox-entrypoint-bypass` | `75fa2e0e3421e7462fa032c3f1bd3c8f4837724a` | `test/mcp-capability-sandbox.test.mjs` |
| `wildcard-segment-boundary` | `ee7b65a7a12a97076a3da72687f69e4e07e4798a` | `test/capability-foundation.test.mjs` |
| `windows-named-pipe-framing` | `67a07ab5dc144518c33087d5718436e6e1512879` | `test/delegation-ipc.test.mjs` |

## Lineage model

```text
historical EveGlyph product baseline @ c3258a2...
        +
explicit ASCS overlay through Milestone D
        +
reviewed security implementation reference @ 061a57eb...
```

The third line is evidence for Milestone E implementation work. It is not a new canonical baseline and does not authorize copying future upstream changes without a new explicit pin.

## E0 runnable reference gate

At the exact pinned upstream checkout, E0 runs:

```text
npm run test:capabilities
npm run test:credential-broker
npm run test:github-connector
npm run test:google-connector
npm run test:mcp-delegation
npm run test:publication
npm run build
npm run verify:dynamic-logic
npm run verify:dynamic-rendering
```

E0 records but deliberately defers these physical-runtime gates to E5:

```text
npm run test:wasmtime-sandbox
npm run verify:wasmtime-sandbox
```

This prevents E0 from overclaiming a fresh physical Wasmtime validation while still freezing the exact files and scripts that E5 must later revalidate.
