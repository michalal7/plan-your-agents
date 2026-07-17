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

## Still uncertain (don't present as best practice)
- **Memory/auto-dream** (Part 8), **routines** (Part 10), **dynamic workflows** (Part 13/14): research preview — surfaces may change.
- **Parts 17–21** of the fan-made source: only topic-level extracted (JS-rendered), detailed tips unverified.
