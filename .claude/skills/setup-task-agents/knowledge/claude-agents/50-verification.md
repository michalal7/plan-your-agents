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

## Automate
- `/go` (skill): test (bash/browser/computer-use) → simplify → PR. Many of the source's prompts end with "… /go".
- `Stop`/`SubagentStop` hook: deterministic done-check before the turn ends.
- `/goal <condition>`: runs until tests/lint pass.
- Code-review agents: auto-dispatch on PR open, one focus per agent (logic/security/perf), inline comments on real bugs.
- The desktop app auto-starts/tests the web server (an alternative to CLI + Chrome extension).

## Why separate verifiers
An agent that grades its own work is lenient (self-preferential bias) and stops too early (agentic laziness). Checking by *separate* agents with a focused goal — ideally several trying to refute — is more reliable. At scale: orchestrator/workflow patterns (`30-workflows.md`), or agent teams with competing hypotheses (`20-parallelism.md`).

Source: Part 1/2/5/6/9/11/14.
