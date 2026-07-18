# Source intake — blakecrosley.com guides

Status: **planned, not executed.** Written 2026-07-18 against plugin 0.4.3.
Written in English on purpose: it steers a `/kb-update` run whose output must be
English, and it is read by agents that must not carry another language into the KB.

## Scope (decided)

**In:** the two long-form guides, **English originals only**.

| Source | Words | Updated | Group fit |
|---|---|---|---|
| `https://blakecrosley.com/guides/claude-code` | ~66,748 | 2026-07-17 | living, fan-made |
| `https://blakecrosley.com/guides/agent-architecture` | ~19,826 (de) — recheck EN | 2026-07-07 (de) | living, fan-made |

**Out:** `/writing/ai-engineering` and `/writing/agent-security`. Both are index
pages, not articles — the first fronts ~130 posts. Declaring them as sources means
carrying 130 items through every `full` run. Revisit as a curated subset later.

**Out:** every `/de/` path. They are translations, older and shorter than the
originals (de guide: 55,238 words / 2026-07-10 vs. en: 66,748 / 2026-07-17).
Ingesting them would mean EN → DE → EN for technical claims, from a stale snapshot.

Numbers above come from page metadata read through WebFetch. Re-measure at intake;
do not carry them into the KB from this file.

## Blocker — needs a human decision first

`blakecrosley.com` is not in `permissions.allow` in `.claude/settings.json`
(9 WebFetch domains, none match). The `kb-fetcher` subagents need it allowlisted.
That file is permission config — per `CLAUDE.md` guardrails, the owner edits it, and
a blocked edit is not routed around. Nothing below runs until this is done.

## `_state.json` entry

New group `secondaryGuides`, or extend `secondaryFanMade`. Per source:

```json
{
  "url": "https://blakecrosley.com/guides/claude-code",
  "type": "fan-made",
  "authoritative": false,
  "updateBehavior": "check-every-run",
  "changeMarker": { "type": "wordCount", "value": 0 },
  "note": "Long-form living guide. Never authoritative for flags/settings/hooks/modes."
}
```

`wordCount` is the right marker here: both pages print `words: N` and
`updated: <date>` as page metadata. Cheaper than a hash, more stable than a heading —
the same reasoning `_state.json` already applies to `topVersion`.

## Procedure

1. Allowlist the domain (owner).
2. `/kb-update <the two URLs>` — explicit URLs, not an incremental run.
3. Fetch via `kb-fetcher`, two fetchers, one per guide. At ~67k words the fetcher
   must return condensed claims, not prose; raw text stays out of the main context.
4. **Every** flag / settings key / hook name / permission mode / version number goes
   through `kb-verifier` against `code.claude.com` before it touches the KB.
   Divergences → `90-deprecated.md` with a rationale.
5. Sort into the existing topic files. Mark every line `(fan-made)`.
6. Advance `CHANGELOG.md` + `_state.json`.
7. Regenerate: `node scripts/sync-plugin-kb.mjs` and `cd mcp-server && npm run build:index`.
8. Bump `version` in `.claude-plugin/plugin.json` — the mirrors are shipped content.

## Claim classes — handle separately

The source mixes three kinds of statement. Only the first can enter as fact.

- **Claude Code facts** (flags, keys, modes, versions) — verifiable; official docs win
  every conflict. This is most of the guide's substance, and the class where a
  fan-made source can never be authoritative.
- **The author's own architecture** (e.g. "84 hooks intercept 15 of 26 lifecycle
  events") — describes his setup, not the product. Usable as a *pattern*, never as a
  fact about Claude Code.
- **Industry / security news** (CVE counts, third-party incidents) — no official
  oracle exists in this KB's verification chain. `contextOnly` or omit.

## Delta candidates

Checked against the KB at plugin 0.4.3 (after incremental run 3). Absent, therefore
worth extracting and verifying:

- `CLAUDE_CODE_WORKFLOWS=1`
- `settings.autoMode.hard_deny`
- `DISABLE_PROMPT_CACHING=1`
- "lethal trifecta" (framing for the security material)

Already covered, do not re-ingest: `autoMode` (`40-config-safety.md`), model IDs
incl. Fable (`60-models.md`), `disallowHooks` (settled as a non-existent name in
`90-deprecated.md`), permission mode `manual` (documented in `40-config-safety.md`
as the CLI alias of `default`, v2.1.200+).

## Effort

Hours, declared not measured. Days if the ~130 archive articles are ever pulled in.
