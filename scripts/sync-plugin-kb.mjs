// Sync the plugins' bundled knowledge-base copies from the canonical KB.
//
// The canonical KB lives at .claude/knowledge/claude-agents/ (the curator writes
// it, the MCP server reads it). The setup-*-agents skills, when installed as a
// plugin, cannot reach that path at runtime — so each ships its own copy bundled
// as skill supporting files. Those copies are GENERATED here, never hand-edited —
// exactly like mcp-server/data/index.json. One source of truth, generated mirrors.
//
//   node scripts/sync-plugin-kb.mjs          # regenerate every mirror
//   node scripts/sync-plugin-kb.mjs --check   # exit 1 if any mirror is out of date
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, ".claude", "knowledge", "claude-agents");
const SKILLS = join(root, ".claude", "skills");
const check = process.argv.includes("--check");

// Every skill that bundles the KB. Each gets an identical generated mirror so it
// stays self-contained (robust regardless of plugin path/variable substitution).
const TARGET_SKILLS = ["setup-dev-agents", "setup-task-agents"];
const targets = TARGET_SKILLS.map((s) => ({
  name: s,
  dir: join(SKILLS, s, "knowledge", "claude-agents"),
  marker: join(SKILLS, s, "knowledge", "GENERATED-DO-NOT-EDIT.txt"),
}));

// Mirror only the knowledge content the skills read (INDEX, PLAYBOOK, 00–90).
// Maintenance meta (CHANGELOG, MAINTENANCE, _state.json) is not needed by a skill
// and would only add churn — matches the MCP server's isKnowledgeFile.
const isKnowledge = (f) => f === "INDEX.md" || f.startsWith("PLAYBOOK") || /^\d{2}-.+\.md$/.test(f);
const files = readdirSync(SRC).filter(isKnowledge);

const MARKER_TEXT =
  "GENERATED — do not edit.\n\n" +
  "This folder is a generated copy of the canonical knowledge base at\n" +
  ".claude/knowledge/claude-agents/ (the single source of truth). It is bundled\n" +
  "here so the skill can read the KB when installed as a plugin.\n\n" +
  "Regenerate with:  node scripts/sync-plugin-kb.mjs\n" +
  "Edit the KB only under .claude/knowledge/claude-agents/, then re-run the sync.\n";

if (check) {
  let ok = true;
  for (const t of targets) {
    const drift = [];
    for (const f of files) {
      const d = join(t.dir, f);
      if (!existsSync(d) || readFileSync(join(SRC, f), "utf8") !== readFileSync(d, "utf8")) drift.push(f);
    }
    const extra = existsSync(t.dir) ? readdirSync(t.dir).filter((f) => !files.includes(f)) : [];
    if (drift.length || extra.length) {
      ok = false;
      console.error(`[sync-plugin-kb] ${t.name}: OUT OF DATE. changed/missing: ${drift.join(", ") || "-"}; stale: ${extra.join(", ") || "-"}`);
    }
  }
  if (!ok) {
    console.error("[sync-plugin-kb] run: node scripts/sync-plugin-kb.mjs");
    process.exit(1);
  }
  console.log(`[sync-plugin-kb] all mirrors up to date (${targets.length} × ${files.length} files)`);
  process.exit(0);
}

for (const t of targets) {
  rmSync(t.dir, { recursive: true, force: true });
  mkdirSync(t.dir, { recursive: true });
  for (const f of files) writeFileSync(join(t.dir, f), readFileSync(join(SRC, f)));
  writeFileSync(t.marker, MARKER_TEXT);
  console.log(`[sync-plugin-kb] wrote ${files.length} files → ${t.dir}`);
}
