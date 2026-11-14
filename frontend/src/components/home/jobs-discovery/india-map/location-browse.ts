import type { PublicCityCount } from "@/services/public-location-counts.service";
import type { JobLocationItem } from "@/types/jobs-discovery";
import { buildJobSearchHref, toJobSearchLocationSlug } from "@/utils/job-search-url";

const NUMBER_FORMAT = new Intl.NumberFormat("en-IN");

/** City slugs the jobs page already treats as the same place. */
const CITY_CANONICAL: Readonly<Record<string, string>> = {
  bengaluru: "bangalore",
  visakhapatnam: "vizag",
};

export function canonicalBrowseCitySlug(value: string): string {
  const slug = toJobSearchLocationSlug(value);
  if (!slug) return "";
  return CITY_CANONICAL[slug] ?? slug;
}

export function formatBrowseJobCount(count: number): string {
  return `${NUMBER_FORMAT.format(count)} Jobs`;
}

export type StateDistrictCount = {
  id: string;
  name: string;
  count: number;
  href: string;
};

/** Highest job counts inside one state, using the same city slugs as the jobs page. */
export function topDistrictsForState(
  cities: readonly PublicCityCount[] | null,
  stateId: string,
  limit = 5,
): StateDistrictCount[] {
  if (!cities || !stateId) return [];
  const totals = new Map<string, { name: string; count: number; city: string }>();

  for (const row of cities) {
    if (toJobSearchLocationSlug(row.state) !== stateId) continue;
    const city = canonicalBrowseCitySlug(row.city);
    if (!city || !Number.isFinite(row.count) || row.count <= 0) continue;
    const current = totals.get(city);
    totals.set(city, {
      city,
      name: row.cityName.trim() || current?.name || row.city,
      count: (current?.count ?? 0) + row.count,
    });
  }

  return [...totals.values()]
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    )
    .slice(0, limit)
    .map((row) => ({
      id: row.city,
      name: row.name,
      count: row.count,
      href: buildJobSearchHref({ state: stateId, cities: [row.city] }),
    }));
}

export function indexStateJobCounts(
  states: readonly { state: string; count: number }[] | null,
): ReadonlyMap<string, number> | null {
  if (!states) return null;
  const counts = new Map<string, number>();
  for (const row of states) {
    const id = toJobSearchLocationSlug(row.state);
    if (!id || !Number.isFinite(row.count)) continue;
    counts.set(id, (counts.get(id) ?? 0) + row.count);
  }
  return counts;
}

export function buildCityBrowseItems(
  cities: readonly PublicCityCount[] | null,
  featured: readonly JobLocationItem[],
  status: "loading" | "ready" | "error",
): JobLocationItem[] {
  const totals = new Map<
    string,
    { count: number; name: string; state: string; city: string }
  >();

  if (cities) {
    for (const row of cities) {
      const city = canonicalBrowseCitySlug(row.city);
      if (!city || !Number.isFinite(row.count) || row.count <= 0) continue;
      const state = toJobSearchLocationSlug(row.state);
      const key = `${state}::${city}`;
      const current = totals.get(key);
      totals.set(key, {
        city,
        state,
        name: row.cityName.trim() || current?.name || row.city,
        count: (current?.count ?? 0) + row.count,
      });
    }
  }

  const countLabel = (count: number) => {
    if (status === "loading") return "…";
    if (status === "error") return "—";
    return formatBrowseJobCount(count);
  };

  const featuredItems = featured.map((item) => {
    const city = canonicalBrowseCitySlug(item.id);
    let count = 0;
    for (const value of totals.values()) {
      if (value.city === city) count += value.count;
    }
    return {
      ...item,
      jobCount: countLabel(count),
    };
  });

  if (status !== "ready") return featuredItems;

  const featuredCities = new Set(
    featured.map((item) => canonicalBrowseCitySlug(item.id)),
  );
  const extras = [...totals.values()]
    .filter((value) => !featuredCities.has(value.city))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    )
    .slice(0, 10)
    .map((value) => ({
      id: value.state ? `${value.state}-${value.city}` : value.city,
      name: value.name,
      jobCount: formatBrowseJobCount(value.count),
      href: buildJobSearchHref({
        state: value.state || undefined,
        cities: [value.city],
      }),
    }));

  return [...featuredItems, ...extras];
}
