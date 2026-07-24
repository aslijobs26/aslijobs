import type { PlaceSuggestion } from "@/types/nominatim-location";

/**
 * Landing-page location autocomplete.
 *
 * Root cause of the old behaviour: Nominatim `/search` is a full-text geocoder,
 * not a prefix autocomplete API. Short queries like "Te" / "Hy" / "Vi" return
 * empty or unrelated results until nearly the full name is typed.
 *
 * Fix:
 * - States: authoritative Indian States/UTs list + client-side prefix ranking.
 * - Cities: Photon (OpenStreetMap autocomplete) scoped by selected-state bbox,
 *   English-only, settlement types only, prefix-ranked.
 */

const PHOTON_SEARCH_URL = "https://photon.komoot.io/api/";
const SUGGESTION_LIMIT = 5;
const FETCH_LIMIT = 20;

const stateCache = new Map<string, PlaceSuggestion[]>();
const cityCache = new Map<string, PlaceSuggestion[]>();

/** Official Indian States and Union Territories (English). */
const INDIAN_STATES_AND_UTS: readonly string[] = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

/**
 * Approximate WGS84 bounding boxes for Photon `bbox` (minLon,minLat,maxLon,maxLat).
 * Used to keep city suggestions inside the selected state.
 */
const STATE_BBOX: Record<string, string> = {
  "andaman and nicobar islands": "92.2,6.7,94.3,13.7",
  "andhra pradesh": "76.5,12.5,84.8,19.2",
  "arunachal pradesh": "91.5,26.5,97.5,29.5",
  assam: "89.7,24.1,96.0,28.0",
  bihar: "83.3,24.3,88.3,27.5",
  chandigarh: "76.7,30.7,76.9,30.9",
  chhattisgarh: "80.2,17.8,84.4,24.1",
  "dadra and nagar haveli and daman and diu": "72.7,20.0,73.2,20.8",
  delhi: "76.8,28.4,77.4,28.9",
  goa: "73.7,14.9,74.4,15.8",
  gujarat: "68.1,20.1,74.5,24.7",
  haryana: "74.4,27.4,77.6,30.9",
  "himachal pradesh": "75.6,30.4,79.0,33.2",
  "jammu and kashmir": "73.3,32.3,80.3,37.1",
  jharkhand: "83.3,21.9,87.9,25.3",
  karnataka: "74.0,11.5,78.6,18.5",
  kerala: "74.8,8.2,77.4,12.8",
  ladakh: "75.9,32.2,80.0,36.0",
  lakshadweep: "71.6,8.2,73.7,12.3",
  "madhya pradesh": "74.0,21.1,82.8,26.9",
  maharashtra: "72.6,15.6,80.9,22.0",
  manipur: "93.0,23.8,94.8,25.7",
  meghalaya: "89.8,25.0,92.8,26.1",
  mizoram: "92.1,21.9,93.5,24.5",
  nagaland: "93.3,25.2,95.2,27.0",
  odisha: "81.3,17.8,87.5,22.6",
  puducherry: "79.6,10.8,79.9,12.1",
  punjab: "73.9,29.5,76.9,32.5",
  rajasthan: "69.5,23.0,78.3,30.2",
  sikkim: "88.0,27.0,88.9,28.2",
  "tamil nadu": "76.2,8.0,80.4,13.6",
  telangana: "77.2,15.8,81.8,19.9",
  tripura: "91.1,22.9,92.4,24.5",
  "uttar pradesh": "77.0,23.9,84.6,30.4",
  uttarakhand: "77.6,28.7,81.0,31.5",
  "west bengal": "85.8,21.5,89.9,27.2",
};

const CITY_OSM_VALUES = new Set([
  "city",
  "town",
  "village",
  "suburb",
  "neighbourhood",
  "neighborhood",
  "locality",
  "hamlet",
  "municipality",
]);

type PhotonProperties = {
  name?: string;
  state?: string;
  countrycode?: string;
  osm_value?: string;
  osm_key?: string;
  type?: string;
  osm_id?: number;
};

type PhotonFeature = {
  properties?: PhotonProperties;
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

function isEnglishLabel(value: string): boolean {
  return /^[A-Za-z0-9\s.',\-()&]+$/.test(value.trim());
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

const PREFIX_STOP_WORDS = new Set(["and", "of", "the", "&"]);

function isPrefixMatch(query: string, label: string): boolean {
  const normalizedQuery = normalizeKey(query);
  const normalizedLabel = normalizeKey(label);

  if (!normalizedQuery || !normalizedLabel) {
    return false;
  }

  if (normalizedLabel.startsWith(normalizedQuery)) {
    return true;
  }

  return normalizedLabel
    .split(/[\s'-]+/)
    .filter((word) => word.length > 0 && !PREFIX_STOP_WORDS.has(word))
    .some((word) => word.startsWith(normalizedQuery));
}

/** Lower score = higher priority. Prefer exact prefix, then word-prefix. */
function prefixScore(query: string, label: string): number {
  const normalizedQuery = normalizeKey(query);
  const normalizedLabel = normalizeKey(label);

  if (normalizedLabel.startsWith(normalizedQuery)) {
    // Shorter remaining suffix ranks higher as the query grows ("Hyd" → Hyderabad).
    return normalizedLabel.length - normalizedQuery.length;
  }

  const words = normalizedLabel
    .split(/[\s'-]+/)
    .filter((word) => word.length > 0 && !PREFIX_STOP_WORDS.has(word));
  const wordIndex = words.findIndex((word) =>
    word.startsWith(normalizedQuery),
  );
  if (wordIndex >= 0) {
    return (
      1000 +
      wordIndex * 100 +
      (words[wordIndex].length - normalizedQuery.length)
    );
  }

  return Number.POSITIVE_INFINITY;
}

function dedupeSuggestions(suggestions: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  const unique: PlaceSuggestion[] = [];

  for (const suggestion of suggestions) {
    const key = normalizeKey(suggestion.label);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(suggestion);
  }

  return unique;
}

function rankSuggestions(
  query: string,
  suggestions: PlaceSuggestion[],
): PlaceSuggestion[] {
  return [...suggestions].sort((left, right) => {
    const scoreDiff =
      prefixScore(query, left.label) - prefixScore(query, right.label);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return left.label.localeCompare(right.label);
  });
}

async function fetchPhoton(
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<PhotonFeature[]> {
  params.set("lang", "en");
  params.set("limit", String(FETCH_LIMIT));

  const response = await fetch(`${PHOTON_SEARCH_URL}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("Unable to fetch locations");
  }

  const payload = (await response.json()) as PhotonResponse;
  return payload.features ?? [];
}

function mapStateSuggestion(name: string): PlaceSuggestion {
  return {
    id: `state-${normalizeKey(name)}`,
    label: name,
    kind: "state",
    state: name,
    city: "",
  };
}

function mapCityFeature(
  feature: PhotonFeature,
  selectedState: string,
  query: string,
): PlaceSuggestion | null {
  const properties = feature.properties;
  if (!properties) {
    return null;
  }

  if (normalizeKey(properties.countrycode || "") !== "in") {
    return null;
  }

  const osmValue = (properties.osm_value || "").toLowerCase();
  if (!CITY_OSM_VALUES.has(osmValue)) {
    return null;
  }

  const city = (properties.name || "").trim();
  if (!city || !isEnglishLabel(city) || !isPrefixMatch(query, city)) {
    return null;
  }

  const featureState = (properties.state || "").trim();
  if (
    featureState &&
    normalizeKey(featureState) !== normalizeKey(selectedState)
  ) {
    return null;
  }

  return {
    id: `city-${properties.osm_id ?? normalizeKey(city)}`,
    label: city,
    kind: "city",
    state: selectedState,
    city,
  };
}

export function resolveIndiaStateLabel(stateValue: string): string {
  const trimmed = stateValue.trim();
  if (!trimmed) {
    return "";
  }

  const spaced = normalizeKey(trimmed.replace(/-/g, " "));
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const match = INDIAN_STATES_AND_UTS.find((state) => {
    const stateKey = normalizeKey(state);
    const stateSlug = state
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return stateKey === spaced || stateSlug === slug;
  });

  return match ?? trimmed;
}

export async function searchIndiaStates(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const cacheKey = normalizeKey(normalizedQuery);
  const cached = stateCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const matches = INDIAN_STATES_AND_UTS.filter((state) =>
    isPrefixMatch(normalizedQuery, state),
  ).map(mapStateSuggestion);

  const suggestions = rankSuggestions(
    normalizedQuery,
    dedupeSuggestions(matches),
  ).slice(0, SUGGESTION_LIMIT);

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  stateCache.set(cacheKey, suggestions);
  return suggestions;
}

export async function searchIndiaCities(
  query: string,
  selectedState: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const normalizedQuery = query.trim();
  const normalizedState = selectedState.trim();

  if (normalizedQuery.length < 2 || !normalizedState) {
    return [];
  }

  const cacheKey = `${normalizeKey(normalizedState)}::${normalizeKey(normalizedQuery)}`;
  const cached = cityCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
  });

  const bbox = STATE_BBOX[normalizeKey(normalizedState)];
  if (bbox) {
    params.set("bbox", bbox);
  }

  const features = await fetchPhoton(params, signal);
  const mapped = features
    .map((feature) => mapCityFeature(feature, normalizedState, normalizedQuery))
    .filter((item): item is PlaceSuggestion => item !== null);

  const suggestions = rankSuggestions(
    normalizedQuery,
    dedupeSuggestions(mapped),
  ).slice(0, SUGGESTION_LIMIT);

  cityCache.set(cacheKey, suggestions);
  return suggestions;
}

/** @deprecated Use searchIndiaStates / searchIndiaCities */
export async function searchIndiaLocations(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  return searchIndiaStates(query, signal);
}
