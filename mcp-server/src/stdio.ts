#!/usr/bin/env node
// stdio transport entrypoint — for local MCP clients (Claude Code, Cursor, …).
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolveKbDir } from "./kb.js";
import { defaultIndexPath, loadIndex, warnIfStale } from "./store.js";
import { createEmbedder } from "./embed.js";
import { createVectorSearcher } from "./search-vector.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const kbDir = resolveKbDir();
  const index = loadIndex(defaultIndexPath());
  warnIfStale(index, kbDir);
  const embedder = createEmbedder();
  const server = createServer({ kbDir, searcher: createVectorSearcher(index, embedder) });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[claude-agents-kb] stdio ready — ${index.chunks.length} chunks, model ${index.model}\n`,
  );
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
