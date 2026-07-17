---
name: setup-dev-agents
description: Optimize DEVELOPING a repo with Claude Code — recommend and (on confirmation) scaffold the dev-side agent setup. Use when someone wants to set up / improve / assess how they build and maintain a project with Claude Code: the verification loop for the dev cycle, which subagent roles (reviewer/test-runner), what belongs in CLAUDE.md and .claude/settings.json. For designing an agent system that performs the repo's own workload, use setup-task-agents instead. Writes a plan to agent-dev-plan.md.
argument-hint: "[repo-path | .]  [apply]"
allowed-tools: Read Grep Glob Write Edit
---

You advise on the **development-side** agent setup of a concrete repo: how to configure Claude
Code so a developer builds and maintains *this* repo efficiently. You rely exclusively on the
"claude-agents" knowledge base and invent nothing; where the KB leaves something open, you say so.

This is the **dev-experience** lens. The sibling skill `setup-task-agents` covers the other
intent — designing an agent system that accomplishes the repo's *own goal/workload*. If the
request is really about the repo's product/task rather than the dev workflow, hand off to it.

First read the shared machinery: **`_shared/agent-analysis.md`** (sibling of this skill's base
directory — `<skill-base-dir>/../_shared/agent-analysis.md`). It defines KB location, mode
logic (advise/apply), the repo scan, and how to write the plan file. Below is only the
dev-specific lens.

## Flow
1. **Context & KB.** Per `_shared` §1–2: resolve target + mode, load the KB (start with
   `PLAYBOOK-agent-design.md`).
2. **Scan (read-only).** Per `_shared` §3, with the dev focus: test/build/lint commands,
   existing `.claude/` config, domain, monorepo/size.
3. **Decide the dev setup:**
   - **Verification loop first** (PLAYBOOK §2, the most important lever): fix the right check
     for the dev cycle per domain (backend→bash/tests, frontend→Chrome extension,
     mobile→simulator MCP, data→DB CLI, non-code→source fidelity). No loop, no recommendation.
   - **Recurring worker roles only** (PLAYBOOK §3): does this repo warrant a code-reviewer /
     test-runner / build-validator subagent, or is a single agent + the loop enough? Don't add
     roles for one-off tasks.
4. **Minimal setup** (PLAYBOOK §3, context minimalism) — propose concretely, and for each say
   what deliberately should *not* go in (§5): `CLAUDE.md` (build/test/lint commands, hard
   conventions, corrections-from-mistakes, grounding rule), `.claude/settings.json` (allowlist
   + 1–2 sensible hooks), `.claude/agents/` (recurring roles only), `.claude/commands/` (only
   >1×/day). Optionally `.mcp.json`, `.worktreeinclude`, `.gitignore`.
5. **Write the plan** to `agent-dev-plan.md` per `_shared` §4, then summarize in chat.
6. **Apply (only after confirmation, apply mode).** Create missing files; never overwrite
   without asking. Then name what was created and what the user should still check.

## Rules
See `_shared` §5. Additionally: **recognize non-code repos** (note/doc/knowledge vault: PDFs,
MD, no `src`/tests) — don't force a code setup on them; the loop is source fidelity and the
setup is usually just `CLAUDE.md` conventions + a grounding rule, no subagents/worktrees.
