/**
 * Downloads state topojson from india-maps-data and writes pre-projected
 * SVG path JSON into src/assets/india-district-maps for instant local loads.
 *
 * For discontiguous UTs (Puducherry, DNH & DD only), features are packed
 * into a readable grid so enclaves are not microscopic in a single viewBox.
 * All other states use a single contiguous Mercator fit.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../src/assets/india-district-maps");
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/topojson/states";
const MAP_SIZE = [480, 540];
const MAP_PAD = 12;

/** Canonical label → CDN slug (must match india-state-districts.ts). */
const STATE_SLUGS = {
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

function slugCandidates(primarySlug) {
  const withoutHyphens = primarySlug.replace(/-/g, "");
  return withoutHyphens === primarySlug
    ? [primarySlug]
    : [primarySlug, withoutHyphens];
}

function districtName(properties, index) {
  return (
    properties?.district?.trim() ||
    properties?.DIST_NAME?.trim() ||
    properties?.name?.trim() ||
    `District ${index + 1}`
  );
}

async function fetchTopology(slug) {
  for (const candidate of slugCandidates(slug)) {
    const response = await fetch(`${CDN_BASE}/${candidate}.json`);
    if (!response.ok) continue;
    return { topology: await response.json(), resolvedSlug: candidate };
  }
  return null;
}

/**
 * Only these UTs are geographically discontinuous enough that a single
 * contiguous projection makes enclaves unreadable. Do NOT infer this from
 * geoArea vs lon/lat span — steradians and degrees are not comparable, and
 * that heuristic incorrectly packed every multi-district state into a grid.
 */
const PACKED_ENCLAVE_SLUGS = new Set(["puducherry", "dnh-and-dd"]);

function shouldPackEnclaves(resolvedSlug) {
  return PACKED_ENCLAVE_SLUGS.has(resolvedSlug);
}

function projectContiguous(collection, resolvedSlug) {
  const projection = geoMercator().fitExtent(
    [
      [MAP_PAD, MAP_PAD],
      [MAP_SIZE[0] - MAP_PAD, MAP_SIZE[1] - MAP_PAD],
    ],
    collection,
  );
  const path = geoPath(projection);
  const districts = [];

  collection.features.forEach((districtFeature, index) => {
    const d = path(districtFeature);
    if (!d) return;
    districts.push({
      id: `${resolvedSlug}-${index}`,
      name: districtName(districtFeature.properties, index),
      d,
    });
  });

  if (districts.length === 0) return null;
  return {
    viewBox: `0 0 ${MAP_SIZE[0]} ${MAP_SIZE[1]}`,
    districts,
  };
}

/**
 * Project each enclave into its own cell so every district stays readable.
 */
function projectPacked(collection, resolvedSlug) {
  const count = collection.features.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = MAP_SIZE[0] / cols;
  const cellH = MAP_SIZE[1] / rows;
  const cellPad = 10;
  const districts = [];

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
    if (!d) return;
    districts.push({
      id: `${resolvedSlug}-${index}`,
      name: districtName(districtFeature.properties, index),
      d,
    });
  });

  if (districts.length === 0) return null;
  return {
    viewBox: `0 0 ${MAP_SIZE[0]} ${MAP_SIZE[1]}`,
    districts,
  };
}

function projectMap(topology, resolvedSlug) {
  const districtsObject =
    topology.objects.districts ??
    topology.objects.Districts ??
    Object.values(topology.objects)[0];
  if (!districtsObject) return null;

  const collection = feature(topology, districtsObject);
  if (!collection?.features?.length) return null;

  return shouldPackEnclaves(resolvedSlug)
    ? projectPacked(collection, resolvedSlug)
    : projectContiguous(collection, resolvedSlug);
}

mkdirSync(OUT_DIR, { recursive: true });

const manifest = {};
let ok = 0;
let failed = 0;

for (const [label, slug] of Object.entries(STATE_SLUGS)) {
  try {
    const fetched = await fetchTopology(slug);
    if (!fetched) {
      console.error("FAIL fetch", label, slug);
      failed += 1;
      continue;
    }
    const mapped = projectMap(fetched.topology, fetched.resolvedSlug);
    if (!mapped) {
      console.error("FAIL project", label, slug);
      failed += 1;
      continue;
    }
    const fileName = `${fetched.resolvedSlug}.json`;
    writeFileSync(join(OUT_DIR, fileName), JSON.stringify(mapped));
    manifest[label] = fileName;
    ok += 1;
    console.log(
      "OK",
      label,
      "→",
      fileName,
      mapped.districts.length,
      "districts",
    );
  } catch (error) {
    console.error("FAIL", label, error);
    failed += 1;
  }
}

writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Done. ok=${ok} failed=${failed}`);
