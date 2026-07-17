# MAINTENANCE — operating the knowledge base

This file describes how the knowledge base is maintained. It is meta (upkeep), not part of the domain knowledge used for project recommendations.

**Language:** the KB is maintained in **English** — content files, `CHANGELOG.md` and `_state.json` notes. The curator (`/kb-update`) is instructed to keep it English even when a source is in another language.

## Optimized flow (since 2026-07-17)
The curator no longer works as a single agent doing everything sequentially in the main context; it delegates and separates roles — per the KB's own principles:

1. **Fetch** in parallel to `kb-fetcher` subagents (one per source) → structured JSON, raw HTML stays out of the main context (context minimalism, delegation, fan-out).
2. **Verify** via a separate `kb-verifier` subagent — safety-/API-relevant claims adversarially against the official docs, default "unverified" (verification = the #1 lever, producer≠checker).
3. **Write** by topic (main run), **review** for compactness (<200 lines, every line decision-relevant).
4. **State** advanced in `CHANGELOG.md` + `_state.json`; incrementally only changed parts.
5. **Sync** the plugin's bundled KB mirror: `node scripts/sync-plugin-kb.mjs` (see below).

**Generated artifacts from the canonical KB** (never hand-edited — one source, generated mirrors, like a build step):
- `.claude/skills/setup-dev-agents/knowledge/claude-agents/` and `.claude/skills/setup-task-agents/knowledge/claude-agents/` — the KB bundled into each skill so it works when installed as a plugin. Regenerate both with `node scripts/sync-plugin-kb.mjs`; verify with `--check`.
- `mcp-server/data/index.json` — the semantic index. Regenerate with `npm run build:index` in `mcp-server/`.

Invocation: slash command `/kb-update` (see `.claude/commands/kb-update.md`); subagents in `.claude/agents/kb-fetcher.md` and `.claude/agents/kb-verifier.md`.
- `/kb-update` — incremental per `_state.json`
- `/kb-update full` — full rebuild
- `/kb-update <url ...>` — target specific sources

## Orchestration decision
Routine update: subagents in one session (default). Only a rare full rebuild with adversarial multi-verification justifies a dynamic workflow (optionally as `~/.claude/workflows/kb-rebuild`). No agent team (no inter-agent talk needed). No forced Plan Mode.

## Consumer side (using the KB)
Separate from the curator (which maintains the KB), the consumer side applies it:
- **Skills** `setup-dev-agents` and `setup-task-agents` (`.claude/skills/*/SKILL.md`, shared machinery in `_shared/agent-analysis.md`) — trigger on intent and are invocable as `/<name> [repo] [apply]`. `setup-dev-agents` optimizes *developing* the repo (Claude Code config); `setup-task-agents` designs an agent system for the repo's *own workload* (orchestration + pattern + verification). Each recommends based on the `PLAYBOOK` and writes a plan (`agent-dev-plan.md` / `agent-task-plan.md`); apply also scaffolds.
Modes: `advise` (writes the plan, otherwise read-only, default) / `apply` (also scaffolds files after confirmation).
Use across projects: put the skill **and** `knowledge/claude-agents/` into `~/.claude/`; the skill reads the KB from `~/.claude/knowledge/claude-agents/` (or repo-local, if present).
- **MCP server** (`mcp-server/`) — exposes the same KB to any MCP client (resources + semantic `search_knowledge` + a `setup-agents` prompt). Reads the KB live; never forks it. See `mcp-server/README.md`.

## Known environment pitfalls
- **JS-rendered sources** (e.g. parts 17–21 of the fan-made site): WebFetch doesn't deliver the tab contents. Fetch them in the main run via the Chrome/browser tool — subagents have no browser access.
- **Writing to `.claude/` from Cowork Cloud**: the bridge tool `device_commit_files` refuses `.claude` target paths. Reliable path: commit into a non-`.claude` staging folder (e.g. `_kb_stage/`), then move it to the target with `device_bash` and `mv`. `device_bash` can write into `.claude` but **not delete** (rm/rmdir fail) — empty staging folders remain and are removed manually. When the curator instead runs locally as `/kb-update` in Claude Code, it writes directly; this detour doesn't apply.

## Open items (as of 2026-07-17)
Fan-made source fully captured (parts 1–21); the earlier doc-verifications (`CLAUDE_CODE_AUTO_COMPACT_WINDOW`, model IDs/Fable 5, `--tmux`) are resolved in `_state.json` → `verified`. Next run: only check for new parts. Current `openItems` live in `_state.json`.
