# Changelog

## 2026-07-18 — Provenance wording + LF normalization (0.3.1)
Clarified in `INDEX.md` that the `verified` ledger in `_state.json` records only *contested* claims a run had to settle, not every verified line — a "(verified)" section marker means "checked during the run dated in that ledger". Without that, the marker promised a traceability the 6-entry ledger cannot provide. Marked the `/sandbox` Windows claim with ⚠️ (fan-made, unverified) instead of carrying "verify" in prose. Normalized the three `INDEX.md` files to LF on disk: `.gitattributes` makes every *fresh* checkout LF, but this working copy predated it and still held CRLF, so `kbHash` — which hashes bytes from disk — differed between checkouts. Version bumped because the KB mirrors are shipped content.

## 2026-07-18 — MCP server ships with the plugin (lexical/BM25)
The plugin now carries the MCP server itself, so plugin users get the KB as resources + `search_knowledge` with no dependency install and no model download. Retrieval on that path is **lexical (BM25)**, not semantic: embeddings would have pulled ~925 MB of dependencies plus a ~465 MB model into a plugin whose KB is ~200 KB; the shipped bundle is ~720 KB with no dependencies. The BM25 index is built in memory from the live KB at startup, so it cannot go stale. Both paths keep an identical MCP surface (same resources, tool name, output shape, prompt) and differ only in `serverInfo.name` (`claude-agents-kb` vs `claude-agents-kb-lexical`). The standalone semantic path (`stdio`/`http`) is unchanged. Wiring is via `.mcp.json` at the plugin root — the `mcpServers` field in `plugin.json` does **not** register (verified both inline and as a path). New committed artifact `mcp-server/bundle/plugin-server.mjs`, guarded from day one by `check:bundle` + `smoke:bundle` in CI and the pre-commit hook. Plugin bumped to 0.3.0.

## 2026-07-17 — Consumer split into two skills + plan output
Split `setup-agents` into **`setup-dev-agents`** (optimize *developing* the repo — Claude Code config) and **`setup-task-agents`** (design an agent system for the repo's *own workload* — orchestration + pattern + verification). Shared machinery factored into `.claude/skills/_shared/agent-analysis.md`. Both now write a markdown plan to the target repo root (`agent-dev-plan.md` / `agent-task-plan.md`) in advise mode; `apply` also scaffolds. `sync-plugin-kb.mjs` now fans the generated KB mirror into both skills. Plugin bumped to 0.2.0. Updated `INDEX.md`/`MAINTENANCE.md`/`README`/`RUNBOOK`/`install.ps1`. (MCP prompt id `setup-agents` unchanged.)

## 2026-07-17 — Consumer renamed: /setup-agents
Skill `agent-setup-advisor` → **`setup-agents`** (invocable as `/setup-agents [repo] [apply]`). Removed the redundant `kb-advise` command (skills are invocable as `/name` themselves). Made the KB path global-capable (`~/.claude/knowledge/...` or repo-local). Added args handling in the skill. Updated references in `INDEX.md`/`MAINTENANCE.md`/`RUNBOOK.md`.

## 2026-07-17 — Parts 17–21 fetched via browser (source complete)
Fetched the JS-rendered parts 17–21 via the Chrome extension (URL hash `#part-N/M` + `get_page_text`, via browser_batch). The fan-made source is now complete (parts 1–21). Worked in:
- **Fable 5** (Part 17): replaces Opus 4.8 as the coding default; specs `claude-fable-5`, 1M/128K, $10/$50, adaptive thinking, cutoff Jan 2026; safety classifier "trigger-happy" (`60-models.md`, `90-deprecated.md`).
- **Plan for your unknowns** (Part 18): new principle #8 with a toolkit (blindspot pass, interview, source-code reference, implementation-notes, quiz) (`00-principles.md`).
- **Loop taxonomy** (Part 19): turn/goal/time/proactive + a "what you hand off" table (`30-workflows.md`).
- **/checkup** (Part 20): setup-hygiene command (`40-config-safety.md`).
- **Automation as the meta-lever / knowledge as infra** (Part 21): #7 expanded (fleet multiplier, fix→code, REVIEW.md, "a rejected PR = a failure of automation") (`00-principles.md`).
`_state.json`: parts 17–21 to `full`.

## 2026-07-17 — Recommendation added: auto-compact threshold 40%
Set `CLAUDE_CODE_AUTO_COMPACT_WINDOW` to ~40% of the window (1M → `=400000`) to stay below the context-rot zone (`10-context-memory.md`). User directive.

## 2026-07-17 — Verification run (dogfooding the kb-verifier)
**Checked:** open doc items via a separate verifier subagent against the official docs.
**Corrected (the verifier found two of the KB's own errors):**
- `CLAUDE_CODE_AUTO_COMPACT_WINDOW` does exist after all (default ~967k) — "unconfirmed" marking lifted (`10`).
- `dontAsk` is a **valid** permission mode — the earlier deprecation was wrong, corrected (`40`, `90`).
- `fable` is an official alias = Claude Fable 5 → no longer speculative (`60`).
- Effort persistence clarified (`low/medium/high/xhigh` persistent, `max` session-only; `effortLevel` setting only up to `xhigh`) (`40`, `60`).
- Added verified model aliases/IDs; `inherit` is not an alias (`60`).
**Confirmed false:** `--tmux` on the worktree doesn't exist (belongs to Agent Teams) (`90`).
**Open:** parts 17–21 (JS-rendered) — needs a browser; the extension wasn't connected.

## 2026-07-17 — Curator workflow optimized (self-update)
**New:** the maintenance flow is now codified instead of prompt-based. Created: `.claude/commands/kb-update.md` (slash command `/kb-update`), `.claude/agents/kb-fetcher.md` (parallel, structured fetching per source), `.claude/agents/kb-verifier.md` (separate, adversarial doc verification), `MAINTENANCE.md` (operating flow + environment pitfalls).
**Why:** applying the KB's own principles to the curator itself — delegation/fan-out instead of sequential in the main context, producer≠checker, context minimalism. Command/agent frontmatter verified against code.claude.com/docs (sub-agents, commands).

## 2026-07-17 — First run (full build)
**New:** built the complete knowledge base — `INDEX.md`, `00-principles.md`, `10-context-memory.md`, `20-parallelism.md`, `30-workflows.md`, `40-config-safety.md`, `50-verification.md`, `60-models.md`, `90-deprecated.md`, `PLAYBOOK-agent-design.md`, `CHANGELOG.md`, `_state.json`.

**Sources processed:**
- Primary (fan-made): howborisusesclaudecode.com — 21 parts. Parts 1–16 fully extracted; parts 17–21 only at the topic/title level (detail not fetchable from the source) → marked low-confidence.
- Secondary (authoritative, added on user request): official docs code.claude.com/docs on sub-agents, agents, agent-view, agent-teams, workflows, worktrees. Plus hooks & settings for cross-checking.

**Contradictions resolved (→ `90-deprecated.md`):**
- Plan Mode as default → replaced by Auto Mode (Opus 4.6+).
- `--permission-mode=dontAsk` → (later corrected: it is a valid mode).
- Workflow trigger bare "workflow" → `ultracode`/"use a workflow".
- "Auto Mode mandatory for workflows" → clarified: workflow subagents always run `acceptEdits` + allowlist; the actual requirement is a complete tool allowlist.
- Agent Teams tools `TeamCreate`/`TeamDelete` → gone (since v2.1.178).

**Marked uncertain:** Fable 5 (speculative), the `CLAUDE_CODE_AUTO_COMPACT_WINDOW` name, `--tmux` on the worktree, memory/routines/workflows (research preview).

**New topic vs. the fan source:** Agent Teams (cooperating peer sessions) added from the official docs.
