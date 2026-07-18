# Repo-Analyse: `plan-your-agents`

_Stand: 2026-07-17. Bewertung, wie gut das Repo sein Ziel umsetzt, plus recherchierte Verbesserungen. Konkrete Befunde wurden unabhängig gegen Dateien und offizielle Docs verifiziert._

## 1. Ziel des Repos
Ein Claude-Code-**Plugin** (`plan-your-agents`, v0.2.0), das eine kuratierte Wissensbasis über Claude-Code-Agenten-Setups bereitstellt und daraus konkrete Setup-Empfehlungen ableitet. Bestandteile:
- **Wissensbasis** (`.claude/knowledge/claude-agents/`) — destilliert aus der Fan-Seite howborisusesclaudecode.com, gegen die offiziellen Docs verifiziert. Single Source of Truth.
- **Consumer-Skills** `setup-dev-agents` (Repo *entwickeln*) und `setup-task-agents` (Agenten-System für den *Workload* des Repos), gemeinsame Mechanik in `_shared/agent-analysis.md`; jeder schreibt einen Markdown-Plan.
- **Kurator-Pipeline** — `/kb-update` mit `kb-fetcher` (Fan-out) und `kb-verifier` (adversarial gegen Docs).
- **MCP-Server** (`mcp-server/`) — TypeScript, exponiert dieselbe KB an beliebige MCP-Clients: Ressourcen, `search_knowledge` (lokale e5-small-Embeddings), Prompt.

## 2. Bewertung der Zielerreichung — gut umgesetzt (~„B+")
Das Ziel ist weitgehend und ungewöhnlich diszipliniert erreicht. Auffällig: das Repo wendet seine eigenen KB-Prinzipien auf sich selbst an.

**Stärken**
- **Saubere Single-Source-of-Truth-Architektur:** KB → generierte Skill-Mirrors (`scripts/sync-plugin-kb.mjs`, mit `--check`) → generierter Semantik-Index (`mcp-server/data/index.json`). Nichts wird geforkt.
- **Producer ≠ Checker:** die Kurator-Pipeline trennt Fetch (`kb-fetcher`) und adversariale Verifikation (`kb-verifier`), mit Provenienz-Markern (⚠️ / „fan-made" / „verified") — genau die Prinzipien aus `00-principles.md`.
- **Echte Offline-Tests:** `mcp-server` mit vitest + deterministischem HashEmbedder, Typecheck, Smoke; Guardrail gegen Dimensions-Mismatch (`store.ts:82`) und Staleness-Warnung (`store.ts:59`).
- **Skills nach Best Practice:** Progressive Disclosure, dünne `SKILL.md`, geteilte Referenz — konform zur offiziellen Skill-Authoring-Guidance.

**Schwächen / Lücken** (mit Beleg)
1. **Fehlendes Enforcement** _(→ in diesem Durchlauf behoben)_: `--check`, Tests und Index-Rebuild waren nur Doku-Konvention (`CLAUDE.md`), nicht erzwungen. Beleg: der lokale `mcp-server/data/index.json` war **tatsächlich stale** (gebaut 19:52, `INDEX.md` danach 23:10 in Commit `b248920` geändert; `kbHash` passte nicht mehr). Dieselbe Drift-Klasse wie der zuvor mehrfach aufgetretene Mirror-Drift.
2. **Stale Doku** _(→ behoben)_: `RUNBOOK.md` führte „parts 17–21 offen" + einen `_DELETE_ME`-Cleanup-Schritt, obwohl `_state.json` alle 21 Teile als `full` führt und die Ordner weg sind; `MAINTENANCE.md` hatte dasselbe Open-Item; `_state.json` enthielt deutsche `/docs/de/…`-URLs, obwohl die KB English-only ist.
3. **Doppel-Hartkodierung der Version:** `mcp-server/package.json` (0.1.0) **und** `mcp-server/src/server.ts:35` (0.1.0) — kann divergieren. (Die „Drift" zum Plugin 0.2.0 ist unkritisch — separate Artefakte.)
4. **Dupliziertes `isKnowledge`:** `scripts/sync-plugin-kb.mjs:32` (Regex) vs. `mcp-server/src/kb.ts:41` (`isKnowledgeFile`) — zwei Definitionen desselben Kriteriums, können still auseinanderlaufen.
5. **Ungetestet:** HTTP-Transport (`src/http.ts`) und der echte TransformersEmbedder (Tests laufen nur über HashEmbedder).
6. **Frische-/Quellen-Risiko:** einzige Inhaltsquelle ist eine Fan-Seite; der Update-Prozess lief bisher genau einmal (`_state.json.runCount = 1`; Git-Historie = 1 Tag).
7. **Retrieval nur dense** (e5-small, 384d): exakte Tokens (Flag-Namen, `/commands`, Env-Vars) matchen schwächer als bei Hybrid (BM25 + dense) — für diese tokenlastige KB relevant.

## 3. Recherchierte Verbesserungen (mit Quellen)
**Quellen:** offizielle Plugin-Referenz (code.claude.com/docs/en/plugins-reference), Anthropic Skill-Authoring-Best-Practices (platform.claude.com).

**In diesem Durchlauf umgesetzt** (die zwei ROI-Hebel):
- **CI + Pre-Commit-Enforcement** — `.github/workflows/ci.yml` (mirror `--check` + `npm ci` + typecheck + test, offline via HashEmbedder) und `.githooks/pre-commit` (mirror `--check` + `check:fresh`), aktiviert via `git config core.hooksPath .githooks`. Neu: `mcp-server/scripts/check-fresh.ts` (nutzt die vorhandene `isStale`/`kbHash`-Logik wieder — kein drittes Staleness-Kriterium). Grund (Skill-Best-Practices): *harte Anforderungen gehören in Hooks/CI, nicht in Doku.*
- **Live-Bug + stale Doku gefixt** (Index neu gebaut; RUNBOOK/MAINTENANCE/`_state.json` bereinigt).

**Offen (nur Empfehlung, bewusst nicht in diesem Scope)**
- **MCP-Server ins Plugin-Manifest:** die Plugin-Referenz bestätigt `mcpServers` in `plugin.json` und `${CLAUDE_PLUGIN_DATA}` (überlebt Updates) für einen vorgebauten Index → Plugin-Nutzer bekämen Semantik-Suche ohne Extra-Install und Modell-Download. Echter Mehrwert.
  > **Nachtrag 2026-07-18 — umgesetzt, aber anders:** Der Server ist jetzt Teil des Plugins, allerdings (a) **lexikalisch (BM25)** statt semantisch — Messung: Deps + Modell hätten ~1,4 GB für ~200 KB Wissen bedeutet, das Bundle wiegt ~720 KB — und (b) verdrahtet über **`.mcp.json` im Plugin-Root**, nicht über das Manifest-Feld: `mcpServers` in `plugin.json` registrierte **nicht** (weder inline noch als Pfad; `claude plugin details` meldete `MCP servers (0)`). Die obige Empfehlung, dem Manifest-Feld zu folgen, ist damit **praktisch widerlegt**. Details: `mcp-server/README.md`. (Der Kurator mitzuliefern ist schwächer begründet — Producer-Seite; und Plugin-Agenten dürfen laut Docs keine `hooks`/`mcpServers`/`permissionMode`-Frontmatter haben, was `kb-fetcher`/`kb-verifier` aber ohnehin nicht nutzen.)
- **Consumer-only-Plugin ist Absicht,** kein Versehen: Nutzer konsumieren die gebündelte KB über die Skills; Updates kommen über Versions-Bumps.
- Geteiltes `isKnowledge`-Modul (Schwäche 4); Versions-Zentralisierung (3); Hybrid-Retrieval (7); HTTP-Transport-Test (5); wiederkehrender `/kb-update`-Lauf (Schedule) gegen das Frische-Risiko (6).

## 4. Fazit
Das Repo erreicht sein Ziel weitgehend und mit ungewöhnlicher Disziplin (Single Source of Truth, Producer≠Checker, echte Tests). Der größte verbleibende Hebel war nicht *mehr Inhalt*, sondern **Enforcement** — die eigenen Konventionen maschinell durchzusetzen, statt sie zu dokumentieren. Genau das ist jetzt (CI + Pre-Commit + `check:fresh`) geschlossen; die restlichen Punkte sind Enhancements, keine Defekte.
