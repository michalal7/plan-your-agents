// Build the semantic index from the KB markdown. Run: `npm run build:index`
// (uses the configured embedder; EMBEDDER=hash for an offline/no-download build).
import { resolveKbDir } from "../src/kb.js";
import { buildIndex, saveIndex, defaultIndexPath } from "../src/store.js";
import { createEmbedder } from "../src/embed.js";

async function main(): Promise<void> {
  const kbDir = resolveKbDir();
  const embedder = createEmbedder();
  process.stderr.write(`[build-index] kb=${kbDir}\n[build-index] model=${embedder.name}\n`);
  const index = await buildIndex(kbDir, embedder);
  const out = defaultIndexPath();
  saveIndex(out, index);
  process.stderr.write(
    `[build-index] wrote ${index.chunks.length} chunks (${index.dims}d) → ${out}\n`,
  );
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
