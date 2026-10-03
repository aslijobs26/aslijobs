import type {
  OperationsPlacementsOverviewKpis,
  PlacementJoiningStatusFilter,
} from "../types/operations-placements";

export type PlacementOverviewKpi =
  | "total"
  | "joined"
  | "joining_pending"
  | "did_not_join"
  | "avg_time_to_join";

export interface PlacementOverviewKpiView {
  label: string;
  emptyMessage: string;
  /** Joining status of the placements listed when the card is selected. */
  status: PlacementJoiningStatusFilter;
  valueKey: keyof Pick<
    OperationsPlacementsOverviewKpis,
    | "totalPlacements"
    | "joined"
    | "joiningPending"
    | "didNotJoin"
    | "avgTimeToJoinDays"
  >;
  /** Card KPI holding the number of placements listed (differs for averages). */
  countKey: keyof Pick<
    OperationsPlacementsOverviewKpis,
    "totalPlacements" | "joined" | "joiningPending" | "didNotJoin"
  >;
  trendKey: keyof Pick<
    OperationsPlacementsOverviewKpis,
    | "totalPlacementsTrendPercent"
    | "joinedTrendPercent"
    | "joiningPendingTrendPercent"
    | "didNotJoinTrendPercent"
    | "avgTimeToJoinTrendPercent"
  >;
  captionKey: keyof Pick<
    OperationsPlacementsOverviewKpis,
    | "totalPlacementsCaption"
    | "joinedCaption"
    | "joiningPendingCaption"
    | "didNotJoinCaption"
    | "avgTimeToJoinCaption"
  >;
  isDays?: boolean;
}

export const PLACEMENT_OVERVIEW_KPI_VIEWS: Record<
  PlacementOverviewKpi,
  PlacementOverviewKpiView
> = {
  total: {
    label: "Total Placements",
    emptyMessage: "No placements found.",
    status: "all",
    valueKey: "totalPlacements",
    countKey: "totalPlacements",
    trendKey: "totalPlacementsTrendPercent",
    captionKey: "totalPlacementsCaption",
  },
  joined: {
    label: "Joined",
    emptyMessage: "No joined placements found.",
    status: "joined",
    valueKey: "joined",
    countKey: "joined",
    trendKey: "joinedTrendPercent",
    captionKey: "joinedCaption",
  },
  joining_pending: {
    label: "Joining Pending",
    emptyMessage: "No placements pending joining.",
    status: "joining_pending",
    valueKey: "joiningPending",
    countKey: "joiningPending",
    trendKey: "joiningPendingTrendPercent",
    captionKey: "joiningPendingCaption",
  },
  did_not_join: {
    label: "Did Not Join",
    emptyMessage: "No placements marked as did not join.",
    status: "did_not_join",
    valueKey: "didNotJoin",
    countKey: "didNotJoin",
    trendKey: "didNotJoinTrendPercent",
    captionKey: "didNotJoinCaption",
  },
  avg_time_to_join: {
    label: "Avg. Time to Join",
    emptyMessage: "No joined placements to measure time to join.",
    status: "joined",
    valueKey: "avgTimeToJoinDays",
    countKey: "joined",
    trendKey: "avgTimeToJoinTrendPercent",
    captionKey: "avgTimeToJoinCaption",
    isDays: true,
  },
};
