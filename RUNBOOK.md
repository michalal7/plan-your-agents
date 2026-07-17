# RUNBOOK — local runs

These steps run in **Claude Code locally on your machine** (not in Cowork Cloud): slash commands and the Chrome extension only exist there.

## 0. Preparation (once)
```bash
cd path/to/plan-your-agents   # the repo root
claude
```
- On first start, **confirm the workspace-trust dialog** — needed so `.claude/settings.json` and the skill's `allowed-tools` take effect.
- Optionally version it: `git init && git add . && git commit -m "KB + agent infrastructure"` (the `.gitignore` keeps `_DELETE_ME_*`, `_kb_stage*`, `.claude/worktrees/`, and the generated `agent-*-plan.md` out).
- **Contributors — enable the drift guard once:** `git config core.hooksPath .githooks`. The pre-commit hook then blocks a commit whose skill KB mirrors or semantic index have drifted from the canonical KB. CI (`.github/workflows/ci.yml`) enforces the mirror check + typecheck + tests on push/PR.

## 1. Test the curator — `/kb-update`
```text
/kb-update
```
- Incremental: reads `_state.json`, fetches only what changed. Expectation: `kb-fetcher` subagents (in parallel) + one `kb-verifier` subagent get spawned (visible in the agent panel), ending in a report (sources, changed files, contradictions, open items).
- Full rebuild (more expensive, many tokens): `/kb-update full`.
- **Verify:** are both subagent types invoked? Does the run update `.claude/knowledge/claude-agents/*` as well as `CHANGELOG.md`/`_state.json`? WebFetch to the doc domains is pre-allowed in `settings.json`; if another permission prompt appears → allow it or add it to the allowlist.

## 2. Test the consumers — `/setup-dev-agents` and `/setup-task-agents`
```text
/setup-dev-agents .          # dev-side advice → writes agent-dev-plan.md
/setup-task-agents .         # workload/goal advice → writes agent-task-plan.md
/setup-dev-agents <path> apply  # also scaffold — writes other files only after confirmation
```
- **Verify:** does each read `PLAYBOOK-agent-design.md` first and the shared `_shared/agent-analysis.md`? Does `setup-dev-agents` name a dev verification loop + minimal `.claude/` setup (and what *not* to include)? Does `setup-task-agents` name an orchestration level + orchestrator pattern + output verification? Does each write its plan file, and `apply` scaffold only after confirmation?
- Reference expectation (validated on "Process Mining", a non-code vault): for doc/knowledge folders `setup-dev-agents` recommends **a single agent + a source-fidelity loop + only CLAUDE.md**, no agent infrastructure.

## Portable path (any MCP client)
Beyond the Claude-native pieces above, `mcp-server/` serves the same KB to other MCP clients with semantic search — see `mcp-server/README.md`.

## Notes
- `max` effort lasts only the session; for durably high effort use `xhigh` or `CLAUDE_CODE_EFFORT_LEVEL`.
- Auto-compact threshold at ~40% of the window: `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` (on 1M).
