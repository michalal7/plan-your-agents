# claude-agents-kb — MCP server

Exposes the `claude-agents` knowledge base (under `.claude/knowledge/claude-agents/`)
to any MCP client — Claude Code, Cursor, Windsurf, other agents — with **semantic
search**. It is an *additive* companion to the `/setup-agents` skill: the skill is the
Claude-native path, this server is the portable, hostable one.

The knowledge base markdown files remain the **single source of truth**. This server
reads from them; it never forks or duplicates their content, so the KB, `/kb-update`,
and this server stay in sync.

## MCP surface

- **Resources** — every KB file (`INDEX`, `PLAYBOOK`, `00`–`90`) as `kb://claude-agents/<file>.md`,
  read live from disk. (Maintenance meta — `CHANGELOG`, `MAINTENANCE`, `_state.json` — is excluded.)
- **Tool `search_knowledge(query, topK?)`** — semantic search over the KB (chunked per
  `##` section, embedded locally). Returns the most relevant sections with their source
  file + heading. Retrieval only — the reasoning stays in your client model.
- **Prompt `setup-agents(repo?, mode?)`** — mirrors the PLAYBOOK flow (decision tree →
  verification-loop-first → minimal setup) so prompt-capable clients get the same guided
  flow. The server supplies knowledge; it does not plan.

## How it works

```
KB markdown ──chunk (## sections)──▶ embed (multilingual-e5-small, local ONNX) ──▶ data/index.json
                                                                                        │
search_knowledge(query) ──embed query──▶ cosine (brute force, in memory) ◀─────────────┘
Resources ──────────────────────────────────────────▶ read live from the KB markdown
```

- **Embeddings:** local, in-process via [transformers.js](https://huggingface.co/docs/transformers.js)
  with `intfloat/multilingual-e5-small` (384-dim; multilingual, so queries in any language
  work). No API key, no per-query cost; the model is cached after first download, then fully offline.
- **Index:** a flat `data/index.json` (chunks + normalized vectors + a KB content hash),
  searched by brute-force cosine. The KB is small, so no vector database is needed.
- **Staleness:** resources are always live. The index is a build artifact; on startup the
  server compares the KB hash and warns if you need to `npm run build:index` again.

## Setup

```bash
cd mcp-server
npm install
npm run build:index        # generate data/index.json from the KB (downloads the model once)
npm test                   # unit + integration tests (offline, hash embedder)
npm run smoke              # end-to-end client over an in-memory transport
```

Offline / no-download build for CI or air-gapped checks: `EMBEDDER=hash npm run build:index`
(uses the deterministic fallback embedder; lower quality, but zero dependencies/network).

Run a transport:

```bash
npm run start:stdio        # stdio (local clients)
PORT=3000 npm run start:http   # streamable HTTP at http://localhost:3000/mcp
```

### Environment variables

| Var | Default | Meaning |
|---|---|---|
| `KB_DIR` | auto-detected | Path to `.claude/knowledge/claude-agents` |
| `EMBEDDER` | `transformers` | `transformers` (local model) or `hash` (offline fallback) |
| `EMBED_MODEL` | `Xenova/multilingual-e5-small` | transformers.js model id |
| `INDEX_PATH` | `data/index.json` | Index location |
| `TRANSFORMERS_OFFLINE` | — | `1` forbids remote model downloads at runtime |
| `PORT` / `MCP_PATH` | `3000` / `/mcp` | HTTP transport |

## Client config (`.mcp.json`)

**Claude Code** — `.mcp.json` in your project (stdio):

```json
{
  "mcpServers": {
    "claude-agents-kb": {
      "command": "npx",
      "args": ["tsx", "src/stdio.ts"],
      "cwd": "./mcp-server"
    }
  }
}
```

**Cursor** — `.cursor/mcp.json` (stdio):

```json
{
  "mcpServers": {
    "claude-agents-kb": {
      "command": "npx",
      "args": ["tsx", "src/stdio.ts"],
      "cwd": "/absolute/path/to/plan-your-agents/mcp-server"
    }
  }
}
```

**Windsurf** — `~/.codeium/windsurf/mcp_config.json` (stdio):

```json
{
  "mcpServers": {
    "claude-agents-kb": {
      "command": "npx",
      "args": ["tsx", "src/stdio.ts"],
      "cwd": "/absolute/path/to/plan-your-agents/mcp-server"
    }
  }
}
```

**Hosted (HTTP)** — any client that supports streamable HTTP:

```json
{
  "mcpServers": {
    "claude-agents-kb": { "type": "http", "url": "http://localhost:3000/mcp" }
  }
}
```

After `npm run build` you can point clients at `node dist/stdio.js` instead of `npx tsx src/stdio.ts`.

## Verify

```bash
npx @modelcontextprotocol/inspector npx tsx src/stdio.ts
```

In the Inspector: **Resources** should list the KB files; call **`search_knowledge`**
with e.g. *"When worktrees instead of subagents?"* and confirm the top hit is
`20-parallelism.md`. `npm run smoke` does the same programmatically.
