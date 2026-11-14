"use client";

import {
  INDIA_MAP_REGIONS,
  INDIA_MAP_VIEWBOX,
  type IndiaMapRegion,
} from "@/components/home/jobs-discovery/india-map/india-map-geometry";
import {
  topDistrictsForState,
  type StateDistrictCount,
} from "@/components/home/jobs-discovery/india-map/location-browse";
import { useTranslate } from "@/i18n/translate";
import type { PublicCityCount } from "@/services/public-location-counts.service";
import { buildJobSearchHref } from "@/utils/job-search-url";
import { cn } from "@/utils/cn";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";

type IndiaStatesMapProps = {
  counts: ReadonlyMap<string, number> | null;
  cities: readonly PublicCityCount[] | null;
  countsStatus: "loading" | "ready" | "error";
};

const NUMBER_FORMAT = new Intl.NumberFormat("en-IN");

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function regionHref(region: IndiaMapRegion): string {
  return buildJobSearchHref({ state: region.id });
}

function highlightFill(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const average = channels.reduce((sum, channel) => sum + channel, 0) / 3;
  const next = channels.map((channel) => {
    const saturated = average + (channel - average) * 1.85;
    return Math.round(Math.min(255, Math.max(0, saturated * 0.84)));
  });
  return `#${next.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function touchPoints(region: IndiaMapRegion): readonly (readonly [number, number])[] {
  if (region.markers.length > 0) return region.markers;
  if (region.hitR > 0) return [[region.anchorX, region.anchorY]];
  return [];
}

export function IndiaStatesMap({
  counts,
  cities,
  countsStatus,
}: IndiaStatesMapProps) {
  const t = useTranslate();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const pinnedRef = useRef<string | null>(null);
  const armedRef = useRef(false);
  const pressedRef = useRef(false);
  const shownId = pinnedId ?? activeId;
  const shown = INDIA_MAP_REGIONS.find((region) => region.id === shownId) ?? null;

  const countLabel = (region: IndiaMapRegion) => {
    if (countsStatus === "error" || !counts) {
      return countsStatus === "loading"
        ? "…"
        : t("home.jobsDiscovery.countsUnavailable");
    }
    const count = counts.get(region.id) ?? 0;
    return t("home.common.jobCount", { count: NUMBER_FORMAT.format(count) });
  };

  const districts = useMemo(
    () => (shown && countsStatus === "ready" ? topDistrictsForState(cities, shown.id, 5) : []),
    [cities, countsStatus, shown],
  );

  const selectRegion = (region: IndiaMapRegion) => {
    pinnedRef.current = region.id;
    armedRef.current = false;
    setPinnedId(region.id);
  };

  const pressRegion = (event: ReactPointerEvent<Element>, region: IndiaMapRegion) => {
    if (event.button !== 0) return;
    pressedRef.current = true;
    if (pinnedRef.current === region.id) {
      armedRef.current = true;
      return;
    }
    selectRegion(region);
  };

  const openRegion = (event: MouseEvent<Element>, region: IndiaMapRegion) => {
    if (isModifiedClick(event)) return;
    event.preventDefault();
    event.stopPropagation();

    const fromPointer = pressedRef.current;
    pressedRef.current = false;

    if (pinnedRef.current !== region.id) {
      selectRegion(region);
      return;
    }

    if (event.detail > 1) return;

    if (fromPointer) {
      if (armedRef.current) router.push(regionHref(region));
      return;
    }

    router.push(regionHref(region));
  };

  const showRegion = (region: IndiaMapRegion) => {
    if (pinnedRef.current) return;
    setActiveId(region.id);
  };

  return (
    <div
      className="flex flex-col gap-4 lg:flex-row lg:items-start"
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        setActiveId(null);
      }}
    >
      <div className="relative min-w-0 w-full lg:max-w-4xl lg:flex-1">
        <svg
          viewBox={`0 0 ${INDIA_MAP_VIEWBOX.width} ${INDIA_MAP_VIEWBOX.height}`}
          className="mx-auto block h-auto w-full"
          role="group"
          aria-label={t("home.jobsDiscovery.mapAria")}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            pinnedRef.current = null;
            armedRef.current = false;
            setPinnedId(null);
          }}
        >
          {INDIA_MAP_REGIONS.map((region) => {
            const active = shownId === region.id;
            const href = regionHref(region);
            const label = `${region.name} – ${countLabel(region)}`;
            return (
              <a
                key={region.id}
                href={href}
                aria-label={label}
                className="outline-none"
                onPointerDown={(event) => pressRegion(event, region)}
                onClick={(event) => openRegion(event, region)}
                onDoubleClick={(event) => event.preventDefault()}
                onPointerEnter={(event) => {
                  if (event.pointerType === "touch") return;
                  showRegion(region);
                }}
                onFocus={() => showRegion(region)}
              >
                <path
                  d={region.d}
                  fill={active ? highlightFill(region.fill) : region.fill}
                  fillRule="evenodd"
                  stroke={active ? "#7dcec8" : "#ffffff"}
                  strokeWidth={active ? 1 : 1.2}
                  vectorEffect="non-scaling-stroke"
                  className="transition-[fill,stroke] duration-200 ease-out"
                />
                {touchPoints(region).map(([x, y]) => (
                  <circle
                    key={`${region.id}-${x}-${y}-hit`}
                    cx={x}
                    cy={y}
                    r={Math.max(region.hitR, 18)}
                    fill="transparent"
                  />
                ))}
                {region.markers.map(([x, y]) => (
                  <circle
                    key={`${region.id}-${x}-${y}`}
                    cx={x}
                    cy={y}
                    r={4.2}
                    fill="#8ec4ea"
                    stroke="#ffffff"
                    strokeWidth={1.2}
                    pointerEvents="none"
                  />
                ))}
                <text
                  x={region.labelX}
                  y={region.labelY}
                  textAnchor={region.labelAnchor}
                  fontSize={region.labelSize - 1}
                  fontWeight={600}
                  fill="#1a2b3c"
                  stroke="#ffffff"
                  strokeWidth={3.5}
                  paintOrder="stroke"
                  pointerEvents="none"
                  style={{ fontFamily: "inherit" }}
                >
                  {region.label.map((line, index) => (
                    <tspan
                      key={line}
                      x={region.labelX}
                      dy={
                        index === 0
                          ? `${-((region.label.length - 1) * 0.58)}em`
                          : "1.16em"
                      }
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </a>
            );
          })}
          {shown ? (
            <path
              d={shown.d}
              fill="none"
              stroke="#0e8585"
              strokeWidth={1.15}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
              style={{
                filter: "drop-shadow(0 0 2px rgba(14,133,133,0.35))",
              }}
            />
          ) : null}
        </svg>

        <div className="pointer-events-none absolute inset-0 lg:hidden">
          {INDIA_MAP_REGIONS.filter((region) => region.hitR > 0).flatMap((region) =>
            touchPoints(region).map(([x, y]) => (
              <a
                key={`${region.id}-pad-${x}-${y}`}
                href={regionHref(region)}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-auto absolute size-11 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(x / INDIA_MAP_VIEWBOX.width) * 100}%`,
                  top: `${(y / INDIA_MAP_VIEWBOX.height) * 100}%`,
                }}
                onPointerDown={(event) => pressRegion(event, region)}
                onClick={(event) => openRegion(event, region)}
              />
            )),
          )}
        </div>
      </div>

      <aside
        aria-live="polite"
        className={cn(
          "w-full shrink-0 lg:sticky lg:top-24 lg:w-80",
          shown ? "block" : "hidden lg:block",
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-[#d5e6f2] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:rounded-[20px] lg:bg-[#f4f9fc] lg:shadow-none">
          {shown ? (
            <StateJobsBox
              region={shown}
              countLabel={countLabel(shown)}
              districts={districts}
              formatCount={(count) =>
                t("home.common.jobCount", { count: NUMBER_FORMAT.format(count) })
              }
              viewAllLabel={t("home.jobsDiscovery.viewAllJobs")}
              noJobsLabel={t("home.jobsDiscovery.noJobs", { state: shown.name })}
            />
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 py-8 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-white text-primary shadow-[0_8px_20px_rgba(14,133,133,0.12)]">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 max-w-[14rem] text-sm font-medium leading-relaxed text-muted">
                {t("home.jobsDiscovery.hoverHint")}
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function StateJobsBox({
  region,
  countLabel,
  districts,
  formatCount,
  viewAllLabel,
  noJobsLabel,
}: {
  region: IndiaMapRegion;
  countLabel: string;
  districts: readonly StateDistrictCount[];
  formatCount: (count: number) => string;
  viewAllLabel: string;
  noJobsLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-[#e6eef5] px-4 py-3.5 lg:block lg:border-[#d5e6f2] lg:bg-white lg:py-4">
        <h3 className="text-base font-bold tracking-tight text-foreground lg:text-sm">
          {region.name}
        </h3>
        <p className="inline-flex shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary lg:mt-2 lg:text-[11px]">
          {countLabel}
        </p>
      </div>

      <div className="px-2 py-1 lg:bg-[#f4f9fc] lg:p-3">
        {districts.length > 0 ? (
          <ul>
            {districts.map((district) => (
              <li key={district.id} className="border-b border-[#eef3f8] last:border-b-0 lg:border-0">
                <Link
                  href={district.href}
                  className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[#f4f9fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:py-2.5 lg:hover:bg-white"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-foreground lg:text-xs">
                    {district.name}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary lg:text-[11px]">
                    {formatCount(district.count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-muted lg:text-xs">{noJobsLabel}</p>
        )}

        <Link
          href={regionHref(region)}
          className="mx-2 mb-3 mt-1 flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:mx-0 lg:mb-0 lg:mt-2 lg:inline-flex lg:justify-start lg:bg-transparent lg:px-1 lg:py-0 lg:text-xs lg:text-primary lg:hover:bg-transparent lg:hover:text-primary-hover"
        >
          {viewAllLabel}
        </Link>
      </div>
    </div>
  );
}
