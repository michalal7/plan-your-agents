import { describe, it, expect } from "vitest";
import { chunkFile, chunkAll } from "../src/chunk.js";
import type { KbFile } from "../src/kb.js";

const sample: KbFile = {
  name: "20-parallelism.md",
  text: [
    "# Parallelism: Subagents, Worktrees",
    "",
    "Intro paragraph about parallelism.",
    "",
    "## Subagents",
    "Isolated context per subagent.",
    "",
    "## Worktrees",
    "Separate working copies via git worktree.",
    "",
  ].join("\n"),
};

describe("chunkFile", () => {
  it("splits into one chunk per ## section plus the intro", () => {
    const chunks = chunkFile(sample);
    expect(chunks.map((c) => c.heading)).toEqual(["", "Subagents", "Worktrees"]);
  });

  it("carries the document H1 title on every chunk", () => {
    const chunks = chunkFile(sample);
    for (const c of chunks) {
      expect(c.docTitle).toBe("Parallelism: Subagents, Worktrees");
      expect(c.file).toBe("20-parallelism.md");
    }
  });

  it("keeps the heading in display text and in the embed input", () => {
    const sub = chunkFile(sample).find((c) => c.heading === "Subagents")!;
    expect(sub.text).toContain("## Subagents");
    expect(sub.text).toContain("Isolated context");
    expect(sub.embedInput).toContain("Parallelism"); // docTitle
    expect(sub.embedInput).toContain("Subagents"); // heading
  });

  it("produces stable, unique ids", () => {
    const ids = chunkAll([sample]).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("20-parallelism.md#subagents");
  });
});
