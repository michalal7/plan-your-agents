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
- Enforcement (so the above isn't just convention): CI (`.github/workflows/ci.yml`) runs the mirror `--check` + typecheck + tests + bundle checks on push/PR; a local pre-commit hook (`git config core.hooksPath .githooks`) blocks commits with a drifted mirror, stale index, or outdated bundle. (`check:fresh` is hook-only: the index is gitignored, so it does not exist in CI.)
- **Changed anything the plugin ships** — skills, `_shared/`, the KB mirrors, the bundle, `.mcp.json`? Then bump `version` in `.claude-plugin/plugin.json` **and** add a `CHANGELOG.md` entry. A bump is mandatory, not hygiene: `claude plugin update` compares the manifest version, not content, so without it the change never reaches an installed user. Rules and the tested evidence: `.claude/knowledge/claude-agents/MAINTENANCE.md` → "Releasing the plugin".

## Conventions
- The KB is the single source of truth; the skill mirror and MCP index are generated from it.
- The KB is English-only — content, `CHANGELOG.md`, `_state.json` notes.
- `overview.png` is rendered from `scripts/overview.html` — edit the source, re-render, never patch the image alone.

## Plan-template freeze (since 2026-07-18, 0.4.2)
The advisory surfaces — `.claude/skills/_shared/agent-analysis.md` (the plan skeleton and rules) and the `setup-agents` prompt in `mcp-server/src/server.ts` — are **frozen for content changes** until skill-output fixtures exist. They have now been reworked twice, validated only against this repo, which is the one repo whose history the generated plans can narrate. That is the situation principle #1 in the KB warns about: no feedback loop, no recommendation.

The loop that lifts the freeze is the three fixture repos under `test/skill-fixtures/`. Until they have been run, iterate the template only with fixture evidence, not with introspection. Bug fixes and broken cross-references are of course exempt.

**This file is auto-loaded into every agent's context, so it must not name the fixtures' expected answers** — an earlier version did, which contaminated a run before it started. The expected answers and the run protocol live in `test/skill-fixtures/README.md`, which fixture runs are forbidden to read. For the same reason a fixture run must not be started from inside this repo at all: copy the fixture elsewhere and run rooted there, so no part of this repo's context reaches the agent.

## Guardrails
- If a guardrail blocks an edit — especially to permission/config files like `.claude/settings.json` — stop and ask. Never route the same change through another channel (shell append, rename, temp file, etc.), even when the change looks trivial. The block is a signal about the file's sensitivity, not an obstacle to work around. Disclosing the workaround afterwards does not make it acceptable.
