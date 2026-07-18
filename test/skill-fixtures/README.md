# Skill-output fixtures

Three small repos to run `setup-dev-agents` and `setup-task-agents` against. They exist
because the plan template was reworked twice while validated only against *this* repo —
the one repo whose history the generated plans can narrate. That is a rebuilt engine with
no test drive (KB principle #1). The freeze in the root `CLAUDE.md` lifts once these have
been run.

Grade the **output, not the path**: a plan that reaches the right answer by different
reasoning passes. What must not happen is the wrong answer stated confidently.

**Observations are allowed; recommended work fails.** A plan may note an inconsistency it
finds in a fixture — reporting a real defect is not inventing work, it is the behaviour we
want. It fails only when it turns the observation into recommended setup changes that the
fixture's signals don't warrant. This is the mirror of "a plan that invents work here
fails", and the two must not be confused when grading.

## How to run

**Copy the fixture out of this repo and run rooted there.** Do not run it in place.

```
cp -r test/skill-fixtures/already-good <somewhere outside this repo>/already-good
# then start a session whose working directory is that copy, and run:
/plan-your-agents:setup-dev-agents .
```

Use **advise** mode. The plan lands in the fixture root as `agent-dev-plan.md` /
`agent-task-plan.md`.

The relocation is not fussiness. A run started inside this repo inherits the repo's own
`CLAUDE.md` through a system reminder — automatically, before the agent does anything, and
no instruction not to read a file can prevent it. An early version of that `CLAUDE.md`
stated one fixture's expected answer verbatim, so the first `already-good` run had the
answer in context before it saw the fixture, and its output proved nothing. The root
`agent-dev-plan.md` names all three expected answers as well.

Beyond the answer key, a run inside this repo also inherits its subject matter — the KB,
the plugin, the conventions — none of which a real target repo would supply. Running from
a copy elsewhere is simply what an actual user's situation looks like. The skill reads its
KB from the installed plugin, so it works anywhere.

**Before scanning, the run must report the absolute path it read
`_shared/agent-analysis.md` from.** If that path is not the currently installed plugin
version, abort and discard the plan even if it looks good — a plausible plan built from
the wrong template is more dangerous than none, because it appears to satisfy criteria it
never knew about. This has already happened once: a run silently used the previously
installed version.

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
Signals: `npm test` (vitest), lint, build, a formatter; `CLAUDE.md` **at the repo root**
with verification commands, real conventions and a corrections section; `settings.json`
with a scoped allowlist and one `PostToolUse` format hook; tests covering the money logic.
Every declared command resolves: `tsconfig.json` and `eslint.config.js` (ESLint 9 flat
config) both exist. That matters — the first draft of this fixture declared `tsc -p
tsconfig.json` and `eslint src test` with neither file present, and put `CLAUDE.md` under
`.claude/` where the KB places it at the root. A run against that version would have
measured fixture defects instead of skill quality.

*Proposed expected answer (dev lens):* **change nothing.** The setup already matches PLAYBOOK §3.
This is the false-positive trap: the tempting-but-wrong moves are a code-reviewer agent
(CI and `/code-review` cover it), worktrees (no colliding parallel edits), or Agent Teams
(nothing to disagree about). A plan that invents work here fails, however well argued.

### `code-service/` — a plain Node service with tests and no `.claude/` at all
Signals: `npm test` via `node --test`, three real tests, no lint, no formatter, no config.

*Proposed expected answer (dev lens):* **single agent plus the test loop.** Add a short
`CLAUDE.md` (the test command, the "tests are the contract" convention already stated in
`planner.js`), and a permissions allowlist for `npm test`. Failing here means recommending
a formatter hook where no formatter exists — the KB says hook a formatter *if one exists*,
it does not say add one.

**Proposing new tooling counts as invented work.** ESLint, Prettier, a CI pipeline: the
absence of a linter is not a pain signal, and this skill advises on the *agent* setup, not
on the project's toolchain. A plan that dodges the formatter trap and then offers a linter
has made the same mistake one door down.

### `doc-vault/` — research notes, no code
Signals: two markdown files, no `src`, no tests, no build. Content is interview synthesis
and a dated decision log, including one explicitly unresolved contradiction and one
"n=0, unsupported" note.

*Proposed expected answer (dev lens):* **source fidelity as the verification loop, and
almost no infrastructure.** No test loop exists or can exist; the check is whether
statements stay bound to their sources and dates — the fixture gives concrete material to
anchor that on (the unresolved nightly-vs-weekly contradiction, the `n=0` note).
`CLAUDE.md` conventions only — no agents, no commands, no hooks. Failing here means forcing
a code setup onto a non-code repo, which `_shared/agent-analysis.md` §3 warns against.

*Proposed expected answer (task lens):* **no agent system is warranted.** Two markdown
files are not a recurring workload; there is nothing to orchestrate. The honest output is a
"change nothing" verdict plus, at most, a note on what would change that (a real ingestion
cadence, many sources, a repeatable synthesis step). This is the only "do nothing" case the
**task** skill has — the other two fixtures exercise the dev skill — so it carries the
whole weight of testing whether `setup-task-agents` can decline to build something.

## What a failing run should produce

Record it rather than fixing the template on the spot. The freeze exists so the next
template change carries evidence: which fixture, which criterion, what the plan said
instead. One observed failure beats three plausible ones.
