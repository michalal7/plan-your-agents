# Core principles

The few levers that decide everything else. Everything in the topic files is just execution of these principles.

## 1. Verification is the most important lever
Give Claude a way to check its own work — and quality goes up 2–3× per the source. No feedback loop = guessing. Concrete loops per domain: see `50-verification.md`.
In short: define *before* building how "done and correct" is provable (test, browser, build, query).
Source: Part 1 (2026-01-02), Part 11 (2026-04-16).

## 2. Context minimalism
Tell the model only what it needs to know — no more. Evolution: prompt engineering → context engineering → context minimalism.
Give a lean brief *plus* a way to fetch context itself (files, search, MCP). Minimal ≠ vague: state the goal, not micro-steps.
Source: Part 15 (2026-06-08).

## 3. Write mistakes down, don't re-prompt them
Every mistake Claude makes becomes a durable artifact (`CLAUDE.md`, skill, rule) — not another chat aside.
One-off fix → say it in chat. Durable fix → write it down. Effect: error rate drops measurably over time, rules accumulate.
Default reflex after every correction: "Update your CLAUDE.md so you don't make that mistake again."
Source: Part 2 (2026-01-31), Part 15 (2026-06-08), Part 21.

## 4. Delegation, not instruction
Treat the model like a capable professional: write a clear brief, kick it off, come back when it's done — don't shepherd it step by step.
Incomplete brief → Claude asks follow-ups. That's the signal to sharpen the brief, not to micromanage.
Source: Part 10 (2026-04-14).

## 5. Complete brief up front: Goal / Constraints / Acceptance
Every non-trivial brief names three things:
- **Goal** — success in plain language.
- **Constraints** — non-goals, "don't touch", performance/compatibility commitments.
- **Acceptance criteria** — how it's verified (ties back to principle 1).
Saves later assumptions and correction loops.
Source: Part 10 (2026-04-14).

## 6. Parallelism is the biggest productivity lever
Multiple isolated Claude runs at once (worktrees) are, per the source, "the single biggest productivity unlock". Details: `20-parallelism.md`.
Source: Part 2 (2026-01-31).

## 7. Knowledge as infrastructure / automation is the meta-lever
Documented rules, patterns and constraints compound across *all* future runs — and multiply across the whole agent fleet (output/time × number of agents).
Two tiers: **one-off fix** (chat correction, costs tokens every time) vs. **codified rule** (lint/CI/skill/rule — removes an entire error class for everyone, durably). Always aim for the second tier.
Pour domain knowledge into infrastructure — `CLAUDE.md`, `REVIEW.md`, skills, docs, memories, code comments — so anyone (including non-engineers) can contribute with zero extra context. Mantra: "a rejected PR is a failure of automation" — the knowledge should have lived in the infra.
Source: Part 15, Part 21.

## 8. Plan for your unknowns
"The map is not the territory": the map is what you give (prompt/context), the territory is codebase + reality; the gap is your *unknowns*. Reducing it is *the* core skill of agentic coding.
Four types (Rumsfeld): known knowns (in the prompt) · known unknowns (questions you know to ask) · unknown knowns ("I'll recognize it when I see it") · unknown unknowns (never considered).
Tools: **blindspot pass** ("do a blindspot pass for my unknown unknowns"), **interview** (one question at a time, prioritized by architecture impact), **reference = source code** (not a screenshot), **prototypes/HTML variants** for "know it when I see it", **implementation-notes.md** with a "Deviations" log, **quiz** before the merge.
Source: Part 18.

## 9. Expertise = precise instruction + demanded verification, not tighter control
Anthropic analysed ~400,000 Claude Code sessions from ~235,000 users (Oct 2025 – Apr 2026). What separates experts from novices is *not* that they supervise more — it's that they instruct more precisely, ask for specific verification, and then hand execution over.
- Experts trigger ~12 actions per prompt (novices ~5) and produce ~3,200 words of output per prompt (novices ~600).
- Across all users, humans make ~70% of *planning* decisions while Claude makes ~80% of *execution* decisions. Experts push execution autonomy further, not less far.
- Verified success: experts 28–33%, novices 15%. When a session hits errors, experts still reach 15% vs. 4% — the gap is largest in *recovery*, not in the happy path. Novices abandon troubled sessions at 19%, experts at 5–7%.
- Controlled for work mode, task value, month, occupation and model family, each expertise level adds ~9% actions and ~13% output per prompt (p < 0.001).
- ⚠️ Caveats stated by the study itself: correlational and preliminary; success is inferred from transcripts (confirmation, tests passing, git activity), not from real-world outcomes; users self-select; experts may simply pick different tasks.
Practical read: the lever is a sharper brief plus an explicit acceptance criterion (#5, #1) — then get out of the way.
Source: anthropic.com/research/claude-code-expertise (2026-06-16).

---
Note: principle 8 from earlier threads — "start every complex task in Plan Mode" — was replaced by Auto Mode as of Opus 4.6. See `90-deprecated.md`.
