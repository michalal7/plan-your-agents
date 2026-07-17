// Standalone smoke-test client: drives the real MCP surface end-to-end over an
// in-memory transport (offline, deterministic hash embedder). Proves that
// resources list/read, search_knowledge, and the setup-agents prompt all work.
// Run: `npm run smoke`.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { resolveKbDir } from "../src/kb.js";
import { buildIndex } from "../src/store.js";
import { HashEmbedder } from "../src/embed.js";
import { createServer } from "../src/server.js";

async function main(): Promise<void> {
  const kbDir = resolveKbDir();
  const embedder = new HashEmbedder();
  const index = await buildIndex(kbDir, embedder);
  const server = createServer({ kbDir, index, embedder });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "smoke-client", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const resources = await client.listResources();
  console.log(`resources (${resources.resources.length}):`);
  for (const r of resources.resources) console.log("  -", r.uri);

  const target = resources.resources.find((r) => r.uri.endsWith("PLAYBOOK-agent-design.md"))
    ?? resources.resources[0];
  const read = await client.readResource({ uri: target.uri });
  const firstLine = String((read.contents[0] as { text?: string })?.text ?? "").split("\n")[0];
  console.log(`\nread ${target.uri} → "${firstLine}"`);

  const query = "When subagents, when worktrees, when agent teams?";
  const res = await client.callTool({ name: "search_knowledge", arguments: { query, topK: 3 } });
  const text = (res.content as Array<{ type: string; text: string }>)[0].text;
  console.log(`\nsearch_knowledge("${query}"):`);
  console.log(
    text
      .split("\n")
      .filter((l) => l.startsWith("### "))
      .join("\n"),
  );

  const prompts = await client.listPrompts();
  console.log(`\nprompts: ${prompts.prompts.map((p) => p.name).join(", ")}`);
  const prompt = await client.getPrompt({
    name: "setup-agents",
    arguments: { repo: ".", mode: "advise" },
  });
  console.log(`getPrompt(setup-agents) → ${prompt.messages.length} message(s)`);

  await client.close();
  await server.close();
  console.log("\nSMOKE OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
