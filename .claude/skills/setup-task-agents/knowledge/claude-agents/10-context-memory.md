# Context & Memory

Controlling what the model knows, retains and forgets. Guiding principle: context minimalism (`00-principles.md` #2).

## CLAUDE.md — the shared rules file
- One `CLAUDE.md` at the repo root, checked into git; the team keeps adding to it. On every mistake, add a correction line.
- Format: short, imperative rules. Example: "Always use `bun`, not `npm`."
- Scopes: `~/.claude/CLAUDE.md` (global, all projects) vs. `./CLAUDE.md` (repo) vs. subfolder `CLAUDE.md`.
- Tag `@.claude` on PRs → Claude updates CLAUDE.md automatically (via GitHub Action, `/install-github-action` — verify the command name against the docs).
- Keep a notes folder per project/task for longer-lived context.
- Surfaced on load via the `InstructionsLoaded` hook (see `40-config-safety.md`).
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
- **`CLAUDE.md` edits do not take effect mid-session** — the prefix was fixed when the session started. Restart the session after changing it. (Same mechanism binds a plugin's skill path at session start: `claude plugin update` alone does not move a running session.)
Design rule: prefer appending over mutating history, and expect anything loaded at session start to stay put until the next one.
Source: code.claude.com/docs/en/prompt-caching + platform.claude.com prompt-caching (verified 2026-07-18).

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
