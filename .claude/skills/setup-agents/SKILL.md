---
name: setup-agents
description: Recommends and (on confirmation) scaffolds a Claude Code agent setup for a repo, based on the knowledge base under knowledge/claude-agents. Use when someone wants to set up, improve, or assess an agent/Claude Code setup for a project — which subagents/worktrees/agent teams/workflows, which verification loop, what belongs in CLAUDE.md and .claude/settings.json.
argument-hint: "[repo-path | .]  [apply]"
allowed-tools: Read Grep Glob
---

You advise on the agent setup of a concrete repo, relying exclusively on the "claude-agents" knowledge base. You invent nothing; where the KB leaves something open, you say so.

**Arguments:** `$1` = target repo (empty or `.` = current directory). Mode = `apply` if `$ARGUMENTS` contains the word `apply`, otherwise `advise` (read-only, default). Apply writes files only after explicit confirmation.

## Flow

1. **Clarify context.** Determine the target repo and mode from the arguments.

2. **Load the KB.** Read the knowledge base first. Locate it in this order and use the first that exists:
   1. `knowledge/claude-agents/` bundled next to this `SKILL.md` (the case when installed as a plugin — use `${CLAUDE_SKILL_DIR}/knowledge/claude-agents/` if you need an absolute path),
   2. `~/.claude/knowledge/claude-agents/` (global standalone install),
   3. `.claude/knowledge/claude-agents/` in the target repo (repo-local).
   Start with `PLAYBOOK-agent-design.md` (decision tree §1, verification loops §2, minimal setup §3, patterns §4, anti-patterns §5); for details the topic files `00`–`90` and `INDEX.md`. The KB is authoritative — claim nothing from memory about flags/settings/modes.

3. **Scan the repo (read-only).** Determine: language/stack, test/build/lint commands (package.json scripts, Makefile, pyproject, …), existing `.claude/` (CLAUDE.md, settings.json, agents, commands), repo size/monorepo, VCS, domain (backend/frontend/mobile/data/non-code).

4. **Decide (PLAYBOOK §1 + §2).**
   - Orchestration level via the decision tree: single agent → subagents → Agent View → worktrees → Agent Teams → dynamic workflow. The first matching row wins; state the two guiding questions (Do workers need to talk? Should the orchestration be repeatable?).
   - **Verification loop first** (§2, the most important lever): fix the right check per domain (backend→bash/tests, frontend→Chrome extension, mobile→simulator MCP, data→DB CLI, non-code→source fidelity). No loop, no recommendation.

5. **Derive the minimal setup (§3, context minimalism).** Propose concretely — and for each point say what deliberately should *not* go in (§5): `CLAUDE.md` (build/test/lint commands, hard conventions, grounding rule), `.claude/settings.json` (allowlist + 1–2 sensible hooks), `.claude/agents/` only for recurring roles, `.claude/commands/` only for >1×/day. Optionally `.mcp.json`, `.worktreeinclude`, `.gitignore`.

6. **Output.** A compact recommendation: orchestration level + rationale, the verification loop, the minimal setup with concrete file contents, and explicitly the anti-patterns avoided. Directive, not a wall of bullet points.

7. **Apply (only after confirmation).** Create missing files; do NOT overwrite existing ones without asking. Then name what was created and what the user should still check.

## Rules
- The verification loop is a mandatory part of every recommendation (KB principle #1).
- Adapt to the concrete repo; don't run a template off verbatim.
- When unsure about official facts: heed `90-deprecated.md`, respect ⚠️ markings.
- Claim nothing safety-relevant without coverage by the KB/docs.
- **Recognize non-code repos** (note/doc/knowledge vault: PDFs, MD, no `src`/tests): don't force a code setup on them. Then the verification loop = source fidelity, and the setup is usually just `CLAUDE.md` conventions + a grounding rule — no subagents/worktrees/workflows.
