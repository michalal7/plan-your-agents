import { describe, it, expect } from "vitest";
import { resolveKbDir } from "../src/kb.js";
import { buildIndex, searchVec, isStale } from "../src/store.js";
import { HashEmbedder } from "../src/embed.js";

describe("index + search (hash embedder, offline)", () => {
  const kbDir = resolveKbDir();
  const embedder = new HashEmbedder();

  it("builds an index with one vector per chunk", async () => {
    const index = await buildIndex(kbDir, embedder);
    expect(index.chunks.length).toBeGreaterThan(10);
    expect(index.vectors.length).toBe(index.chunks.length);
    expect(index.dims).toBe(embedder.dims);
    expect(index.vectors[0].length).toBe(embedder.dims);
  });

  it("retrieves a topically relevant file for a keyword-rich query", async () => {
    const index = await buildIndex(kbDir, embedder);
    const qv = await embedder.embedQuery("worktrees subagents agent teams parallelism");
    const hits = searchVec(index, qv, 5);
    expect(hits[0].score).toBeGreaterThan(0);
    expect(hits.some((h) => h.chunk.file === "20-parallelism.md")).toBe(true);
  });

  it("detects staleness when the KB hash no longer matches", async () => {
    const index = await buildIndex(kbDir, embedder);
    expect(isStale(index, kbDir)).toBe(false);
    expect(isStale({ ...index, kbHash: "deadbeef" }, kbDir)).toBe(true);
  });

  it("rejects a query vector whose dims do not match the index", async () => {
    const index = await buildIndex(kbDir, embedder);
    expect(() => searchVec(index, [0, 1, 2], 3)).toThrow(/dims/);
  });
});
