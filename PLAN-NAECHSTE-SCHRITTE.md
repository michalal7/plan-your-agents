# Plan: nächste Schritte

_Stand 2026-07-18, nach kb-update Lauf 4. Plugin 0.4.3 ist ausgeliefert und
installiert; **0.4.4 (Lauf 4) ist committet, aber noch nicht gemerged, gepusht oder
installiert** — siehe Phase 1a. Sprache Deutsch wie
`REPO-ANALYSE.md` — Koordinationsdokument, keine KB-Inhalte._

## Die Reihenfolge und warum sie so ist

Eine harte Abhängigkeit bestimmt alles: **Die Fixture-Läufe konsumieren die KB über
das installierte Plugin.** Sie laufen außerhalb dieses Repos, greifen also
ausschließlich auf `~/.claude/plugins/cache/.../<version>/` zu. Lauf 3 hat in der KB
zwei echte Fehler korrigiert (`/agents` als Panel, `defaultMode` als Top-Level-Key).
Solange 0.4.2 installiert ist, testen die Fixtures diesen alten Stand — ein Plan
könnte `/agents` empfehlen und wäre nach der KB von heute schlicht falsch.

Daraus folgt: **Release vor Läufen. Und während der Läufe die KB einfrieren**, sonst
misst man gegen ein bewegliches Ziel.

---

## Phase 1 — 0.4.3 ausliefern — ✅ ERLEDIGT (2026-07-18)

Suite grün, committet, nach `main` gemerged und gepusht, Plugin auf 0.4.3
aktualisiert, Versionsprobe gefahren. Der Ablauf zur Nachvollziehbarkeit:

1. Verifikationssuite: `cd mcp-server && npm test && npm run typecheck && npm run smoke
   && npm run smoke:bundle && npm run check:bundle`, dazu
   `node scripts/sync-plugin-kb.mjs --check` (zuletzt grün, `2 × 10 files`).
2. ~~Willison auf `on-demand` demoten~~ — **hinfällig, war ein Fehlschluss.** Die
   Quelle war nicht ruhig, der Zeiger stand auf dem Ankündigungs-Blogpost statt auf
   dem Guide. Der Guide steht bei 16 Kapiteln. Korrigiert am 2026-07-18; **kein
   einziges** Kapitel wurde je vollständig gelesen — siehe Phase 4a.
3. Commit auf einem Branch, nicht auf `main`. Pre-Commit-Hook prüft Mirror/Index/Bundle.
4. `claude plugin update` — und danach **die Versionsprobe wiederholen**.

**Abbruchbedingung, aktualisiert:** Ein Fixture-Lauf, dessen Skill-Basispfad nicht
`…\0.4.4\…` meldet, wird verworfen. (War `0.4.3`; Lauf 4 hat die KB-Mirrors
geändert, also ist 0.4.4 der Stand, gegen den die Kampagne laufen muss.)

**Die Session-Bindung ist jetzt kontrolliert nachgewiesen** (2026-07-18). Ablauf:
`claude plugin update` meldete „updated from 0.4.2 to 0.4.3 … Restart to apply
changes", `installed_plugins.json` zeigte den 0.4.3-Pfad, der Cache-Ordner enthielt
die korrigierten Inhalte — und eine Probe **in derselben Session** löste weiter auf
`…\0.4.2\…` auf. Der Beleg ist inhaltlich, nicht nur der Pfadname: In 0.4.2 endet
`40-config-safety.md` mit „Hook events verified against code.claude.com/docs/en/hooks."
**ohne** Datum, in 0.4.3 mit „(2026-07-18)". Die Probe las die datumslose Fassung.

**KORRIGIERT im Review von Lauf 4 (2026-07-18).** Die Beobachtung oben ist echt und
reproduzierbar — die Erklärung, die ich daran gehängt hatte, war erfunden. Sie lautete
„Prompt-Caching bindet den Skill-Pfad an den Session-Start". Laut Docs gilt das
Gegenteil: Plugin-Skills werden **angehängt** und invalidieren den Cache nie. Der
wirkliche Grund ist der **versionierte Plugin-Cache** (`~/.claude/plugins/cache/…`)
mit ~7 Tagen Schonfrist für die abgelöste Version, damit laufende Sessions nicht
brechen.

Und die praktische Folge fällt damit anders aus als hier bisher stand:
**`/reload-plugins` übernimmt Plugin-Änderungen in die laufende Session** — ohne
Neustart. Das hatte ich nie ausprobiert. Eine frisch gestartete Session ist also
**ein** Weg, nicht der einzige.

Was bleibt: **Ein `claude plugin update` allein genügt nicht.** Entweder
`/reload-plugins` oder eine neue Session — und in beiden Fällen wird die
Versionsprobe gefahren, denn „aktualisiert" ist nicht „läuft damit". Die
Verwurzelung außerhalb dieses Repos bleibt davon unberührt und ist weiterhin
zwingend.

## Phase 2 — Die Fixture-Kampagne

Der eigentlich blockierende Punkt. Bisher liegt **kein einziges gültiges Ergebnis** vor.

**Vier Läufe, nicht drei und nicht sechs.** Abgeleitet aus dem bestätigten
Antwortsatz — nur `doc-vault` hat für beide Linsen eine definierte Soll-Antwort:

| Fixture | Dev-Linse | Task-Linse |
|---|---|---|
| `already-good` | ✔ | — |
| `code-service` | ✔ | — |
| `doc-vault` | ✔ | ✔ |

Damit ist auch die offene Frage aus `agent-task-plan.md` §5 („sechs Läufe oder drei?")
beantwortet: vier.

**Protokoll je Lauf** (unverändert, hat sich bewährt):
1. Fixture nach außerhalb des Repos kopieren, Session dort verwurzelt starten.
   Ein Subagent von hier aus genügt nicht — er erbt `CLAUDE.md` per system-reminder.
2. Der Lauf meldet **zuerst** seinen Skill-Basispfad, vor dem Scan.
3. `test/skill-fixtures/README.md` ist gesperrt.
4. advise-Modus, Plan landet im (kopierten) Fixture-Root.
5. Vorlage: Rohtext unkommentiert + Kriterienraster mit beobachtbaren Fakten,
   ohne Pass/Fail. Das Urteil spricht der Repo-Eigentümer.
6. Ein Fehllauf wird protokolliert, nicht sofort per Vorlagen-Fix geheilt.

**Reihenfolge:** `already-good` zuerst (empfindlichster Fall), dann `code-service`,
dann `doc-vault` beidseitig.

**Während der Kampagne: keine KB-Änderung.** Kein `/kb-update`, keine Quellenaufnahme.

## Phase 3 — Freeze-Entscheidung

Erst wenn alle vier Läufe vorliegen. Nicht beim ersten Befund.

Zwei Beobachtungen sind bereits protokolliert und warten auf diese Phase — beide aus
den Same-Repo-Läufen vom 2026-07-18, also **schwache Evidenz**, die durch die
Fixtures bestätigt oder verworfen werden muss:

- **Zahlen-Beschriftung.** `agent-dev-plan.md` nannte „108 tracked files"; echt
  gemessen waren es Working-Tree-Dateien (`git ls-files` = 102). Die Zahl stimmte,
  das Etikett nicht. Kandidat für eine Ergänzung der Präzisionsregel.
- **Zeilendeckel gerissen.** 127 bzw. 134 Prosazeilen gegen ~120.

## Phase 4 — Quellenaufnahme

Nach der Freeze-Entscheidung, damit die KB während der Kampagne stillsteht.
**Drei** Quellen, unterschiedlicher Typ. Reihenfolge nach Ertrag, nicht nach
Entdeckungsdatum.

### 4a — Willison-Guide, 16 Kapitel — ✅ ERLEDIGT (2026-07-18, Lauf 4, Plugin 0.4.4)

14 von 16 Kapiteln gelesen; die zwei Annotated-Prompt-Walkthroughs bewusst
übersprungen, dokumentiert in `_state.json`.

**Der Ertrag lag weit unter der Erwartung dieses Plans.** Oben standen fünf Kapitel
als „direkt im Thema". **Drei** davon brachten nichts — „Subagents" waren 350 Wörter,
die `20-parallelism.md` bereits ausführlicher und mit Doc-Beleg trägt. (Erste Fassung
dieses Absatzes schrieb „vier" und nannte einen „Faktor fünf"; beides im Review
widerlegt. Die Zahl steht jetzt gezählt da, der Faktor ist ersatzlos gestrichen.)
Bilanz:
**eine echte Ergänzung** (Agentic manual testing → `50-verification.md`), **eine
Korrektur** (die Red/green-TDD-Zeile war aus der Ankündigungs-Zusammenfassung
geschrieben und ausgeschmückt), elf Kapitel ohne Ertrag. Das ist der belegte
Preis eines gekapitelten Fan-Guides und gehört in die Kalkulation des nächsten.

Nebenbefunde: ein Widerspruch **innerhalb** der KB überlebte einen ganzen Lauf
(`fork: true` in `10-` gegen die Widerlegung in `90-`), drei Divergenzen in `90-`,
und `chapterCount` allein ist der falsche Marker — er sieht neue Kapitel, nie
Änderungen an bestehenden. Ab jetzt `lastModified` pro Kapitel.

Das Risiko, das ich vor dem Lauf gemeldet hatte — das Subagents-Kapitel könnte
die Skills bereitwilliger Subagenten empfehlen lassen und damit `already-good`
beeinflussen — **ist nicht eingetreten**: das Kapitel brachte nichts, kein Satz
daraus steht in der KB.

### 4b — blakecrosley.com, zwei Guides

Vollständiger Plan: `SOURCE-INTAKE-blakecrosley.md`.
**Blocker entfallen** — `blakecrosley.com` steht seit 2026-07-18 in
`permissions.allow`.

### 4c — Paper „Dive into Claude Code" (arXiv 2604.14228v1)

Liu, Zhao, Shang, Shen — VILA Lab, MBZUAI. 14 Seiten, ~31.700 Wörter.
Lokale Datei, **kein Allowlist-Blocker**. Konvertiert liegt sie im Scratchpad;
für die Aufnahme neu konvertieren, der Scratchpad ist sessiongebunden.

**Quellentyp und Rang.** Third-party *Quellcode-Analyse*, kein Blogpost und keine
offizielle Doku. Das ist ein neuer Typ für `_state.json`: unterhalb der offiziellen
Docs, aber brauchbar als alleinige Quelle für **Architektur- und Designbegründungen,
die die Docs gar nicht behandeln**. Kennzeichnung `(third-party source analysis,
v2.1.88)`. Nie autoritativ für Flags, Keys, Modi, Feldnamen.

**Der zentrale Vorbehalt: das Paper analysiert v2.1.88.** Die KB steht auf
CHANGELOG 2.1.214 — rund 126 Versionen Drift. Jede konkrete Angabe ist ein
Schnappschuss, kein Zustand. Beispiel aus dem Abstract: „a permission system with
seven modes". Bei v2.1.88 waren das 5 externe plus 2 interne/feature-gated; die KB
führt heute 6 externe (`default`/`manual`, `acceptEdits`, `plan`, `auto`, `dontAsk`,
`bypassPermissions`). Kein Widerspruch — nur ein alter Stand. Genau deshalb muss
jede Zahl, Liste und jeder Feldname vor Aufnahme gegen die aktuellen Docs.

**Was inhaltlich lohnt** (gesichtet, nicht geraten):

- **§6.3 „Why Four Mechanisms?" — der höchste Wert im ganzen Paper.** Die
  Kontextkosten-Ordnung der vier Erweiterungsmechanismen: Hooks null, Skills niedrig
  (nur Frontmatter-Beschreibungen im Prompt), Plugins mittel, MCP hoch (Tool-Schemas).
  Das ist eine **Entscheidungsregel** für „welchen Mechanismus nehme ich?" und damit
  direkt `PLAYBOOK`-Material. Die KB hat dafür bisher keine Kostenachse.
- **§8.1 Delegationskriterien** — die Unterscheidung SkillTool injiziert in den
  laufenden Kontext / AgentTool spawnt einen neuen, isolierten. Und der Preis:
  der Default-Pfad erbt die Konversation *nicht*, Subagenten brauchen deshalb
  selbsttragende Prompts. Ergänzt `20-parallelism.md`.
  ⚠️ Die Liste der Built-in-Subagent-Typen darin ist v2.1.88-Stand und weicht vom
  heutigen ab — nicht übernehmen, nur die Argumentation.
- **§7.2/7.3** CLAUDE.md-Hierarchie, Auto-Memory, Compaction-Pipeline → `10-context-memory.md`.
- **§11.2 Value Tensions / §11.3 Architectural Trade-offs** — Framing, kein Fakt.
- **§10 Vergleich mit OpenClaw** und die sechs offenen Designrichtungen: interessant,
  aber für eine KB über *Setup-Entscheidungen* außerhalb des Zwecks. Weglassen.

**Was nicht reingehört:** Implementierungsinterna (Dateinamen wie `permissions.ts`,
`yoloClassifier.ts`, Klassennamen). Für jemanden, der ein Agentensystem aufsetzt,
nicht handlungsleitend — und bei 126 Versionen Drift vermutlich ohnehin überholt.

**`_state.json`-Eintrag**, neue Gruppe `literature`:

```json
{
  "url": "https://arxiv.org/abs/2604.14228",
  "type": "third-party-source-analysis",
  "authoritative": false,
  "updateBehavior": "fetch-once",
  "analyzedVersion": "v2.1.88",
  "note": "Preprint v1. A v2 is a new entry, not an update. Never authoritative for flags/keys/modes."
}
```

---

## Nebenläufig, blockiert nichts

- **`kb-update.md:35` ist veraltet.** Nennt als Beispiel einen Eintrag mit
  `urlVerified: false` („currently the `claude-code` CHANGELOG raw path"). Der steht
  seit 2026-07-18 auf `true`; es gibt keinen `false`-Eintrag mehr. Regel bleibt
  richtig, Beispiel ist tot. Bugfix, vom Freeze nicht betroffen.
- **Part 12 Tab-Count** ungelöst in `_state.json` (2 gelesen gegen 4 gespeichert,
  zweimal). Braucht das Browser-Tool, nicht den Fetcher.
- **`managed-agents`-Docs-Seite** weiterhin ungefetcht.
- **Protokoll-Artefakt in Gefahr:** der 0.4.0-Plan liegt unter
  `…\scratchpad\artifacts\already-good_agent-dev-plan_0.4.0-INVALID.md`. Der
  Scratchpad ist sessiongebunden. Wenn er Bestand haben soll, muss er woandershin.

## Was auf dem Eigentümer liegt

1. ~~Willison demoten~~ — hinfällig, war ein Fehlschluss (siehe Phase 4a).
2. ~~Commit + Release 0.4.3 freigeben~~ — erledigt 2026-07-18.
3. ~~`blakecrosley.com` in die Allowlist~~ — erledigt 2026-07-18.
4. **0.4.4 freigeben und installieren.** Neu, und **Voraussetzung für Punkt 5** — im
   Review von Lauf 4 aufgefallen, weil die Abbruchbedingung auf `…\0.4.4\…`
   verschärft wurde, ohne dass das Ausliefern je als Aufgabe dastand. So wie es
   dastand, hätte der Eigentümer Läufe gestartet, die die eigene Abbruchbedingung
   verwirft. Branch `kb-run4-willison-guide`, Commit steht, Suite grün, **nicht
   gepusht**. Danach `claude plugin update` **plus** `/reload-plugins` oder eine neue
   Session — und in jedem Fall die Versionsprobe.
5. **Die vier Fixture-Läufe starten.** Liegt zwingend beim Eigentümer: nur er kann
   eine Session außerhalb dieses Repos verwurzeln. Die Session muss 0.4.4 auflösen —
   entweder frisch gestartet oder per `/reload-plugins` nachgezogen.

Alles Übrige (Phase 3 Urteil, restliche Phase 4) hängt an Punkt 5.

## Nicht behoben, bewusst

- **Erfundene Zahl in einer Commit-Message.** `d0d46c9` behauptet 22 korrigierte
  Datumsvorkommen in `_state.json`; es waren 21. Gefunden im Review, nicht korrigiert:
  der Branch war beim Fund schon gepusht, und History umzuschreiben wiegt schwerer als
  die falsche Zahl. Bleibt als Protokoll stehen.
- **`agent-task-plan.md`** beschreibt Willison noch als chapter-tracked. Gitignoriertes,
  generiertes Artefakt — generierte Dateien werden nicht von Hand nachgepflegt.
