/** Canonical Indian state/UT labels used by analytics + map. */
export const INDIA_STATE_LABELS = [
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

export type IndiaStateLabel = (typeof INDIA_STATE_LABELS)[number];

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/nct of delhi|national capital territory of delhi/g, "delhi")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map aliases / misspellings / topojson labels → canonical label. */
const STATE_ALIASES: Record<string, IndiaStateLabel> = {
  delhi: "Delhi",
  "new delhi": "Delhi",
  "nct of delhi": "Delhi",
  "andaman and nicobar islands": "Andaman and Nicobar Islands",
  "andaman nicobar island": "Andaman and Nicobar Islands",
  "andaman nicobar islands": "Andaman and Nicobar Islands",
  "andra pradesh": "Andhra Pradesh",
  "andhra pradesh": "Andhra Pradesh",
  "arunachal pradesh": "Arunachal Pradesh",
  "arunanchal pradesh": "Arunachal Pradesh",
  "dadra and nagar haveli and daman and diu":
    "Dadra and Nagar Haveli and Daman and Diu",
  "dadara and nagar havelli": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "jammu and kashmir": "Jammu and Kashmir",
  orissa: "Odisha",
  odisha: "Odisha",
  pondicherry: "Puducherry",
  puducherry: "Puducherry",
  "tamil nadu": "Tamil Nadu",
  telangana: "Telangana",
  "uttar pradesh": "Uttar Pradesh",
  uttaranchal: "Uttarakhand",
  uttarakhand: "Uttarakhand",
  "west bengal": "West Bengal",
  maharashtra: "Maharashtra",
  karnataka: "Karnataka",
};

for (const label of INDIA_STATE_LABELS) {
  STATE_ALIASES[normalizeKey(label)] = label;
}

/** Common cities → parent state (when employers stored city in `state`). */
const CITY_TO_STATE: Record<string, IndiaStateLabel> = {
  hyderabad: "Telangana",
  secunderabad: "Telangana",
  madhapur: "Telangana",
  gachibowli: "Telangana",
  warangal: "Telangana",
  bhimavaram: "Andhra Pradesh",
  vijayawada: "Andhra Pradesh",
  visakhapatnam: "Andhra Pradesh",
  vizag: "Andhra Pradesh",
  bengaluru: "Karnataka",
  bangalore: "Karnataka",
  mysuru: "Karnataka",
  mysore: "Karnataka",
  mumbai: "Maharashtra",
  pune: "Maharashtra",
  nagpur: "Maharashtra",
  chennai: "Tamil Nadu",
  kolathur: "Tamil Nadu",
  coimbatore: "Tamil Nadu",
  madurai: "Tamil Nadu",
  delhi: "Delhi",
  "new delhi": "Delhi",
  noida: "Uttar Pradesh",
  gurgaon: "Haryana",
  gurugram: "Haryana",
  kolkata: "West Bengal",
  ahmedabad: "Gujarat",
  surat: "Gujarat",
  jaipur: "Rajasthan",
  lucknow: "Uttar Pradesh",
  chandigarh: "Chandigarh",
  kochi: "Kerala",
  thiruvananthapuram: "Kerala",
  bhopal: "Madhya Pradesh",
  indore: "Madhya Pradesh",
  patna: "Bihar",
  ranchi: "Jharkhand",
  bhubaneswar: "Odisha",
  guwahati: "Assam",
};

export function resolveIndiaStateLabel(
  rawState: string,
  rawCity = "",
): IndiaStateLabel | null {
  const stateKey = normalizeKey(rawState);
  if (stateKey && STATE_ALIASES[stateKey]) {
    return STATE_ALIASES[stateKey];
  }
  if (stateKey && CITY_TO_STATE[stateKey]) {
    return CITY_TO_STATE[stateKey];
  }

  const cityKey = normalizeKey(rawCity);
  if (cityKey && CITY_TO_STATE[cityKey]) {
    return CITY_TO_STATE[cityKey];
  }
  if (cityKey && STATE_ALIASES[cityKey]) {
    return STATE_ALIASES[cityKey];
  }

  return null;
}

/** Map topojson feature name → canonical label. */
export function resolveMapFeatureStateName(featureName: string): string {
  return resolveIndiaStateLabel(featureName) ?? featureName;
}
