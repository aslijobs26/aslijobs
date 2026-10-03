import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { JOB_CONTENT_LANGUAGES, type JobContentLanguage } from "./job-content-language.js";
import {
  jobTranslationCacheKey,
  jobTranslationSourceHash,
} from "./job-translation.policy.js";

export type CachedJobTranslation = {
  sourceHash: string;
  jobTitle: string;
  description: string;
  interviewInstructions: string;
};

let cacheClient: Redis | null = null;
let cacheDisabled = false;

function getCacheClient(): Redis | null {
  if (cacheDisabled || !env.REDIS_URL.trim()) {
    return null;
  }
  if (!cacheClient) {
    cacheClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 800,
      commandTimeout: 800,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    cacheClient.on("error", () => {
      cacheDisabled = true;
    });
  }
  return cacheClient;
}

async function withCacheTimeout<T>(work: () => Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 400);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function readCachedJobTranslation(
  jobMongoId: string,
  language: JobContentLanguage,
): Promise<CachedJobTranslation | null> {
  const client = getCacheClient();
  if (!client) {
    return null;
  }
  const raw = await withCacheTimeout(() =>
    client.get(jobTranslationCacheKey(jobMongoId, language)),
  );
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<CachedJobTranslation>;
    if (!parsed.sourceHash || typeof parsed.jobTitle !== "string") {
      return null;
    }
    return {
      sourceHash: parsed.sourceHash,
      jobTitle: parsed.jobTitle,
      description: typeof parsed.description === "string" ? parsed.description : "",
      interviewInstructions:
        typeof parsed.interviewInstructions === "string"
          ? parsed.interviewInstructions
          : "",
    };
  } catch {
    return null;
  }
}

export async function writeCachedJobTranslation(
  jobMongoId: string,
  language: JobContentLanguage,
  value: CachedJobTranslation,
): Promise<void> {
  const client = getCacheClient();
  if (!client) {
    return;
  }
  try {
    await client.set(
      jobTranslationCacheKey(jobMongoId, language),
      JSON.stringify(value),
      "EX",
      env.JOB_TRANSLATION_CACHE_TTL_SECONDS,
    );
  } catch {
    cacheDisabled = true;
  }
}

export async function invalidateJobTranslationCache(jobMongoId: string): Promise<void> {
  const client = getCacheClient();
  if (!client) {
    return;
  }
  try {
    const keys = JOB_CONTENT_LANGUAGES.map((language) =>
      jobTranslationCacheKey(jobMongoId, language),
    );
    await client.del(...keys);
  } catch {
    cacheDisabled = true;
  }
}

export function cachedTranslationMatchesSource(
  cached: CachedJobTranslation | null,
  source: {
    jobTitle: string;
    description: string;
    interviewInstructions: string;
  },
): cached is CachedJobTranslation {
  if (!cached) {
    return false;
  }
  return cached.sourceHash === jobTranslationSourceHash(source);
}

export async function closeJobTranslationCache(): Promise<void> {
  if (!cacheClient) {
    return;
  }
  const client = cacheClient;
  cacheClient = null;
  cacheDisabled = false;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}
