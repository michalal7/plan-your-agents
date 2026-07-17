---
name: setup-task-agents
description: Design an agent SYSTEM that performs a repo's own goal/workload — recommend and (on confirmation) scaffold the orchestration. Use when the repo's purpose is (or could be) accomplished by agents: large migrations, data/document processing, research, triage/routing, batch generation, or any recurring task. Produces the orchestration level, the orchestrator pattern, the output verification, and workflow/command/agent stubs. For configuring Claude Code to develop the repo itself, use setup-dev-agents instead. Writes a plan to agent-task-plan.md.
argument-hint: "[repo-path | .]  [apply]"
allowed-tools: Read Grep Glob Write Edit
---

You design the **agent system that accomplishes the repo's own goal** — the workload the repo
exists to perform — not the dev-time Claude Code config. You rely exclusively on the
"claude-agents" knowledge base and invent nothing; where the KB leaves something open, you say so.

This is the **execution/workload** lens. The sibling skill `setup-dev-agents` covers the other
intent — configuring Claude Code to build and maintain the repo. If the request is really about
the dev workflow rather than the repo's task, hand off to it.

First read the shared machinery: **`_shared/agent-analysis.md`** (sibling of this skill's base
directory — `<skill-base-dir>/../_shared/agent-analysis.md`). It defines KB location, mode
logic (advise/apply), the repo scan, and how to write the plan file. Below is only the
task-specific lens.

## Flow
1. **Context & KB.** Per `_shared` §1–2: resolve target + mode, load the KB (start with
   `PLAYBOOK-agent-design.md`; lean on §1, §4, `20-parallelism.md`, `30-workflows.md`).
2. **Characterize the workload.** Beyond the common scan (`_shared` §3), determine what the
   repo is *for* and the shape of its task: one-off vs recurring, volume/scale, homogeneous vs
   heterogeneous input, any existing pipeline/command/workflow that already does it, and what a
   correct output looks like.
3. **Decide the orchestration (PLAYBOOK §1).** Walk the decision tree top-to-bottom, first
   match wins: single agent → subagents → Agent View → worktrees → Agent Teams → dynamic
   workflow. State the two guiding questions explicitly:
   - Do the workers need to talk to each other? (yes → Teams; no → subagents/workflow)
   - Should the orchestration be repeatable/scriptable? (yes → workflow)
   Fan-out sweet spot is 3–5 parallel units; more brings diminishing returns at linear cost.
4. **Pick the orchestrator pattern (PLAYBOOK §4)** that fits the workload: classify-and-act,
   fan-out-and-synthesize, adversarial verification, generate-and-filter, tournament,
   loop-until-done, or the base form (top → implementer → 2 verifiers → fixer). One, justified.
5. **Output verification (PLAYBOOK §2, mandatory).** Fix how the task's *output* is checked —
   producer ≠ checker; for high assurance, separate verifiers that try to refute. No verification
   means, no recommendation.
6. **Concrete artifacts.** Propose the actual scaffolding the system needs — a `/command` or
   skill for a recurring task, `.claude/agents/` worker roles (terse frontmatter; `description`
   drives delegation; `isolation: worktree` when they touch files), an optional
   `~/.claude/workflows/<name>` for a repeatable dynamic workflow, `.mcp.json` if the task needs
   external tools. For each, say what deliberately should *not* be built (§5): no Team/workflow
   for routine work, no parallelism without isolation.
7. **Write the plan** to `agent-task-plan.md` per `_shared` §4, then summarize in chat.
8. **Apply (only after confirmation, apply mode).** Create the stubs; never overwrite without
   asking. Then name what was created and what the user should still check.

## Rules
See `_shared` §5. Additionally: default to the **leanest** orchestration that fits (§5) — a
single agent + a verification loop beats a 5-agent panel for routine work. Reserve Teams for
workers that must genuinely disagree/coordinate, and dynamic workflows for repeatable
orchestration with built-in cross-checking.
