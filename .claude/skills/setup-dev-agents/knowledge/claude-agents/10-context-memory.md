# Context & Memory

Controlling what the model knows, retains and forgets. Guiding principle: context minimalism (`00-principles.md` #2).

## CLAUDE.md — the shared rules file
- One `CLAUDE.md` at the repo root, checked into git; the team keeps adding to it. On every mistake, add a correction line.
- Format: short, imperative rules. Example: "Always use `bun`, not `npm`."
- Scopes: `~/.claude/CLAUDE.md` (global, all projects) vs. `./CLAUDE.md` (repo) vs. subfolder `CLAUDE.md`.
- Tag `@.claude` on PRs → Claude updates CLAUDE.md automatically (via GitHub Action, `/install-github-action` — verify the command name against the docs).
- Keep a notes folder per project/task for longer-lived context.
- Surfaced on load via the `InstructionsLoaded` hook (see `40-config-safety.md`).
- **Load order (verified):** files are read from the filesystem root *down* to your working directory, so the nearest file is read last. Files in subdirectories *below* cwd are a different path — they load on demand when Claude reads a file there, not at launch. On conflict the docs promise no positional rule: Claude reconciles by judgment, "with more specific instructions typically taking precedence". So rely on **specificity**, not on position, and if a rule must hold, see the next line. (/en/memory#how-claude-md-files-load, /en/features-overview)
- **An instruction file is guidance, not enforcement (verified).** It is "delivered as a user message after the system prompt", so there is "no guarantee of strict compliance" — Claude treats it as context, not enforced configuration. Anything that must hold every time belongs in a `PreToolUse` hook or a permission rule. Writing ever-firmer prose does not close that gap; changing mechanism does. (/en/memory#claude-isnt-following-my-claude-md, /en/features-overview)
Source: Part 1 (2026-01-02), Part 2 (2026-01-31), Part 15.

## Skills & Commands — encapsulate repetition
- Rule of thumb: if something is used >1×/day → pour it into a skill or slash command.
- Check skills into git (reusable across repos/projects). `SKILL.md` + folder.
- Slash commands under `.claude/commands/`; may contain inline bash to precompute.
- Isolation: `context: fork` in the SKILL frontmatter (optionally with `agent:`) runs the skill in a forked context. **There is no `fork: true` field** — that fan-made fragment was refuted, see `90-deprecated.md`.
Source: Part 1, Part 2, Part 16.

## Prompt caching — why the transcript is append-only (verified)
Caching matches on the **prefix**, exactly: a change anywhere in the prefix recomputes everything after it. There is no per-file or per-segment caching. That single constraint explains a family of behaviours you would otherwise have to memorize separately:
- Editing a file Claude already read does **not** rewrite the earlier read. A `<system-reminder>` is appended instead.
- Skills and commands inject their instructions **at the point of invocation**; nothing earlier changes.
- `/recap` appends; `/compact` replaces. `/rewind` truncates back to an already-cached prefix.
- **`CLAUDE.md` edits do not take effect mid-session** — the prefix was fixed when the session started. Restart the session after changing it.
Design rule: prefer appending over mutating history, and expect anything loaded at session start to stay put until the next one.
Knobs (verified on the prompt-caching page, and also listed on `/en/env-vars`): `DISABLE_PROMPT_CACHING` for everything, or per model `_HAIKU` / `_SONNET` / `_OPUS` / `_FABLE`. TTL: `ENABLE_PROMPT_CACHING_1H=1` opts into the one-hour lifetime, `FORCE_PROMPT_CACHING_5M=1` forces five minutes regardless of authentication. Reach for these when debugging cache behaviour, not as a default — disabling the cache makes every turn pay full price.
Source: code.claude.com/docs/en/prompt-caching + platform.claude.com prompt-caching (verified 2026-07-18).

## Plugin changes mid-session — a different mechanism, and `/reload-plugins`
Do **not** explain a stale plugin by prompt caching: skills, commands, agents, hooks and themes are *appended*, so they never invalidate the cache. A plugin that looks stale is stale for a separate reason — marketplace plugins are copied into a per-version directory under `~/.claude/plugins/cache`, and an updated-away version is kept for a 7-day grace period so running sessions don't break mid-flight.
- `claude plugin update` therefore does **not** move a running session; it keeps the version it loaded at launch.
- **`/reload-plugins` is the documented in-session fix** — it reloads plugins, skills, agents, hooks and plugin MCP/LSP servers without a restart. Since v2.1.163 it warns and declines when the reload would force a full cache re-read (a plugin providing non-deferred MCP tools); `--force` applies it anyway.
- Consequence for testing a plugin you are developing: a new session is one way to pick up a build, not the only one, and "I updated it" is not the same as "the session is running it" — check the resolved path either way.
Source: code.claude.com/docs/en/plugins-reference (plugin caching and file resolution), /en/discover-plugins, /en/prompt-caching (verified 2026-07-18).

## Memory (`/memory`) — newer, partly preview
- Auto-memory stores preferences/patterns between sessions.
- Auto-dream: a subagent reviews and consolidates memory (`/dream`).
- Status: young (since ~2026-03), partly research preview — don't treat as a stable best practice; verify against the docs.
Source: Part 8 (2026-03).

## /compact vs. /clear — know the difference
- `/compact`: lossy LLM summary. Cheap, keeps momentum. Steerable: `/compact focus on auth, drop test debugging`.
- `/clear`: a hand-written, exact brief. More effort, more precise context.
- Choose `/clear` when precision matters; `/compact` to keep going on the same thread.

## Auto-compact threshold — compact early
- Context rot sets in around ~300–400k tokens (on a 1M model); compacting earlier keeps performance sharp. ⚠️ The *effect* is documented ("as token count grows, accuracy and recall degrade — context rot"); the **numeric threshold is fan-made**, no Anthropic benchmark curve is published. Treat any specific cliff figure as framing, not fact — the recommendation below stands on the effect, not on the number.
- `CLAUDE_CODE_AUTO_COMPACT_WINDOW` controls the threshold (verified, model-config doc). Default ~967k tokens (Sonnet 5, 1M window). **Recommendation: ~40% of the window** — so `=400000` on a 1M window — to stay well below the context-rot zone. Toggle via `autoCompactEnabled` or `DISABLE_AUTO_COMPACT`.
- Use the `PostCompact` hook to re-inject critical instructions after compaction.
Source: Part 10 (2026-04-14).

## /rewind instead of correcting
- `/rewind` or double-tap Esc: go back to an earlier message, discard everything after it.
- Cleaner than "stacking a correction on top", because the faulty context doesn't linger.
- Optionally run "summarize from here" before rewinding to salvage insights.
Source: Part 10 (2026-04-14).
