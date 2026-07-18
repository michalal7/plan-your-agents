# Skill-output fixtures

Three small repos to run `setup-dev-agents` and `setup-task-agents` against. They exist
because the plan template was reworked twice while validated only against *this* repo —
the one repo whose history the generated plans can narrate. That is a rebuilt engine with
no test drive (KB principle #1). The freeze in the root `CLAUDE.md` lifts once these have
been run.

Grade the **output, not the path**: a plan that reaches the right answer by different
reasoning passes. What must not happen is the wrong answer stated confidently.

## How to run

From this repo, point the skill at a fixture:

```
/plan-your-agents:setup-dev-agents test/skill-fixtures/already-good
/plan-your-agents:setup-task-agents test/skill-fixtures/doc-vault
```

Use **advise** mode. The plan lands in the fixture root as `agent-dev-plan.md` /
`agent-task-plan.md`; both are gitignored so a run leaves no trace to clean up.

The fixtures' own `.claude/` directories are inert — Claude Code reads project config from
the working directory upward, never downward — so `already-good/.claude/settings.json`
never applies to this repo. It is there to be *scanned*, not obeyed.

## Pass criteria (all three fixtures)

1. **A verdict up front**, with an effort class, before any reasoning.
2. **A concrete verification loop** named for that repo — not a generic "add tests".
3. **No infrastructure the fixture doesn't warrant.** Every recommendation must trace to a
   signal actually present in the fixture.
4. **Claims trace to the KB**, not to invention. Any number or attribution must be checkable.
5. **The plain-language line is genuinely plain** — no jargon smuggled back in, and it says
   something rather than restating the heading.
6. **The §5 sweep happened**, including in the "change nothing" case.
7. **Under ~120 prose lines.**

## Fixtures and their expected answers

⚠️ **The expected answers below are proposals, not settled.** They were written by the same
agent that reworked the template, so treating them as ground truth would restore exactly
the self-assessment loop these fixtures exist to break. Confirm or correct them before
using them to judge a run.

### `already-good/` — a TypeScript invoice API with a proportionate setup
Signals: `npm test` (vitest), lint, build, a formatter; `CLAUDE.md` with verification
commands, real conventions and a corrections section; `settings.json` with a scoped
allowlist and one `PostToolUse` format hook; tests covering the money logic.

*Proposed expected answer:* **change nothing.** The setup already matches PLAYBOOK §3.
This is the false-positive trap: the tempting-but-wrong moves are a code-reviewer agent
(CI and `/code-review` cover it), worktrees (no colliding parallel edits), or Agent Teams
(nothing to disagree about). A plan that invents work here fails, however well argued.

### `code-service/` — a plain Node service with tests and no `.claude/` at all
Signals: `npm test` via `node --test`, three real tests, no lint, no formatter, no config.

*Proposed expected answer:* **single agent plus the test loop.** Add a short `CLAUDE.md`
(the test command, the "tests are the contract" convention already stated in
`planner.js`), and a permissions allowlist for `npm test`. Failing here means recommending
a formatter hook where no formatter exists — the KB says hook a formatter *if one exists*,
it does not say add one.

### `doc-vault/` — research notes, no code
Signals: two markdown files, no `src`, no tests, no build. Content is interview synthesis
and a dated decision log, including one explicitly unresolved contradiction and one
"n=0, unsupported" note.

*Proposed expected answer:* **source fidelity as the verification loop, and almost no
infrastructure.** No test loop exists or can exist; the check is whether statements stay
bound to their sources and dates. `CLAUDE.md` conventions only — no agents, no commands,
no hooks. Failing here means forcing a code setup onto a non-code repo, which
`_shared/agent-analysis.md` §3 explicitly warns against.

## What a failing run should produce

Record it rather than fixing the template on the spot. The freeze exists so the next
template change carries evidence: which fixture, which criterion, what the plan said
instead. One observed failure beats three plausible ones.
