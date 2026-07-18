---
description: Incrementally updates the claude-agents knowledge base (fetch → verify → write → review) from fan-made + official sources.
argument-hint: "[full | <source-url ...>]  (empty = incremental per _state.json)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Agent
  - WebFetch
  - WebSearch
model: inherit
---

You maintain the knowledge base under `.claude/knowledge/claude-agents/`. Another agent derives project recommendations from it — write it lookup-friendly, directive, compact. Work by the principles in `00-principles.md` (verification, context minimalism, delegation, producer≠checker).

**Language: the KB is maintained in English.** Write all content, `CHANGELOG.md` entries and `_state.json` notes in English — never reintroduce another language, even if a source is in another language.

Argument: `$ARGUMENTS` (empty = incremental; `full` = full rebuild; otherwise specific source URLs).

Current state: @.claude/knowledge/claude-agents/_state.json

## Flow

1. **Determine scope.** Read `_state.json` (`schemaVersion` 2). On an empty argument process only what changed; on `full`, everything. Each source group has its own `updateBehavior` — follow it, don't refetch everything:

   | Group | Behaviour | Scope rule |
   |---|---|---|
   | `primary` (fan-made timeline) | part tracking | parts whose title/tab count changed, plus new parts |
   | `secondary` (official docs) | check every run | authoritative for flags/settings/hooks/modes |
   | `datedPosts` (anthropic.com engineering/research) | fetch once | only entries with `status != "done"` |
   | `living` (docs pages + GitHub) | check every run | fetch, compare `changeMarker`, process only on change |
   | `secondaryFanMade` (Willison) | chapter tracking | new chapters only; mark "(fan-made, Willison)" |
   | `contextOnly` (Trends Report PDF, InfoQ) | on demand | framing only — **never** a source for a verified claim |

   Rank on conflict: official docs > dated Anthropic posts > CHANGELOG > fan-made/context. An entry marked `urlVerified: false` (currently the `claude-code` CHANGELOG raw path) must be confirmed by the first fetch; on 404 record `incomplete` and report it — do not go hunting for a replacement URL.

2. **Fetch — delegate in parallel.** For each source to fetch, start a `kb-fetcher` subagent (several at once, one message with multiple Agent tool calls; the fan-out sweet spot is 3–5). Each returns structured JSON; raw HTML stays out of your context. Pass the fetcher what it needs for change detection: for `living` entries the stored `changeMarker` (and for the CHANGELOG the `lastChecked` version, so it reports only newer entries). An incremental run stays in the sweet spot by construction — the group behaviours prune it. A **`full` run does not**: 7 `datedPosts` + 5 `living` + the `secondary` docs + 21 parts would blow far past it at linear token cost. Batch a `full` run in **waves of 3–5 fetchers**, synthesizing between waves, instead of fanning out over everything at once. Anything that comes back `incomplete` — JS-rendered tabs, PDFs — is fetched here in the main run via the Chrome/browser tool (subagents have no browser access).

3. **Verify — separately.** Collect all `claimsToVerify` from the fetch results, dedupe them, and hand them to a `kb-verifier` subagent. Result: verdicts + divergences. The verifier is NOT the writer.

4. **Resolve contradictions.** Newer beats older; official docs beat fan-made. Resolved items (including `diverged`/`unverified` from step 3) go to `90-deprecated.md` with a rationale. Mark uncertain/preview items explicitly, not as best practice.

5. **Sort in by topic.** Work condensed content into the existing topic files (`00`–`90`), NOT chronologically. Each rule: one line of core statement, optionally a minimal example, date, source link. Convention: ⚠️ = uncertain/to-check, "(fan-made)" / "(verified)".

6. **Review — enforce compactness.** Check every changed file: > ~200 lines → condense instead of appending (merge redundant tips). Every line must be able to influence a decision. Keep `PLAYBOOK-agent-design.md` and `INDEX.md` consistent. Optionally hand this review to a subagent.

7. **Advance state.** Update `CHANGELOG.md` (date, added/changed/dropped, open items) and `_state.json`: `lastRun`, `runCount`, seen parts/tabs — plus, for the new groups, `status`/`ingestedAt` on processed `datedPosts`, the fresh `changeMarker` + `lastChecked` on every `living` entry you fetched (also when nothing changed — that is what makes the next run cheap), new `parts` for `secondaryFanMade`, and `urlVerified: true` once an unconfirmed URL has resolved.

8. **Regenerate what the KB feeds.** Two generated artifacts derive from the KB and go stale the moment you change it — the commit hook blocks on both:
   - `node scripts/sync-plugin-kb.mjs` — each skill's bundled KB copy (`.claude/skills/setup-dev-agents/` and `setup-task-agents/knowledge/claude-agents/`, generated mirrors). Verify with `--check`.
   - `cd mcp-server && npm run build:index` — the semantic index (`data/index.json`). Verify with `npm run check:fresh`.

   Never edit either by hand. The plugin bundle needs no rebuild: it indexes the live KB in memory at startup.

## Orchestration choice (PLAYBOOK §1)
Routine update = these subagents in one session are enough. Only a rare `full` run with adversarial multi-verification justifies a dynamic workflow (`~/.claude/workflows/kb-rebuild`) — no permanent panel for small deltas.

## Don't
No agent team (workers don't need to talk to each other). No forced Plan Mode. Don't bloat files. Claim nothing from memory about official facts — when in doubt, `kb-verifier`.

At the end, report: sources/parts processed, files changed, contradictions resolved, open items.
