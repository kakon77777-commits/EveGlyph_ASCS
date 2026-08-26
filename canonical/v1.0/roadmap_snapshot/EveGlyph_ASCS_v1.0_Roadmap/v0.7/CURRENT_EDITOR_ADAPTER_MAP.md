# Current EveGlyph Editor -> v0.7 Agent Contract Map

This is an implementation handoff map, not a new ontology.

| Current source / state | v0.7 target |
|---|---|
| `S.cfg.agent` / provider / model | `AgentRun.model_binding`; never Principal identity |
| workspace `cwd` | physical/external adapter scope; never workspace persistent identity |
| `agentMode=suggest` | review policy: no canonical mutation |
| `agentMode=patch` | proposal-only + mandatory review |
| `agentMode=direct` | auto-commit eligible only after base/validator/capability checks |
| `agentPermission=cautious/standard/trusted` | UX capability templates; compile into explicit scoped grant |
| `.eveglyph/rules.md` | `workspace-policy`, host-assigned `trusted-policy` |
| `.eveglyph/glossary.md` | `protected-glossary`, `trusted-data` |
| recent/pitfalls | workspace memory; trust depends on provenance/review |
| active document / selection / frontmatter | `untrusted-data` for instruction authority |
| current `context-pack.json` | debug projection of future logical Context Pack |
| `compileContext()` prompt string | model-specific Context Pack renderer |
| git pre-run snapshot | file-agent pre-effect checkpoint |
| CLI stdout/stderr | generated/untrusted data |
| filesystem edits | external effects until imported/committed |
| git diff review | human review of imported proposal |
| accepted patch | Runtime Transaction -> EGIR commit |
| monitor events | runtime diagnostics/provenance input |

## Migration priority

1. Introduce Principal / Run / Context Pack IDs without changing existing UI.
2. Compile permission tiers into scoped capabilities.
3. Convert diff review result into Proposal records.
4. Move direct mode behind the same Runtime Transaction path.
5. Gradually replace filesystem-first agents with proposal-first EGIR agents.
6. Keep file-agent adapter for legacy/local CLI compatibility.

## Security correction

The current prompt compiler correctly treats active document classification as descriptive data rather than commands. v0.7 generalizes this rule to all workspace/external data: **content never determines its own authority class**.
