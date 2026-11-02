import { AsyncLocalStorage } from "node:async_hooks";
import { env } from "../../config/env.js";
import { taxonomyGroupFor } from "./whatsapp-role-taxonomy.js";

/**
 * Active job titles and cities observed from the jobs collection.
 * Tests pass a catalog with withSearchCatalog so they do not change process state.
 * An empty catalog keeps the existing static role and city lists unchanged.
 */
export type WhatsAppSearchCatalog = {
  titles: string[];
  cities: string[];
};

const EMPTY: WhatsAppSearchCatalog = { titles: [], cities: [] };
const storage = new AsyncLocalStorage<WhatsAppSearchCatalog>();
let processCatalog: WhatsAppSearchCatalog = EMPTY;
let catalogReadyAt = 0;
let catalogRetryAt = 0;
let catalogInflight: Promise<void> | null = null;

const CATALOG_RETRY_MS = 60 * 1000;

export type CatalogMetrics = {
  hits: number;
  misses: number;
  refreshes: number;
  failures: number;
  lastRefreshMs: number;
  lastFailure: string;
  titles: number;
  cities: number;
};

const metrics: CatalogMetrics = {
  hits: 0,
  misses: 0,
  refreshes: 0,
  failures: 0,
  lastRefreshMs: 0,
  lastFailure: "",
  titles: 0,
  cities: 0,
};

export function whatsAppCatalogMetrics(): CatalogMetrics {
  return { ...metrics };
}

const TOKEN_STOP = new Set(["job", "jobs", "work", "role", "the", "and", "for"]);

export function withSearchCatalog<T>(catalog: WhatsAppSearchCatalog, run: () => T): T {
  return storage.run(normalizeCatalog(catalog), run);
}

export function currentSearchCatalog(): WhatsAppSearchCatalog {
  return storage.getStore() ?? processCatalog;
}

export function replaceProcessSearchCatalog(catalog: WhatsAppSearchCatalog): void {
  processCatalog = normalizeCatalog(catalog);
}

export function invalidateWhatsAppSearchCatalog(reason: string): void {
  catalogReadyAt = 0;
  const safe = reason.replace(/[^\w.-]/g, "_").slice(0, 40);
  console.info(`[WA-CATALOG] invalidated reason=${safe}`);
}

export async function ensureWhatsAppSearchCatalog(
  load: () => Promise<WhatsAppSearchCatalog>,
): Promise<void> {
  const now = Date.now();
  if (catalogReadyAt > now) {
    metrics.hits += 1;
    return;
  }
  if (now < catalogRetryAt) return;
  if (catalogInflight) return catalogInflight;
  metrics.misses += 1;
  const started = Date.now();
  catalogInflight = load()
    .then((catalog) => {
      processCatalog = normalizeCatalog(catalog);
      metrics.titles = processCatalog.titles.length;
      metrics.cities = processCatalog.cities.length;
      metrics.refreshes += 1;
      metrics.lastRefreshMs = Date.now() - started;
      catalogReadyAt = Date.now() + catalogTtlMs();
      console.info(
        `[WA-CATALOG] refreshed titles=${metrics.titles} cities=${metrics.cities} durationMs=${metrics.lastRefreshMs}`,
      );
    })
    .catch((error: unknown) => {
      catalogRetryAt = Date.now() + CATALOG_RETRY_MS;
      metrics.failures += 1;
      metrics.lastFailure = error instanceof Error ? error.name : "unknown";
      console.error(
        `[WA-CATALOG] refresh_failed reason=${metrics.lastFailure} durationMs=${Date.now() - started}`,
      );
    })
    .finally(() => {
      catalogInflight = null;
    });
  return catalogInflight;
}

function catalogTtlMs(): number {
  const raw = env.WHATSAPP_CATALOG_TTL_MS;
  if (!Number.isFinite(raw)) return 60_000;
  return Math.min(10 * 60 * 1000, Math.max(15_000, raw));
}

/** Test hook. Production refresh uses the TTL above. */
export function resetProcessSearchCatalog(): void {
  processCatalog = EMPTY;
  catalogReadyAt = 0;
  catalogRetryAt = 0;
}

function normalizeCatalog(catalog: WhatsAppSearchCatalog): WhatsAppSearchCatalog {
  return {
    titles: uniqueLabels(catalog.titles),
    cities: uniqueLabels(catalog.cities),
  };
}

function uniqueLabels(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim().slice(0, 80);
    if (trimmed.length < 2) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function hasLabel(values: readonly string[], label: string): boolean {
  const key = label.trim().toLowerCase();
  return values.some((value) => value.toLowerCase() === key);
}

/**
 * Keep a known role when the catalog agrees or is empty.
 * Remap only when the live titles contain the synonym and not the static name.
 */
export function alignKnownRole(canonical: string, phrase: string): string {
  const titles = currentSearchCatalog().titles;
  if (titles.length === 0 || hasLabel(titles, canonical)) return canonical;
  const preferred = preferredTitle(phrase || canonical, titles);
  return preferred || canonical;
}

/** Map a free-text title onto a live job title. Empty means "keep the user's words". */
export function matchCatalogRole(phrase: string): string {
  const titles = currentSearchCatalog().titles;
  const cleaned = phrase.trim();
  if (!cleaned || titles.length === 0) return "";
  if (hasLabel(titles, cleaned)) {
    return titles.find((title) => title.toLowerCase() === cleaned.toLowerCase()) ?? cleaned;
  }
  const preferred = preferredTitle(cleaned, titles);
  if (preferred) return preferred;
  const fuzzy = closestSupportedLabel(cleaned, titles, 0.88);
  if (!fuzzy || !sharesSignificantToken(cleaned, fuzzy)) return "";
  return fuzzy;
}

export function matchCatalogCityInText(text: string): string {
  const cities = currentSearchCatalog().cities;
  if (cities.length === 0) return "";
  const folded = text.toLowerCase();
  const contained = cities.filter((city) => city.length >= 4 && folded.includes(city.toLowerCase()));
  if (contained.length > 0) {
    contained.sort((a, b) => b.length - a.length);
    return contained[0] ?? "";
  }
  const tokens = folded.match(/[a-z]{5,}/g) ?? [];
  for (const token of tokens) {
    const decision = acceptRankedLabel(rankLabels(token, cities));
    if (decision.label) return decision.label;
  }
  return "";
}

export function withinOneEdit(left: string, right: string): boolean {
  const a = left.toLowerCase().replace(/\s+/g, "");
  const b = right.toLowerCase().replace(/\s+/g, "");
  return damerauLevenshtein(a, b) <= 1;
}

export function closestSupportedLabel(
  token: string,
  candidates: readonly string[],
  minScore = 0.88,
): string {
  return acceptRankedLabel(rankLabels(token, candidates), minScore).label;
}

export type LabelRank = { label: string; score: number };

/** Jaro-Winkler and Damerau-Levenshtein, so one missing letter or a swap can still match. */
export function similarity(left: string, right: string): number {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 1;
  const edit = 1 - damerauLevenshtein(a, b) / Math.max(a.length, b.length);
  return Math.max(edit, jaroWinkler(a, b));
}

export function rankLabels(token: string, candidates: readonly string[]): LabelRank[] {
  const needle = token.trim().toLowerCase();
  if (needle.length < 5 || needle.length > 40) return [];
  const ranked: LabelRank[] = [];
  for (const candidate of candidates) {
    const folded = candidate.toLowerCase();
    if (Math.abs(folded.length - needle.length) > 3) continue;
    const score = similarity(needle, folded);
    if (score >= 0.84) ranked.push({ label: candidate, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return ranked.slice(0, 4);
}

export function acceptRankedLabel(
  ranked: readonly LabelRank[],
  minScore = 0.88,
): { label: string; options: string[] } {
  const first = ranked[0];
  const second = ranked[1];
  if (!first || first.score < minScore) return { label: "", options: [] };
  if (second && second.score >= 0.86 && first.score - second.score < 0.045) {
    return {
      label: "",
      options: ranked.filter((item) => item.score >= 0.86).slice(0, 3).map((item) => item.label),
    };
  }
  return { label: first.label, options: [] };
}

function preferredTitle(phrase: string, titles: readonly string[]): string {
  const group = taxonomyGroupFor(phrase);
  if (!group) return "";
  const hits = group.titles.filter((title) => hasLabel(titles, title));
  if (hits.length === 0) return "";
  if (group.mode === "ambiguous" && hits.length !== 1) return "";
  const found = hits[0];
  if (!found) return "";
  return titles.find((title) => title.toLowerCase() === found.toLowerCase()) ?? found;
}

/** Two or more live titles fit an ambiguous phrase. Empty when it is safe to search. */
export function ambiguousRoleOptions(phrase: string, canonical: string): string[] {
  const titles = currentSearchCatalog().titles;
  if (titles.length === 0 || (canonical && hasLabel(titles, canonical))) return [];
  const group = taxonomyGroupFor(phrase);
  if (!group || group.mode !== "ambiguous") return [];
  const hits = group.titles.filter((title) => hasLabel(titles, title));
  return hits.length >= 2 ? hits.slice(0, 3) : [];
}

function sharesSignificantToken(left: string, right: string): boolean {
  const a = tokens(left);
  const b = tokens(right);
  return a.some((token) =>
    b.some(
      (other) => token === other || (token.length >= 5 && other.length >= 5 && similarity(token, other) >= 0.8),
    ),
  );
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !TOKEN_STOP.has(token));
}

function damerauLevenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid: number[] = new Array(rows * cols);
  for (let i = 0; i < rows; i += 1) grid[i * cols] = i;
  for (let j = 0; j < cols; j += 1) grid[j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        (grid[(i - 1) * cols + j] ?? 0) + 1,
        (grid[i * cols + (j - 1)] ?? 0) + 1,
        (grid[(i - 1) * cols + (j - 1)] ?? 0) + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, (grid[(i - 2) * cols + (j - 2)] ?? 0) + 1);
      }
      grid[i * cols + j] = best;
    }
  }
  return grid[a.length * cols + b.length] ?? Math.max(a.length, b.length);
}

function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const matchDistance = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i += 1) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);
    for (let j = start; j < end; j += 1) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches += 1;
      break;
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k += 1;
    if (a[i] !== b[k]) transpositions += 1;
    k += 1;
  }
  const jaro =
    (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  const limit = Math.min(4, a.length, b.length);
  while (prefix < limit && a[prefix] === b[prefix]) prefix += 1;
  return jaro + prefix * 0.1 * (1 - jaro);
}
