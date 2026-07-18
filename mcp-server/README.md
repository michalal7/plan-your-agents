# claude-agents-kb — MCP server

Exposes the `claude-agents` knowledge base (under `.claude/knowledge/claude-agents/`)
to any MCP client — Claude Code, Cursor, Windsurf, other agents — with **semantic
search**. It is an *additive* companion to the `/setup-dev-agents` and `/setup-task-agents`
skills: the skills are the Claude-native path, this server is the portable, hostable one.

The knowledge base markdown files remain the **single source of truth**. This server
reads from them; it never forks or duplicates their content, so the KB, `/kb-update`,
and this server stay in sync.

## MCP surface

- **Resources** — every KB file (`INDEX`, `PLAYBOOK`, `00`–`90`) as `kb://claude-agents/<file>.md`,
  read live from disk. (Maintenance meta — `CHANGELOG`, `MAINTENANCE`, `_state.json` — is excluded.)
- **Tool `search_knowledge(query, topK?)`** — search over the KB (chunked per `##` section).
  Returns the most relevant sections with their source file + heading. Retrieval only —
  the reasoning stays in your client model.
- **Prompt `setup-agents(repo?, mode?)`** — mirrors the PLAYBOOK flow (decision tree →
  verification-loop-first → minimal setup) so prompt-capable clients get the same guided
  flow. The server supplies knowledge; it does not plan.

## Two deployment paths, one MCP contract

Same resources, same tool name, same output shape, same prompt — only the retrieval
strategy and the server name differ, so a client can always tell which is running.

| | **Standalone** | **Shipped in the plugin** |
|---|---|---|
| Server name | `claude-agents-kb` | `claude-agents-kb-lexical` |
| Retrieval | semantic (multilingual embeddings) | lexical BM25 |
| Entry | `src/stdio.ts` / `src/http.ts` | `bundle/plugin-server.mjs` |
| Needs | `npm install` + model (~1.4 GB), prebuilt index | nothing — one 719 KB file |
| Queries | any language | **English** (BM25 is not cross-lingual) |

Why the plugin path is lexical: embeddings would drag ~925 MB of dependencies plus a
~465 MB model into a plugin whose knowledge base is ~200 KB. This KB is also token-heavy
(flag names, `/commands`, env vars), where exact-token matching is a strength. The BM25
index is built in memory from the live KB at startup, so there is **no index artifact that
can go stale**.

The bundle is a committed generated artifact — rebuild with `npm run build:bundle`, verify
with `npm run check:bundle`, and smoke-test the real subprocess with `npm run smoke:bundle`.
Never edit `bundle/plugin-server.mjs` by hand.

### How the plugin wires it up
Via **`.mcp.json` in the plugin root** (repo root), pointing at
`${CLAUDE_PLUGIN_ROOT}/mcp-server/bundle/plugin-server.mjs`.

> Verified the hard way: declaring `mcpServers` in `.claude-plugin/plugin.json` — both as an
> inline object and as a `"./mcp-config.json"` path, as the manifest field table suggests —
> left `claude plugin details` reporting `MCP servers (0)`. Only the auto-discovered
> `.mcp.json` at the plugin root registered the server. If you move this config, re-check the
> inventory rather than trusting the manifest field.

The output is `.mjs`, not `.js`, on purpose: Node only treats `.js` as ESM when a neighbouring
package.json says `"type": "module"`, and a self-contained bundle must not depend on that.

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
