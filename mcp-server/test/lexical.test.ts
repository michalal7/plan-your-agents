// BM25 retrieval: tokenization of technical identifiers, ranking, heading boost.
import { describe, it, expect } from "vitest";
import { tokenize, createLexicalSearcher } from "../src/lexical.js";
import { chunkAll } from "../src/chunk.js";
import { resolveKbDir, loadKb } from "../src/kb.js";

describe("tokenize", () => {
  it("keeps technical identifiers whole and also emits their parts", () => {
    expect(tokenize("/kb-update")).toEqual(["kb-update", "kb", "update"]);
    expect(tokenize("settings.json")).toEqual(["settings.json", "settings", "json"]);
  });

  it("strips leading flag dashes and trailing punctuation", () => {
    expect(tokenize("--tmux")).toEqual(["tmux"]);
    expect(tokenize("use a loop.")).toEqual(["use", "a", "loop"]);
  });

  it("keeps single-character flags — `claude -w` must stay findable", () => {
    expect(tokenize("claude -w")).toEqual(["claude", "w"]);
  });

  it("lowercases env-var style keys", () => {
    expect(tokenize("CLAUDE_CODE_AUTO_COMPACT_WINDOW")).toContain(
      "claude_code_auto_compact_window",
    );
  });
});

describe("createLexicalSearcher", () => {
  const chunks = chunkAll(loadKb(resolveKbDir()));
  const searcher = createLexicalSearcher(chunks);

  it("reports its variant", () => {
    expect(searcher.variant).toBe("lexical");
  });

  it("returns nothing for a query with no matching terms", async () => {
    // A single nonsense token: anything with separators would be split into
    // parts that may legitimately occur in the KB.
    expect(await searcher.search("zzzqqqwxyv", 5)).toEqual([]);
  });

  it("respects topK and ranks by descending score", async () => {
    const hits = await searcher.search("verification loop", 3);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(3);
    const scores = hits.map((h) => h.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("finds exact technical tokens — the reason lexical fits this KB", async () => {
    const hits = await searcher.search("worktrees", 5);
    expect(hits.length).toBeGreaterThan(0);
    const blob = hits.map((h) => `${h.chunk.file} ${h.chunk.heading} ${h.chunk.text}`).join(" ");
    expect(blob.toLowerCase()).toContain("worktree");
  });

  it("boosts matches that occur in a heading", async () => {
    const hits = await searcher.search("anti-patterns", 5);
    expect(hits.length).toBeGreaterThan(0);
    const top = hits[0];
    expect(`${top.chunk.heading} ${top.chunk.text}`.toLowerCase()).toContain("anti-pattern");
  });
});
