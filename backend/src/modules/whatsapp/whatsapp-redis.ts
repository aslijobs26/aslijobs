import { Redis } from "ioredis";

/** Worker connections may block on Redis; BullMQ requires maxRetriesPerRequest: null. */
export function openWhatsAppWorkerRedis(url: string): Redis {
  const connection = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  connection.on("error", (error: Error) => {
    console.error(`[WhatsApp] redis_error ${error.message}`);
  });
  return connection;
}

/**
 * Producer connections must fail fast so enqueue can fall back inline.
 * enableOfflineQueue:false + finite maxRetriesPerRequest prevents hang-forever.
 */
export function openWhatsAppProducerRedis(url: string): Redis {
  const connection = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    enableReadyCheck: false,
    connectTimeout: 5_000,
  });
  connection.on("error", (error: Error) => {
    console.error(`[WhatsApp] redis_producer_error ${error.message}`);
  });
  return connection;
}

/** Rejects if Redis add() stalls (defensive; producer should already fail fast). */
export async function withQueueEnqueueTimeout<T>(
  operation: Promise<T>,
  timeoutMs = 3_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error("WhatsAppQueueEnqueueTimeout"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * BullMQ rarely throws on duplicate jobId (it returns the existing job).
 * Keep a narrow matcher so unrelated errors are not treated as duplicates.
 */
export function isBullMqDuplicateJobError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /job.*(already exists|duplicated)|duplicated job/i.test(message);
}
