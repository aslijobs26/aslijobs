import { JobModel } from "./job.model.js";
import {
  readPublicLocationCountsCache,
  rollupPublicLocationCounts,
  toPublicCountSlug,
  writePublicLocationCountsCache,
  type PublicLocationCountRow,
  type PublicLocationCounts,
} from "./public-location-counts.js";

type LocationCountAggregate = {
  _id: {
    state: string;
    stateName: string;
    city: string;
    cityName: string;
  };
  count: number;
};

/**
 * Active-job counts by state and city.
 * Uses the same `status: "active"` rule as the public jobs listing total.
 * Employer verification is enforced when a job is published, so this aggregate
 * does not repeat that lookup — matching `countDocuments` on the jobs page.
 */
export async function getPublicLocationCounts(): Promise<PublicLocationCounts> {
  const cached = readPublicLocationCountsCache();
  if (cached) return cached;

  const grouped = await JobModel.aggregate<LocationCountAggregate>([
    { $match: { status: "active" } },
    {
      $group: {
        _id: {
          state: { $toLower: { $trim: { input: { $ifNull: ["$state", ""] } } } },
          stateName: {
            $toLower: { $trim: { input: { $ifNull: ["$stateName", ""] } } },
          },
          city: { $toLower: { $trim: { input: { $ifNull: ["$city", ""] } } } },
          cityName: { $trim: { input: { $ifNull: ["$cityName", ""] } } },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const rows: PublicLocationCountRow[] = grouped.map((row) => ({
    state: toPublicCountSlug(row._id.state),
    stateName: row._id.stateName,
    city: toPublicCountSlug(row._id.city),
    cityName: row._id.cityName,
    count: row.count,
  }));

  const value = rollupPublicLocationCounts(rows);
  writePublicLocationCountsCache(value);
  return value;
}
