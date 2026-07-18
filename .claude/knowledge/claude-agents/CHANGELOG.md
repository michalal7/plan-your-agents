# Changelog

## 2026-07-19 — Incremental run 3: the `secondary` docs, read properly for the first time (plugin 0.4.3)
Runs 1–2 had never given the eight `secondary` doc URLs a real extraction pass — they were listed as "check every run" but the KB's subagent and hooks material still rested largely on the fan-made source. This run fetched all eight. Everything else was quiet: CHANGELOG still at 2.1.214, both best-practices pages unchanged, no part 22, no third Willison chapter, all 7 `datedPosts` already done.

**Two things in the KB were simply wrong:**
- **`/agents` was described as a management panel.** It stopped opening a wizard in v2.1.198; it now prints a pointer to `.claude/agents/`. This one mattered — a setup recommendation telling someone to "run `/agents` to manage them" would have wasted their time on a UI that no longer exists.
- **`defaultMode` was listed as a top-level `settings.json` key.** It is nested: `permissions.defaultMode`. Related correction: the project/local ignore rule applies only to the *value* `auto`, not to the key — every other mode is honored from project scope. The KB implied the whole key was scope-restricted.

**Two parked observations became documented contract** (`90-deprecated.md`): the residual `"Task"` name in the `system:init` tools list and `result.permission_denials[].tool_name`, and the Windows 8191-character command-line limit on subagent prompts. Both are now stated verbatim in `agent-sdk/subagents`. The old entry had `system/init` with a slash; the docs use a colon.

**Two invented names settled and recorded as nonexistent:** `fork: true` (a fan-made fragment from Part 16 — the real mechanisms are the SKILL field `context: fork` and the separate `fork` subagent type behind `/subtask`), and `disallowHooks` (the real key is `disableAllHooks`). Both re-confirmations went through `kb-verifier` rather than being accepted from the fetch.

**Added, ranked by whether it changes a recommendation:**
- **The hook exit-code contract** (`40`): only exit `2` blocks — exit `1` does *not*, contrary to Unix convention — and on exit 2 the feedback must go to **stderr**, because stdout is ignored. Plus the split between blocking-capable and advisory-only events: a `PostToolUse` or `SubagentStart` "gate" is decorative. A verification loop built on the wrong event silently doesn't gate anything.
- **`permissions.ask` survives every mode** (`40`): still prompts under `bypassPermissions`, denied under `dontAsk`. That makes it the correct tool for "run unattended except for these few actions", instead of hunting for a permission mode that happens to prompt.
- **Subagent cost trap** (`20`): since v2.1.198 the built-in `Explore` inherits the main model rather than always being Haiku. Exploration-heavy setups got quietly more expensive; the fix is a project agent named `Explore` with `model: haiku`.
- **Permission modes don't nest downward** (`20`): a permissive parent overrides a subagent's stricter `permissionMode`. Sandboxing a subagent by giving it a tighter mode does not work.
- **Forks as a distinct mechanism** (`20`, new section): fork vs named subagent, and the `/subtask` ↔ `/fork` rename in v2.1.212 — `/fork` now means "copy the session to a new background session", so the old advice points at the wrong command.
- **Subagent resume via `SendMessage`** (`20`), which does not require agent teams — relevant to orchestrator patterns that currently assume a subagent is one-shot.
- **Ultracode's human-input gate** (`30`): since v2.1.210 the keyword only fires from genuine human input, not from `-p`, scheduled prompts or webhook/PR-comment relays. Directly relevant to anyone automating Claude Code — untrusted issue text can no longer escalate a run into a hundreds-of-agents workflow.
- Smaller: agent definition precedence and the full frontmatter table, model resolution order, tool-restriction sets, `worktree.bgIsolation`, Agent View idle-stop and quota multiplier, workflow size guideline vs. the hard 16/1000 caps, `availableModels`/`enforceAvailableModels`, hook matcher regex-vs-exact semantics, the 10k `additionalContext` cap, managed hook controls.

⚠️ One unresolved discrepancy, deliberately not written into the KB: the fan-made part 12 read as 2 tabs against a stored 4 across two passes. The page is JS-rendered and the fetcher was inconsistent on part numbering in the same run, so this is more likely fetch noise than a real change. Left in `_state.json` open items for the next run to settle with the browser tool rather than guessed at.

## 2026-07-18 — Align the MCP advisory surface + freeze the template (plugin 0.4.2)
The `setup-agents` prompt in `mcp-server/src/server.ts` is a second advisory surface, and 0.4.1 left it behind. Ported the **substance**, not the formatting:
- **Verdict first** — step 5 now opens with the one-sentence answer plus an effort class, before the reasoning.
- **The unconditional §5 sweep** — the lesson from the 0.4.1 review, which was missing here exactly as it had been missing from the skeleton: a recommendation to change nothing still has to show it checked.
- **The widened precision rule** — the prompt previously guarded only flags and settings ("claim nothing from memory"); it now covers every number and attribution, with declared estimates explicitly exempt.

Deliberately **not** ported: the section skeleton, the ~120-line cap and the plain-language companion lines. Those are conventions for a plan *file*, and an MCP client may not be writing one — a mechanical copy would bloat the prompt without improving the flow. The prompt now says so, so the boundary is explicit rather than inferred.

Also clarified a genuine ambiguity in `_shared`: inside the fenced skeleton, "the rule in §5" could be read as the plan's §5 (Next steps) instead of the machinery's §5 (Rules).

**Template freeze** recorded in `CLAUDE.md`: both advisory surfaces are closed to content changes until skill-output fixtures exist. They have been reworked twice now, validated only against this repo — the one repo whose history the generated plans can narrate. That is precisely the no-feedback-loop situation KB principle #1 warns about, so the next iteration waits for evidence instead of introspection.

## 2026-07-18 — Plan template: verdict first, less redundancy (plugin 0.4.1)
Both skills were run against this repo and the two resulting plans were reviewed. They were factually sound (88 tracked files, the test-coverage gap, and a sharp catch: `github.com` is not in the WebFetch allowlist, so the note redirecting the fetcher to `raw.githubusercontent.com` is load-bearing). The weaknesses were in the **template**, not the execution — the skills filled it correctly.

- **Verdict block up front**, with an effort class (minutes/hours/days). The plans buried their actual answer ("nothing needs changing, except one gap") about thirty lines deep, and never said how much any recommendation costs.
- **7 → 5 sections.** The old skeleton asked for stack and existing config twice (§1 Context *and* §2 Repo scan), and asked for "what should not go in" twice (§5 Setup *and* §6 Anti-patterns). Both plans dutifully answered twice. §1+§2 merged into "What's there"; §6 dissolved into §4, where each exclusion now sits with the item it belongs to.
- **A plain-language line per recommendation.** The plans were unreadable for anyone outside the team — "fan-out-and-synthesize", "producer ≠ checker", "PLAYBOOK §1 row 2", none unpacked. A plan is also read by people who decide about the work, not only by those who do it.
- **Precision rule widened.** One plan asserted that `INDEX.md` records a ledger of "(4 entries)" — `INDEX.md` states no count at all, and the ledger holds 18. The old rule only covered *safety-relevant* claims, so a fabricated count fell outside it. Now every number and every attribution must be read during the run, not recalled.
- **~80-line cap plus a re-run rule.** The template was written for a first run; on a repeat the skills produced a plan/changelog hybrid ("Delta since the last plan", "this has paid for itself measurably"). Changes since the last plan now get exactly one line in the Verdict.

⚠️ Validated against one repo only — our own, the single repo whose history these plans can narrate. Whether the plain-language requirement holds up elsewhere, or degrades into filler, is untested. That is what the three skill fixtures in `agent-dev-plan.md` are for.

## 2026-07-18 — First ingestion of the 2026 sources (run 2, plugin 0.4.0)
The source model added earlier today was actually exercised: all 7 `datedPosts` and all 5 `living` entries fetched, verified and ingested; `runCount` 1 → 2. Plugin bumped to **0.4.0** because the KB mirrors are shipped content — without the bump `claude plugin update` compares only the manifest version and this never reaches an installed user (`MAINTENANCE.md` → "Releasing the plugin").

**Added:**
- **Auto Mode mechanism** (`40-config-safety.md`): two-layer defense (input probe + transcript classifier), the classifier deliberately blind to Claude's reasoning, three decision tiers, denial escalation at 3 consecutive / 20 total with headless termination, and the measured error rates (~0.4% FP, ~17% FN on genuinely overeager actions).
- **Containment model** (`40-config-safety.md`): the three isolation layers, the 24-of-25 successful credential-exfiltration phishing test, hooks that ran before the trust dialog, and symlink-before-path-validation. Settles the `/sandbox` Windows question: still no Windows sandboxing.
- **Evals** (`50-verification.md`): 20–50 tasks to start, the two-expert solvability test, grade-the-output-not-the-path, capability vs. regression suites, and `pass@k` vs `pass^k`.
- **Expertise study** (`00-principles.md`, new principle #9): experts instruct more precisely and hand over *more* execution autonomy, not less; the gap is largest in recovery from failure. Carries the study's own caveats — correlational, preliminary, transcript-inferred success.
- **16-agent case study** (`20-parallelism.md`): git-lock coordination with no orchestrator and no inter-agent messaging; and the failure that matters — when the task stopped decomposing, all 16 agents hit the same bug and overwrote each other.
- **Harness design** (`30-workflows.md`): write the harness for the model (greppable logs, pre-computed aggregates, a fast sampling path against time blindness), generator/evaluator split, and the cost ladder. Plus the rule that scaffolding encodes a model's weaknesses and must be re-checked on upgrade.
- **Brain/hands decoupling** (`PLAYBOOK` §4b) and **skill authoring limits** (`40-config-safety.md`).

**Corrected:** subagents run in the background by default and inherit extended thinking since v2.1.198 — the previous "thinking weights don't propagate" line was fan-made and is now disproven. Nesting depth 5 is fixed, not a starting value.

**Rejected — the point of the separate verifier:** six claims did not survive the doc check and went to `90-deprecated.md` instead of into the KB. Four are changelog-only (`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`, `CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH`, `EndConversation`, and the residual `"Task"` tool name), one is a conflation ("Stop hooks are overridden after 8 blocks" — those counters belong to Auto Mode), one is unsourced (the Windows 8191-character limit). A fetcher also self-flagged two C-compiler items as possible reconstructions; a verbatim browser check showed both were genuine — including a `claude-opus-X-Y` placeholder that really is in the original. Noted there too: that post's `--fast` is the author's own harness option, not a Claude Code flag.

**Not done, deliberately:** `contextOnly` (Trends Report PDF, InfoQ) stays `pending` — its behaviour is `on-demand` and it may never back a claim. The `managed-agents` docs page was not fetched, so there is still no managed-vs-local decision matrix; recorded in `openItems`.

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
