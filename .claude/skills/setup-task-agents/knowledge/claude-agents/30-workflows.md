# Dynamic workflows & orchestration

A workflow is a **JavaScript script that Claude writes** and a runtime executes in the background while the session stays responsive. The plan lives in code, not in Claude's context — which is what lets it scale to dozens–hundreds of subagents and be repeatable.
Status: research preview, needs v2.1.154+, paid plans + API/Bedrock/Vertex/Foundry. On Pro, enable via "Dynamic workflows" in `/config`.
Authoritative source: code.claude.com/docs/en/workflows. Supersedes diverging fan-made claims.

## Who holds the plan? (delineation)
| | Subagents | Skills | Agent Teams | Workflows |
|---|---|---|---|---|
| Plan holder | Claude, turn by turn | Claude, per prompt | Lead, turn by turn | the **script** |
| Intermediate results | context window | context window | shared task list | script variables |
| What's repeatable | worker def | the instruction | team def | the **orchestration itself** |
| Scaling | few/turn | like subagents | a handful of peers | dozens–hundreds/run |
| Interruption | redo the turn | redo the turn | keep running | **resumable** (same session) |
In short: use a workflow when a task needs more agents than a conversation can coordinate, OR when you want the orchestration as a readable/re-runnable script.

## Triggering
- Keyword **`ultracode`** anywhere in the prompt → Claude writes a workflow script instead of going turn by turn. Natural language ("use a workflow"/"run a workflow") works the same. Before v2.1.160 the literal keyword was `workflow` (too many false positives → changed).
- `/effort ultracode`: combines `xhigh` effort with *automatic* workflow orchestration for *every* substantial task in the session (more tokens, slower). Lasts until session end; revert with `/effort high`.
- Discard a mis-trigger: `Option/Alt+W`. Turn the trigger off entirely in `/config`.

## Bundled: /deep-research
- `/deep-research <question>`: fans out web searches across multiple angles, fetches sources, cross-checks them, votes per claim, delivers a cited report (unconfirmed claims filtered out). Needs the WebSearch tool.

## Approval & permissions (important — corrects fan-made)
- Before the run the CLI shows the planned phases: **Yes** / **Yes, don't ask again** / **Show raw script** (`Ctrl+G` editor, `Tab` adjust prompt) / **No**.
- When it asks, per mode: default/acceptEdits → every run (until "don't ask again"); **Auto** → only the first time, then remembered (skipped entirely under Ultracode); bypassPermissions/`claude -p`/SDK → never, starts immediately.
- ⚠️ Core correction: the subagents a workflow spawns **always run in `acceptEdits` mode** and inherit your tool allowlist — regardless of the session mode. So file edits are always auto-approved. Only shell/web/MCP tools *outside* the allowlist can still prompt mid-run.
- In practice: before a long run, add the shell/web/MCP commands you need to the allowlist (`40-config-safety.md`). "Auto Mode is mandatory" (fan-made Part 13) is overstated — what's needed is a *complete allowlist*; Auto Mode is a convenient way to get there.

## Runtime behavior & limits
- No user input during the run (only agent permission prompts can interrupt). For mid-run approval: run each phase as its own workflow.
- No direct FS/shell access from the script — the *agents* read/write/execute, the script only coordinates.
- Max **16 concurrent** agents (fewer with few CPU cores), **1000 agents total** per run.
- Model: each agent uses the session model unless the script routes a phase to a different one. Check `/model` before a big run.

## Primitives (fan-made; JS API)
- `parallel([fns])` — barrier, waits for all. `pipeline(items, ...stages)` — no barrier, items flow independently through the stages. `agent(prompt, {schema})` — subagent; `schema` forces validated JSON back.
- Default `pipeline` (wall-clock = slowest single chain). Barrier only when a stage needs *all* prior results together (dedup/merge, early-exit at 0).

## Patterns (fan-made)
classify-and-act · fan-out-and-synthesize · adversarial verification (separate skeptics try to refute) · generate-and-filter · tournament (rank pairwise) · loop-until-done (until K rounds find nothing new). Claude mixes/nests them.
Fixes three failure modes of single agents: **agentic laziness** (stops too early), **self-preferential bias** (grades its own work leniently), **goal drift** (loses fidelity to the goal). Antidotes: producer ≠ checker, deterministic loops, focused goals.

## Orchestrator base form
Top Claude → N tasks → each **implementer** → **2 independent verifiers** → **fixer**. Separating producer/checker kills self-preferential bias.

## Good use cases
Codebase audits, large migrations (500+ files), deep research with cross-checking, sorting 1000+ items (tournament), rule/memory fidelity (one verifier per rule), root cause (parallel hypotheses). Often more valuable for non-coding.
⚠️ When NOT to: normal coding tasks don't need a 5-reviewer panel — token-heavy, only for genuine need. Run on a small slice first (one directory) to estimate cost.

## Saving, inputs, managing
- `/workflows` lists runs; select one → progress view (phases, agent count, tokens, time). Keys: ↑/↓ select, Enter/→ drill down, `p` pause/resume, `x` end agent/run, `r` restart agent, `s` save.
- Saving (`s`): `.claude/workflows/` (project, shared) or `~/.claude/workflows/` (personal). On a name clash the project one wins. Runs afterward as `/<name>`.
- Inputs: a saved workflow reads global `args` (structured data, no parsing needed) — e.g. "Run /triage-issues on issues 1024, 1025".
- Resume only in the *same* session; restarting Claude Code → the run starts over.
- Disable: `/config`, `"disableWorkflows": true` in `settings.json`, or `CLAUDE_CODE_DISABLE_WORKFLOWS=1`.

## Loop taxonomy (Part 19) — what you hand off
Every loop is one of four forms; the more autonomous, the more you hand off.
| Loop | Trigger / Stop | You hand off | When |
|---|---|---|---|
| **Turn-based** (agentic loop) | Prompt / Claude thinks it's done | the *check* | short single tasks |
| **Goal-based** `/goal` | Prompt / condition met or turn cap | the *stop condition* | verifiable exit criteria |
| **Time-based** `/loop` `/schedule` | Interval / cancel or done | the *trigger* | recurring / reacting to external systems |
| **Proactive** | Event/schedule, no human | the *prompt* | recurring, well-defined streams |
Progression: check → stop condition → trigger → prompt. Not every task needs a complex loop — take the simplest one. Keep quality high (clean code, self-verify skills, a second agent to review); manage tokens (right primitive+model, clear stop criteria, pilot on a slice first, don't over-schedule).

## /goal & /loop (fan-made; supplementary)
- `/goal <condition>` — runs until the condition is true (e.g. "all tests in test/auth pass and lint clean"). "Ralph loop, built in."
- `/loop [interval] /<cmd>` — recurring, local, up to ~3 days: `/loop 5m /babysit`, `/loop 1h /pr-pruner`.
- `/schedule` & routines: cloud, unbounded; trigger cron/GitHub event/API. Preview.
- `/usage` shows token spend per skill/MCP/plugin; cap the budget in the prompt ("use 50k tokens").
Source: Part 6/8/10/12/14 — verify commands against the docs.
