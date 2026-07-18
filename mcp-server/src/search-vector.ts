// Semantic retrieval — the standalone path. Kept in its own module so the
// lexical plugin bundle never pulls embedding/index code in.
import { searchVec, type IndexData } from "./store.js";
import type { Embedder } from "./embed.js";
import type { Searcher, SearchHit } from "./search.js";

export function createVectorSearcher(index: IndexData, embedder: Embedder): Searcher {
  if (embedder.dims !== index.dims) {
    throw new Error(
      `Runtime embedder "${embedder.name}" (${embedder.dims}d) does not match the ` +
        `index model "${index.model}" (${index.dims}d). Rebuild with the same EMBEDDER.`,
    );
  }
  return {
    variant: "semantic",
    async search(query: string, topK: number): Promise<SearchHit[]> {
      const qv = await embedder.embedQuery(query);
      return searchVec(index, qv, topK);
    },
  };
}
