# Verification — feedback loops per domain

The single most important lever (`00-principles.md` #1): give Claude a way to check its own work → 2–3× quality per the source. Without a loop the model guesses. This file says *which* loop fits *which* work.

## Rule
In the brief, define *acceptance criteria* + the verification means before building. Have Claude co-plan the verification steps, not just the implementation. Make the check deterministic (exit code, test result) so it can be automated as a `Stop`/`SubagentStop` hook or a `/goal` condition.

## Loop per domain
| Domain | Verification means | Note |
|---|---|---|
| **Backend/CLI** | Server/unit tests via bash, `docker logs` | "Go fix the failing CI tests" without micromanagement |
| **Frontend/Web** | **Chrome extension** (drive a real browser) | Per the source, more reliable + more token-efficient than Playwright/Chromium MCP for E2E |
| **Mobile** | Simulator MCP | Screenshot/interaction in the simulator |
| **Data/Analytics** | The DB's CLI/MCP/API (`bq` for BigQuery) | "haven't written a line of SQL in 6+ months" |
| **Research/Facts** | Cross-check by *other* agents | `/deep-research`, adversarial verification (`30-`) |
| **Refactor/Migration** | Tests green *before* the PR | `/batch` agents test per worktree before the PR |
| **Documents/Knowledge (non-code)** | Ground statements against the source document/script; check consistency across files | Note/doc vaults: no tests/CI — the check is source fidelity |

Red/green TDD works as a *steering* pattern, not just a testing one: have the agent write the failing test first, **confirm it fails**, then implement until it passes. It guards two distinct failure modes — code that doesn't work, and code that is unnecessary and never used — and leaves a regression suite behind. Models treat "use red/green TDD" as known shorthand, so it costs one phrase to invoke. (fan-made, Willison, [red-green-tdd](https://simonwillison.net/guides/agentic-engineering-patterns/red-green-tdd/))

## No automated test surface? Drive it and capture evidence
When the work has no test suite to run — UI, content, a fresh script — the loop is still "run it", never "read it". Shape: **start the thing → drive it programmatically → capture observable output → have the agent inspect that output.**
- API/CLI work: start a dev server or run the binary, exercise it (`curl`, a throwaway script), read the real response. Keep scratch files out of the repo.
- Browser/UI work: drive it with a browser-automation layer and take screenshots; the agent judges the screenshot with its own vision ("confirm the menu is where it should be"). Claude Code ships browser tooling for exactly this (`30-workflows.md`).
- **Record commands and their real output**, not the agent's account of them. A transcript of executed commands is the difference between a result that was shown and one that was merely asserted — the same producer≠checker logic as below, applied to evidence.
- Convert anything a manual pass finds into a permanent test (red/green above), so the loop tightens over time.
(fan-made, Willison, [agentic-manual-testing](https://simonwillison.net/guides/agentic-engineering-patterns/agentic-manual-testing/); the third-party tools it names are not Anthropic-endorsed and are deliberately not listed here)

## Automate
- `/go` (skill): test (bash/browser/computer-use) → simplify → PR. Many of the source's prompts end with "… /go".
- `Stop`/`SubagentStop` hook: deterministic done-check before the turn ends.
- `/goal <condition>`: runs until tests/lint pass.
- Code-review agents: auto-dispatch on PR open, one focus per agent (logic/security/perf), inline comments on real bugs.
- The desktop app auto-starts/tests the web server (an alternative to CLI + Chrome extension).

## Why separate verifiers
An agent that grades its own work is lenient (self-preferential bias) and stops too early (agentic laziness). Checking by *separate* agents with a focused goal — ideally several trying to refute — is more reliable. At scale: orchestrator/workflow patterns (`30-workflows.md`), or agent teams with competing hypotheses (`20-parallelism.md`).

## Evals — when the loop itself needs measuring
A test says "this case works". An eval says "the agent handles this *class* of case at rate X". Build one as soon as an agent runs unattended.
- **Start at 20–50 tasks** drawn from real failures (bug tracker, support queue, manual checks) — not hundreds. Early effect sizes are large, so small samples suffice.
- **Solvability test:** would two domain experts independently reach the same pass/fail verdict? If not, the task is ambiguous, not hard. Write a reference solution to prove it's solvable at all.
- **Balance the set.** Include cases where the behaviour should *not* fire. One-sided sets train the agent toward a single behaviour.
- **Grade the output, not the path** — checking for a specific step sequence penalizes valid alternative solutions. Prefer deterministic graders; use LLM-as-judge only for open-ended output, calibrated against human verdicts, and always give the judge an explicit "Unknown" option.
- **Two suites, different targets:** *capability* evals start at a low pass rate and probe hard tasks; *regression* evals should sit near 100%. When a capability task saturates, graduate it into the regression suite.
- **Read transcripts.** You cannot tell whether a grader works without reading its grades on real runs.
- **Diagnostics:** 100% pass rate = saturated, no signal left. 0% at `pass@100` = almost always a broken task, not an incapable agent.
- **`pass@k` vs `pass^k`:** `pass@k` = at least one of k attempts succeeds (rises with k); `pass^k` = *all* k succeed (falls with k). For anything user-facing, `pass^k` is the honest metric — 75% per trial is only ~42% across three.
- Isolate runs: fresh state per trial, no shared state. A leftover git history from a previous trial silently hands the agent the answer.
Source: anthropic.com/engineering/demystifying-evals-for-ai-agents (2026-01-09, verified).

Source: Part 1/2/5/6/9/11/14.
