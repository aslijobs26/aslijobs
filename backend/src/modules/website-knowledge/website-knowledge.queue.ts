import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";
import { env } from "../../config/env.js";
import {
  openWhatsAppProducerRedis,
  openWhatsAppWorkerRedis,
} from "../whatsapp/whatsapp-redis.js";
import { syncWebsiteKnowledge, isWebsiteKnowledgeSyncRunning } from "./website-knowledge.sync.js";
import { bumpKnowledgeMetric } from "./website-knowledge.metrics.js";

const QUEUE_NAME = "website-knowledge-sync";
const LOCK_KEY = "website-knowledge:sync-lock";

let queue: Queue | null = null;
let queueConnection: Redis | null = null;
let worker: Worker | null = null;
let workerConnection: Redis | null = null;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let workerStatus: "idle" | "running" | "disabled" = "disabled";
let lockConnection: Redis | null = null;

export function getWebsiteKnowledgeWorkerStatus(): "idle" | "running" | "disabled" {
  if (!env.WEBSITE_KNOWLEDGE_AUTO_SYNC_ENABLED) return "disabled";
  return workerStatus;
}

function getQueue(): Queue | null {
  if (!env.REDIS_URL.trim()) return null;
  if (!queue) {
    queueConnection = openWhatsAppProducerRedis(env.REDIS_URL);
    queue = new Queue(QUEUE_NAME, { connection: queueConnection });
  }
  return queue;
}

async function withDistributedLock(run: () => Promise<void>): Promise<boolean> {
  if (!env.REDIS_URL.trim()) {
    if (isWebsiteKnowledgeSyncRunning()) return false;
    await run();
    return true;
  }
  if (!lockConnection) {
    lockConnection = openWhatsAppProducerRedis(env.REDIS_URL);
  }
  const token = `${process.pid}-${Date.now()}`;
  const ok = await lockConnection.set(
    LOCK_KEY,
    token,
    "PX",
    Math.max(30_000, env.WEBSITE_KNOWLEDGE_MAX_CRAWL_DURATION_MS + 15_000),
    "NX",
  );
  if (ok !== "OK") return false;
  try {
    await run();
  } finally {
    const current = await lockConnection.get(LOCK_KEY);
    if (current === token) await lockConnection.del(LOCK_KEY);
  }
  return true;
}

export async function enqueueWebsiteKnowledgeSync(input?: {
  crawl?: boolean;
  reason?: string;
}): Promise<{ queued: boolean; inline?: boolean }> {
  const crawl = input?.crawl ?? env.WEBSITE_KNOWLEDGE_CRAWL_ENABLED;
  const activeQueue = getQueue();
  if (!activeQueue) {
    workerStatus = "running";
    try {
      await withDistributedLock(async () => {
        await syncWebsiteKnowledge({
          frontendOrigin: env.FRONTEND_URL,
          crawlEnabled: crawl,
          persistMongo: true,
          timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
          maxPages: env.WEBSITE_KNOWLEDGE_MAX_PAGES,
          maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
          concurrency: env.WEBSITE_KNOWLEDGE_CRAWL_CONCURRENCY,
          maxDurationMs: env.WEBSITE_KNOWLEDGE_MAX_CRAWL_DURATION_MS,
          fetchSitemap: true,
          semanticEnabled: env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED,
          embeddingProvider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
          browserFallbackEnabled: env.WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED,
        });
      });
    } finally {
      workerStatus = env.WEBSITE_KNOWLEDGE_AUTO_SYNC_ENABLED ? "idle" : "disabled";
    }
    return { queued: false, inline: true };
  }
  await activeQueue.add(
    "sync",
    { crawl, reason: input?.reason || "manual" },
    {
      jobId: `knowledge-sync-${Date.now()}`,
      removeOnComplete: 20,
      removeOnFail: 40,
      attempts: env.WEBSITE_KNOWLEDGE_SYNC_MAX_RETRIES,
      backoff: { type: "exponential", delay: 5_000 },
    },
  );
  bumpKnowledgeMetric("sync_enqueued");
  return { queued: true };
}

export function startWebsiteKnowledgeRuntime(): () => Promise<void> {
  if (env.NODE_ENV === "test" || !env.WEBSITE_KNOWLEDGE_AUTO_SYNC_ENABLED) {
    workerStatus = "disabled";
    return async () => undefined;
  }

  workerStatus = "idle";

  if (env.REDIS_URL.trim() && !worker) {
    workerConnection = openWhatsAppWorkerRedis(env.REDIS_URL);
    worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        workerStatus = "running";
        const crawl = Boolean(job.data?.crawl ?? env.WEBSITE_KNOWLEDGE_CRAWL_ENABLED);
        try {
          await withDistributedLock(async () => {
            const status = await syncWebsiteKnowledge({
              frontendOrigin: env.FRONTEND_URL,
              crawlEnabled: crawl,
              persistMongo: true,
              timeoutMs: env.WEBSITE_KNOWLEDGE_FETCH_TIMEOUT_MS,
              maxPages: env.WEBSITE_KNOWLEDGE_MAX_PAGES,
              maxBytes: env.WEBSITE_KNOWLEDGE_MAX_RESPONSE_BYTES,
              concurrency: env.WEBSITE_KNOWLEDGE_CRAWL_CONCURRENCY,
              maxDurationMs: env.WEBSITE_KNOWLEDGE_MAX_CRAWL_DURATION_MS,
              fetchSitemap: true,
              semanticEnabled: env.WEBSITE_KNOWLEDGE_SEMANTIC_ENABLED,
              embeddingProvider: env.WEBSITE_KNOWLEDGE_EMBEDDING_PROVIDER,
              browserFallbackEnabled: env.WEBSITE_KNOWLEDGE_BROWSER_FALLBACK_ENABLED,
            });
            console.info(
              `[website-knowledge] auto_sync discovered=${status.discovered} updated=${status.updated} failed=${status.failed} crawl=${status.crawlEnabled}`,
            );
          });
        } finally {
          workerStatus = "idle";
        }
      },
      { connection: workerConnection, concurrency: 1 },
    );
    worker.on("failed", (job, error) => {
      console.error(
        `[website-knowledge] worker_failed job=${job?.id ?? "-"} reason=${error.name}`,
      );
      bumpKnowledgeMetric("sync_worker_failed");
    });
  }

  if (env.WEBSITE_KNOWLEDGE_SYNC_AT_STARTUP) {
    void enqueueWebsiteKnowledgeSync({ reason: "startup" }).catch((error) => {
      console.error(
        `[website-knowledge] startup_sync_failed reason=${error instanceof Error ? error.name : "unknown"}`,
      );
    });
  }

  const intervalMs = env.WEBSITE_KNOWLEDGE_SYNC_INTERVAL_MS;
  schedulerTimer = setInterval(() => {
    void enqueueWebsiteKnowledgeSync({ reason: "schedule" }).catch(() => undefined);
  }, intervalMs);
  schedulerTimer.unref?.();

  return async () => {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
    if (worker) {
      await worker.close();
      worker = null;
    }
    if (workerConnection) {
      try {
        await workerConnection.quit();
      } catch {
        workerConnection.disconnect();
      }
      workerConnection = null;
    }
    if (queue) {
      await queue.close();
      queue = null;
    }
    if (queueConnection) {
      try {
        await queueConnection.quit();
      } catch {
        queueConnection.disconnect();
      }
      queueConnection = null;
    }
    if (lockConnection) {
      try {
        await lockConnection.quit();
      } catch {
        lockConnection.disconnect();
      }
      lockConnection = null;
    }
    workerStatus = "disabled";
  };
}
