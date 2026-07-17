// Embedding providers. The default is a small multilingual model that runs
// in-process (transformers.js / ONNX), so the server is fully offline once the
// model is cached. A deterministic hash embedder is used for tests and as a
// zero-dependency fallback.

export interface Embedder {
  name: string;
  dims: number;
  embedQuery(text: string): Promise<number[]>;
  embedPassages(texts: string[]): Promise<number[][]>;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function stripPrefix(t: string): string {
  return t.replace(/^(query|passage):\s*/i, "");
}

/**
 * Deterministic, offline, dependency-free embedder. Signed feature hashing of
 * tokens into a fixed-width L2-normalized vector. Not as good as a real model,
 * but stable and instant — ideal for unit tests and CI without network.
 */
export class HashEmbedder implements Embedder {
  readonly name: string;
  readonly dims: number;
  constructor(dims = 256) {
    this.dims = dims;
    this.name = `hash-${dims}`;
  }
  private embed(text: string): number[] {
    const v = new Array<number>(this.dims).fill(0);
    const toks = stripPrefix(text).toLowerCase().normalize("NFKD").match(/[\p{L}\p{N}]+/gu) ?? [];
    for (const t of toks) {
      const bucket = fnv1a(t) % this.dims;
      const sign = fnv1a("#" + t) & 1 ? 1 : -1;
      v[bucket] += sign;
    }
    let norm = 0;
    for (const x of v) norm += x * x;
    norm = Math.sqrt(norm) || 1;
    return v.map((x) => x / norm);
  }
  async embedQuery(text: string): Promise<number[]> {
    return this.embed(text);
  }
  async embedPassages(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embed(t));
  }
}

/**
 * Multilingual sentence embeddings via transformers.js (ONNX, runs locally).
 * Model default: intfloat/multilingual-e5-small (384 dims), which needs the
 * "query:" / "passage:" prefixes it is applied here.
 */
export class TransformersEmbedder implements Embedder {
  readonly name: string;
  readonly dims = 384;
  // The pipeline is loaded lazily and memoized across calls/requests.
  private pipePromise: Promise<(input: string[], opts: unknown) => Promise<{ tolist(): number[][] }>> | null = null;

  constructor(private model = "Xenova/multilingual-e5-small") {
    this.name = model;
  }

  private load() {
    if (this.pipePromise) return this.pipePromise;
    this.pipePromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      if (process.env.TRANSFORMERS_CACHE) env.cacheDir = process.env.TRANSFORMERS_CACHE;
      if (process.env.TRANSFORMERS_OFFLINE === "1") env.allowRemoteModels = false;
      const pipe = await pipeline("feature-extraction", this.model);
      return pipe as unknown as (input: string[], opts: unknown) => Promise<{ tolist(): number[][] }>;
    })();
    return this.pipePromise;
  }

  private async run(inputs: string[]): Promise<number[][]> {
    const pipe = await this.load();
    const out = await pipe(inputs, { pooling: "mean", normalize: true });
    return out.tolist();
  }

  async embedQuery(text: string): Promise<number[]> {
    return (await this.run([`query: ${text}`]))[0];
  }

  async embedPassages(texts: string[]): Promise<number[][]> {
    const batchSize = 16;
    const res: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize).map((t) => `passage: ${t}`);
      res.push(...(await this.run(batch)));
    }
    return res;
  }
}

/** Pick the embedder from env: EMBEDDER=hash|transformers (default transformers). */
export function createEmbedder(): Embedder {
  const kind = (process.env.EMBEDDER ?? "transformers").toLowerCase();
  if (kind === "hash") return new HashEmbedder();
  return new TransformersEmbedder(process.env.EMBED_MODEL || undefined);
}
