# plan-your-agents

> Plan and scaffold a Claude Code **agent setup** for any project — a distilled knowledge base plus a `/setup-agents` skill that reads it and recommends (or builds) the right setup for your repo.

Point the skill at a project and it tells you: single agent, subagents, worktrees, agent teams, or a dynamic workflow? Which verification loop fits your domain? What belongs in `CLAUDE.md` and `.claude/settings.json` — and what deliberately does not. In `apply` mode it scaffolds those files for you.

## What's inside

- **`.claude/skills/setup-agents/`** — the skill (invocable as `/setup-agents`, also auto-triggers on intent).
- **`.claude/knowledge/claude-agents/`** — the knowledge base it reads: `INDEX.md`, the decision-oriented `PLAYBOOK-agent-design.md`, and topic files `00`–`90` (principles, context/memory, parallelism, workflows, config/safety, verification, models, deprecated).
- **`.claude/commands/kb-update.md`** + **`.claude/agents/kb-fetcher.md`, `kb-verifier.md`** — the *curator* that keeps the knowledge base current from source.
- **`mcp-server/`** — an *additive* MCP server that exposes the same knowledge base to any MCP client (Cursor, Windsurf, other agents) with semantic search. See below.
- **`RUNBOOK.md`** — step-by-step for running everything locally.

The knowledge is distilled from Boris Cherny's public Claude Code tips and cross-checked against the official docs (see Credits).

## Install

```bash
git clone https://github.com/michalal7/plan-your-agents
cd plan-your-agents
```

Skills and knowledge are just files — no build step. Copy both the skill **and** the knowledge base into your user-level `~/.claude/` so `/setup-agents` works in every project:

**Windows (PowerShell)** — or just run `./install.ps1`:
```powershell
Copy-Item -Recurse -Force ".claude\skills\setup-agents"     "$HOME\.claude\skills\setup-agents"
Copy-Item -Recurse -Force ".claude\knowledge\claude-agents" "$HOME\.claude\knowledge\claude-agents"
```

**macOS / Linux:**
```bash
mkdir -p ~/.claude/skills ~/.claude/knowledge
cp -R .claude/skills/setup-agents     ~/.claude/skills/
cp -R .claude/knowledge/claude-agents ~/.claude/knowledge/
```

The skill reads the knowledge base from `~/.claude/knowledge/claude-agents/` (or a repo-local `.claude/knowledge/claude-agents/` if present).

## Use

In the project you want to set up:
```bash
cd path/to/your/project
claude            # accept the workspace-trust prompt once
```
then:
```
/setup-agents .            # advise only (read-only)
/setup-agents . apply      # scaffold the files, after you confirm
/setup-agents ../other-repo
```
`/setup-agents` is a slash command, but plain language works too — e.g. “set up the agent system for this repo” — because the skill auto-triggers on intent.

> Note: the repo is named **plan-your-agents**; the command is **`/setup-agents`**. The command name comes from the skill's folder, not the repo.

## MCP server — same knowledge base, any client

The `/setup-agents` skill is the Claude-native path. For **other MCP clients** (Cursor,
Windsurf, custom agents), `mcp-server/` serves the *same* knowledge base — no fork, the
markdown files stay the single source of truth — with:

- **Resources** — the KB files as `kb://claude-agents/<file>.md`, read live from disk.
- **Tool `search_knowledge(query)`** — semantic search (local multilingual embeddings, no API key).
- **Prompt `setup-agents`** — mirrors the PLAYBOOK flow for prompt-capable clients.

Transports: **stdio** (local) and **streamable HTTP** (hosting). Quick start:

```bash
cd mcp-server
npm install
npm run build:index     # embed the KB → data/index.json (downloads the model once)
npm test                # offline
npm run start:stdio     # or: PORT=3000 npm run start:http
```

Full docs, `.mcp.json` examples for Claude Code / Cursor / Windsurf, and the verification
steps live in [`mcp-server/README.md`](mcp-server/README.md).

## Keeping the knowledge base current

Run `/kb-update` (curator) to refresh the KB from its sources incrementally; `/kb-update full` rebuilds. See `.claude/knowledge/claude-agents/MAINTENANCE.md`.

## Suggested GitHub topics

`claude` · `claude-code` · `claude-skill` · `ai-agents` · `agentic-coding` · `developer-tools` · `llm`

## Language

The knowledge base, the skill, and the MCP prompt are in **English**. (An earlier revision was in German — it remains in the git history.)

## Credits & disclaimer

Primary source: the fan-made collection *How Boris Uses Claude Code* (Boris Cherny et al.), cross-checked against the official docs at code.claude.com/docs and docs.claude.com. **Not affiliated with Anthropic.**
