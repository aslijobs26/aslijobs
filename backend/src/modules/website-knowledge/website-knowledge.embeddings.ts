import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { softNormalizeKnowledgeText, tokenizeKnowledgeQuery } from "./website-knowledge.normalize.js";

export const HASH_EMBEDDING_MODEL = "aslijobs-hash-v1";
export const HASH_EMBEDDING_VERSION = 1;
export const HASH_EMBEDDING_DIMS = 256;

/** Multilingual E5 small via Transformers.js — Apache-2.0, 384 dims. */
export const XENOVA_E5_MODEL_ID = "Xenova/multilingual-e5-small";
export const XENOVA_E5_VERSION = 1;
export const XENOVA_E5_DIMS = 384;

/**
 * Lightweight hashed bag-of-tokens embedding (fallback / default when transformers off).
 */
export function embedKnowledgeTextHash(text: string, dims = HASH_EMBEDDING_DIMS): number[] {
  const tokens = tokenizeKnowledgeQuery(softNormalizeKnowledgeText(text) || text);
  const vec = new Array<number>(dims).fill(0);
  if (tokens.length === 0) return vec;
  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();
    const index = digest.readUInt16BE(0) % dims;
    const sign = digest[2]! & 1 ? 1 : -1;
    vec[index]! += sign;
    if (token.length >= 3) {
      const tri = createHash("sha256").update(`3:${token.slice(0, 3)}`).digest();
      const tIndex = tri.readUInt16BE(0) % dims;
      vec[tIndex]! += tri[2]! & 1 ? 0.5 : -0.5;
    }
  }
  return l2Normalize(vec);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na <= 0 || nb <= 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function l2Normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  if (sum <= 0) return vec;
  const inv = 1 / Math.sqrt(sum);
  return vec.map((v) => v * inv);
}

export type EmbeddingProviderName = "hash" | "xenova" | "none";

export function resolveEmbeddingProvider(enabled: boolean, configured?: string): EmbeddingProviderName {
  if (!enabled) return "none";
  const name = (configured || "hash").trim().toLowerCase();
  if (name === "xenova" || name === "transformers" || name === "e5" || name === "hf") {
    return "xenova";
  }
  if (name === "hash") return "hash";
  return "hash";
}

export function expectedEmbeddingModelForProvider(provider: EmbeddingProviderName): string {
  if (provider === "xenova") return XENOVA_E5_MODEL_ID;
  if (provider === "hash") return HASH_EMBEDDING_MODEL;
  return "";
}

export function expectedEmbeddingDimsForProvider(provider: EmbeddingProviderName): number {
  if (provider === "xenova") return XENOVA_E5_DIMS;
  if (provider === "hash") return HASH_EMBEDDING_DIMS;
  return 0;
}

export function embeddingsCompatible(input: {
  embedding?: number[];
  embeddingModel?: string;
  provider: EmbeddingProviderName;
}): boolean {
  if (input.provider === "none") return false;
  const expectedModel = expectedEmbeddingModelForProvider(input.provider);
  const expectedDims = expectedEmbeddingDimsForProvider(input.provider);
  if (!input.embedding?.length || input.embedding.length !== expectedDims) return false;
  if (!input.embeddingModel || input.embeddingModel !== expectedModel) return false;
  return true;
}

type PipelineFn = (
  texts: string | string[],
  options?: { pooling?: string; normalize?: boolean },
) => Promise<{ data: Float32Array | number[]; dims?: number[] }>;

let xenovaPipeline: PipelineFn | null = null;
let xenovaLoadError: string | null = null;
let xenovaLoading: Promise<PipelineFn | null> | null = null;
let onnxRedirectInstalled = false;
let lastLoadMs: number | null = null;
let lastInferMs: number | null = null;
let backendMode: "wasm" | "native" | "unknown" = "unknown";

/** Bound concurrent transformer inference (CPU / memory safety). */
const MAX_INFER_CONCURRENCY = 2;
let inferInFlight = 0;
const inferWaiters: Array<() => void> = [];

async function withInferSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (inferInFlight >= MAX_INFER_CONCURRENCY) {
    await new Promise<void>((resolve) => {
      inferWaiters.push(resolve);
    });
  }
  inferInFlight += 1;
  try {
    return await fn();
  } finally {
    inferInFlight -= 1;
    const next = inferWaiters.shift();
    if (next) next();
  }
}

/**
 * Node 20+/24 on Windows often fails to dlopen onnxruntime-node (ERR_DLOPEN_FAILED).
 * Force WASM via onnxruntime-web with local file:// wasmPaths (https:// is blocked in Node).
 */
function installOnnxWebRedirect(): { wasmPaths: string; entry: string } {
  const require = createRequire(import.meta.url);
  const wasmEntry = require.resolve("onnxruntime-web");
  const wasmDir = path.dirname(wasmEntry);
  const wasmPaths = pathToFileURL(wasmDir.endsWith(path.sep) ? wasmDir : `${wasmDir}${path.sep}`).href;

  if (!onnxRedirectInstalled) {
    // Node's Module._load is untyped in @types/node for ESM interop.
    const moduleAny = Module as unknown as {
      _load: (request: string, parent: unknown, isMain: boolean) => unknown;
    };
    const origLoad = moduleAny._load.bind(Module);
    moduleAny._load = function patchedLoad(
      request: string,
      parent: unknown,
      isMain: boolean,
    ) {
      const normalized = String(request || "").replace(/\\/g, "/");
      if (
        normalized === "onnxruntime-node"
        || (normalized.includes("onnxruntime-node") && !normalized.includes("onnxruntime-web"))
      ) {
        return origLoad(wasmEntry, parent, isMain);
      }
      return origLoad(request, parent, isMain);
    };
    onnxRedirectInstalled = true;
  }

  return { wasmPaths, entry: wasmEntry };
}

export function getEmbeddingProviderHealth(): {
  provider: EmbeddingProviderName;
  model: string;
  dims: number;
  ready: boolean;
  error: string | null;
  backend?: string;
  lastLoadMs?: number | null;
  lastInferMs?: number | null;
  inferInFlight?: number;
} {
  const ready = Boolean(xenovaPipeline) || !xenovaLoadError;
  return {
    provider: xenovaPipeline ? "xenova" : "hash",
    model: xenovaPipeline ? XENOVA_E5_MODEL_ID : HASH_EMBEDDING_MODEL,
    dims: xenovaPipeline ? XENOVA_E5_DIMS : HASH_EMBEDDING_DIMS,
    ready,
    error: xenovaLoadError,
    backend: xenovaPipeline ? backendMode : "hash",
    lastLoadMs,
    lastInferMs,
    inferInFlight,
  };
}

export async function warmXenovaEmbeddingModel(): Promise<boolean> {
  const pipe = await loadXenovaPipeline();
  return Boolean(pipe);
}

export function resetXenovaEmbeddingStateForTests(): void {
  xenovaPipeline = null;
  xenovaLoadError = null;
  xenovaLoading = null;
  lastLoadMs = null;
  lastInferMs = null;
  backendMode = "unknown";
}

async function loadXenovaPipeline(): Promise<PipelineFn | null> {
  if (xenovaPipeline) return xenovaPipeline;
  if (xenovaLoading) return xenovaLoading;
  xenovaLoading = (async () => {
    const started = Date.now();
    try {
      const { wasmPaths } = installOnnxWebRedirect();
      // Prefer maintained @huggingface/transformers; fall back to legacy @xenova/transformers.
      let pipe: PipelineFn | null = null;
      try {
        const mod = await import("@huggingface/transformers");
        if (mod.env) {
          mod.env.allowLocalModels = false;
          mod.env.useBrowserCache = false;
          if (mod.env.backends?.onnx?.wasm) {
            mod.env.backends.onnx.wasm.numThreads = 1;
            mod.env.backends.onnx.wasm.wasmPaths = wasmPaths;
          }
        }
        pipe = (await mod.pipeline(
          "feature-extraction",
          XENOVA_E5_MODEL_ID,
        )) as unknown as PipelineFn;
        backendMode = "wasm";
      } catch (hfError) {
        const legacy = await import("@xenova/transformers");
        if (legacy.env) {
          legacy.env.allowLocalModels = true;
          legacy.env.useBrowserCache = false;
        }
        pipe = (await legacy.pipeline(
          "feature-extraction",
          XENOVA_E5_MODEL_ID,
        )) as unknown as PipelineFn;
        backendMode = "native";
        // Preserve primary error context if both fail later.
        void hfError;
      }
      xenovaPipeline = pipe;
      xenovaLoadError = null;
      lastLoadMs = Date.now() - started;
      console.info(
        `[website-knowledge] e5_model_ready model=${XENOVA_E5_MODEL_ID} backend=${backendMode} loadMs=${lastLoadMs}`,
      );
      return pipe;
    } catch (error) {
      xenovaLoadError = error instanceof Error ? error.message : "xenova_load_failed";
      xenovaPipeline = null;
      lastLoadMs = Date.now() - started;
      console.warn(
        `[website-knowledge] e5_model_unavailable loadMs=${lastLoadMs} error=${xenovaLoadError.slice(0, 200)}`,
      );
      return null;
    } finally {
      xenovaLoading = null;
    }
  })();
  return xenovaLoading;
}

function extractVector(output: { data: Float32Array | number[]; dims?: number[] }): number[] | null {
  const data = Array.from(output.data as ArrayLike<number>);
  if (data.length === 0) return null;
  if (data.length === XENOVA_E5_DIMS) return l2Normalize(data);
  if (data.length > XENOVA_E5_DIMS && data.length % XENOVA_E5_DIMS === 0) {
    return l2Normalize(data.slice(0, XENOVA_E5_DIMS));
  }
  return null;
}

async function embedWithXenova(text: string): Promise<number[] | null> {
  const pipe = await loadXenovaPipeline();
  if (!pipe) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const prefixed =
    trimmed.startsWith("query:") || trimmed.startsWith("passage:")
      ? trimmed
      : `passage: ${trimmed}`;

  return withInferSlot(async () => {
    const t0 = Date.now();
    const output = await pipe(prefixed.slice(0, 2_000), {
      pooling: "mean",
      normalize: true,
    });
    lastInferMs = Date.now() - t0;
    const vector = extractVector(output);
    if (!vector || vector.length !== XENOVA_E5_DIMS) return null;
    return vector;
  });
}

export async function embedKnowledgeText(input: {
  text: string;
  enabled: boolean;
  provider?: string;
  asQuery?: boolean;
}): Promise<{ vector: number[]; model: string; version: number; provider: EmbeddingProviderName } | null> {
  const provider = resolveEmbeddingProvider(input.enabled, input.provider);
  if (provider === "none") return null;

  if (provider === "xenova") {
    const text = input.asQuery ? `query: ${input.text}` : input.text;
    try {
      const vector = await embedWithXenova(text);
      if (vector) {
        return {
          vector,
          model: XENOVA_E5_MODEL_ID,
          version: XENOVA_E5_VERSION,
          provider: "xenova",
        };
      }
    } catch (error) {
      xenovaLoadError = error instanceof Error ? error.message : "xenova_infer_failed";
      console.warn(
        `[website-knowledge] e5_infer_failed error=${xenovaLoadError.slice(0, 160)}`,
      );
    }
    // Do not write a hash vector into an E5 index. Callers keep lexical retrieval.
    return null;
  }

  return {
    vector: embedKnowledgeTextHash(input.text),
    model: HASH_EMBEDDING_MODEL,
    version: HASH_EMBEDDING_VERSION,
    provider: "hash",
  };
}

export async function embedKnowledgeTextsBatch(input: {
  texts: string[];
  enabled: boolean;
  provider?: string;
  batchSize?: number;
}): Promise<Array<{ vector: number[]; model: string; version: number; provider: EmbeddingProviderName } | null>> {
  const size = Math.max(1, input.batchSize ?? 8);
  const out: Array<{ vector: number[]; model: string; version: number; provider: EmbeddingProviderName } | null> = [];
  for (let i = 0; i < input.texts.length; i += size) {
    const slice = input.texts.slice(i, i + size);
    const embedded = await Promise.all(
      slice.map((text) =>
        embedKnowledgeText({
          text,
          enabled: input.enabled,
          provider: input.provider,
        }),
      ),
    );
    out.push(...embedded);
  }
  return out;
}
