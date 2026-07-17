// Reading the knowledge base from disk. The markdown files are the single source
// of truth; nothing here forks or duplicates their content.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Locate the KB directory. Precedence: explicit arg → KB_DIR env → walk up from
 * this module looking for `.claude/knowledge/claude-agents/INDEX.md`.
 */
export function resolveKbDir(explicit?: string): string {
  const configured = explicit ?? process.env.KB_DIR;
  if (configured) {
    const p = resolve(configured);
    if (!existsSync(join(p, "INDEX.md"))) {
      throw new Error(`KB_DIR "${p}" does not contain INDEX.md`);
    }
    return p;
  }
  let dir = HERE;
  for (let i = 0; i < 10; i++) {
    const cand = join(dir, ".claude", "knowledge", "claude-agents");
    if (existsSync(join(cand, "INDEX.md"))) return cand;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "Could not locate .claude/knowledge/claude-agents. Set KB_DIR to point at it.",
  );
}

/**
 * A file counts as knowledge content (exposed as a resource and indexed) when it
 * is INDEX.md, a PLAYBOOK, or a numbered topic file (00-…, 10-…, …). Maintenance
 * meta (CHANGELOG.md, MAINTENANCE.md, _state.json) is deliberately excluded.
 */
export function isKnowledgeFile(name: string): boolean {
  return (
    name === "INDEX.md" ||
    name.startsWith("PLAYBOOK") ||
    /^\d{2}-.+\.md$/.test(name)
  );
}

export interface KbFile {
  name: string;
  text: string;
}

export function listKnowledgeFiles(kbDir: string): string[] {
  return readdirSync(kbDir)
    .filter((n) => n.endsWith(".md") && isKnowledgeFile(n))
    .sort();
}

export function readKnowledgeFile(kbDir: string, name: string): string {
  if (!isKnowledgeFile(name)) throw new Error(`Not a knowledge file: ${name}`);
  return readFileSync(join(kbDir, name), "utf8");
}

export function loadKb(kbDir: string): KbFile[] {
  return listKnowledgeFiles(kbDir).map((name) => ({
    name,
    text: readFileSync(join(kbDir, name), "utf8"),
  }));
}

/** Stable content hash over all knowledge files — used for staleness detection. */
export function kbHash(files: KbFile[]): string {
  const h = createHash("sha256");
  for (const f of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    h.update(f.name);
    h.update("\0");
    h.update(f.text);
    h.update("\0");
  }
  return h.digest("hex");
}
