#!/usr/bin/env node
// Streamable HTTP transport entrypoint — for hosting. Stateless: a fresh MCP
// server + transport is created per request, while the (heavy) index and
// embedder are shared singletons captured in the closure.
import { createServer as createHttpServer, type IncomingMessage } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { resolveKbDir } from "./kb.js";
import { defaultIndexPath, loadIndex, warnIfStale } from "./store.js";
import { createEmbedder } from "./embed.js";
import { createServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3000);
const PATH = process.env.MCP_PATH ?? "/mcp";

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve(undefined);
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function jsonError(code: number, message: string): string {
  return JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null });
}

async function main(): Promise<void> {
  const kbDir = resolveKbDir();
  const index = loadIndex(defaultIndexPath());
  warnIfStale(index, kbDir);
  const embedder = createEmbedder();

  const http = createHttpServer(async (req, res) => {
    const url = (req.url ?? "").split("?")[0];
    if (url !== PATH) {
      res.writeHead(404, { "Content-Type": "application/json" }).end(jsonError(-32601, "Not found"));
      return;
    }
    // Stateless server: only POST is meaningful; SSE stream / session teardown
    // (GET/DELETE) are not supported.
    if (req.method !== "POST") {
      res
        .writeHead(405, { Allow: "POST", "Content-Type": "application/json" })
        .end(jsonError(-32000, "Method not allowed (stateless server)"));
      return;
    }
    try {
      const body = await readBody(req);
      const server = createServer({ kbDir, index, embedder });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (e) {
      process.stderr.write(String(e) + "\n");
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" }).end(jsonError(-32603, "Internal error"));
      }
    }
  });

  http.listen(PORT, () => {
    process.stderr.write(
      `[claude-agents-kb] streamable-http on :${PORT}${PATH} — ${index.chunks.length} chunks, model ${index.model}\n`,
    );
  });
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n");
  process.exit(1);
});
