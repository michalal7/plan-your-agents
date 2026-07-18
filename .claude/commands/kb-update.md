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
   | `secondaryFanMade` (Willison guide) | check every run | a chaptered guide that changes in place: compare `chapterCount`, read only chapters whose `status` is not `ingested`; mark "(fan-made, Willison)" |
   | `feeds` (blogs) | **feed scan** | entries `>=` `watermark` minus `seenIds`, filtered by the entry's `relevance`; see below |
   | `contextOnly` (Trends Report PDF, InfoQ) | on demand | framing only — **never** a source for a verified claim |

   **Two source shapes, two strategies — don't confuse them.** A source that *changes in place* (the official docs, the `living` pages) is tracked by a fixed URL plus a `changeMarker`; there is no feed for "the hooks page changed", and re-checking those is where run 3 found `/agents` and `defaultMode` wrong. A source that *publishes new items* must never be tracked by a fixed article URL — that watches one frozen corner of a live site. Use `feed-scan`:

   - **You** fetch the `feedUrl` in the main run — not a `kb-fetcher`. The feed is one cheap structured document, and the relevance call has to stay with the orchestrator; handing it to a fetcher is what the stored filter exists to prevent. Subagents come in afterwards, one per selected item.
   - Use the **`feedUrl`** (an Atom/RSS feed, not the HTML homepage — structured entries, stable permalinks, cheaper and it survives redesigns).
   - Candidates = entries with a date **`>=`** `watermark`, minus anything already in `seenIds`. The `>=` and the set work as a pair: the date keeps the window small, the set removes what was already handled on the boundary day. With a strict `>` the set is unreachable and a second post on the watermark date is lost forever.
   - **First run** (no `watermark`): do not ingest the whole feed. Take only entries from the last 30 days, then seed `watermark`/`seenIds` from the newest entry as usual. Record in the entry's note that older items were never scanned.
   - Apply the entry's stored **`relevance`** filter to title + summary *before* fetching anything else. It lives in `_state.json` on purpose: for a general-interest blog most items are off-topic, and re-deciding the topic each run invites drift.
   - Only then fetch full text, and only for what survived. A quiet run therefore costs exactly one fetch.
   - Advance `watermark` to the newest entry seen and reset `seenIds` to that date's permalinks **even when nothing was relevant** — that is what keeps the next run cheap.
   - **Only on a successful fetch.** If the feed 404s or returns nothing parseable, leave `watermark` and `seenIds` untouched, record `incomplete` on the entry and report it. Advancing state on a failed fetch would silently skip the whole window.
   - **Gap check, and it will usually fire.** A feed is a bounded window: this one holds ~28 entries ≈ 9 days against a ~22-posts-a-week author, while the cadence in `MAINTENANCE.md` is monthly. So at a monthly interval roughly three weeks of posts fall out of the window *before every run*. That is structural, not an occasional accident. If the oldest entry in the feed is newer than `watermark`, **still advance** — refusing to advance only re-scans the same window forever and cannot reach what is already gone — but name the gap (the uncovered date range) in the report and add an `openItems` note, so a miss is recorded rather than swallowed. Backdated or out-of-order posts are not detectable this way at all. **`feed-scan` is best-effort by construction**; if a feed source ever matters enough that misses are unacceptable, raise its cadence rather than pretending the class is lossless.

   Rank on conflict: official docs > dated Anthropic posts > CHANGELOG > fan-made/context. An entry marked `urlVerified: false` must be confirmed by the first fetch (no entry currently carries it — the `claude-code` CHANGELOG raw path resolved on 2026-07-18 and was promoted to `true`); on 404 record `incomplete` and report it — do not go hunting for a replacement URL.

2. **Fetch — delegate in parallel.** For each source to fetch, start a `kb-fetcher` subagent (several at once, one message with multiple Agent tool calls; the fan-out sweet spot is 3–5). Each returns structured JSON; raw HTML stays out of your context. Pass the fetcher what it needs for change detection: for `living` entries the stored `changeMarker` (and for the CHANGELOG the `lastChecked` version, so it reports only newer entries). An incremental run stays in the sweet spot by construction — the group behaviours prune it. A **`full` run does not**: 7 `datedPosts` + 5 `living` + the `secondary` docs + 21 parts would blow far past it at linear token cost. Batch a `full` run in **waves of 3–5 fetchers**, synthesizing between waves, instead of fanning out over everything at once. Anything that comes back `incomplete` — JS-rendered tabs, PDFs — is fetched here in the main run via the Chrome/browser tool (subagents have no browser access).

3. **Verify — separately.** Collect all `claimsToVerify` from the fetch results, dedupe them, and hand them to a `kb-verifier` subagent. Result: verdicts + divergences. The verifier is NOT the writer.

4. **Resolve contradictions.** Newer beats older; official docs beat fan-made. Resolved items (including `diverged`/`unverified` from step 3) go to `90-deprecated.md` with a rationale. Mark uncertain/preview items explicitly, not as best practice.

5. **Sort in by topic.** Work condensed content into the existing topic files (`00`–`90`), NOT chronologically. Each rule: one line of core statement, optionally a minimal example, date, source link. Convention: ⚠️ = uncertain/to-check, "(fan-made)" / "(verified)".

6. **Review — enforce compactness.** Check every changed file: > ~200 lines → condense instead of appending (merge redundant tips). Every line must be able to influence a decision. Keep `PLAYBOOK-agent-design.md` and `INDEX.md` consistent. Optionally hand this review to a subagent.

7. **Advance state.** Update `CHANGELOG.md` (date, added/changed/dropped, open items) and `_state.json`: `lastRun`, `runCount`, seen parts/tabs — plus, for the new groups, `status`/`ingestedAt` on processed `datedPosts`, the fresh `changeMarker` + `lastChecked` on every `living` entry you fetched (also when nothing changed — that is what makes the next run cheap), the advanced `watermark` + `seenIds` on every `feeds` entry that fetched successfully (again: also when nothing was relevant), the fresh `chapterCount` and per-chapter `status` on `secondaryFanMade`, and `urlVerified: true` once an unconfirmed URL has resolved. **Set `lastChecked` on every entry you fetched, in every group** — `feeds` and `secondaryFanMade` included; it is the one field that rots silently because no group-specific rule names it. Only promote a chapter to `status: "ingested"` when the chapter itself was fetched and read: that status permanently excludes it from later runs, so a summary of it — from an announcement post, an index, or another chapter — does not qualify.

8. **Regenerate what the KB feeds.** Two generated artifacts derive from the KB and go stale the moment you change it — the commit hook blocks on both:
   - `node scripts/sync-plugin-kb.mjs` — each skill's bundled KB copy (`.claude/skills/setup-dev-agents/` and `setup-task-agents/knowledge/claude-agents/`, generated mirrors). Verify with `--check`.
   - `cd mcp-server && npm run build:index` — the semantic index (`data/index.json`). Verify with `npm run check:fresh`.

   Never edit either by hand. The plugin bundle needs no rebuild: it indexes the live KB in memory at startup.

## Orchestration choice (PLAYBOOK §1)
Routine update = these subagents in one session are enough. Only a rare `full` run with adversarial multi-verification justifies a dynamic workflow (`~/.claude/workflows/kb-rebuild`) — no permanent panel for small deltas.

## Don't
No agent team (workers don't need to talk to each other). No forced Plan Mode. Don't bloat files. Claim nothing from memory about official facts — when in doubt, `kb-verifier`.

At the end, report: sources/parts processed, files changed, contradictions resolved, open items.
