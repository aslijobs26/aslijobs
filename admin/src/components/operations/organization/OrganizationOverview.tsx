import {
  Building2,
  ChevronRight,
  MapPin,
  Settings2,
  Shield,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  UsersRound,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import indiaStatesMap from "../../../assets/india-states-map.json";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { OperationsOrgOverviewResponse } from "../../../types/operations-organization";
import { cn } from "../../../utils/cn";
import {
  resolveIndiaStateLabel,
  resolveMapFeatureStateName,
} from "../employers/overview/india-state-normalize";
import {
  getCachedIndiaStateDistrictMap,
  loadIndiaStateDistrictMap,
  prefetchIndiaStateDistrictMaps,
  type IndiaStateDistrictMap,
} from "../../../utils/india-state-districts";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

/** Region org units → Indian states shown when that region is selected. */
const REGION_STATE_LABELS: Record<string, string[]> = {
  "south india": [
    "Andhra Pradesh",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Telangana",
    "Puducherry",
    "Andaman and Nicobar Islands",
    "Lakshadweep",
  ],
  "west india": ["Goa", "Gujarat", "Maharashtra", "Dadra and Nagar Haveli and Daman and Diu"],
  "north india": [
    "Chandigarh",
    "Delhi",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Ladakh",
    "Punjab",
    "Rajasthan",
    "Uttar Pradesh",
    "Uttarakhand",
  ],
  "east india": ["Bihar", "Jharkhand", "Odisha", "West Bengal", "Sikkim"],
  "central india": ["Chhattisgarh", "Madhya Pradesh"],
  "northeast india": [
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Tripura",
  ],
};

const KPI_META: Record<
  OperationsOrgOverviewResponse["kpis"][number]["id"],
  {
    icon: LucideIcon;
    iconClass: string;
    wrapClass: string;
    cardClassName: string;
  }
> = {
  people: {
    icon: Users,
    iconClass: "text-sky-600",
    wrapClass: "bg-sky-500/20",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
  },
  teams: {
    icon: UsersRound,
    iconClass: "text-violet-600",
    wrapClass: "bg-violet-500/20",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
  },
  departments: {
    icon: Building2,
    iconClass: "text-amber-600",
    wrapClass: "bg-amber-500/20",
    cardClassName:
      "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white dark:border-amber-500/25 dark:from-amber-500/10 dark:to-surface",
  },
  cities: {
    icon: MapPin,
    iconClass: "text-emerald-600",
    wrapClass: "bg-emerald-500/20",
    cardClassName:
      "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-500/25 dark:from-emerald-500/10 dark:to-surface",
  },
};

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
  "add-team": UsersRound,
  "add-department": Building2,
  "assign-people": UserPlus,
  "manage-roles": Shield,
  "view-reports": BarChart3,
  "location-settings": Settings2,
};

const DONUT_COLORS = [
  "#2563EB",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#0EA5E9",
  "#6366F1",
  "#84CC16",
] as const;

const INACTIVE_FILL = "#E8EEF5";
const INACTIVE_STROKE = "#D5DEE9";
const ACTIVE_STROKE = "#0284C7";
const FOCUSED_STROKE = "#94A3B8";
const FOCUSED_STROKE_HOVER = "#64748B";

interface OrganizationOverviewProps {
  overview: OperationsOrgOverviewResponse;
  isLoading?: boolean;
  onSelectNamedLocation?: (name: string, kind: "district" | "state") => void;
  locationHint?: string | null;
}

export function OrganizationOverview({
  overview,
  isLoading,
  onSelectNamedLocation,
  locationHint,
}: OrganizationOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-hero-bg" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-xl bg-hero-bg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overview.kpis.map((kpi) => {
          const meta = KPI_META[kpi.id];
          const Icon = meta.icon;
          return (
            <div
              key={kpi.id}
              className={cn(
                "ops-brand-border-glow rounded-xl border p-3.5 shadow-sm",
                meta.cardClassName,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted">{kpi.label}</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-foreground">
                    {kpi.value.toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-lg",
                    meta.wrapClass,
                    meta.iconClass,
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[11px]">
                {kpi.trendPercent != null ? (
                  <>
                    {kpi.trendDirection === "up" ? (
                      <TrendingUp
                        className="size-3 text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : kpi.trendDirection === "down" ? (
                      <TrendingDown
                        className="size-3 text-rose-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "font-semibold",
                        kpi.trendDirection === "up" && "text-emerald-700",
                        kpi.trendDirection === "down" && "text-rose-700",
                        kpi.trendDirection === "neutral" && "text-muted",
                      )}
                    >
                      {kpi.trendPercent > 0 ? "+" : ""}
                      {kpi.trendPercent}%
                    </span>
                    <span className="text-muted">vs last quarter</span>
                  </>
                ) : (
                  <span className="text-muted">{kpi.caption}</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        <LocationMapCard
          unitName={overview.unit.name}
          unitType={overview.unit.type}
          mapPoints={overview.mapPoints}
          onSelectNamedLocation={onSelectNamedLocation}
          locationHint={locationHint}
        />
        <KeyInformationCard keyInfo={overview.keyInfo} />
        <QuickActionsCard actions={overview.quickActions} />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <TeamsTable unitName={overview.unit.name} teams={overview.teams} />
        <PeopleDistribution
          totalPeople={overview.unit.peopleCount}
          shares={overview.peopleByDepartment}
        />
      </div>
    </div>
  );
}

function LocationMapCard({
  unitName,
  unitType,
  mapPoints,
  onSelectNamedLocation,
  locationHint,
}: {
  unitName: string;
  unitType: string;
  mapPoints: OperationsOrgOverviewResponse["mapPoints"];
  onSelectNamedLocation?: (name: string, kind: "district" | "state") => void;
  locationHint?: string | null;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusedViewBox, setFocusedViewBox] = useState<string | null>(null);
  const highlightName =
    unitType === "state"
      ? (resolveIndiaStateLabel(unitName) ?? unitName)
      : null;

  const [districtMap, setDistrictMap] = useState<IndiaStateDistrictMap | null>(
    () =>
      highlightName ? getCachedIndiaStateDistrictMap(highlightName) : null,
  );
  const [districtsLoading, setDistrictsLoading] = useState(
    () => Boolean(highlightName) && !getCachedIndiaStateDistrictMap(highlightName ?? ""),
  );
  const focusGroupRef = useRef<SVGGElement>(null);

  const regionStateNames =
    unitType === "region"
      ? (REGION_STATE_LABELS[unitName.trim().toLowerCase()] ?? null)
      : null;

  useEffect(() => {
    if (!regionStateNames?.length) return;
    prefetchIndiaStateDistrictMaps(regionStateNames);
  }, [regionStateNames]);

  const allFeatures = useMemo(
    () =>
      indiaStatesMap.features.filter(
        (feature) => feature.name && feature.name !== "Unknown" && feature.d,
      ),
    [],
  );

  const visibleFeatures = useMemo(() => {
    if (highlightName) {
      const match = allFeatures.find(
        (feature) =>
          resolveMapFeatureStateName(feature.name).toLowerCase() ===
          highlightName.toLowerCase(),
      );
      return match ? [match] : [];
    }

    if (regionStateNames && regionStateNames.length > 0) {
      const allowed = new Set(
        regionStateNames.map((name) => name.toLowerCase()),
      );
      return allFeatures.filter((feature) =>
        allowed.has(resolveMapFeatureStateName(feature.name).toLowerCase()),
      );
    }

    return allFeatures;
  }, [allFeatures, highlightName, regionStateNames]);

  const showDistricts =
    Boolean(highlightName) &&
    Boolean(districtMap && districtMap.districts.length > 0);

  /** While districts load for a state, never flash the coarse state outline. */
  const waitingForDistricts = Boolean(highlightName) && !showDistricts && districtsLoading;

  const isFocusedMap =
    Boolean(highlightName) || Boolean(regionStateNames?.length);

  useEffect(() => {
    if (!highlightName) {
      setDistrictMap(null);
      setDistrictsLoading(false);
      return;
    }

    const cached = getCachedIndiaStateDistrictMap(highlightName);
    if (cached) {
      setDistrictMap(cached);
      setDistrictsLoading(false);
      return;
    }

    let cancelled = false;
    setDistrictsLoading(true);
    setDistrictMap(null);

    void loadIndiaStateDistrictMap(highlightName).then((result) => {
      if (cancelled) {
        return;
      }
      setDistrictMap(result);
      setDistrictsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [highlightName]);

  useLayoutEffect(() => {
    if (!isFocusedMap) {
      setFocusedViewBox(null);
      return;
    }

    if (waitingForDistricts) {
      setFocusedViewBox(null);
      return;
    }

    if (showDistricts && districtMap) {
      setFocusedViewBox(districtMap.viewBox);
      return;
    }

    if (visibleFeatures.length === 0) {
      setFocusedViewBox(null);
      return;
    }

    const group = focusGroupRef.current;
    if (!group) {
      setFocusedViewBox(null);
      return;
    }

    try {
      const box = group.getBBox();
      if (!box.width || !box.height) {
        setFocusedViewBox(null);
        return;
      }
      const pad = Math.max(box.width, box.height) * 0.04;
      setFocusedViewBox(
        `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`,
      );
    } catch {
      setFocusedViewBox(null);
    }
  }, [
    districtMap,
    isFocusedMap,
    showDistricts,
    visibleFeatures,
    waitingForDistricts,
  ]);

  const cityMarkers = mapPoints.filter(
    (point) => point.type === "city" || point.type === "office",
  );

  const mapCaption = highlightName
    ? cityMarkers.length > 0
      ? null
      : showDistricts
        ? `${highlightName} districts. Add cities to show location markers.`
        : districtsLoading
          ? `Loading ${highlightName} district borders…`
          : `${highlightName} focused. Add cities to show location markers.`
    : regionStateNames
      ? cityMarkers.length > 0
        ? null
        : `${unitName} states focused. Select a state for a closer view.`
      : "Select a state or add cities to focus the map.";

  const hasRenderableMap =
    showDistricts ||
    (!highlightName && visibleFeatures.length > 0) ||
    (Boolean(highlightName) && !districtsLoading && visibleFeatures.length > 0);

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="border-b border-border-subtle px-3 py-2.5">
        <h3 className="text-[13px] font-semibold text-foreground">
          Location Map
        </h3>
        <p className="text-[11px] text-muted">{unitName}</p>
      </header>
      <div className="relative bg-gradient-to-b from-sky-50/80 to-surface p-3 dark:from-sky-500/5">
        {waitingForDistricts ? (
          <div
            className="flex min-h-[16rem] max-h-[20rem] items-center justify-center"
            role="status"
            aria-live="polite"
            aria-label={`Loading ${highlightName} district map`}
          >
            <p className="text-center text-[11px] text-muted">
              Loading {highlightName} districts…
            </p>
          </div>
        ) : !hasRenderableMap ? (
          <p className="flex min-h-[16rem] items-center justify-center text-center text-[11px] text-muted">
            Map outline is not available for {unitName}.
          </p>
        ) : (
          <svg
            viewBox={
              showDistricts && districtMap
                ? districtMap.viewBox
                : (focusedViewBox ?? indiaStatesMap.viewBox)
            }
            preserveAspectRatio="xMidYMid meet"
            className={cn(
              "mx-auto h-auto w-full transition-opacity duration-150",
              showDistricts
                ? "aspect-[480/540] max-h-[20rem] max-w-[18rem] sm:max-w-[20rem]"
                : isFocusedMap
                  ? "max-h-[20rem] min-h-[16rem]"
                  : "max-h-[13rem]",
              isFocusedMap && !showDistricts && !focusedViewBox
                ? "opacity-0"
                : "opacity-100",
            )}
            role="img"
            aria-label={`Map for ${unitName}`}
          >
            <g ref={focusGroupRef}>
              {showDistricts && districtMap
                ? districtMap.districts.map((district) => {
                    const isHovered =
                      hovered?.toLowerCase() === district.name.toLowerCase();
                    return (
                      <path
                        key={district.id}
                        d={district.d}
                        fill="transparent"
                        stroke={
                          isHovered ? FOCUSED_STROKE_HOVER : FOCUSED_STROKE
                        }
                        strokeWidth={isHovered ? 1.15 : 0.85}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="cursor-pointer transition-[stroke,stroke-width] duration-150"
                        onMouseEnter={() => setHovered(district.name)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(district.name)}
                        onBlur={() => setHovered(null)}
                        onClick={() =>
                          onSelectNamedLocation?.(district.name, "district")
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelectNamedLocation?.(district.name, "district");
                          }
                        }}
                        tabIndex={0}
                        aria-label={district.name}
                      >
                        <title>{district.name}</title>
                      </path>
                    );
                  })
                : visibleFeatures.map((feature) => {
                    const canonical = resolveMapFeatureStateName(feature.name);
                    const isHovered =
                      hovered?.toLowerCase() === canonical.toLowerCase();
                    return (
                      <path
                        key={feature.id}
                        d={feature.d}
                        fill={isFocusedMap ? "none" : INACTIVE_FILL}
                        stroke={
                          isFocusedMap
                            ? isHovered
                              ? FOCUSED_STROKE_HOVER
                              : FOCUSED_STROKE
                            : isHovered
                              ? ACTIVE_STROKE
                              : INACTIVE_STROKE
                        }
                        strokeWidth={
                          isFocusedMap
                            ? isHovered
                              ? 1.6
                              : 1.1
                            : isHovered
                              ? 1.2
                              : 0.55
                        }
                        vectorEffect={
                          isFocusedMap ? "non-scaling-stroke" : undefined
                        }
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="cursor-pointer transition-[stroke,stroke-width] duration-150"
                        onMouseEnter={() => setHovered(canonical)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() =>
                          onSelectNamedLocation?.(canonical, "state")
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelectNamedLocation?.(canonical, "state");
                          }
                        }}
                        tabIndex={0}
                        aria-label={canonical}
                      />
                    );
                  })}
            </g>
          </svg>
        )}
        {locationHint ? (
          <p className="mt-2 text-center text-[11px] text-muted" role="status">
            {locationHint}
          </p>
        ) : hovered && showDistricts ? (
          <p className="mt-2 text-center text-[11px] font-medium text-foreground">
            {hovered}
          </p>
        ) : cityMarkers.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {cityMarkers.slice(0, 8).map((point) => (
              <li
                key={point.id}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-sky-800 shadow-sm ring-1 ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/30"
              >
                <MapPin className="size-2.5 shrink-0" aria-hidden="true" />
                {point.name}
              </li>
            ))}
          </ul>
        ) : mapCaption ? (
          <p className="mt-2 text-center text-[11px] text-muted">{mapCaption}</p>
        ) : null}
      </div>
    </section>
  );
}


function KeyInformationCard({
  keyInfo,
}: {
  keyInfo: OperationsOrgOverviewResponse["keyInfo"];
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Region", value: keyInfo.region ?? "—" },
    { label: "Country", value: keyInfo.country ?? "—" },
    { label: "State", value: keyInfo.state ?? "—" },
    { label: "Head", value: keyInfo.head?.name ?? "—" },
    {
      label: "Established",
      value: formatEstablished(keyInfo.establishedAt),
    },
    {
      label: "Total People",
      value: keyInfo.totalPeople.toLocaleString("en-IN"),
    },
    {
      label: "Total Teams",
      value: keyInfo.totalTeams.toLocaleString("en-IN"),
    },
    { label: "Primary Office", value: keyInfo.primaryOffice ?? "—" },
    {
      label: "Coordinates",
      value:
        keyInfo.coordinates != null
          ? formatCoordinates(
              keyInfo.coordinates.latitude,
              keyInfo.coordinates.longitude,
            )
          : "—",
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="border-b border-border-subtle px-3 py-2.5">
        <h3 className="text-[13px] font-semibold text-foreground">
          Key Information
        </h3>
      </header>
      <dl className="divide-y divide-border-subtle">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <dt className="text-[11px] text-muted">{row.label}</dt>
            <dd className="truncate text-right text-[12px] font-medium text-foreground">
              {row.label === "Head" && keyInfo.head ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-800 dark:bg-sky-500/20 dark:text-sky-200">
                    {initials(keyInfo.head.name)}
                  </span>
                  {row.value}
                </span>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function QuickActionsCard({
  actions,
}: {
  actions: OperationsOrgOverviewResponse["quickActions"];
}) {
  const available = actions.filter((action) => action.available);
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="border-b border-border-subtle px-3 py-2.5">
        <h3 className="text-[13px] font-semibold text-foreground">
          Quick Actions
        </h3>
      </header>
      {available.length === 0 ? (
        <p className="px-3 py-8 text-center text-[12px] text-muted">
          No quick actions available.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {available.map((action) => {
            const Icon = QUICK_ACTION_ICONS[action.id] ?? ChevronRight;
            return (
              <li key={action.id}>
                <Link
                  to={action.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-hero-bg text-muted">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TeamsTable({
  unitName,
  teams,
}: {
  unitName: string;
  teams: OperationsOrgOverviewResponse["teams"];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5">
        <h3 className="text-[13px] font-semibold text-foreground">
          Teams in {unitName}
        </h3>
        <Link
          to={OPERATIONS_ROUTES.TEAMS}
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </header>
      {teams.length === 0 ? (
        <p className="px-3 py-10 text-center text-[12px] text-muted">
          No teams in this scope yet.
        </p>
      ) : (
        <div className="overflow-x-auto scrollbar-hidden">
          <table className="w-full min-w-[30rem] text-left text-[12px]">
            <thead>
              <tr className="border-b border-border-subtle bg-hero-bg/50 text-[10px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-semibold">Team Name</th>
                <th className="px-3 py-2 font-semibold">Department</th>
                <th className="px-3 py-2 font-semibold">People</th>
                <th className="px-3 py-2 font-semibold">Team Lead</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.slice(0, 6).map((team) => (
                <tr
                  key={team.id}
                  className="border-b border-border-subtle/70 last:border-0"
                >
                  <td className="px-3 py-2.5 font-medium text-foreground">
                    {team.name}
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {team.departmentName}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-foreground">
                    {team.peopleCount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 text-muted">
                    {team.leadName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                          {initials(team.leadName)}
                        </span>
                        {team.leadName}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                        team.status.toLowerCase() === "active"
                          ? "bg-success/10 text-success"
                          : team.status.toLowerCase() === "archived"
                            ? "bg-muted/25 text-muted"
                            : "bg-amber-500/10 text-amber-700",
                      )}
                    >
                      {team.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PeopleDistribution({
  totalPeople,
  shares,
}: {
  totalPeople: number;
  shares: OperationsOrgOverviewResponse["peopleByDepartment"];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const total = shares.reduce((sum, item) => sum + item.count, 0);
  const chartData = shares.map((item, index) => ({
    ...item,
    fill: DONUT_COLORS[index % DONUT_COLORS.length],
  }));
  const active = chartData.find((item) => item.id === activeId) ?? null;

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2.5">
        <h3 className="text-[13px] font-semibold text-foreground">
          People Distribution by Department
        </h3>
        <Link
          to={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </header>
      {total === 0 || shares.length === 0 ? (
        <p className="flex min-h-44 items-center justify-center px-3 text-center text-[12px] text-muted">
          No people assigned in this scope.
        </p>
      ) : (
        <div className="flex min-h-44 flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <div className="relative mx-auto size-40 shrink-0 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="64%"
                  outerRadius="100%"
                  paddingAngle={1.5}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive={false}
                  onMouseLeave={() => setActiveId(null)}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.fill}
                      stroke="none"
                      style={{
                        opacity:
                          activeId == null || activeId === entry.id ? 1 : 0.4,
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => setActiveId(entry.id)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold tabular-nums text-foreground">
                {(active?.count ?? (totalPeople || total)).toLocaleString(
                  "en-IN",
                )}
              </span>
              <span className="text-[10px] text-muted">
                {active?.label ?? "People"}
              </span>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-2">
            {chartData.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 text-[12px]"
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "truncate text-muted",
                      activeId === item.id && "font-semibold text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-foreground">
                  {item.percent != null ? (
                    <span className="font-semibold">{item.percent}%</span>
                  ) : (
                    <span className="font-semibold">
                      {item.count.toLocaleString("en-IN")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatEstablished(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCoordinates(latitude: number, longitude: number): string {
  const latHemisphere = latitude >= 0 ? "N" : "S";
  const lonHemisphere = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(4)}° ${latHemisphere}, ${Math.abs(longitude).toFixed(4)}° ${lonHemisphere}`;
}
