# Knowledge base: working effectively with Claude Code & agent systems

A reference for a Claude agent that derives setup recommendations for coding projects from it. Organized by topic (not chronologically). For setup decisions, read `PLAYBOOK-agent-design.md` first.

Sources: (1) the fan-made timeline howborisusesclaudecode.com (Boris Cherny et al., Jan–Jun 2026, *not* official) — the source for practical tips; (2) the official docs code.claude.com/docs & docs.claude.com — authoritative for flags/settings/hooks/modes. On conflict, (2) wins; resolved items live in `90-deprecated.md`.

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
- **Consumer side** (outside this folder): the skill `setup-agents` (`.claude/skills/setup-agents/`, invocable as `/setup-agents [repo] [apply]`) applies this KB to a concrete repo — recommend an agent setup and (on confirmation) scaffold it. Reads `PLAYBOOK-agent-design.md` first.

## Quick reference: commands & concepts
| What | Where | File |
|---|---|---|
| Verification = 2–3× quality | decide the check before building | `00`, `50` |
| Choose a parallelism mechanism | choice table | `20` |
| Start a worktree | `claude -w <name>` / `isolation: worktree` | `20` |
| Background sessions | `claude agents`, `claude --bg` | `20` |
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
