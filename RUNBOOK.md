# RUNBOOK — local runs

These steps run in **Claude Code locally on your machine** (not in Cowork Cloud): slash commands and the Chrome extension only exist there.

## 0. Preparation (once)
```bash
cd path/to/plan-your-agents   # the repo root
claude
```
- On first start, **confirm the workspace-trust dialog** — needed so `.claude/settings.json` and the skill's `allowed-tools` take effect.
- Optionally version it: `git init && git add . && git commit -m "KB + agent infrastructure"` (the `.gitignore` keeps `_DELETE_ME_*`, `_kb_stage*`, `.claude/worktrees/` out).
- Clean up: delete the empty `_DELETE_ME_empty_kb_stage*` folders in the root.

## 1. Test the curator — `/kb-update`
```text
/kb-update
```
- Incremental: reads `_state.json`, fetches only what changed. Expectation: `kb-fetcher` subagents (in parallel) + one `kb-verifier` subagent get spawned (visible in the agent panel), ending in a report (sources, changed files, contradictions, open items).
- Full rebuild (more expensive, many tokens): `/kb-update full`.
- **Verify:** are both subagent types invoked? Does the run update `.claude/knowledge/claude-agents/*` as well as `CHANGELOG.md`/`_state.json`? WebFetch to the doc domains is pre-allowed in `settings.json`; if another permission prompt appears → allow it or add it to the allowlist.

## 2. Fill parts 17–21 (needs a browser)
Prerequisite: the **Claude Chrome extension** installed/connected (https://claude.ai/chrome), logged in with the same account.
```text
Fetch parts 17–21 from howborisusesclaudecode.com via the browser: click each numbered
tab, and per tip extract title + full text + commands/flags + links.
Then work them into the KB by topic (not chronologically), check safety-relevant
claims with kb-verifier against the docs, and set parts 17–21 to status "full" in
_state.json.
```
- This is the remainder noted in `_state.json` → `openItems`. After that the fan-made source is fully captured.

## 3. Test the consumer — `/setup-agents`
```text
/setup-agents .            # advise mode (read-only) for the current repo
/setup-agents <path>       # advise a different project
/setup-agents <path> apply # scaffold — writes only after explicit confirmation
```
- **Verify:** does it read `PLAYBOOK-agent-design.md` first? Does it name an orchestration level **and** a verification loop? Does it propose a minimal setup and say what deliberately should *not* go in? Does `apply` write only after confirmation?
- Reference expectation (validated on "Process Mining", a non-code vault): for doc/knowledge folders it recommends **a single agent + a source-fidelity loop + only CLAUDE.md**, no agent infrastructure.

## Portable path (any MCP client)
Beyond the Claude-native pieces above, `mcp-server/` serves the same KB to other MCP clients with semantic search — see `mcp-server/README.md`.

## Notes
- `max` effort lasts only the session; for durably high effort use `xhigh` or `CLAUDE_CODE_EFFORT_LEVEL`.
- Auto-compact threshold at ~40% of the window: `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` (on 1M).
