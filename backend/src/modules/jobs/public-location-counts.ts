/**
 * Rolls active-job location rows into the same state and city slugs the
 * public jobs filter matches. A state click on the homepage map uses
 * `?state=<slug>`, and that filter matches `state` / `stateName` after the
 * same slug rules — so a count is included only when that filter would
 * return the job.
 */

export type PublicLocationCountRow = {
  state: string;
  stateName: string;
  city: string;
  cityName: string;
  count: number;
};

export type PublicStateCount = {
  state: string;
  stateName: string;
  count: number;
};

export type PublicCityCount = {
  city: string;
  cityName: string;
  state: string;
  stateName: string;
  count: number;
};

export type PublicLocationCounts = {
  states: PublicStateCount[];
  cities: PublicCityCount[];
};

/** Current 28 states and 8 union territories, matching the homepage map ids. */
export const PUBLIC_STATE_NAMES: Readonly<Record<string, string>> = {
  "andaman-and-nicobar-islands": "Andaman and Nicobar Islands",
  "andhra-pradesh": "Andhra Pradesh",
  "arunachal-pradesh": "Arunachal Pradesh",
  assam: "Assam",
  bihar: "Bihar",
  chandigarh: "Chandigarh",
  chhattisgarh: "Chhattisgarh",
  "dadra-and-nagar-haveli-and-daman-and-diu":
    "Dadra and Nagar Haveli and Daman and Diu",
  delhi: "Delhi",
  goa: "Goa",
  gujarat: "Gujarat",
  haryana: "Haryana",
  "himachal-pradesh": "Himachal Pradesh",
  "jammu-and-kashmir": "Jammu and Kashmir",
  jharkhand: "Jharkhand",
  karnataka: "Karnataka",
  kerala: "Kerala",
  ladakh: "Ladakh",
  lakshadweep: "Lakshadweep",
  "madhya-pradesh": "Madhya Pradesh",
  maharashtra: "Maharashtra",
  manipur: "Manipur",
  meghalaya: "Meghalaya",
  mizoram: "Mizoram",
  nagaland: "Nagaland",
  odisha: "Odisha",
  puducherry: "Puducherry",
  punjab: "Punjab",
  rajasthan: "Rajasthan",
  sikkim: "Sikkim",
  "tamil-nadu": "Tamil Nadu",
  telangana: "Telangana",
  tripura: "Tripura",
  "uttar-pradesh": "Uttar Pradesh",
  uttarakhand: "Uttarakhand",
  "west-bengal": "West Bengal",
};

/**
 * Same city aliases the jobs search expands, collapsed onto the slug the
 * homepage city links already use.
 */
const CITY_CANONICAL: Readonly<Record<string, string>> = {
  bengaluru: "bangalore",
  visakhapatnam: "vizag",
};

export function toPublicCountSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolvePublicStateId(state: string, stateName: string): string {
  const fromState = toPublicCountSlug(state);
  if (fromState && PUBLIC_STATE_NAMES[fromState]) return fromState;
  const fromName = toPublicCountSlug(stateName);
  if (fromName && PUBLIC_STATE_NAMES[fromName]) return fromName;
  return "";
}

export function canonicalPublicCitySlug(city: string, cityName = ""): string {
  const slug = toPublicCountSlug(city) || toPublicCountSlug(cityName);
  if (!slug) return "";
  return CITY_CANONICAL[slug] ?? slug;
}

function preferredCityName(cityName: string, slug: string): string {
  const trimmed = cityName.trim();
  if (trimmed) return trimmed;
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const CACHE_TTL_MS = 60_000;

let cachedCounts: { expiresAt: number; value: PublicLocationCounts } | null = null;

export function readPublicLocationCountsCache(
  now = Date.now(),
): PublicLocationCounts | null {
  if (!cachedCounts || cachedCounts.expiresAt <= now) return null;
  return cachedCounts.value;
}

export function writePublicLocationCountsCache(
  value: PublicLocationCounts,
  now = Date.now(),
): void {
  cachedCounts = { expiresAt: now + CACHE_TTL_MS, value };
}

export function clearPublicLocationCountsCache(): void {
  cachedCounts = null;
}

export function rollupPublicLocationCounts(
  rows: readonly PublicLocationCountRow[],
): PublicLocationCounts {
  const states = new Map<string, PublicStateCount>();
  const cities = new Map<string, PublicCityCount>();

  for (const row of rows) {
    if (!Number.isFinite(row.count) || row.count <= 0) continue;

    const stateId = resolvePublicStateId(row.state, row.stateName);
    const stateName = stateId
      ? PUBLIC_STATE_NAMES[stateId] ?? row.stateName.trim()
      : "";

    if (stateId) {
      const current = states.get(stateId);
      states.set(stateId, {
        state: stateId,
        stateName,
        count: (current?.count ?? 0) + row.count,
      });
    }

    const cityId = canonicalPublicCitySlug(row.city, row.cityName);
    if (!cityId) continue;

    const cityKey = `${stateId}|${cityId}`;
    const currentCity = cities.get(cityKey);
    cities.set(cityKey, {
      city: cityId,
      cityName: currentCity?.cityName || preferredCityName(row.cityName, cityId),
      state: stateId,
      stateName,
      count: (currentCity?.count ?? 0) + row.count,
    });
  }

  return {
    states: [...states.values()].sort((left, right) => right.count - left.count || left.state.localeCompare(right.state)),
    cities: [...cities.values()].sort((left, right) => right.count - left.count || left.city.localeCompare(right.city)),
  };
}
