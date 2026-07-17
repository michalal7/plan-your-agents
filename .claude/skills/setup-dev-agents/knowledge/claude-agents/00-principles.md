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

---
Note: principle 8 from earlier threads — "start every complex task in Plan Mode" — was replaced by Auto Mode as of Opus 4.6. See `90-deprecated.md`.
