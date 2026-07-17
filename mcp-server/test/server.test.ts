// Integration test: a real MCP Client talks to the server over an in-memory
// transport and exercises every surface (resources, tool, prompt). Offline —
// uses the deterministic hash embedder.
import { describe, it, expect, beforeAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { resolveKbDir } from "../src/kb.js";
import { buildIndex, type IndexData } from "../src/store.js";
import { HashEmbedder } from "../src/embed.js";
import { createServer } from "../src/server.js";

async function connectedClient(index: IndexData, embedder: HashEmbedder, kbDir: string) {
  const server = createServer({ kbDir, index, embedder });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

describe("MCP server surface", () => {
  const kbDir = resolveKbDir();
  const embedder = new HashEmbedder();
  let index: IndexData;

  beforeAll(async () => {
    index = await buildIndex(kbDir, embedder);
  });

  it("lists the KB files as resources", async () => {
    const { client, server } = await connectedClient(index, embedder, kbDir);
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("kb://claude-agents/INDEX.md");
    expect(uris).toContain("kb://claude-agents/PLAYBOOK-agent-design.md");
    expect(uris.every((u) => u.startsWith("kb://claude-agents/"))).toBe(true);
    await client.close();
    await server.close();
  });

  it("reads a resource live from disk", async () => {
    const { client, server } = await connectedClient(index, embedder, kbDir);
    const read = await client.readResource({ uri: "kb://claude-agents/INDEX.md" });
    expect(read.contents[0].mimeType).toBe("text/markdown");
    expect(String((read.contents[0] as { text?: string }).text)).toContain("Knowledge base");
    await client.close();
    await server.close();
  });

  it("answers search_knowledge with sourced sections", async () => {
    const { client, server } = await connectedClient(index, embedder, kbDir);
    const res = await client.callTool({
      name: "search_knowledge",
      arguments: { query: "verification feedback loop tests", topK: 3 },
    });
    const text = (res.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toMatch(/resource: kb:\/\/claude-agents\//);
    expect(text).toMatch(/score/);
    await client.close();
    await server.close();
  });

  it("exposes the setup-agents prompt with a guided flow", async () => {
    const { client, server } = await connectedClient(index, embedder, kbDir);
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toContain("setup-agents");
    const prompt = await client.getPrompt({
      name: "setup-agents",
      arguments: { repo: ".", mode: "advise" },
    });
    const body = String((prompt.messages[0].content as { text?: string }).text);
    expect(body).toContain("PLAYBOOK-agent-design.md");
    expect(body).toContain("search_knowledge");
    await client.close();
    await server.close();
  });
});
