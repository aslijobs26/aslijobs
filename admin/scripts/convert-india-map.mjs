/**
 * One-time converter: India TopoJSON → compact SVG path features.
 * Prerequisites: npm install topojson-client d3-geo in this scripts folder.
 * Run: node convert-india-map.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, "package.json"));
const { feature } = require("topojson-client");
const { geoMercator, geoPath } = require("d3-geo");

const topo = JSON.parse(
  readFileSync(join(__dirname, "india.topo.json"), "utf8"),
);

const objectName = Object.keys(topo.objects)[0];
const geo = feature(topo, topo.objects[objectName]);

const projection = geoMercator().fitSize([480, 540], geo);
const path = geoPath(projection);

const features = geo.features
  .map((f) => {
    const props = f.properties || {};
    const name =
      props.st_nm ||
      props.ST_NM ||
      props.name ||
      props.NAME_1 ||
      props.state ||
      props.NAME ||
      "Unknown";
    const id =
      props.id ||
      props.ID_1 ||
      props.state_code ||
      String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return {
      id: String(id),
      name: String(name),
      d: path(f) || "",
    };
  })
  .filter((f) => f.d);

mkdirSync(join(__dirname, "../src/assets"), { recursive: true });
const outPath = join(__dirname, "../src/assets/india-states-map.json");
writeFileSync(outPath, JSON.stringify({ viewBox: "0 0 480 540", features }));
console.log(`Wrote ${features.length} states to ${outPath}`);
