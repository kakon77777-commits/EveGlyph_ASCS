# v0.9 Security Boundary Matrix

| Surface | Default trust | Canonical authority | Required gate | Productization note |
|---|---|---|---|---|
| committed EGIR revision | trusted after validation | yes | TW-01/TW-03 validation | immutable hash/revision semantics remain authoritative |
| session/view state | conditional | no | session policy | never promoted by persistence accident |
| derived caches / indexes | conditional | no | rebuild + source revision pin | corruption means rebuild, not ontology repair |
| Markdown/LaTeX/PDF/SVG/import bytes | untrusted | candidate-only | v0.8 adapter + review/policy | no embedded instruction self-elevation |
| `.eveglyph/` directives | trusted only after workspace/user policy | directive-only | v0.7 context authority | unfamiliar workspace requires review/approval |
| AI/model output | untrusted proposal | no | proposal → validation → authorization → commit | direct mode does not bypass gates |
| filesystem/process/network | external | no | explicit capability + effect record | unknown outcome is never automatically replayed |
| telemetry/log backend | derived observation | no | redaction + retention | outage must not block canonical operation |
| external URI/DOI/DID/SWHID | external reference | no local identity by default | explicit binding authority | resolution success does not imply identity merge |
| release package/build artifacts | verified external artifact | no object identity | package hash + release manifest | package provenance is distinct from workspace identity |

## Production-specific prohibitions

- plaintext persistent provider/API secrets MUST NOT satisfy production profile;
- auto-approve agent execution MUST remain capability-scoped and review/policy bounded;
- destructive reject/reset flows MUST surface their data-loss set before execution;
- remote ingress MUST have explicit authentication, scope, rate/resource bounds, and audit evidence;
- telemetry MUST redact credentials and SHOULD minimize absolute paths / raw model output samples.
