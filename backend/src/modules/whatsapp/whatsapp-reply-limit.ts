import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { openWhatsAppProducerRedis, withQueueEnqueueTimeout } from "./whatsapp-redis.js";
import type { Redis } from "ioredis";

/** 20 replies per phone per minute. The 21st is one notice. Later ones stay quiet. */
export const WHATSAPP_REPLY_LIMIT = 20;
const WINDOW_MS = 60_000;

export type ReplySlot = "allow" | "notice" | "drop";

/** Redis TTL -1 means the key has no expiry. Retry EXPIRE instead of leaving a permanent block. */
export function replyWindowNeedsExpire(ttlSeconds: number): boolean {
  return !Number.isFinite(ttlSeconds) || ttlSeconds < 0;
}

export function decideReplySlot(count: number): ReplySlot {
  if (count <= WHATSAPP_REPLY_LIMIT) return "allow";
  if (count === WHATSAPP_REPLY_LIMIT + 1) return "notice";
  return "drop";
}

type MemoryBucket = { hits: number[] };

export function createMemoryReplyLimiter(now: () => number = Date.now) {
  const buckets = new Map<string, MemoryBucket>();
  return {
    consume(phone: string): ReplySlot {
      const start = now() - WINDOW_MS;
      const bucket = buckets.get(phone) ?? { hits: [] };
      bucket.hits = bucket.hits.filter((time) => time > start);
      bucket.hits.push(now());
      buckets.set(phone, bucket);
      if (buckets.size > 5_000) {
        for (const [key, value] of buckets) {
          value.hits = value.hits.filter((time) => time > start);
          if (value.hits.length === 0) buckets.delete(key);
        }
      }
      return decideReplySlot(bucket.hits.length);
    },
  };
}

const memoryLimiter = createMemoryReplyLimiter();
let limitRedis: Redis | null = null;

function limitConnection(): Redis | null {
  if (!env.REDIS_URL.trim()) return null;
  if (!limitRedis) {
    limitRedis = openWhatsAppProducerRedis(env.REDIS_URL);
  }
  return limitRedis;
}

function phoneKey(phone: string): string {
  const hash = createHash("sha256").update(phone).digest("hex").slice(0, 16);
  return `wa:replies:${hash}`;
}

/** Redis increment, or the in-process window when that increment throws. */
export async function consumeCountedSlot(
  phone: string,
  incr: () => Promise<number>,
): Promise<ReplySlot> {
  try {
    return decideReplySlot(await incr());
  } catch (error) {
    console.error(
      `[WhatsApp] reply_limit_redis_failed reason=${error instanceof Error ? error.name : "unknown"}`,
    );
    return memoryLimiter.consume(phone);
  }
}

/**
 * Shared counter when Redis is up. A Redis error uses the in-process window
 * so a cache outage does not mute the bot or throw on the webhook path.
 */
export async function consumeWhatsAppReplySlot(phone: string): Promise<ReplySlot> {
  const client = limitConnection();
  if (!client) return memoryLimiter.consume(phone);
  const key = phoneKey(phone);
  return consumeCountedSlot(phone, async () => {
    const count = await withQueueEnqueueTimeout(client.incr(key), 400);
    const ttl = await client.ttl(key).catch(() => -1);
    if (count === 1 || replyWindowNeedsExpire(ttl)) {
      await client.expire(key, 60).catch(() => undefined);
    }
    return count;
  });
}
