# CLAUDE.md

## Knowledge base: Claude Code & agent systems
A curated reference under `.claude/knowledge/claude-agents/`.
- Start here: `.claude/knowledge/claude-agents/INDEX.md`.
- For setup decisions (which agent setup does project X need?): `.claude/knowledge/claude-agents/PLAYBOOK-agent-design.md`.
Read the content when needed; don't pull it into context up front.

## Verify changes
- MCP server (`mcp-server/`): `cd mcp-server && npm test` (offline). Also `npm run typecheck`, `npm run smoke`.
- After editing the KB (`.claude/knowledge/claude-agents/`), regenerate the mirrors and verify:
  - `node scripts/sync-plugin-kb.mjs` → then `node scripts/sync-plugin-kb.mjs --check` (must be green).
  - `cd mcp-server && npm run build:index` (rebuild the semantic index).
  Never hand-edit the generated copies: `.claude/skills/*/knowledge/claude-agents/` (both skill mirrors) and `mcp-server/data/index.json`.

## Conventions
- The KB is the single source of truth; the skill mirror and MCP index are generated from it.
- The KB is English-only — content, `CHANGELOG.md`, `_state.json` notes.
