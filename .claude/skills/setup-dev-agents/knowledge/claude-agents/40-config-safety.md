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
- CLI: `claude --permission-mode auto` (verified). `claude auto-mode reset` restores the default config by removing the `autoMode` section (v2.1.212+). `defaultMode: "auto"` is **ignored** from project/local settings — it must come from the user level or the CLI.
Source: Part 8/11/15.

### How Auto Mode actually decides (mechanism)
Two independent layers, because either alone is bypassable:
1. **Input probe** — screens the incoming request itself.
2. **Transcript classifier** — reads the conversation so far and grades the proposed action. It is deliberately **blind to Claude's reasoning**: a model that could talk the classifier into approving by explaining itself would be a single point of failure.
Three outcomes: auto-approve · ask the user · block outright. Block rules cover credential access, destructive filesystem operations, network exfiltration and permission-system tampering.
- The classifier runs both when work is **delegated to a subagent** and when it **returns** — a subagent cannot launder an action past it.
- **Escalation:** 3 consecutive or 20 total denials end the autonomous run. In headless (`-p`) mode there is no user to fall back to, so the session terminates instead of prompting.
- Measured: ~0.4% false-positive rate end to end; ~17% false negatives on genuinely overeager actions. Read that second number as: Auto Mode reduces the prompt burden, it does not remove the need for a sandbox and a clean allowlist.
Source: anthropic.com/engineering/claude-code-auto-mode (2026-03-25).

## Containment — what the sandbox is actually for
Anthropic's own layered model, useful as a template for how much isolation a project needs:
- **Layer 1 — isolation:** gVisor for claude.ai; OS-level sandboxing for Claude Code (Seatbelt on macOS, bubblewrap on Linux). Effect measured: permission prompts down ~84%, because safe operations no longer need asking.
- **Layer 2 — egress control:** an allowlist of reachable hosts. Known bypass: substituting a Files API key to smuggle data out through an *allowed* host. An egress allowlist constrains destinations, not intent.
- **Layer 3 — the permission system** (above).
Findings worth designing around:
- **Prompt injection works.** In their own testing, a phishing page that asked Claude to exfiltrate `~/.aws/credentials` succeeded in 24 of 25 attempts. Treat any fetched content as data, never instruction — and keep credentials out of reach of the sandbox rather than relying on the model to refuse.
- **Trust dialogs can be too late.** Project-local `.claude/settings.json` hooks were executing *before* the trust dialog appeared; fixed by deferring hook execution. Lesson for your own tooling: anything that runs on session start runs before the human has agreed to anything.
- **Validate after resolution, not before.** A symlink checked before path resolution passes a check the resolved path would fail.
- Sandboxes are an **EDR blind spot** — endpoint tooling on the host may not see inside them.
Source: anthropic.com/engineering/how-we-contain-claude (2026-05-25).

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
- `/sandbox`: open-source sandbox runtime, file and network isolation. Implementation is OS-native: Seatbelt (macOS), bubblewrap (Linux). **No Windows sandboxing** as of the 2026-07-18 doc check — the fan-made "coming soon" (Part 3, Feb 2026) has still not landed; don't promise it.
- For sandboxed runs, `dontAsk`, `auto` or `bypassPermissions` fit (all valid).

## Effort
- `/effort` or `/model`: `low → medium → high → xhigh → max`. `low/medium/high/xhigh` persist across sessions; `max` lasts only the session (except via env `CLAUDE_CODE_EFFORT_LEVEL`). The settings field `effortLevel` accepts only `low/medium/high/xhigh` (not `max`/`ultracode`). Adaptive thinking since Opus 4.7. Details & version defaults → `60-models.md`.

## Skills — authoring limits (verified)
Only a skill's **metadata** (`name`, `description`) is preloaded at startup; `SKILL.md` itself loads on demand. That is what makes the frontmatter budget the real constraint:
- `name`: max **64 chars**, lowercase letters/numbers/hyphens only, no XML tags, and the reserved words `anthropic`/`claude` are forbidden. Prefer gerund form (`processing-pdfs`).
- `description`: non-empty, max **1,024 chars**, no XML tags. Write it third-person and say *what* + *when* — it is injected into the system prompt and is the only basis for choosing among many skills. (Separately, Claude Code truncates `description` + `when_to_use` at 1,536 chars in its skill listing.)
- `SKILL.md` body: keep under **500 lines**; split overflow into one-level-deep reference files. Guidance, not enforcement.
- `disable-model-invocation: true` makes a skill manual-only, invoked as `/<name>` (verified).
- Reference MCP tools fully qualified as `ServerName:tool_name`, otherwise they fail to resolve when several servers are loaded.
- Use forward slashes in paths even on Windows. Build 3+ eval scenarios before writing extensive docs; there is no built-in eval runner (`50-verification.md`).
Source: platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.

## /checkup — setup hygiene (Part 20)
`/checkup` audits the whole Claude Code install and cleans up — **confirms first, fully reversible** (settings = one-line toggles, CLAUDE.md edits land in the working tree for `git diff`): remove unused skills/MCPs/plugins, dedupe local vs. checked-in `CLAUDE.md`, break a large `CLAUDE.md` into nested + skills, turn off slow hooks, update the version, turn Auto Mode on, pre-allow frequently-denied read-only commands. Setups accumulate silent waste (Boris' run: broken launcher, 38 never-used skills over 2345 sessions, `CLAUDE.md` ~10k tokens/session → ~5.5k tokens/session saved). The automated half of context minimalism — run it periodically.

## Further customization (compact)
`/config` (theme, output style Explanatory/Learning, recaps on/off) · `/statusline` (model, directory, context left, cost) · `/keybindings` (`~/.claude/keybindings.json`, live reload) · `/terminal-setup` (shift+enter) · `/vim` · spinner verbs. All shareable via `settings.json`. 37 settings, 84 env vars (Part 3) — look up against the docs as needed.
