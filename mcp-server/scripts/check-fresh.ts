// Fails when the built semantic index no longer matches the KB it was built from.
// Reuses the server's own staleness logic (isStale/kbHash) — one definition of
// "stale", never a second copy. A missing index is not an error (nothing can be
// stale); a present-but-stale index exits 1 so a hook/CI can catch the drift.
import { existsSync } from "node:fs";
import { resolveKbDir } from "../src/kb.js";
import { defaultIndexPath, loadIndex, isStale } from "../src/store.js";

const path = defaultIndexPath();
if (!existsSync(path)) {
  console.log(`[check:fresh] no index at ${path} — nothing to check (run: npm run build:index).`);
  process.exit(0);
}

const data = loadIndex(path);
if (isStale(data, resolveKbDir())) {
  console.error("[check:fresh] index is STALE vs the KB. Run: npm run build:index");
  process.exit(1);
}
console.log(`[check:fresh] index is fresh (${data.chunks.length} chunks, kbHash ${data.kbHash.slice(0, 12)}…).`);
process.exit(0);
