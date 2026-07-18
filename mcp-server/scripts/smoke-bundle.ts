// Smoke-test the ARTIFACT the plugin actually ships: spawn bundle/plugin-server.mjs
// as a real subprocess over stdio (exactly how Claude Code runs it) and exercise
// the MCP surface. Proves the bundle is self-contained — no node_modules needed.
//
// Run: `npm run smoke:bundle`
// Override the binary under test with BUNDLE_PATH, and the KB with KB_DIR.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolveKbDir } from "../src/kb.js";
import { BUNDLE_OUT } from "./bundle-options.js";

const bundle = process.env.BUNDLE_PATH ?? BUNDLE_OUT;
const kbDir = process.env.KB_DIR ?? resolveKbDir();

// Inherit the ambient env, then pin KB_DIR last so it always wins.
const env: Record<string, string> = {};
for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
env.KB_DIR = kbDir;

const transport = new StdioClientTransport({ command: process.execPath, args: [bundle], env });
const client = new Client({ name: "smoke-bundle-client", version: "0.0.0" });
await client.connect(transport);

const info = client.getServerVersion();
console.log(`server: ${info?.name} ${info?.version}`);
if (info?.name !== "claude-agents-kb-lexical") {
  throw new Error(`unexpected server name: ${info?.name}`);
}

const { resources } = await client.listResources();
console.log(`resources: ${resources.length}`);
if (resources.length === 0) throw new Error("no resources exposed");

const { tools } = await client.listTools();
console.log(`tools: ${tools.map((t) => t.name).join(", ")}`);

const res = await client.callTool({
  name: "search_knowledge",
  arguments: { query: "worktrees parallel agents", topK: 2 },
});
const text = (res.content as Array<{ type: string; text: string }>)[0].text;
if (!/resource: kb:\/\/claude-agents\//.test(text)) {
  throw new Error("search_knowledge returned no sourced sections");
}
console.log("search_knowledge: ok\n" + text.split("\n").slice(0, 3).join("\n"));

const { prompts } = await client.listPrompts();
console.log(`prompts: ${prompts.map((p) => p.name).join(", ")}`);

await client.close();
console.log("\n[smoke:bundle] OK — bundle runs standalone and serves the full MCP surface.");
