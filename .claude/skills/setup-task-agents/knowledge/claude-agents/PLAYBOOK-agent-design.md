# PLAYBOOK: agent setup for a new project

Purpose: "I'm starting project X — what agent setup does it need?" This document decides, it doesn't just describe. Evidence lives in the topic files; here only the decision + the pointer.

---

## 1. Decision tree: single agent vs. subagents vs. teams vs. workflow
Go top to bottom, take the first matching row.

1. **Trivial/sequential task, one context is enough** → *single agent*, no special setup. (The overhead never pays off for linear work.)
2. **Side/exploration work would flood the main context, only the result matters** → *subagent(s)* (`.claude/agents/`, "use subagents"). No inter-agent talk needed.
3. **Several independent tasks in parallel, you want to watch them** → *Agent View* (`claude agents`, background sessions), optionally + worktrees.
4. **Parallel file changes that would otherwise collide** → *worktrees* (`-w` or `isolation: worktree` on the subagent).
5. **Workers must exchange findings / disagree / self-coordinate** → *Agent Teams* (experimental, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`). Typical: debugging with competing hypotheses, multi-perspective review.
6. **More agents than a conversation can coordinate, OR repeatable orchestration with built-in cross-checking** → *dynamic workflow* (`ultracode`/"use a workflow"). Typical: 500-file migration, codebase audit, deep research, sorting 1000+.

Two questions that settle most cases:
- *Do the workers need to talk to each other?* Yes → teams. No → subagents/workflow.
- *Should the orchestration be repeatable/scriptable?* Yes → workflow. No → subagents/teams.
Rule of thumb for team/workflow fan-out: 3–5 parallel units are usually the sweet spot; more brings diminishing returns and linear token cost.

Details: `20-parallelism.md`, `30-workflows.md`.

---

## 1b. Which extension mechanism? Order by context cost
There are four, and they are not interchangeable — they sit at different points on a **context-cost curve**, which is the reason there are four rather than one general API. Cheapest first; take the cheapest that does the job:

| Mechanism | Resident context cost | Use it for |
|---|---|---|
| **Hook** | **Zero** until it fires | Cross-cutting policy and automation: gates, formatting, logging, stop conditions |
| **Skill** | Only the frontmatter `description` | Shaping *how the agent works* — procedures, checklists, house style |
| **Plugin** | A packaging layer, not a runtime primitive | Distributing a bundle of the other three |
| **MCP server** | **Highest — tool schemas are loaded and stay loaded** | Genuinely new callable tools reaching an external system |

- **The MCP cost is paid every request, whether or not the tool is used.** That makes "just add an MCP server" the most expensive reflex in agent setup. Reach for it only when you actually need a new callable tool.
- **A skill's `description` is the only part you pay for continuously** — the body loads on invocation. So keep descriptions short and high-signal, and put the detail in the body. (Matches the doc-backed skill limits in `10-context-memory.md`.)
- **"Should this be a plugin?" is a distribution question**, separate from which mechanism provides the capability. A plugin can bundle all of the above.
- **Subagents are not on this list on purpose.** They do not extend the current context — they open a *new, isolated* one. Reason about them as independent workers (§1 above), not as a capability you bolt on.
(third-party source analysis, v2.1.88 — the ordering is a design rationale that survives version drift; the per-mechanism API details in that source do not.)

---

## 2. Verification loop per project type (the most important lever)
Fix the loop first, then everything else — without a verification means the model guesses (`00-principles.md` #1, `50-verification.md`).

- **Backend/API/CLI** → unit/integration tests via bash; `docker logs`. Automate as a `Stop` hook or `/goal "tests pass && lint clean"`.
- **Frontend/Web** → Chrome extension (E2E in a real browser; more reliable/token-efficient than Playwright). The desktop app can auto-start/test the web server.
- **Mobile** → simulator MCP (screenshot/interaction).
- **Data/Analytics** → DB CLI/MCP (`bq` etc.); check the result against the expected metric.
- **Research/Decisions** → cross-check by *separate* agents (`/deep-research`, adversarial verification).
- **Migration/Refactor** → tests green *before* the PR, per worktree (`/batch`).
- **Non-code (note/doc/knowledge vault)** → the verification means is source fidelity: bind statements to the source PDF/script, check consistency across files. No build/test loop; the setup is usually just `CLAUDE.md` conventions + a grounding rule, no agent infrastructure.

Always: producer ≠ checker. For high assurance, multiple verifiers that try to *refute*.

---

## 3. Standard setup for a new repo (minimal)
Deliberately start lean (context minimalism, `00-principles.md` #2). Add when a concrete need shows up — not preemptively.

**`CLAUDE.md` (repo root)** — the most important thing. In:
- How to build/test/lint (the verification commands).
- Hard project conventions Claude would otherwise guess wrong (e.g. "use `bun`, not `npm`").
- Corrections that come out of mistakes (keep adding, `00-principles.md` #3).
- *Not* in: general best practices, long-winded architecture prose, things Claude can see from the code itself. Keep it short — every line must influence a decision.

**`.claude/settings.json`** — only what the team should share:
- `permissions.allow` for safe, frequent commands (build/test/lint/format) so prompts don't nag.
- 1–2 `hooks` worth having: `PostToolUse` auto-format (`Write|Edit`), optionally `Stop`/`SubagentStop` as a done-check.
- `env`/`model` only when genuinely needed. Private → `settings.local.json`.
- *Not*: over-broadening permissions (`bypassPermissions` globally), hooks for cases that never occur.

**`.claude/agents/`** — only recurring worker roles (e.g. code-reviewer, test-runner, build-validator). Frontmatter terse: `name`, `description` (drives auto-delegation!), `tools` (only what's needed), `model`, optionally `isolation: worktree`. *Not*: an agent per one-off task.

**`.claude/commands/`** — only what's used >1×/day (`00-principles.md`, the 10s file). A slash command may contain inline bash to precompute. *Not*: every prompt variant as a command.

Optional per project: `.mcp.json` (Slack/DB/Sentry, if used), `.worktreeinclude` (when `.env` is needed in worktrees), `.claude/worktrees/` in `.gitignore`, skills for recurring multi-step flows.

---

## 4. Orchestrator patterns — one sentence "when it fits" each
- **classify-and-act** — sort inputs first, then act per class: for heterogeneous input (issue triage, routing).
- **fan-out-and-synthesize** — spread wide, then merge: research, multi-file analysis.
- **adversarial verification** — separate skeptics refute every claim: when correctness beats speed.
- **generate-and-filter** — produce a lot, filter strictly: ideation, candidate search.
- **tournament** — compare/rank pairwise: sorting 1000+ items, picking "best of N".
- **loop-until-done** — until K rounds bring nothing new: exhaustive bug/edge-case hunting.
- **orchestrator base form** — top → implementer → 2 verifiers → fixer: the default for "build + reliably assure".

---

## 4b. If you build your own harness: decouple the brain from the hands
Relevant once agents run longer than a session and you're writing the scaffolding yourself. Anthropic's Managed Agents service is built on three separations worth copying regardless of whether you use the hosted product:
- **Brain (model + harness loop) vs. hands (sandbox + tools).** Tying a harness to one long-lived container makes that container a pet: fragile, irreplaceable. Keep the harness *stateless* so any brain can attach to any sandbox, either side can fail and be replaced, and sandboxes stay disposable.
- **Session vs. context window.** Store the session as a durable, append-only event log *outside* the model's context. Then the harness can retrieve selectively and transform before passing anything in — instead of making irreversible context decisions as it goes.
- **Provision lazily.** Spin a sandbox up when a tool call actually needs one; a session that starts with reasoning shouldn't wait on container setup. Reported effect: p50 time-to-first-token down ~60%, p95 down >90%.
- **Credentials must be unreachable from the sandbox where generated code runs.** Two workable patterns: bundle a scoped token at initialization (e.g. for git), or keep credentials in a vault and relay calls through an MCP proxy holding the session's tokens. Never hand the sandbox the secret itself.
⚠️ The source is an architecture narrative — it publishes no pricing, quotas, concurrency caps or a managed-vs-local decision matrix. Hosted service: `platform.claude.com/docs/en/managed-agents/overview` (beta, requires the `managed-agents-2026-04-01` header).
Source: anthropic.com/engineering/managed-agents (2026-04-08).

---

## 5. Anti-patterns / when you DON'T need it
- **Workflow/team for routine coding.** A 5-reviewer panel for a bugfix is token waste. First a single agent + verification loop.
- **Parallelism without isolation.** Multiple agents editing the same file → overwrites. Worktrees or disjoint file sets.
- **Forced Plan Mode as a first step.** Unnecessary on Opus 4.6+; Auto Mode + a good brief is enough (`90-deprecated.md`).
- **Bloated CLAUDE.md.** Long prose dilutes the signal and eats context. Short, correction-driven.
- **Globally defeating permissions** (`bypassPermissions` everywhere) instead of allowing safe things specifically.
- **Re-prompting instead of writing down.** Recurring mistakes belong in CLAUDE.md/skill/rule, not in the next chat aside.
- **Teammates/subagents without a separate verifier.** Self-assessment is lenient — always hand checking to other agents.
- **Missing feedback loop.** The most expensive anti-pattern: building without a verification means. Always settle section 2 first.
- **Adding agents to a task that doesn't decompose.** If parallel agents keep converging on the same blocking bug and overwriting each other, the answer is a better split (an oracle, a bisect, disjoint file sets), not more agents (`20-parallelism.md`).
- **Scaffolding that outlives its reason.** Harness constructs built around a model's weakness become dead weight once the model improves — re-check them on every upgrade instead of inheriting them (`30-workflows.md`).

---
For evidence/details follow the respective topic file. This guide is a template — adapt to project X, don't run it off verbatim.
