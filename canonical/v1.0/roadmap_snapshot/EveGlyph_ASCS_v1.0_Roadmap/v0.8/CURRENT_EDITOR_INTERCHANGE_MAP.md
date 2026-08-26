# Current EveGlyph Editor → v0.8 Interchange Map

This file maps the current `eveglyph-editor` product surface onto the v0.8 canonical boundaries. It is a migration aid, not a replacement implementation.

| Current surface | Current behavior | v0.8 classification | Future rule |
|---|---|---|---|
| Markdown files | Primary editable source in current product | legacy-document adapter surface | import/export via versioned Markdown profile; EGIR becomes canonical for ASCS mode |
| `marked` preview | Markdown rendering | projection | never canonical authority |
| KaTeX math | LaTeX-style math rendering | LaTeX/presentation adapter | native math semantics live in NCM; KaTeX remains renderer |
| Encoding-aware file IO | Big5/GBK/Shift-JIS/etc. preservation | physical text adapter | decode/encode provenance must remain separate from semantic identity |
| EveGlyph-MD frontmatter | lightweight classification metadata | legacy metadata mapping | mapped fields become candidate metadata/relations; unknown fields preserved |
| World Studio YAML/World IR | specialized external source format | domain adapter | validated candidate mapping; source syntax is not ASCS ontology |
| PDF export | static document output | static projection | source revision + fidelity report required |
| File System Access / local bridge | physical workspace access | physical locator/adapter | file path is not persistent identity |
| Git diff review | human review mechanism | v0.7 review/commit adapter | preserve as compatibility workflow |
| MCP stdio/HTTP | tool transport | v0.7 transport adapter | transport session is not agent/workspace identity |

## Migration invariant

Current users may continue editing Markdown-first workspaces. ASCS mode can import the same files into candidate EGIR objects and export Markdown projections without silently changing the meaning of existing files.

$$
CurrentProductSurface\rightarrow Adapter\rightarrow \text{EGIR Candidate}\rightarrow Review/Commit.
$$
