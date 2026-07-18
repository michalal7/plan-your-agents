# plan-your-agents

> Plan and scaffold a Claude Code **agent setup** for any project — a distilled knowledge base plus two skills (`/setup-dev-agents`, `/setup-task-agents`) that read it and recommend (or build) the right setup for your repo, each writing a markdown plan.

Point a skill at a project and it tells you: single agent, subagents, worktrees, agent teams, or a dynamic workflow? Which verification loop fits your domain? What belongs in `CLAUDE.md` and `.claude/settings.json` — and what deliberately does not. Each run writes its analysis as a markdown **plan** file, and in `apply` mode it scaffolds the files for you.

Two skills, two intents:
- **`/setup-dev-agents`** — optimize *developing* the repo: the Claude Code config (verification loop for the dev cycle, subagent roles, `CLAUDE.md`, `.claude/settings.json`). Plan → `agent-dev-plan.md`.
- **`/setup-task-agents`** — design an agent *system that performs the repo's own workload* (migrations, data/doc processing, research, triage, batch jobs): orchestration level, orchestrator pattern, output verification, and workflow/command/agent stubs. Plan → `agent-task-plan.md`.

## What's inside

- **`.claude/skills/setup-dev-agents/`, `.claude/skills/setup-task-agents/`** — the two skills (each invocable as `/<name>`, also auto-trigger on intent); shared analysis machinery in `.claude/skills/_shared/`.
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

Skills and knowledge are just files — no build step. Copy both skills **and** the knowledge base into your user-level `~/.claude/` so the commands work in every project:

**Windows (PowerShell)** — or just run `./install.ps1`:
```powershell
Copy-Item -Recurse -Force ".claude\skills\setup-dev-agents"  "$HOME\.claude\skills\setup-dev-agents"
Copy-Item -Recurse -Force ".claude\skills\setup-task-agents" "$HOME\.claude\skills\setup-task-agents"
Copy-Item -Recurse -Force ".claude\skills\_shared"           "$HOME\.claude\skills\_shared"
Copy-Item -Recurse -Force ".claude\knowledge\claude-agents"  "$HOME\.claude\knowledge\claude-agents"
```

**macOS / Linux:**
```bash
mkdir -p ~/.claude/skills ~/.claude/knowledge
cp -R .claude/skills/setup-dev-agents  ~/.claude/skills/
cp -R .claude/skills/setup-task-agents ~/.claude/skills/
cp -R .claude/skills/_shared           ~/.claude/skills/
cp -R .claude/knowledge/claude-agents  ~/.claude/knowledge/
```

The skills read the knowledge base from `~/.claude/knowledge/claude-agents/` (or a repo-local `.claude/knowledge/claude-agents/` if present).

## Install as a plugin (recommended — versioned updates)

Packaged as a Claude Code plugin, so users install once and update with `/plugin update`
instead of re-copying files. This repo is its own marketplace.

```text
/plugin marketplace add michalal7/plan-your-agents
/plugin install plan-your-agents@michalal7
```
Then the skills are available (namespaced) as `/plan-your-agents:setup-dev-agents` and
`/plan-your-agents:setup-task-agents`.

The knowledge base travels with the plugin (bundled into each skill as a generated mirror of
`.claude/knowledge/claude-agents/`), so there's nothing else to install. Updates ship when the
`version` in `.claude-plugin/plugin.json` is bumped.

The plugin also ships the **MCP server** (config key `claude-agents-kb`; it reports itself as
`claude-agents-kb-lexical` at runtime): the KB as resources plus a `search_knowledge` tool. It's
a single self-contained ~720 KB file using keyword (BM25) search — no dependency install, no
model download. Phrase queries in English on this path; BM25 is not cross-lingual.

## Use

In the project you want to set up:
```bash
cd path/to/your/project
claude            # accept the workspace-trust prompt once
```
then pick the intent:
```
/setup-dev-agents .          # optimize developing this repo  → agent-dev-plan.md
/setup-task-agents .         # design an agent system for the repo's workload → agent-task-plan.md
/setup-dev-agents . apply    # also scaffold the files, after you confirm
/setup-task-agents ../other-repo
```
Both are slash commands, but plain language works too — e.g. “set up the agent system for developing this repo” — because the skills auto-trigger on intent. Each writes its analysis to a plan file in the target repo's root (advise is read-only otherwise; `apply` additionally scaffolds).

> Note: the repo is named **plan-your-agents**; the commands are **`/setup-dev-agents`** and **`/setup-task-agents`**. Command names come from the skill folders, not the repo.

## MCP server — same knowledge base, any client

The `/setup-dev-agents` and `/setup-task-agents` skills are the Claude-native path. For **other MCP clients** (Cursor,
Windsurf, custom agents), `mcp-server/` serves the *same* knowledge base — no fork, the
markdown files stay the single source of truth — with:

- **Resources** — the KB files as `kb://claude-agents/<file>.md`, read live from disk.
- **Tool `search_knowledge(query)`** — semantic search (local multilingual embeddings, no API key).
- **Prompt `setup-agents`** — mirrors the PLAYBOOK flow for prompt-capable clients.

> **This is the same server as the one in the plugin, built two ways.** Identical resources, tool
> name, output shape and prompt — only retrieval differs: the standalone build searches
> *semantically* (needs `npm install` + a ~1.4 GB model, queries in any language), the
> plugin build searches *lexically* with BM25 (one file, nothing to install, English queries).
> Side-by-side comparison: [Two deployment paths, one MCP contract](mcp-server/README.md#two-deployment-paths-one-mcp-contract).

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
