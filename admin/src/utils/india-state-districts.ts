import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";

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
 * Canonical state label → india-maps-data topojson slug.
 * Note: Tamil Nadu is `tamilnadu` (no hyphen) in topojson/states.
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

/** Alternate CDN filenames when the primary slug 404s (dataset naming is inconsistent). */
function topojsonSlugCandidates(primarySlug: string): string[] {
  const withoutHyphens = primarySlug.replace(/-/g, "");
  const candidates = [primarySlug];
  if (withoutHyphens !== primarySlug) {
    candidates.push(withoutHyphens);
  }
  return candidates;
}

const MAP_SIZE: [number, number] = [480, 540];
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

/**
 * Loads district outlines for an Indian state and projects them to SVG paths.
 * Results are cached in-memory for the session.
 */
export async function loadIndiaStateDistrictMap(
  stateLabel: string,
): Promise<IndiaStateDistrictMap | null> {
  const cached = districtMapCache.get(stateLabel);
  if (cached) {
    return cached;
  }

  const inflight = districtMapInflight.get(stateLabel);
  if (inflight) {
    return inflight;
  }

  const slug = STATE_TOPOJSON_SLUG[stateLabel];
  if (!slug) {
    return null;
  }

  const request = (async (): Promise<IndiaStateDistrictMap | null> => {
    try {
      let topology: {
        type: "Topology";
        objects: Record<string, unknown>;
      } | null = null;
      let resolvedSlug = slug;

      for (const candidate of topojsonSlugCandidates(slug)) {
        const response = await fetch(
          `${TOPOLOGY_CDN_BASE}/${candidate}.json`,
        );
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
      ) as FeatureCollection<Geometry, DistrictProperties>;

      const projection = geoMercator().fitSize(MAP_SIZE, collection);
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

      const mapped: IndiaStateDistrictMap = {
        viewBox: `0 0 ${MAP_SIZE[0]} ${MAP_SIZE[1]}`,
        districts,
      };
      districtMapCache.set(stateLabel, mapped);
      return mapped;
    } catch {
      return null;
    } finally {
      districtMapInflight.delete(stateLabel);
    }
  })();

  districtMapInflight.set(stateLabel, request);
  return request;
}
