#!/usr/bin/env node
// Plugin-shipped entrypoint — lexical (BM25) retrieval.
//
// This is what the Claude Code plugin runs, wired up by `.mcp.json` at the plugin
// root — NOT by an `mcpServers` field in .claude-plugin/plugin.json, which does
// not register (see mcp-server/README.md). It deliberately avoids the semantic
// path: embeddings would drag
// ~925 MB of dependencies plus a ~465 MB model into a plugin whose knowledge
// base is ~200 KB. Here the index is built in memory from the live KB at
// startup, so there is also no index artifact that can go stale.
//
// The KB is located by walking up from this file to `.claude/knowledge/
// claude-agents/` — which resolves inside the plugin cache, since the plugin
// ships the whole repo. KB_DIR overrides it.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolveKbDir, loadKb } from "./kb.js";
import { chunkAll } from "./chunk.js";
import { createLexicalSearcher } from "./lexical.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const kbDir = resolveKbDir();
  const chunks = chunkAll(loadKb(kbDir));
  const server = createServer({ kbDir, searcher: createLexicalSearcher(chunks) });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[claude-agents-kb-lexical] stdio ready — ${chunks.length} chunks (BM25, in memory)\n`,
  );
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
