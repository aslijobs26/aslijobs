export type LanguageRegion = {
  countryCode: string;
  country: string;
  state: string;
  stateCode: string;
  city: string;
};

export function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function asString(value: unknown, max = 120): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
}

function regionFromParts(
  countryCode: string,
  country: string,
  state: string,
  stateCode: string,
  city: string,
): LanguageRegion | null {
  if (!countryCode && !country && !state && !stateCode) {
    return null;
  }
  return {
    countryCode: countryCode.toUpperCase(),
    country,
    state,
    stateCode: stateCode.toUpperCase(),
    city,
  };
}

/** BigDataCloud reverse-geocode client and server payloads. Coordinates are dropped. */
export function parseBigDataCloudRegion(payload: unknown): LanguageRegion | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.status === "number" && record.status >= 400) {
    return null;
  }
  return regionFromParts(
    asString(record.countryCode, 8),
    asString(record.countryName),
    asString(record.principalSubdivision),
    asString(record.principalSubdivisionCode, 16),
    asString(record.city) || asString(record.locality),
  );
}

/**
 * Photon reverse GeoJSON. A place name is not used as the city: the first
 * feature is often a building rather than the locality.
 */
export function parsePhotonRegion(payload: unknown): LanguageRegion | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const features = (payload as { features?: unknown }).features;
  if (!Array.isArray(features) || features.length === 0) {
    return null;
  }
  const first = features[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) {
    return null;
  }
  const properties = (first as { properties?: unknown }).properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return null;
  }
  const record = properties as Record<string, unknown>;
  return regionFromParts(
    asString(record.countrycode, 8),
    asString(record.country),
    asString(record.state),
    "",
    asString(record.city) || asString(record.locality),
  );
}

/** Nominatim reverse JSON (`addressdetails=1`). The display name is not kept. */
export function parseNominatimRegion(payload: unknown): LanguageRegion | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.error === "string") {
    return null;
  }
  if (!record.address || typeof record.address !== "object" || Array.isArray(record.address)) {
    return null;
  }
  const address = record.address as Record<string, unknown>;
  return regionFromParts(
    asString(address.country_code, 8),
    asString(address.country),
    asString(address.state) || asString(address.region),
    asString(address["ISO3166-2-lvl4"], 16) || asString(address["ISO3166-2-lvl3"], 16),
    asString(address.city) ||
      asString(address.town) ||
      asString(address.village) ||
      asString(address.state_district),
  );
}
