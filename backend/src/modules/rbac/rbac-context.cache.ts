/**
 * Process-local TTL cache for resolved member RBAC contexts.
 * Avoids Redis dependency while cutting duplicate Member+Role reads on busy
 * workspace sessions. Invalidated explicitly on role/member permission changes.
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

const memberContextCache = new Map<string, CacheEntry<unknown>>();

function cacheKey(employerId: string, memberId: string): string {
  return `${employerId}:${memberId}`;
}

export function getCachedMemberRbacContext<T>(
  employerId: string,
  memberId: string,
): T | null {
  const key = cacheKey(employerId, memberId);
  const entry = memberContextCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    memberContextCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCachedMemberRbacContext<T>(
  employerId: string,
  memberId: string,
  value: T,
  ttlMs = DEFAULT_TTL_MS,
): void {
  if (memberContextCache.size >= MAX_ENTRIES) {
    // Drop oldest insertion (Map preserves insertion order).
    const firstKey = memberContextCache.keys().next().value;
    if (typeof firstKey === "string") {
      memberContextCache.delete(firstKey);
    }
  }
  memberContextCache.set(cacheKey(employerId, memberId), {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/** Drop one member's cached context (role/status change for that member). */
export function invalidateMemberRbacCache(
  employerId: string,
  memberId: string,
): void {
  memberContextCache.delete(cacheKey(employerId, memberId));
}

/** Drop all cached contexts for an employer (role permission matrix edits). */
export function invalidateEmployerRbacCache(employerId: string): void {
  const prefix = `${employerId}:`;
  for (const key of memberContextCache.keys()) {
    if (key.startsWith(prefix)) {
      memberContextCache.delete(key);
    }
  }
}

export function clearAllRbacCaches(): void {
  memberContextCache.clear();
}
