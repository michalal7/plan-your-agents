# Configuration & safety

`settings.json`, permissions, Auto Mode, hooks, sandbox, effort. All check-in-able for the team.
Structures below checked against the official docs (code.claude.com/docs/en/{settings,hooks,permission-modes}) — as of that check.

## settings.json — core keys (verified)
`permissions` (allow/deny/ask) · `hooks` · `additionalDirectories` · `defaultMode` · `env` · `model` · `enableAllProjectMcpServers` · `disableWorkflows` · `teammateMode` · `worktree.baseRef` · `cleanupPeriodDays`.
Scopes & precedence (high→low): managed (org) → command-line → `.claude/settings.local.json` (private) → `.claude/settings.json` (project) → `~/.claude/settings.json` (user).
Check into the repo what the team should share; keep private things in `settings.local.json` or the user level.

## Permissions
- `/permissions` edits allow/deny/ask. Wildcard syntax: `Bash(bun run *)`, `Bash(bq query:*)`, `Edit(/docs/**)`, `Read(~/.zshrc)`, `Read(./.env)` (deny).
- Pre-allowing safe, frequent commands saves prompts (and is a prerequisite for uninterrupted workflows/teams).
- `/fewer-permission-prompts` scans history and suggests allowlist additions for safe, repeatedly-prompting commands.

## Permission modes (verified)
`default` (CLI alias `manual`) · `acceptEdits` · `plan` · `auto` · `dontAsk` · `bypassPermissions`. Set in `defaultMode` or cycle with shift+tab.
Note: `dontAsk` is a **valid** mode (permission-modes doc) — the fan-made mention `--permission-mode=dontAsk` was correct. `auto` uses the classifier, `bypassPermissions` skips everything.

## Auto Mode — safely skip prompts
- Enable: `claude --enable-auto-mode` or shift+tab to Auto Mode. For Max/Team/Enterprise.
- A classifier grades every action: safe ones are auto-approved, risky ones flagged/blocked (events `PermissionRequest`/`PermissionDenied`).
- Safety argument (source): red-teamed on thousands of transcripts; safer than rubber-stamping hundreds of prompts ("eyes glaze over"). Practically required for many parallel Claudes/workflows, so one prompt doesn't freeze everything.
Source: Part 8/11/15.

## Hooks — deterministic lifecycle logic
- Configured in `settings.json` under `hooks`. Three levels: event → `matcher` (filter, e.g. `"Edit|Write"`, `"Bash"`) → handler array.
- Handler `type`: `command` · `http` · `mcp_tool` · `prompt` · `agent`. Useful fields: `if` (permission-rule filter, e.g. `Bash(git *)`), `timeout`, `statusMessage`, `once`, `async`.
- Format example (auto-format after edits, Part 1):
  ```json
  { "hooks": { "PostToolUse": [ { "matcher": "Write|Edit",
    "hooks": [ { "type": "command", "command": "bun run format || true" } ] } ] } }
  ```
- Key events (a selection of 30+): `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied`, `Stop`, `SubagentStart`/`SubagentStop`, `PreCompact`/`PostCompact`, `InstructionsLoaded`, `WorktreeCreate`/`WorktreeRemove`, `TeammateIdle`/`TaskCreated`/`TaskCompleted`, `SessionEnd`.
- Patterns: `Stop`/`SubagentStop` → deterministic done-check (build/test); `PostToolUse` → auto-format/lint; `PostCompact` → re-inject critical instructions; `PermissionRequest` → route to Slack/Opus; `SessionStart` → load context.
- Quick start: ask Claude to add a hook.
Hook events verified against code.claude.com/docs/en/hooks.

## MCP & tool integrations
- `.mcp.json` configures MCP servers (Slack, BigQuery, Sentry …). `enableAllProjectMcpServers: true` auto-approves project MCPs.
- Claude uses allowed tools autonomously. Browse/install plugins/MCPs/skills via `/plugin`.

## Sandbox
- `/sandbox`: open-source sandbox runtime, file and network isolation. ⚠️ Windows support was "coming soon" as of Part 3 (fan-made, Feb 2026) — unverified against the docs, so don't promise it.
- For sandboxed runs, `dontAsk`, `auto` or `bypassPermissions` fit (all valid).

## Effort
- `/effort` or `/model`: `low → medium → high → xhigh → max`. `low/medium/high/xhigh` persist across sessions; `max` lasts only the session (except via env `CLAUDE_CODE_EFFORT_LEVEL`). The settings field `effortLevel` accepts only `low/medium/high/xhigh` (not `max`/`ultracode`). Adaptive thinking since Opus 4.7. Details & version defaults → `60-models.md`.

## /checkup — setup hygiene (Part 20)
`/checkup` audits the whole Claude Code install and cleans up — **confirms first, fully reversible** (settings = one-line toggles, CLAUDE.md edits land in the working tree for `git diff`): remove unused skills/MCPs/plugins, dedupe local vs. checked-in `CLAUDE.md`, break a large `CLAUDE.md` into nested + skills, turn off slow hooks, update the version, turn Auto Mode on, pre-allow frequently-denied read-only commands. Setups accumulate silent waste (Boris' run: broken launcher, 38 never-used skills over 2345 sessions, `CLAUDE.md` ~10k tokens/session → ~5.5k tokens/session saved). The automated half of context minimalism — run it periodically.

## Further customization (compact)
`/config` (theme, output style Explanatory/Learning, recaps on/off) · `/statusline` (model, directory, context left, cost) · `/keybindings` (`~/.claude/keybindings.json`, live reload) · `/terminal-setup` (shift+enter) · `/vim` · spinner verbs. All shareable via `settings.json`. 37 settings, 84 env vars (Part 3) — look up against the docs as needed.
