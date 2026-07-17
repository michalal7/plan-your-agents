# Parallelism: Subagents, Worktrees, Agent View, Agent Teams

The biggest productivity lever (`00-principles.md` #6). Four mechanisms — they combine. Workflows (a fifth, programmatic one) → `30-workflows.md`.
Authoritative source: official docs code.claude.com/docs/en/{sub-agents,agents,agent-view,agent-teams,worktrees}. Where the fan-made source diverges, the docs win.

## Choosing the mechanism (decision aid)
| Mechanism | What | When |
|---|---|---|
| **Subagents** | Workers in *one* session, own context, report only to the parent | Side/exploration work that would flood the main context; only the result matters |
| **Agent View** | A control surface for many *independent* background sessions | Several separate tasks, status at a glance |
| **Agent Teams** | Peer sessions with a *shared* task list, talking directly to each other | Work that needs discussion/disagreement/self-coordination (experimental) |
| **Worktrees** | Isolated git checkouts | Avoid file conflicts when changing things in parallel |
| **Workflows** | A script orchestrates dozens–hundreds of subagents | Scale beyond what a conversation can coordinate → `30-` |
Token cost scales with the number of parallel contexts — the more parallelism, the more expensive.

## Subagents
- Own context, own system prompt, restricted tool access, independent permissions. Delegates automatically when a task matches the `description`. Appending "use subagents" forces delegation.
- Definition: a `.md` under `.claude/agents/` (scopes: project/user/plugin/CLI). Frontmatter includes: `name`, `description`, `tools`, `model`, `isolation: worktree`, `background: true`.
- `/agents` = management panel. Default agent in `settings.json` or `--agent=<name>`.
- Foreground/background controllable (`run_in_background` / `background: true`).
- Nested subagents: agents spawn agents (context management), depth initially **depth=5**; each level its own context. Model propagates downward, thinking weights (still) don't. (fan-made, verify against the docs)

## Worktrees
- Start: `claude --worktree <name>` (short `-w`). Default location `.claude/worktrees/<name>/`, branch `worktree-<name>`. Omit the name → auto-name (e.g. `bright-running-fox`).
- Branches off the default branch (`origin/HEAD`). Set `worktree.baseRef: "head"` in `settings.json` to branch off the local HEAD (including unpushed commits).
- Branch off a PR: `claude --worktree "#1234"` → `.claude/worktrees/pr-1234`.
- In-session "work in a worktree" → the `EnterWorktree` tool.
- **Subagent isolation**: `isolation: worktree` in the frontmatter or "use worktrees for your agents". A temp worktree is auto-removed when it ends without changes.
- `.worktreeinclude` (gitignore syntax) at the root copies gitignored files (`.env` etc.) into every new worktree.
- Add `.claude/worktrees/` to `.gitignore`. First use requires running `claude` in the directory once (trust dialog).
- Non-git (SVN/P4/hg/jj): `WorktreeCreate`/`WorktreeRemove` hooks replace the git logic (then `.worktreeinclude` doesn't apply).
- The desktop app creates a worktree automatically per new session.
- ⚠️ The `--tmux` flag on the worktree (fan-made Part 4) is not confirmed in the docs — likely confused with Agent Teams split panes. Don't treat as certain.

## Agent View — managing background sessions
- Open: `claude agents` (optionally `--cwd <path>`). Needs v2.1.139+.
- Status groups: Pinned · Ready for review (open PRs) · Needs input · Working · Completed. `Ctrl+S` switches between status/directory grouping.
- New background session: `claude --bg "task"`, named `claude --bg --name "x" "task"`; from a running session `/bg <instructions>`.
- Navigation: ↑/↓ select, Space = preview, Enter/→ attach, ← detach, `Ctrl+R` rename, `Ctrl+T` pin, `Ctrl+X` stop (2× delete).
- From the shell: `claude attach|logs|stop|rm|respawn <id>`, `claude daemon status`.
- File isolation of background sessions runs via automatic worktrees.

## Agent Teams — cooperating peer sessions (experimental)
- ⚠️ **Off** by default. Enable: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` under `env` in `settings.json` (or shell env). Documented since v2.1.178.
- A **lead** (main session) coordinates; **teammates** are standalone sessions with their own context, sharing a **task list** + **mailbox** and messaging each other directly — unlike subagents, which only report to the parent.
- Start: describe it in plain language ("spawn three teammates: UX, architecture, devil's advocate"). Claude creates/coordinates; never spawns teammates without confirmation.
- Display: `in-process` (default, any terminal) or `split-panes` (needs tmux/iTerm2; not in the VS Code terminal/Windows Terminal/Ghostty). Set via `teammateMode` in `settings.json` or `--teammate-mode <auto|tmux|iterm2|in-process>`.
- Model: teammates do **not** inherit the lead's `/model` choice — set the default in `/config`. Effort is inherited (v2.1.186+).
- Plan enforcement: "require plan approval" → the teammate plans read-only, the lead approves/rejects.
- Tasks: the lead assigns or teammates claim them (file lock against races); dependencies unlock automatically.
- Quality gates via hooks: `TeammateIdle`, `TaskCreated`, `TaskCompleted` — exit code 2 sends feedback / blocks.
- Storage: `~/.claude/teams/{team}/config.json` (removed at session end), `~/.claude/tasks/{team}/` (persists, never uploaded). One team per session; no nested teams; the lead is fixed.
- Permissions: teammates start in the lead's mode; a teammate can't approve a prompt on your behalf; in Auto Mode a forwarded approval counts as *untrusted*.
- ⚠️ Limits: `/resume`+`/rewind` don't restore in-process teammates; task status can get stuck.
- Best practice: 3–5 teammates, ~5–6 tasks per teammate, each owning different files (avoid conflicts), start with research/review tasks, have it wait on teammates.

## /batch & /simplify (fan-made)
- `/batch migrate src/ from X to Y`: plan interactively, then 5–30 isolated worktree subagents, each testing before the PR. For large migrations.
- Append `/simplify` to a prompt: parallel agents check the changed code for reuse/quality/efficiency.
- `/tasks` lists running work.
Source: Part 5, Part 9 — verify command names against the current docs.
