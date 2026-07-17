// Sync the plugin's bundled knowledge-base copy from the canonical KB.
//
// The canonical KB lives at .claude/knowledge/claude-agents/ (the curator writes
// it, the MCP server reads it). The setup-agents skill, when installed as a
// plugin, cannot reach that path at runtime — so it ships its own copy bundled
// as skill supporting files. That copy is GENERATED here, never hand-edited —
// exactly like mcp-server/data/index.json. One source of truth, generated mirror.
//
//   node scripts/sync-plugin-kb.mjs          # regenerate the mirror
//   node scripts/sync-plugin-kb.mjs --check   # exit 1 if the mirror is out of date
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, ".claude", "knowledge", "claude-agents");
const DST = join(root, ".claude", "skills", "setup-agents", "knowledge", "claude-agents");
const MARKER = join(root, ".claude", "skills", "setup-agents", "knowledge", "GENERATED-DO-NOT-EDIT.txt");
const check = process.argv.includes("--check");

// Mirror only the knowledge content the skill reads (INDEX, PLAYBOOK, 00–90).
// Maintenance meta (CHANGELOG, MAINTENANCE, _state.json) is not needed by the
// skill and would only add churn — matches the MCP server's isKnowledgeFile.
const isKnowledge = (f) => f === "INDEX.md" || f.startsWith("PLAYBOOK") || /^\d{2}-.+\.md$/.test(f);
const files = readdirSync(SRC).filter(isKnowledge);

if (check) {
  let drift = [];
  for (const f of files) {
    const d = join(DST, f);
    if (!existsSync(d) || readFileSync(join(SRC, f), "utf8") !== readFileSync(d, "utf8")) drift.push(f);
  }
  const extra = existsSync(DST) ? readdirSync(DST).filter((f) => !files.includes(f)) : [];
  if (drift.length || extra.length) {
    console.error(`[sync-plugin-kb] OUT OF DATE. changed/missing: ${drift.join(", ") || "-"}; stale: ${extra.join(", ") || "-"}`);
    console.error("[sync-plugin-kb] run: node scripts/sync-plugin-kb.mjs");
    process.exit(1);
  }
  console.log(`[sync-plugin-kb] mirror is up to date (${files.length} files)`);
  process.exit(0);
}

rmSync(DST, { recursive: true, force: true });
mkdirSync(DST, { recursive: true });
for (const f of files) writeFileSync(join(DST, f), readFileSync(join(SRC, f)));
writeFileSync(
  MARKER,
  "GENERATED — do not edit.\n\n" +
    "This folder is a generated copy of the canonical knowledge base at\n" +
    ".claude/knowledge/claude-agents/ (the single source of truth). It is bundled\n" +
    "here so the setup-agents skill can read the KB when installed as a plugin.\n\n" +
    "Regenerate with:  node scripts/sync-plugin-kb.mjs\n" +
    "Edit the KB only under .claude/knowledge/claude-agents/, then re-run the sync.\n",
);
console.log(`[sync-plugin-kb] wrote ${files.length} files → ${DST}`);
