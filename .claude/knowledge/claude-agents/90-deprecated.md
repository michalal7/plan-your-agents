# Deprecated & resolved contradictions

Newer statements beat older ones. Here are pieces of advice the source itself walked back, plus divergences of the fan-made source from the official docs — each with a rationale, so the setup agent doesn't apply them by accident.

## Default coding model: Opus → Fable 5
- **Old:** Part 1 "use Opus", Part 13 "Opus 4.8, strongest yet".
- **New (Part 17, Jun 2026):** Fable 5 replaces Opus 4.8 as the strongest coding model and default. Alias `fable` is doc-verified. Details → `60-models.md`.

## Plan Mode as default → Auto Mode
- **Old (Part 1/2, Jan 2026):** "start every complex task in Plan Mode (shift+tab 2×), iterate the plan, then auto-accept."
- **New (Part 15, Jun 2026, Opus 4.6+):** Boris: "I don't use that anymore. I use auto mode." Newer models plan implicitly; forced Plan Mode became overhead.
- **Consequence:** For genuinely complex/risky work, *planning* is still worthwhile (Goal/Constraints/Acceptance, `00-principles.md` #5), but no longer as a forced Plan-Mode first step. Default today: Auto Mode + go. Exception: plan approval for teammates (`20-parallelism.md`) is a deliberate, different feature.

## CORRECTED misconception: `dontAsk` is valid
- An earlier run of this KB classified `--permission-mode=dontAsk` (Part 1) as "not a current mode" — **that was wrong.**
- **Docs (permission-modes, verified 2026-07-17):** valid modes are `default` (alias `manual`), `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. The earlier settings fetch simply didn't list `dontAsk`.
- **Consequence:** The fan-made mention was correct. Lesson: individual settings pages aren't complete — for permission modes, consult the permission-modes doc.

## Workflow trigger: plain "workflow" → "ultracode"/"use a workflow"
- **Old:** a bare "workflow" in the prompt.
- **New (Part 16 + docs):** the keyword is `ultracode`; natural language "use a workflow" works the same. Until v2.1.160 the literal keyword was `workflow` — changed due to too many false positives.

## "Auto Mode is mandatory for workflows" → more precisely: a complete allowlist
- **Old (Part 13):** without Auto Mode a single permission prompt freezes the whole run.
- **Docs (checked):** workflow subagents *always* run in `acceptEdits` and inherit the tool allowlist; file edits are auto-approved. Only shell/web/MCP *outside* the allowlist still prompt. In Auto Mode it only asks on the first run.
- **Consequence:** the actual requirement is a *complete tool allowlist* before long runs; Auto Mode is a convenient way there, not a hard requirement.

## Playwright / Chromium MCP for E2E → Chrome extension
- Not "deprecated", but the source consistently recommends the **Chrome extension** for frontend E2E (more reliable, more token-efficient). Playwright/Chromium MCP only when the extension doesn't fit.

## Agent Teams tooling: `TeamCreate`/`TeamDelete` → gone
- Before v2.1.178 you set up teams via the `TeamCreate`/`TeamDelete` tools. **Both no longer exist.** The `team_name` field in hook payloads is deprecated and now only carries the session-derived name. Teams today are purely via plain-text prompt + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`.

## `--tmux` on the worktree → nonexistent (verified false)
- **Old (Part 4):** `claude --worktree my_worktree --tmux`.
- **Docs (worktrees, verified 2026-07-17):** the worktree docs know no `--tmux` flag; "tmux" doesn't appear there. Split panes/tmux belong to **Agent Teams** (`teammateMode`/`--teammate-mode`), not worktrees.
- **Consequence:** drop `--tmux` from `--worktree`; for tmux split panes use Agent Teams.

## Verified & defused (2026-07-17)
- **`CLAUDE_CODE_AUTO_COMPACT_WINDOW`**: does exist after all (model-config doc), default ~967k. Earlier "unconfirmed" marking lifted → `10-context-memory.md`.
- **Fable 5**: `fable` is an official alias = Claude Fable 5. No longer speculative → `60-models.md`.

## CHANGELOG-only claims — shipped, but not documented (checked 2026-07-18)
The `anthropics/claude-code` CHANGELOG is authoritative for *when* something shipped, never for *how* it is used. These entries appear there but could not be found in the docs — do not present them as documented API:
- **`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`** (allegedly default 200) — not in the docs. Its sibling `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION` (default 200, v2.1.212+) *is* documented; don't infer the one from the other.
- **`CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH`** — not documented. The 60 KB truncation of OTEL content attributes is real but presented as a **fixed** limit; the documented escape hatch is `OTEL_LOG_RAW_API_BODIES=file:<dir>`.
- **`EndConversation`** — absent from the tools reference table, so it cannot be used in permission rules, subagent `tools` lists or hook matchers.

## Other divergences found on doc-check (2026-07-18, re-checked in run 3)
- **"Stop hooks are overridden after 8 consecutive blocks"** — no such threshold is documented. Re-checked 2026-07-18: no `stop_hook_active` field, no numeric cap, no loop-protection anywhere on `/hooks`. The only documented block counters (3 consecutive / 20 total) belong to **Auto Mode's classifier fallback**, a different mechanism — do not let that number migrate into the Stop-hook entry.
- **`fork: true` on a skill or subagent — does not exist.** A fragment of the fan-made Part 16 suggested it. The real mechanisms are two and distinct: `context: fork` in **SKILL** frontmatter (plus optional `agent:`) runs a skill in a forked context; separately a `fork` **subagent type** inherits the whole conversation, started by the user via `/subtask` (v2.1.212+, formerly `/fork`). The subagent frontmatter table contains no `fork` field. → `20-parallelism.md`.
- **`disallowHooks` — does not exist.** The real key is `disableAllHooks` (boolean); the enterprise-side control is `allowManagedHooksOnly`. Likely conflated with the subagent field `disallowedTools`.
- **`defaultMode` is nested, not top-level:** it is `permissions.defaultMode`. Also, the project/local ignore rule applies *only* to the value `auto` (so a repo can't grant itself auto mode) — every other value is honored from project and local scope. The KB previously implied the whole key was scope-restricted.

## Promoted from observation to documented (2026-07-18)
Both were parked as "observed, unsourced". Both are now documented verbatim on `code.claude.com/docs/en/agent-sdk/subagents`, so they may be stated as contract:
- **Residual `"Task"` after the v2.1.63 rename** — "Current SDK releases emit `"Agent"` in `tool_use` blocks but still use `"Task"` in the `system:init` tools list and in `result.permission_denials[].tool_name`." Note the spelling is `system:init` with a **colon**; an earlier KB entry had it with a slash. Check both values in `block.name` for cross-version compatibility.
- **Windows 8191-character command-line limit** — documented under Troubleshooting → "Long prompt failures on Windows": subagents with very long prompts may fail at that limit; keep prompts concise or use filesystem-based agents. Directly relevant on this platform.

## Divergences recorded in run 4 (2026-07-18)
Three from the Willison guide; the fourth is a *fetcher's* error against it, kept deliberately.
- **"Quality degrades above ~200,000 tokens"** — the *direction* is documented ("context rot"), the **number is not**. No Anthropic benchmark curve is published, and 200k appears in the docs as a *context-window size* (Haiku 4.5, Sonnet 4.5), so the guide plausibly conflated a window size with a quality cliff. Cite the effect, never the figure. → `10-context-memory.md`.
- **"Claude Code for web"** — the surface is real but is called **Claude Code on the web** (claude.ai/code, research preview; `--cloud` / `--teleport` move sessions between web and terminal).
- **Claude Opus 4.6** — a valid model ID (`claude-opus-4-6`) but **legacy**. Current: Fable 5, Opus 4.8, Sonnet 5, Haiku 4.5. Guide examples naming it are dated, not wrong.
- **"Explore is not a built-in subagent"** — this one was a *fetcher's* claim against the guide, and the fetcher was wrong: `Explore`, `Plan` and `general-purpose` are documented built-ins. Recorded because it shows why the producer never rules on its own extraction.

## Still uncertain (don't present as best practice)
- **Memory/auto-dream** (Part 8), **routines** (Part 10), **dynamic workflows** (Part 13/14): research preview — surfaces may change.
- **Parts 17–21** of the fan-made source: only topic-level extracted (JS-rendered), detailed tips unverified.
