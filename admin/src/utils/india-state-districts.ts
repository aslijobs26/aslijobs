import type { FeatureCollection, Geometry } from "geojson";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { resolveIndiaStateLabel } from "../components/operations/employers/overview/india-state-normalize";

export type IndiaDistrictPath = {
  id: string;
  name: string;
  d: string;
};

export type IndiaStateDistrictMap = {
  viewBox: string;
  districts: IndiaDistrictPath[];
};

/**
 * Canonical state label → local asset / CDN topojson slug.
 * Note: Tamil Nadu is `tamilnadu` (no hyphen).
 */
const STATE_TOPOJSON_SLUG: Record<string, string> = {
  "Andaman and Nicobar Islands": "andaman-and-nicobar-islands",
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  Assam: "assam",
  Bihar: "bihar",
  Chandigarh: "chandigarh",
  Chhattisgarh: "chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu": "dnh-and-dd",
  Delhi: "delhi",
  Goa: "goa",
  Gujarat: "gujarat",
  Haryana: "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jammu and Kashmir": "jammu-and-kashmir",
  Jharkhand: "jharkhand",
  Karnataka: "karnataka",
  Kerala: "kerala",
  Ladakh: "ladakh",
  Lakshadweep: "lakshadweep",
  "Madhya Pradesh": "madhya-pradesh",
  Maharashtra: "maharashtra",
  Manipur: "manipur",
  Meghalaya: "meghalaya",
  Mizoram: "mizoram",
  Nagaland: "nagaland",
  Odisha: "odisha",
  Puducherry: "puducherry",
  Punjab: "punjab",
  Rajasthan: "rajasthan",
  Sikkim: "sikkim",
  "Tamil Nadu": "tamilnadu",
  Telangana: "telangana",
  Tripura: "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  Uttarakhand: "uttarakhand",
  "West Bengal": "west-bengal",
};

const TOPOLOGY_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/topojson/states";

const MAP_SIZE: [number, number] = [480, 540];
const MAP_PAD = 12;

/** Precomputed district SVG maps shipped with the admin app (instant same-origin load). */
const localDistrictModules = import.meta.glob<{
  default: IndiaStateDistrictMap;
}>("../assets/india-district-maps/*.json");

const districtMapCache = new Map<string, IndiaStateDistrictMap>();
const districtMapInflight = new Map<
  string,
  Promise<IndiaStateDistrictMap | null>
>();

type DistrictProperties = {
  district?: string;
  DIST_NAME?: string;
  name?: string;
};

function districtNameFromProperties(
  properties: DistrictProperties | null | undefined,
  index: number,
): string {
  return (
    properties?.district?.trim() ||
    properties?.DIST_NAME?.trim() ||
    properties?.name?.trim() ||
    `District ${index + 1}`
  );
}

function topojsonSlugCandidates(primarySlug: string): string[] {
  const withoutHyphens = primarySlug.replace(/-/g, "");
  const candidates = [primarySlug];
  if (withoutHyphens !== primarySlug) {
    candidates.push(withoutHyphens);
  }
  return candidates;
}

function localModulePathForSlug(slug: string): string | null {
  const path = `../assets/india-district-maps/${slug}.json`;
  return path in localDistrictModules ? path : null;
}

async function loadLocalDistrictMap(
  slug: string,
): Promise<IndiaStateDistrictMap | null> {
  const modulePath = localModulePathForSlug(slug);
  if (!modulePath) {
    return null;
  }
  const loaded = await localDistrictModules[modulePath]!();
  const mapped = loaded.default;
  if (!mapped?.districts?.length) {
    return null;
  }
  return mapped;
}

/**
 * Only these UTs are discontinuous enough that contiguous projection makes
 * enclaves unreadable. Do not infer from geoArea vs lon/lat span — those
 * units are not comparable and incorrectly packed contiguous states.
 */
const PACKED_ENCLAVE_SLUGS = new Set(["puducherry", "dnh-and-dd"]);

function shouldPackEnclaves(resolvedSlug: string): boolean {
  return PACKED_ENCLAVE_SLUGS.has(resolvedSlug);
}

function projectContiguous(
  collection: FeatureCollection<Geometry, DistrictProperties>,
  resolvedSlug: string,
): IndiaStateDistrictMap | null {
  const projection = geoMercator().fitExtent(
    [
      [MAP_PAD, MAP_PAD],
      [MAP_SIZE[0] - MAP_PAD, MAP_SIZE[1] - MAP_PAD],
    ],
    collection,
  );
  const path = geoPath(projection);
  const districts: IndiaDistrictPath[] = [];

  collection.features.forEach((districtFeature, index) => {
    const d = path(districtFeature);
    if (!d) {
      return;
    }
    districts.push({
      id: `${resolvedSlug}-${index}`,
      name: districtNameFromProperties(districtFeature.properties, index),
      d,
    });
  });

  if (districts.length === 0) {
    return null;
  }

  return {
    viewBox: `0 0 ${MAP_SIZE[0]} ${MAP_SIZE[1]}`,
    districts,
  };
}

function projectPacked(
  collection: FeatureCollection<Geometry, DistrictProperties>,
  resolvedSlug: string,
): IndiaStateDistrictMap | null {
  const count = collection.features.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = MAP_SIZE[0] / cols;
  const cellH = MAP_SIZE[1] / rows;
  const cellPad = 10;
  const districts: IndiaDistrictPath[] = [];

  collection.features.forEach((districtFeature, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const projection = geoMercator().fitExtent(
      [
        [col * cellW + cellPad, row * cellH + cellPad],
        [(col + 1) * cellW - cellPad, (row + 1) * cellH - cellPad],
      ],
      districtFeature,
    );
    const path = geoPath(projection);
    const d = path(districtFeature);
    if (!d) {
      return;
    }
    districts.push({
      id: `${resolvedSlug}-${index}`,
      name: districtNameFromProperties(districtFeature.properties, index),
      d,
    });
  });

  if (districts.length === 0) {
    return null;
  }

  return {
    viewBox: `0 0 ${MAP_SIZE[0]} ${MAP_SIZE[1]}`,
    districts,
  };
}

function projectDistrictCollection(
  collection: FeatureCollection<Geometry, DistrictProperties>,
  resolvedSlug: string,
): IndiaStateDistrictMap | null {
  return shouldPackEnclaves(resolvedSlug)
    ? projectPacked(collection, resolvedSlug)
    : projectContiguous(collection, resolvedSlug);
}

async function loadCdnDistrictMap(
  slug: string,
): Promise<IndiaStateDistrictMap | null> {
  let topology: {
    type: "Topology";
    objects: Record<string, unknown>;
  } | null = null;
  let resolvedSlug = slug;

  for (const candidate of topojsonSlugCandidates(slug)) {
    const response = await fetch(`${TOPOLOGY_CDN_BASE}/${candidate}.json`);
    if (!response.ok) {
      continue;
    }
    topology = (await response.json()) as {
      type: "Topology";
      objects: Record<string, unknown>;
    };
    resolvedSlug = candidate;
    break;
  }

  if (!topology) {
    return null;
  }

  const districtsObject =
    topology.objects.districts ??
    topology.objects.Districts ??
    Object.values(topology.objects)[0];
  if (!districtsObject) {
    return null;
  }

  const collection = feature(
    topology as never,
    districtsObject as never,
  ) as unknown as FeatureCollection<Geometry, DistrictProperties>;

  if (!collection?.features?.length) {
    return null;
  }

  return projectDistrictCollection(collection, resolvedSlug);
}

/**
 * Returns a previously loaded district map synchronously, if present in cache.
 */
export function getCachedIndiaStateDistrictMap(
  stateLabel: string,
): IndiaStateDistrictMap | null {
  const canonical =
    resolveIndiaStateLabel(stateLabel) ?? stateLabel.trim();
  return (
    districtMapCache.get(stateLabel) ??
    districtMapCache.get(canonical) ??
    null
  );
}

/**
 * Prefetch district maps so state clicks render from cache immediately.
 */
export function prefetchIndiaStateDistrictMaps(stateLabels: string[]): void {
  for (const label of stateLabels) {
    void loadIndiaStateDistrictMap(label);
  }
}

/**
 * Loads district outlines for an Indian state.
 * Prefers bundled local assets (near-instant), falls back to CDN.
 */
export async function loadIndiaStateDistrictMap(
  stateLabel: string,
): Promise<IndiaStateDistrictMap | null> {
  const canonical =
    resolveIndiaStateLabel(stateLabel) ?? stateLabel.trim();

  const cached =
    districtMapCache.get(stateLabel) ?? districtMapCache.get(canonical);
  if (cached) {
    districtMapCache.set(stateLabel, cached);
    districtMapCache.set(canonical, cached);
    return cached;
  }

  const inflight =
    districtMapInflight.get(stateLabel) ??
    districtMapInflight.get(canonical);
  if (inflight) {
    return inflight;
  }

  const slug = STATE_TOPOJSON_SLUG[canonical];
  if (!slug) {
    return null;
  }

  const request = (async (): Promise<IndiaStateDistrictMap | null> => {
    try {
      const local = await loadLocalDistrictMap(slug);
      const mapped = local ?? (await loadCdnDistrictMap(slug));
      if (!mapped) {
        return null;
      }
      districtMapCache.set(stateLabel, mapped);
      districtMapCache.set(canonical, mapped);
      return mapped;
    } catch {
      return null;
    } finally {
      districtMapInflight.delete(stateLabel);
      districtMapInflight.delete(canonical);
    }
  })();

  districtMapInflight.set(stateLabel, request);
  districtMapInflight.set(canonical, request);
  return request;
}

/** Default South India states to warm on Organization page load. */
export const SOUTH_INDIA_DISTRICT_PREFETCH_LABELS = [
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Tamil Nadu",
  "Telangana",
  "Puducherry",
  "Andaman and Nicobar Islands",
  "Lakshadweep",
] as const;
