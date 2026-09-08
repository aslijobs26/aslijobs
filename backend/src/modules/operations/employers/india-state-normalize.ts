/** Canonical Indian state/UT labels for employer location analytics. */
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

const STATE_ALIASES: Record<string, IndiaStateLabel> = {
  delhi: "Delhi",
  "new delhi": "Delhi",
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
};

for (const label of INDIA_STATE_LABELS) {
  STATE_ALIASES[normalizeKey(label)] = label;
}

const CITY_TO_STATE: Record<string, IndiaStateLabel> = {
  hyderabad: "Telangana",
  secunderabad: "Telangana",
  madhapur: "Telangana",
  gachibowli: "Telangana",
  warangal: "Telangana",
  karimnagar: "Telangana",
  nizamabad: "Telangana",
  khammam: "Telangana",
  nalgonda: "Telangana",
  mahbubnagar: "Telangana",
  mahabubnagar: "Telangana",
  siddipet: "Telangana",
  adilabad: "Telangana",
  ramagundam: "Telangana",
  bhimavaram: "Andhra Pradesh",
  vijayawada: "Andhra Pradesh",
  visakhapatnam: "Andhra Pradesh",
  vizag: "Andhra Pradesh",
  tirupati: "Andhra Pradesh",
  tirupathi: "Andhra Pradesh",
  kakinada: "Andhra Pradesh",
  nellore: "Andhra Pradesh",
  guntur: "Andhra Pradesh",
  ongole: "Andhra Pradesh",
  rajahmundry: "Andhra Pradesh",
  rajamundry: "Andhra Pradesh",
  kadapa: "Andhra Pradesh",
  cuddapah: "Andhra Pradesh",
  anantapur: "Andhra Pradesh",
  eluru: "Andhra Pradesh",
  srikakulam: "Andhra Pradesh",
  kurnool: "Andhra Pradesh",
  bengaluru: "Karnataka",
  bangalore: "Karnataka",
  mysuru: "Karnataka",
  mysore: "Karnataka",
  hubli: "Karnataka",
  mangalore: "Karnataka",
  mangaluru: "Karnataka",
  mumbai: "Maharashtra",
  pune: "Maharashtra",
  nagpur: "Maharashtra",
  nashik: "Maharashtra",
  thane: "Maharashtra",
  chennai: "Tamil Nadu",
  kolathur: "Tamil Nadu",
  coimbatore: "Tamil Nadu",
  madurai: "Tamil Nadu",
  trichy: "Tamil Nadu",
  tiruchirappalli: "Tamil Nadu",
  delhi: "Delhi",
  "new delhi": "Delhi",
  noida: "Uttar Pradesh",
  gurgaon: "Haryana",
  gurugram: "Haryana",
  faridabad: "Haryana",
  kolkata: "West Bengal",
  ahmedabad: "Gujarat",
  surat: "Gujarat",
  vadodara: "Gujarat",
  jaipur: "Rajasthan",
  lucknow: "Uttar Pradesh",
  kanpur: "Uttar Pradesh",
  varanasi: "Uttar Pradesh",
  chandigarh: "Chandigarh",
  kochi: "Kerala",
  ernakulam: "Kerala",
  thiruvananthapuram: "Kerala",
  trivandrum: "Kerala",
  kozhikode: "Kerala",
  bhopal: "Madhya Pradesh",
  indore: "Madhya Pradesh",
  patna: "Bihar",
  ranchi: "Jharkhand",
  bhubaneswar: "Odisha",
  guwahati: "Assam",
  hyd: "Telangana",
};

export function resolveIndiaStateLabel(
  rawState: unknown,
  rawCity: unknown = "",
): IndiaStateLabel | "Unspecified" {
  const state = String(rawState ?? "").trim();
  const city = String(rawCity ?? "").trim();
  const stateKey = normalizeKey(state);
  if (stateKey && STATE_ALIASES[stateKey]) {
    return STATE_ALIASES[stateKey];
  }
  if (stateKey && CITY_TO_STATE[stateKey]) {
    return CITY_TO_STATE[stateKey];
  }

  const cityKey = normalizeKey(city);
  if (cityKey && CITY_TO_STATE[cityKey]) {
    return CITY_TO_STATE[cityKey];
  }
  if (cityKey && STATE_ALIASES[cityKey]) {
    return STATE_ALIASES[cityKey];
  }

  return "Unspecified";
}

/**
 * Split free-text preferred locations into tokens for state resolution.
 * Examples: "Hyderabad", "Hyderabad, Telangana", "Bangalore | Pune"
 */
export function preferredLocationTokens(rawPreferred: unknown): string[] {
  const preferred = String(rawPreferred ?? "").trim();
  if (!preferred) {
    return [];
  }
  return preferred
    .split(/[,|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Resolve state using the same field priority Operations Candidates UI uses:
 * city/state first, then preferredJobLocation tokens.
 */
export function resolveIndiaStateFromLocationFields(input: {
  state?: unknown;
  city?: unknown;
  preferredJobLocation?: unknown;
}): IndiaStateLabel | "Unspecified" {
  const direct = resolveIndiaStateLabel(input.state, input.city);
  if (direct !== "Unspecified") {
    return direct;
  }

  for (const token of preferredLocationTokens(input.preferredJobLocation)) {
    const fromToken = resolveIndiaStateLabel(token, token);
    if (fromToken !== "Unspecified") {
      return fromToken;
    }
  }

  // Preferred free-text without separators (e.g. "Hyderabad Telangana").
  const preferredKey = normalizeKey(String(input.preferredJobLocation ?? ""));
  if (preferredKey) {
    if (STATE_ALIASES[preferredKey]) {
      return STATE_ALIASES[preferredKey];
    }
    if (CITY_TO_STATE[preferredKey]) {
      return CITY_TO_STATE[preferredKey];
    }
    // Match a known city token inside the free-text string.
    for (const [cityKey, stateLabel] of Object.entries(CITY_TO_STATE)) {
      if (
        preferredKey === cityKey ||
        preferredKey.startsWith(`${cityKey} `) ||
        preferredKey.endsWith(` ${cityKey}`) ||
        preferredKey.includes(` ${cityKey} `)
      ) {
        return stateLabel;
      }
    }
    for (const [stateKey, stateLabel] of Object.entries(STATE_ALIASES)) {
      if (
        preferredKey === stateKey ||
        preferredKey.startsWith(`${stateKey} `) ||
        preferredKey.endsWith(` ${stateKey}`) ||
        preferredKey.includes(` ${stateKey} `)
      ) {
        return stateLabel;
      }
    }
  }

  return "Unspecified";
}

/** City label for analytics: structured city, else first preferred token. */
export function resolveCityLabelFromLocationFields(input: {
  city?: unknown;
  preferredJobLocation?: unknown;
}): string {
  const city = String(input.city ?? "").trim();
  if (city) {
    return city;
  }
  const [firstPreferred] = preferredLocationTokens(input.preferredJobLocation);
  return firstPreferred?.trim() ?? "";
}
