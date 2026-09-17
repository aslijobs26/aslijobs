import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import {
  resolveIndiaStateFromLocationFields,
  resolveIndiaStateLabel,
} from "../employers/india-state-normalize.js";
import {
  percentChange,
  resolveLocationComparisonRange,
  type DashboardDateRange,
} from "./operations-dashboard-domain.js";
import type { OperationsDashboardLocationRow } from "./operations-dashboard.types.js";

export const LOCATION_TOP_STATES = 8;
export const LOCATION_UNSPECIFIED = "Unspecified";
export const LOCATION_OTHERS = "Others";

const PLACEMENT_STATUSES = ["selected", "joined", "did_not_join"] as const;

type CountMap = Map<string, number>;

type GroupedSeekOrEmployerRow = {
  _id: {
    state?: string | null;
    city?: string | null;
    preferredJobLocation?: string | null;
  };
  count: number;
};

type GroupedJobRow = {
  _id: {
    state?: string | null;
    city?: string | null;
  };
  count: number;
};

type GroupedPlacementRow = {
  _id: {
    jobState?: string | null;
    jobStateName?: string | null;
    jobCity?: string | null;
    jobCityName?: string | null;
    seekerState?: string | null;
    seekerCity?: string | null;
    preferredJobLocation?: string | null;
  };
  count: number;
};

function trendDirection(
  percent: number | null,
  current: number,
  previous: number,
): OperationsDashboardLocationRow["trendDirection"] {
  if (previous <= 0 && current > 0) return "new";
  if (percent == null || percent === 0) return "neutral";
  return percent > 0 ? "up" : "down";
}

function addCount(target: CountMap, state: string, count: number) {
  if (count <= 0) return;
  target.set(state, (target.get(state) ?? 0) + count);
}

function firstNonEmpty(...values: Array<unknown>): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function withCreatedAt(
  match: Record<string, unknown>,
  from: Date,
  toExclusive: Date,
): Record<string, unknown> {
  const createdAt = { createdAt: { $gte: from, $lt: toExclusive } };
  if (Object.keys(match).length === 0) return createdAt;
  return { $and: [match, createdAt] };
}

function trimExpr(field: string) {
  return { $trim: { input: { $ifNull: [`$${field}`, ""] } } };
}

function filterCanonicalState(map: CountMap, selectedState: string): CountMap {
  const trimmed = selectedState.trim();
  if (!trimmed) return map;
  const canonical = resolveIndiaStateLabel(trimmed);
  if (canonical === LOCATION_UNSPECIFIED) return map;
  const next: CountMap = new Map();
  const count = map.get(canonical) ?? 0;
  if (count > 0) next.set(canonical, count);
  return next;
}

export function rankOperationsLocationActivity(input: {
  totals: CountMap;
  trendCurrent: CountMap;
  trendPrevious: CountMap;
  topStates?: number;
}): OperationsDashboardLocationRow[] {
  const topStates = input.topStates ?? LOCATION_TOP_STATES;
  const unspecifiedCount = input.totals.get(LOCATION_UNSPECIFIED) ?? 0;

  const mapped = [...input.totals.entries()]
    .filter(
      ([state, count]) =>
        state !== LOCATION_UNSPECIFIED &&
        state !== LOCATION_OTHERS &&
        count > 0,
    )
    .sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en-IN"),
    );

  const grandTotal =
    mapped.reduce((sum, [, count]) => sum + count, 0) + unspecifiedCount;

  const toRow = (
    state: string,
    totalActivity: number,
    memberStates: string[] = [state],
  ): OperationsDashboardLocationRow => {
    const trendCurrent = memberStates.reduce(
      (sum, name) => sum + (input.trendCurrent.get(name) ?? 0),
      0,
    );
    const trendPrevious = memberStates.reduce(
      (sum, name) => sum + (input.trendPrevious.get(name) ?? 0),
      0,
    );
    const trend = percentChange(trendCurrent, trendPrevious);
    return {
      state,
      totalActivity,
      sharePercent:
        grandTotal > 0
          ? Math.round((totalActivity / grandTotal) * 1000) / 10
          : null,
      trendPercent: trend,
      trendDirection: trendDirection(trend, trendCurrent, trendPrevious),
    };
  };

  const head =
    mapped.length <= topStates
      ? mapped
      : mapped.slice(0, Math.max(topStates - 1, 1));
  const rest =
    mapped.length <= topStates ? [] : mapped.slice(Math.max(topStates - 1, 1));

  const rows = head.map(([state, count]) => toRow(state, count));
  if (rest.length > 0) {
    const othersActivity = rest.reduce((sum, [, count]) => sum + count, 0);
    rows.push(
      toRow(
        LOCATION_OTHERS,
        othersActivity,
        rest.map(([state]) => state),
      ),
    );
  }
  if (unspecifiedCount > 0) {
    rows.push(toRow(LOCATION_UNSPECIFIED, unspecifiedCount));
  }
  return rows;
}

function accumulateSeekerRows(
  target: CountMap,
  rows: GroupedSeekOrEmployerRow[],
) {
  for (const row of rows) {
    addCount(
      target,
      resolveIndiaStateFromLocationFields({
        state: row._id.state,
        city: row._id.city,
        preferredJobLocation: row._id.preferredJobLocation,
      }),
      row.count,
    );
  }
}

function accumulateJobRows(target: CountMap, rows: GroupedJobRow[]) {
  for (const row of rows) {
    addCount(
      target,
      resolveIndiaStateFromLocationFields({
        state: row._id.state,
        city: row._id.city,
      }),
      row.count,
    );
  }
}

function accumulatePlacementRows(
  target: CountMap,
  rows: GroupedPlacementRow[],
) {
  for (const row of rows) {
    addCount(
      target,
      resolveIndiaStateFromLocationFields({
        state: firstNonEmpty(
          row._id.jobStateName,
          row._id.jobState,
          row._id.seekerState,
        ),
        city: firstNonEmpty(
          row._id.jobCityName,
          row._id.jobCity,
          row._id.seekerCity,
        ),
        preferredJobLocation: row._id.preferredJobLocation,
      }),
      row.count,
    );
  }
}

async function loadSeekerLocationCounts(
  match: Record<string, unknown>,
  from: Date,
  toExclusive: Date,
): Promise<GroupedSeekOrEmployerRow[]> {
  return JobSeekerModel.aggregate<GroupedSeekOrEmployerRow>([
    { $match: withCreatedAt(match, from, toExclusive) },
    {
      $group: {
        _id: {
          state: trimExpr("state"),
          city: trimExpr("city"),
          preferredJobLocation: trimExpr("preferredJobLocation"),
        },
        count: { $sum: 1 },
      },
    },
  ]);
}

async function loadEmployerLocationCounts(
  match: Record<string, unknown>,
  from: Date,
  toExclusive: Date,
): Promise<GroupedSeekOrEmployerRow[]> {
  return EmployerModel.aggregate<GroupedSeekOrEmployerRow>([
    { $match: withCreatedAt(match, from, toExclusive) },
    {
      $group: {
        _id: {
          state: trimExpr("state"),
          city: trimExpr("city"),
        },
        count: { $sum: 1 },
      },
    },
  ]);
}

async function loadJobLocationCounts(
  match: Record<string, unknown>,
  from: Date,
  toExclusive: Date,
): Promise<GroupedJobRow[]> {
  return JobModel.aggregate<GroupedJobRow>([
    { $match: withCreatedAt(match, from, toExclusive) },
    {
      $group: {
        _id: {
          state: {
            $let: {
              vars: {
                name: trimExpr("stateName"),
                code: trimExpr("state"),
              },
              in: {
                $cond: [{ $ne: ["$$name", ""] }, "$$name", "$$code"],
              },
            },
          },
          city: {
            $let: {
              vars: {
                name: trimExpr("cityName"),
                code: trimExpr("city"),
              },
              in: {
                $cond: [{ $ne: ["$$name", ""] }, "$$name", "$$code"],
              },
            },
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);
}

async function loadPlacementLocationCounts(
  match: Record<string, unknown>,
  from: Date,
  toExclusive: Date,
): Promise<GroupedPlacementRow[]> {
  return ApplicationModel.aggregate<GroupedPlacementRow>([
    { $match: withCreatedAt(match, from, toExclusive) },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              state: 1,
              stateName: 1,
              city: 1,
              cityName: 1,
            },
          },
        ],
        as: "job",
      },
    },
    {
      $lookup: {
        from: "jobseekers",
        localField: "jobSeekerId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              state: 1,
              city: 1,
              preferredJobLocation: 1,
            },
          },
        ],
        as: "seeker",
      },
    },
    {
      $group: {
        _id: {
          jobState: {
            $trim: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$job.state", 0] }, ""],
              },
            },
          },
          jobStateName: {
            $trim: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$job.stateName", 0] }, ""],
              },
            },
          },
          jobCity: {
            $trim: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$job.city", 0] }, ""],
              },
            },
          },
          jobCityName: {
            $trim: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$job.cityName", 0] }, ""],
              },
            },
          },
          seekerState: {
            $trim: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$seeker.state", 0] }, ""],
              },
            },
          },
          seekerCity: {
            $trim: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$seeker.city", 0] }, ""],
              },
            },
          },
          preferredJobLocation: {
            $trim: {
              input: {
                $ifNull: [
                  { $arrayElemAt: ["$seeker.preferredJobLocation", 0] },
                  "",
                ],
              },
            },
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);
}

async function accumulateWindow(input: {
  from: Date;
  toExclusive: Date;
  canCandidates: boolean;
  canEmployers: boolean;
  canJobs: boolean;
  canPlacements: boolean;
  employerMatch: Record<string, unknown>;
}): Promise<CountMap> {
  const target: CountMap = new Map();
  const loads: Promise<void>[] = [];

  if (input.canCandidates) {
    loads.push(
      loadSeekerLocationCounts(
        { registrationStatus: "COMPLETED" },
        input.from,
        input.toExclusive,
      ).then((rows) => accumulateSeekerRows(target, rows)),
    );
  }
  if (input.canEmployers) {
    loads.push(
      loadEmployerLocationCounts(
        input.employerMatch,
        input.from,
        input.toExclusive,
      ).then((rows) => accumulateSeekerRows(target, rows)),
    );
  }
  if (input.canJobs) {
    loads.push(
      loadJobLocationCounts({}, input.from, input.toExclusive).then((rows) =>
        accumulateJobRows(target, rows),
      ),
    );
  }
  if (input.canPlacements) {
    loads.push(
      loadPlacementLocationCounts(
        { status: { $in: [...PLACEMENT_STATUSES] } },
        input.from,
        input.toExclusive,
      ).then((rows) => accumulatePlacementRows(target, rows)),
    );
  }

  await Promise.all(loads);
  return target;
}

export async function buildLocationActivity(input: {
  canCandidates: boolean;
  canEmployers: boolean;
  canJobs: boolean;
  canPlacements: boolean;
  range: DashboardDateRange;
  selectedState?: string;
  employerMatch: Record<string, unknown>;
}): Promise<OperationsDashboardLocationRow[]> {
  const windows = resolveLocationComparisonRange(input.range);
  const selectedState = input.selectedState?.trim() ?? "";

  const totalsPromise = accumulateWindow({
    from: windows.totalsFrom,
    toExclusive: windows.totalsToExclusive,
    canCandidates: input.canCandidates,
    canEmployers: input.canEmployers,
    canJobs: input.canJobs,
    canPlacements: input.canPlacements,
    employerMatch: input.employerMatch,
  });

  const trendPreviousPromise = accumulateWindow({
    from: windows.trendPreviousFrom,
    toExclusive: windows.trendPreviousToExclusive,
    canCandidates: input.canCandidates,
    canEmployers: input.canEmployers,
    canJobs: input.canJobs,
    canPlacements: input.canPlacements,
    employerMatch: input.employerMatch,
  });

  const trendCurrentPromise = windows.usesDistinctTrendWindow
    ? accumulateWindow({
        from: windows.trendCurrentFrom,
        toExclusive: windows.trendCurrentToExclusive,
        canCandidates: input.canCandidates,
        canEmployers: input.canEmployers,
        canJobs: input.canJobs,
        canPlacements: input.canPlacements,
        employerMatch: input.employerMatch,
      })
    : null;

  const [totalsRaw, trendPreviousRaw, trendCurrentRaw] = await Promise.all([
    totalsPromise,
    trendPreviousPromise,
    trendCurrentPromise,
  ]);

  const totals = filterCanonicalState(totalsRaw, selectedState);
  const trendPrevious = filterCanonicalState(trendPreviousRaw, selectedState);
  const trendCurrent = filterCanonicalState(
    trendCurrentRaw ?? totalsRaw,
    selectedState,
  );

  return rankOperationsLocationActivity({
    totals,
    trendCurrent,
    trendPrevious,
  });
}
