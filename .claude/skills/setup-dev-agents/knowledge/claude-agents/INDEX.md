# Knowledge base: working effectively with Claude Code & agent systems

A reference for a Claude agent that derives setup recommendations for coding projects from it. Organized by topic (not chronologically). For setup decisions, read `PLAYBOOK-agent-design.md` first.

**Sources, in rank order.** On conflict the higher rank wins; resolved items live in `90-deprecated.md`.
1. **Official docs** — code.claude.com/docs & platform.claude.com. Authoritative for every flag, setting, hook, mode, model ID and limit. Nothing else ever is.
2. **Dated Anthropic engineering/research posts** — authoritative for measured findings and architecture they describe.
3. **Fan-made** — the timeline howborisusesclaudecode.com (Boris Cherny et al.), the Willison guide, the blakecrosley guides. Good for practice and framing; every safety- or API-relevant claim goes through doc verification first. Marked "(fan-made)".
4. **Third-party source analysis** (`literature`) — e.g. arXiv 2604.14228 on v2.1.88. Usable *only* for design rationale, and only after checking the docs do not cover it better; presumed stale on every concrete surface. Marked "(third-party source analysis, \<version\>)".
5. **Context only** — never evidence for a claim.

Full provenance, per-source state and update behaviour: `_state.json`.

## Files
- **`00-principles.md`** — the few core principles: verification as the #1 lever, context minimalism, write mistakes down instead of re-prompting, delegation over instruction, a complete brief (Goal/Constraints/Acceptance), parallelism, knowledge as infrastructure.
- **`10-context-memory.md`** — CLAUDE.md, skills/commands, memory (`/memory`, preview), `/compact` vs. `/clear`, the auto-compact threshold, `/rewind`.
- **`20-parallelism.md`** — the four parallelism mechanisms with a choice table: subagents, worktrees, Agent View (background sessions), Agent Teams (cooperating, experimental); plus `/batch`, `/simplify`.
- **`30-workflows.md`** — dynamic workflows: trigger (`ultracode`), primitives (parallel/pipeline), approval/permissions, limits, patterns, `/goal`/`/loop`/`/schedule`, token budgets.
- **`40-config-safety.md`** — `settings.json` keys, permissions & modes, Auto Mode, hooks (events + structure), sandbox, effort, MCP.
- **`50-verification.md`** — the feedback loop per domain (backend/frontend/mobile/data/research/migration) and how to automate it.
- **`60-models.md`** — effort levels (low→max), version history Opus 4.5–4.8, uncertainties (Fable 5) marked.
- **`90-deprecated.md`** — outdated advice + doc divergences, each with a rationale.
- **`PLAYBOOK-agent-design.md`** — the product: decision tree, verification loops, minimal repo setup, orchestrator patterns, anti-patterns.
- **`CHANGELOG.md`** / **`_state.json`** — run history and the source state seen (for incremental updates).
- **`MAINTENANCE.md`** — operations/upkeep: how the KB is maintained (meta, not domain knowledge). The curator runs as `/kb-update` with the subagents `kb-fetcher` (fetch in parallel) and `kb-verifier` (check adversarially against the docs) under `.claude/commands/` and `.claude/agents/`.
- **Consumer side** (outside this folder): two skills apply this KB to a concrete repo, each invocable as `/<name> [repo] [apply]` and each writing a markdown plan — `setup-dev-agents` (optimize *developing* the repo) and `setup-task-agents` (design an agent system for the repo's *own workload*). Shared machinery in `.claude/skills/_shared/`. Both read `PLAYBOOK-agent-design.md` first.

## Quick reference: commands & concepts
| What | Where | File |
|---|---|---|
| Verification = 2–3× quality | decide the check before building | `00`, `50` |
| Choose a parallelism mechanism | choice table | `20` |
| Start a worktree | `claude -w <name>` / `isolation: worktree` | `20` |
| Background sessions | `claude agents`, `claude --bg` | `20` |
| Fork the conversation | `/subtask` (≠ `/fork`); skill `context: fork` | `20` |
| Resume a subagent | `SendMessage` (not Explore/Plan) | `20` |
| Enable Agent Teams | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | `20` |
| Trigger a workflow | `ultracode` / "use a workflow" | `30` |
| Deep research | `/deep-research <question>` | `30` |
| Run until a condition | `/goal <cond>`; `/loop`, `/schedule` | `30` |
| Permissions/modes | `/permissions`; plan/acceptEdits/bypassPermissions/default/auto | `40` |
| Auto Mode | `claude --enable-auto-mode` / shift+tab | `40` |
| Hook events & structure | `settings.json` → `hooks` | `40` |
| Effort | `/effort` low→medium→high→xhigh→max (`max` session only) | `40`, `60` |
| Manage context | `/compact` vs. `/clear`, `/rewind` | `10` |
| Setup decision | decision tree | `PLAYBOOK` |

Convention in the files: ⚠️ marks uncertain/to-be-checked-against-docs items; "(fan-made)" marks the non-official; "(verified)" = checked against the official docs.

The `verified` ledger in `_state.json` is **not** an inventory of every verified line — it records only the *contested* claims a run had to settle (confirmed corrections and refuted assertions), so it stays short and reviewable. A "(verified)" marker on a section therefore means "checked during the run dated in that ledger", not "each line has its own ledger entry".
