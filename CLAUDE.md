# CLAUDE.md

## Knowledge base: Claude Code & agent systems
A curated reference under `.claude/knowledge/claude-agents/`.
- Start here: `.claude/knowledge/claude-agents/INDEX.md`.
- For setup decisions (which agent setup does project X need?): `.claude/knowledge/claude-agents/PLAYBOOK-agent-design.md`.
Read the content when needed; don't pull it into context up front.

## Verify changes
- MCP server (`mcp-server/`): `cd mcp-server && npm test` (offline). Also `npm run typecheck`, `npm run smoke`, `npm run smoke:bundle`.
- After editing the KB (`.claude/knowledge/claude-agents/`), regenerate the mirrors and verify:
  - `node scripts/sync-plugin-kb.mjs` → then `node scripts/sync-plugin-kb.mjs --check` (must be green).
  - `cd mcp-server && npm run build:index` (rebuild the semantic index).
- After editing `mcp-server/src/`, rebuild the plugin bundle: `cd mcp-server && npm run build:bundle` (verify with `npm run check:bundle`).
- Never hand-edit the generated artifacts: `.claude/skills/*/knowledge/claude-agents/` (both skill mirrors), `mcp-server/data/index.json`, and `mcp-server/bundle/plugin-server.mjs`.
- Enforcement (so the above isn't just convention): CI (`.github/workflows/ci.yml`) runs the mirror `--check` + typecheck + tests + bundle checks on push/PR; a local pre-commit hook (`git config core.hooksPath .githooks`) blocks commits with a drifted mirror, stale index, or outdated bundle.

## Conventions
- The KB is the single source of truth; the skill mirror and MCP index are generated from it.
- The KB is English-only — content, `CHANGELOG.md`, `_state.json` notes.
