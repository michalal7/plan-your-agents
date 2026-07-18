// The retrieval abstraction shared by both deployment paths.
//
// Standalone the server retrieves *semantically* (multilingual embeddings, needs
// the model + heavy deps). Shipped inside the Claude Code plugin it retrieves
// *lexically* (BM25, pure JS, no model) — the plugin must stay small and must not
// pull ~1.4 GB of dependencies plus model for a ~200 KB knowledge base.
//
// Both satisfy this interface, so the MCP surface (resources, tool contract,
// output shape, prompt) is identical either way. Deliberately import-free so the
// lexical bundle can never drag vector/embedding code in.
import type { Chunk } from "./chunk.js";

export interface SearchHit {
  score: number;
  chunk: Chunk;
}

export type SearchVariant = "semantic" | "lexical";

export interface Searcher {
  /** Which retrieval strategy this is — surfaced in the server name and tool description. */
  readonly variant: SearchVariant;
  search(query: string, topK: number): Promise<SearchHit[]>;
}
