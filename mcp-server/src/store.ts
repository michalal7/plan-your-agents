// The vector index: a flat JSON file with chunks + normalized vectors, searched
// by brute-force cosine in memory. The KB is small (~dozens of chunks), so this
// stays instant and needs no vector database. The index is a build artifact
// generated from the KB markdown — never edited by hand.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chunkAll, type Chunk } from "./chunk.js";
import { loadKb, kbHash } from "./kb.js";
import type { Embedder } from "./embed.js";

const HERE = dirname(fileURLToPath(import.meta.url));

export interface IndexData {
  version: 1;
  model: string;
  dims: number;
  kbHash: string;
  builtAt: string;
  chunks: Chunk[];
  vectors: number[][];
}

export function defaultIndexPath(): string {
  return process.env.INDEX_PATH
    ? resolve(process.env.INDEX_PATH)
    : resolve(HERE, "..", "data", "index.json");
}

export async function buildIndex(kbDir: string, embedder: Embedder): Promise<IndexData> {
  const files = loadKb(kbDir);
  const chunks = chunkAll(files);
  const vectors = await embedder.embedPassages(chunks.map((c) => c.embedInput));
  return {
    version: 1,
    model: embedder.name,
    dims: embedder.dims,
    kbHash: kbHash(files),
    builtAt: new Date().toISOString(),
    chunks,
    vectors,
  };
}

export function saveIndex(path: string, data: IndexData): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
}

export function loadIndex(path: string): IndexData {
  return JSON.parse(readFileSync(path, "utf8")) as IndexData;
}

/** True when the KB on disk no longer matches what the index was built from. */
export function isStale(data: IndexData, kbDir: string): boolean {
  return data.kbHash !== kbHash(loadKb(kbDir));
}

export function warnIfStale(data: IndexData, kbDir: string): boolean {
  if (isStale(data, kbDir)) {
    process.stderr.write(
      "[claude-agents-kb] WARNING: search index is stale vs the KB. Run `npm run build:index`.\n",
    );
    return true;
  }
  return false;
}

export interface SearchHit {
  score: number;
  chunk: Chunk;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/** Cosine similarity (vectors are stored L2-normalized, so this is a dot product). */
export function searchVec(data: IndexData, queryVec: number[], topK = 5): SearchHit[] {
  if (queryVec.length !== data.dims) {
    throw new Error(
      `Query vector has ${queryVec.length} dims but index has ${data.dims}. ` +
        `Rebuild the index with the same embedder the server runs (EMBEDDER).`,
    );
  }
  const hits = data.vectors.map((v, i) => ({ score: dot(v, queryVec), chunk: data.chunks[i] }));
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, topK);
}
