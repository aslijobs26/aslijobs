/** Normalize FAQ / query text for exact and near-exact matching. */
export function normalizeKnowledgeText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeKnowledgeQuery(input: string): string[] {
  const normalized = normalizeKnowledgeText(input);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !STOP_WORDS.has(token));
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "am",
  "was",
  "were",
  "be",
  "to",
  "of",
  "in",
  "on",
  "for",
  "and",
  "or",
  "with",
  "my",
  "me",
  "i",
  "you",
  "your",
  "please",
  "can",
  "how",
  "what",
  "where",
  "when",
  "why",
  "which",
  "do",
  "does",
  "did",
  "will",
  "would",
  "should",
  "about",
  "lo",
  "la",
  "ki",
  "ku",
  "cheyyali",
  "cheyali",
  "enti",
  "ante",
  "ela",
  "epdi",
  "kaise",
  "hege",
  "engane",
  "enni",
  "unnayi",
  "undha",
  "kavali",
]);

export function hashKnowledgeContent(parts: string[]): string {
  const payload = parts.join("\u0001");
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16)}`;
}
