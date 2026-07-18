// Lexical retrieval (BM25) — the plugin-shipped path.
//
// Why lexical here: this KB is token-heavy (flag names, /commands, env vars,
// settings keys), where exact-token matching is a strength, not a compromise.
// It needs no model and no dependencies, so the plugin bundle stays tiny, and
// the index is built in memory at startup from the live KB — meaning there is no
// index artifact that can ever go stale.
//
// Trade-off vs the semantic path: BM25 is NOT cross-lingual. The KB is English,
// so queries should be English too — the tool description says so explicitly.
import type { Chunk } from "./chunk.js";
import type { Searcher, SearchHit } from "./search.js";

const K1 = 1.2;
const B = 0.75;
// Headings are the most discriminative text in this KB; the doc title less so.
const HEADING_WEIGHT = 3;
const TITLE_WEIGHT = 2;

/**
 * Tokenize while preserving technical identifiers. `--tmux` → `tmux`,
 * `/kb-update` → `kb-update` (+ `kb`, `update`), `settings.json` →
 * `settings.json` (+ `settings`, `json`), `CLAUDE_CODE_X` → the full key + parts.
 * Emitting both the whole identifier and its parts keeps exact matches ranked
 * high without losing recall on partial queries (the same splitting runs on the
 * query side, so `kb-update` still matches text that only says "update").
 *
 * No stopword list and no minimum length: single-character tokens must survive,
 * because `claude -w` (worktree) tokenizes to `w` and is a real flag in this KB.
 * BM25's IDF already neutralizes ubiquitous words like "a".
 */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  const raw = text.toLowerCase().match(/[a-z0-9][a-z0-9._/+-]*/g) ?? [];
  for (const t0 of raw) {
    const t = t0.replace(/[._/+-]+$/, "");
    if (!t) continue;
    out.push(t);
    if (/[._/-]/.test(t)) {
      for (const part of t.split(/[._/-]+/)) {
        if (part.length >= 2) out.push(part);
      }
    }
  }
  return out;
}

interface Doc {
  chunk: Chunk;
  tf: Map<string, number>;
  len: number;
}

function weightedTokens(chunk: Chunk): string[] {
  const body = tokenize(chunk.text);
  const heading = tokenize(chunk.heading);
  const title = tokenize(chunk.docTitle);
  const out = [...body];
  for (let i = 0; i < HEADING_WEIGHT; i++) out.push(...heading);
  for (let i = 0; i < TITLE_WEIGHT; i++) out.push(...title);
  return out;
}

/** Build a BM25 index over the chunks and expose it as a Searcher. */
export function createLexicalSearcher(chunks: Chunk[]): Searcher {
  const docs: Doc[] = chunks.map((chunk) => {
    const tokens = weightedTokens(chunk);
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { chunk, tf, len: tokens.length };
  });

  const N = docs.length;
  const avgdl = N === 0 ? 0 : docs.reduce((s, d) => s + d.len, 0) / N;

  const df = new Map<string, number>();
  for (const d of docs) {
    for (const term of d.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }

  const idf = (term: string): number => {
    const n = df.get(term) ?? 0;
    if (n === 0) return 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  };

  return {
    variant: "lexical",
    async search(query: string, topK: number): Promise<SearchHit[]> {
      const terms = tokenize(query);
      if (terms.length === 0 || N === 0) return [];

      const hits: SearchHit[] = [];
      for (const d of docs) {
        let score = 0;
        for (const term of terms) {
          const tf = d.tf.get(term);
          if (!tf) continue;
          const norm = tf + K1 * (1 - B + (B * d.len) / (avgdl || 1));
          score += idf(term) * ((tf * (K1 + 1)) / norm);
        }
        if (score > 0) hits.push({ score, chunk: d.chunk });
      }

      hits.sort((a, b) => b.score - a.score);
      return hits.slice(0, topK);
    },
  };
}
