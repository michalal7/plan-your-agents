// Integration test: a real MCP Client talks to the server over an in-memory
// transport and exercises every surface (resources, tool, prompt). Offline.
//
// The suite runs against BOTH retrieval variants — semantic (deterministic hash
// embedder) and lexical (BM25) — because they must expose an identical MCP
// contract. Only the server name differs.
import { describe, it, expect, beforeAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { resolveKbDir, loadKb } from "../src/kb.js";
import { buildIndex } from "../src/store.js";
import { chunkAll } from "../src/chunk.js";
import { HashEmbedder } from "../src/embed.js";
import { createVectorSearcher } from "../src/search-vector.js";
import { createLexicalSearcher } from "../src/lexical.js";
import type { Searcher } from "../src/search.js";
import { createServer } from "../src/server.js";

const kbDir = resolveKbDir();

const makeSemantic = async (): Promise<Searcher> => {
  const embedder = new HashEmbedder();
  return createVectorSearcher(await buildIndex(kbDir, embedder), embedder);
};
const makeLexical = async (): Promise<Searcher> => createLexicalSearcher(chunkAll(loadKb(kbDir)));

describe.each([
  ["semantic", makeSemantic, "claude-agents-kb"],
  ["lexical", makeLexical, "claude-agents-kb-lexical"],
] as const)("MCP server surface (%s)", (_label, makeSearcher, expectedName) => {
  let searcher: Searcher;

  beforeAll(async () => {
    searcher = await makeSearcher();
  });

  async function connectedClient() {
    const server = createServer({ kbDir, searcher });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    return { client, server };
  }

  it("identifies its retrieval variant in the server name", async () => {
    const { client, server } = await connectedClient();
    expect(client.getServerVersion()?.name).toBe(expectedName);
    await client.close();
    await server.close();
  });

  it("lists the KB files as resources", async () => {
    const { client, server } = await connectedClient();
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("kb://claude-agents/INDEX.md");
    expect(uris).toContain("kb://claude-agents/PLAYBOOK-agent-design.md");
    expect(uris.every((u) => u.startsWith("kb://claude-agents/"))).toBe(true);
    await client.close();
    await server.close();
  });

  it("reads a resource live from disk", async () => {
    const { client, server } = await connectedClient();
    const read = await client.readResource({ uri: "kb://claude-agents/INDEX.md" });
    expect(read.contents[0].mimeType).toBe("text/markdown");
    expect(String((read.contents[0] as { text?: string }).text)).toContain("Knowledge base");
    await client.close();
    await server.close();
  });

  it("answers search_knowledge with sourced sections", async () => {
    const { client, server } = await connectedClient();
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
    const { client, server } = await connectedClient();
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
