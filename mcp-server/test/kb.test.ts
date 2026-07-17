import { describe, it, expect } from "vitest";
import {
  isKnowledgeFile,
  resolveKbDir,
  listKnowledgeFiles,
  loadKb,
  kbHash,
} from "../src/kb.js";

describe("isKnowledgeFile", () => {
  it("accepts INDEX, PLAYBOOK and numbered topic files", () => {
    expect(isKnowledgeFile("INDEX.md")).toBe(true);
    expect(isKnowledgeFile("PLAYBOOK-agent-design.md")).toBe(true);
    expect(isKnowledgeFile("00-principles.md")).toBe(true);
    expect(isKnowledgeFile("90-deprecated.md")).toBe(true);
  });

  it("rejects maintenance meta and non-markdown", () => {
    expect(isKnowledgeFile("CHANGELOG.md")).toBe(false);
    expect(isKnowledgeFile("MAINTENANCE.md")).toBe(false);
    expect(isKnowledgeFile("_state.json")).toBe(false);
  });
});

describe("KB on disk", () => {
  const kbDir = resolveKbDir();

  it("lists the expected knowledge files", () => {
    const files = listKnowledgeFiles(kbDir);
    expect(files).toContain("INDEX.md");
    expect(files).toContain("PLAYBOOK-agent-design.md");
    expect(files.some((f) => /^\d{2}-/.test(f))).toBe(true);
    expect(files).not.toContain("CHANGELOG.md");
  });

  it("hash is stable across reads and content-sensitive", () => {
    const files = loadKb(kbDir);
    expect(kbHash(files)).toBe(kbHash(loadKb(kbDir)));
    const mutated = files.map((f, i) => (i === 0 ? { ...f, text: f.text + "x" } : f));
    expect(kbHash(mutated)).not.toBe(kbHash(files));
  });
});
