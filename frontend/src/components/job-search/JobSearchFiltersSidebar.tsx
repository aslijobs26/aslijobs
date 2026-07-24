"use client";

import {
  JOB_SEARCH_EXPERIENCE_OPTIONS,
  JOB_SEARCH_GENDER_OPTIONS,
  JOB_SEARCH_JOB_TYPE_OPTIONS,
  JOB_SEARCH_SALARY_DEBOUNCE_MS,
  JOB_SEARCH_SALARY_MIN_GAP,
  JOB_SEARCH_SALARY_PRESETS,
  JOB_SEARCH_SALARY_SLIDER_MAX,
  JOB_SEARCH_WORK_MODE_OPTIONS,
} from "@/constants/job-search";
import type { PublicJobCityFacet } from "@/services/public-jobs.service";
import {
  resolveIndiaStateLabel,
  searchIndiaCities,
} from "@/services/nominatim-location.service";
import type { JobSearchUrlState } from "@/types/job-search";
import { cn } from "@/utils/cn";
import { toJobSearchLocationSlug } from "@/utils/job-search-url";
import { ChevronDown, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const LOCATION_VISIBLE_COUNT = 5;

type JobSearchFiltersSidebarProps = {
  state: JobSearchUrlState;
  cityFacets: PublicJobCityFacet[];
  isLocationLoading?: boolean;
  onChange: (patch: Partial<JobSearchUrlState>) => void;
  onClearFilters: () => void;
  /** Defaults to full desktop sidebar chrome. Use `panel` inside mobile sheets. */
  presentation?: "sidebar" | "panel";
  /** When set, only these panels render. Omit for full filter set. */
  panels?: JobSearchFilterPanelId[];
};

export type JobSearchFilterPanelId =
  | "within"
  | "location"
  | "experience"
  | "salary"
  | "jobType"
  | "gender"
  | "workMode";

type FilterSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  showTitle?: boolean;
  showBorder?: boolean;
};

type LocationOption = {
  city: string;
  cityName: string;
  count?: number;
};

function FilterSection({
  title,
  children,
  defaultOpen = true,
  collapsible = true,
  showTitle = true,
  showBorder = true,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const isOpen = collapsible ? open : true;

  return (
    <div
      className={cn(
        showBorder && "border-b border-border-subtle last:border-b-0",
        showTitle || collapsible ? "py-5" : "py-1",
      )}
    >
      {showTitle && collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-2 rounded-lg text-left transition-colors hover:text-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/30"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            {title}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform duration-300 ease-out",
              isOpen ? "rotate-180" : "rotate-0",
            )}
            strokeWidth={2.25}
            aria-hidden="true"
          />
        </button>
      ) : null}
      {showTitle && !collapsible ? (
        <h3 className="text-[15px] font-bold tracking-tight text-foreground">
          {title}
        </h3>
      ) : null}
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              showTitle ? (collapsible ? "pt-3.5" : "pt-3") : undefined,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterCheckboxRow({
  checked,
  label,
  count,
  onChange,
}: {
  checked: boolean;
  label: string;
  count?: number;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors",
        "hover:bg-hero-bg/80",
        checked ? "bg-primary-soft/5" : "",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="job-search-filter-checkbox"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {label}
      </span>
      {count !== undefined ? (
        <span className="shrink-0 text-sm tabular-nums text-muted">
          ({count.toLocaleString("en-IN")})
        </span>
      ) : null}
    </label>
  );
}

function FilterRadioRow({
  name,
  checked,
  label,
  onChange,
}: {
  name: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors",
        "hover:bg-hero-bg/80",
        checked ? "bg-primary-soft/5" : "",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="job-search-filter-radio"
      />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}

function LocationFilterSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {Array.from({ length: LOCATION_VISIBLE_COUNT }).map((_, index) => (
        <li
          key={index}
          className="flex items-center gap-3 rounded-xl px-2 py-2"
        >
          <span className="size-4 shrink-0 rounded bg-border-subtle" />
          <span className="h-3.5 flex-1 rounded bg-border-subtle" />
          <span className="h-3.5 w-8 shrink-0 rounded bg-border-subtle" />
        </li>
      ))}
    </ul>
  );
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function formatSalaryFilterAmount(value: number, isOpenEndedMax = false): string {
  if (isOpenEndedMax && value >= JOB_SEARCH_SALARY_SLIDER_MAX) {
    return `₹${JOB_SEARCH_SALARY_SLIDER_MAX.toLocaleString("en-IN")}+`;
  }

  return `₹${value.toLocaleString("en-IN")}`;
}

function resolveSalaryDraftFromState(
  minSalary: number | undefined,
  maxSalary: number | undefined,
): { min: number; max: number } {
  const max =
    maxSalary === undefined
      ? JOB_SEARCH_SALARY_SLIDER_MAX
      : Math.min(maxSalary, JOB_SEARCH_SALARY_SLIDER_MAX);
  const min = Math.min(minSalary ?? 0, max);
  return { min, max };
}

function SalaryRangeFilter({
  minSalary,
  maxSalary,
  onChange,
}: {
  minSalary: number | undefined;
  maxSalary: number | undefined;
  onChange: (patch: {
    minSalary: number | undefined;
    maxSalary: number | undefined;
    page: number;
  }) => void;
}) {
  const syncedKey = `${minSalary ?? ""}|${maxSalary === undefined ? "open" : maxSalary}`;
  const [draft, setDraft] = useState(() =>
    resolveSalaryDraftFromState(minSalary, maxSalary),
  );
  const [syncedSalaryKey, setSyncedSalaryKey] = useState(syncedKey);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  if (syncedKey !== syncedSalaryKey) {
    setSyncedSalaryKey(syncedKey);
    setDraft(resolveSalaryDraftFromState(minSalary, maxSalary));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const isFullRange =
        draft.min === 0 && draft.max >= JOB_SEARCH_SALARY_SLIDER_MAX;
      const nextMin = isFullRange ? undefined : draft.min;
      const nextMax = isFullRange
        ? undefined
        : draft.max >= JOB_SEARCH_SALARY_SLIDER_MAX
          ? undefined
          : draft.max;

      const currentMax =
        maxSalary === undefined || maxSalary >= JOB_SEARCH_SALARY_SLIDER_MAX
          ? undefined
          : maxSalary;

      if (minSalary === nextMin && currentMax === nextMax) {
        return;
      }

      onChangeRef.current({
        minSalary: nextMin,
        maxSalary: nextMax,
        page: 1,
      });
    }, JOB_SEARCH_SALARY_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft.max, draft.min, maxSalary, minSalary]);

  const rangeFillStart = (draft.min / JOB_SEARCH_SALARY_SLIDER_MAX) * 100;
  const rangeFillEnd = (draft.max / JOB_SEARCH_SALARY_SLIDER_MAX) * 100;
  const isOpenEndedMax = draft.max >= JOB_SEARCH_SALARY_SLIDER_MAX;

  const handleMinChange = (rawValue: number) => {
    const cappedMax = Math.max(draft.max, JOB_SEARCH_SALARY_MIN_GAP);
    const nextMin = Math.min(
      rawValue,
      cappedMax - JOB_SEARCH_SALARY_MIN_GAP,
    );
    setDraft((current) => ({
      ...current,
      min: Math.max(0, nextMin),
    }));
  };

  const handleMaxChange = (rawValue: number) => {
    const nextMax = Math.max(
      rawValue,
      draft.min + JOB_SEARCH_SALARY_MIN_GAP,
    );
    setDraft((current) => ({
      ...current,
      max: Math.min(JOB_SEARCH_SALARY_SLIDER_MAX, nextMax),
    }));
  };

  const applyPreset = (preset: (typeof JOB_SEARCH_SALARY_PRESETS)[number]) => {
    const nextMax =
      preset.max === undefined
        ? JOB_SEARCH_SALARY_SLIDER_MAX
        : Math.min(preset.max, JOB_SEARCH_SALARY_SLIDER_MAX);
    const nextMin = Math.min(preset.min, nextMax);
    setDraft({ min: nextMin, max: nextMax });
    onChange({
      minSalary: nextMin,
      maxSalary: preset.max,
      page: 1,
    });
  };

  return (
    <div className="space-y-5 px-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-subtle bg-hero-bg/60 px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-[0.04em] text-muted uppercase">
            Minimum
          </p>
          <p className="mt-1 text-sm font-bold text-foreground tabular-nums">
            {formatSalaryFilterAmount(draft.min)}
          </p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-hero-bg/60 px-3 py-2.5 text-right">
          <p className="text-[10px] font-semibold tracking-[0.04em] text-muted uppercase">
            Maximum
          </p>
          <p className="mt-1 text-sm font-bold text-foreground tabular-nums">
            {formatSalaryFilterAmount(draft.max, true)}
          </p>
        </div>
      </div>

      <div className="job-search-salary-range">
        <div
          className="job-search-salary-range__track"
          style={
            {
              "--range-start": `${rangeFillStart}%`,
              "--range-end": `${rangeFillEnd}%`,
            } as CSSProperties
          }
        />
        <input
          type="range"
          min={0}
          max={JOB_SEARCH_SALARY_SLIDER_MAX}
          step={JOB_SEARCH_SALARY_MIN_GAP}
          value={draft.min}
          onChange={(event) => handleMinChange(Number(event.target.value))}
          className="job-search-salary-range__input job-search-salary-range__input--min"
          aria-label="Minimum salary"
        />
        <input
          type="range"
          min={0}
          max={JOB_SEARCH_SALARY_SLIDER_MAX}
          step={JOB_SEARCH_SALARY_MIN_GAP}
          value={draft.max}
          onChange={(event) => handleMaxChange(Number(event.target.value))}
          className="job-search-salary-range__input job-search-salary-range__input--max"
          aria-label="Maximum salary"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {JOB_SEARCH_SALARY_PRESETS.map((preset) => {
          const hasSalaryFilter =
            minSalary !== undefined || maxSalary !== undefined;
          const stateMatches =
            (minSalary ?? 0) === preset.min &&
            (preset.max === undefined
              ? maxSalary === undefined
              : maxSalary === preset.max);
          const draftMatches =
            draft.min === preset.min &&
            (preset.max === undefined
              ? draft.max >= JOB_SEARCH_SALARY_SLIDER_MAX
              : draft.max === preset.max);
          const active = hasSalaryFilter && stateMatches && draftMatches;

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/30",
                active
                  ? "border-primary-soft bg-primary-soft text-white shadow-sm"
                  : "border-border bg-surface text-foreground hover:-translate-y-px hover:border-primary-soft/40 hover:bg-primary-soft/5",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        Salary range {formatSalaryFilterAmount(draft.min)} to{" "}
        {formatSalaryFilterAmount(draft.max, isOpenEndedMax)}
      </p>
    </div>
  );
}

export function JobSearchFiltersSidebar({
  state,
  cityFacets,
  isLocationLoading = false,
  onChange,
  onClearFilters,
  presentation = "sidebar",
  panels,
}: JobSearchFiltersSidebarProps) {
  const isPanel = presentation === "panel";
  const showPanel = (id: JobSearchFilterPanelId) =>
    !panels || panels.includes(id);
  const sectionCollapsible = !isPanel;
  const singlePanel = isPanel && (panels?.length ?? 0) === 1;
  const sectionShowTitle = !singlePanel;
  const sectionShowBorder = !singlePanel;
  const [withinDraft, setWithinDraft] = useState(state.within);
  const [syncedWithin, setSyncedWithin] = useState(state.within);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSearchResults, setLocationSearchResults] = useState<
    LocationOption[]
  >([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(
    state.workMode.length > 0 || isPanel,
  );
  const [showAllCities, setShowAllCities] = useState(false);
  const [syncedStateSlug, setSyncedStateSlug] = useState(state.state);
  const onChangeRef = useRef(onChange);
  const withinInputId = useId();
  const locationSearchId = useId();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  if (state.within !== syncedWithin) {
    setSyncedWithin(state.within);
    setWithinDraft(state.within);
  }

  if (state.state !== syncedStateSlug) {
    setSyncedStateSlug(state.state);
    setLocationQuery("");
    setLocationSearchResults([]);
    setShowAllCities(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (withinDraft.trim() !== state.within) {
        onChangeRef.current({ within: withinDraft.trim(), page: 1 });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [withinDraft, state.within]);

  const stateLabel = useMemo(
    () => (state.state ? resolveIndiaStateLabel(state.state) : ""),
    [state.state],
  );

  const facetCountByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const facet of cityFacets) {
      map.set(facet.city, facet.count);
    }
    return map;
  }, [cityFacets]);

  useEffect(() => {
    const query = locationQuery.trim();
    if (!state.state || query.length < 2) {
      setLocationSearchResults([]);
      setIsLocationSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLocationSearching(true);
      void searchIndiaCities(query, stateLabel || state.state, controller.signal)
        .then((suggestions) => {
          const options: LocationOption[] = [];
          for (const suggestion of suggestions) {
            const citySlug =
              toJobSearchLocationSlug(suggestion.city) || suggestion.city;
            if (!citySlug) {
              continue;
            }
            if (options.some((option) => option.city === citySlug)) {
              continue;
            }
            options.push({
              city: citySlug,
              cityName: suggestion.city || suggestion.label,
              count: facetCountByCity.get(citySlug),
            });
          }
          setLocationSearchResults(options);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setLocationSearchResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLocationSearching(false);
          }
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [facetCountByCity, locationQuery, state.state, stateLabel]);

  const normalizedLocationQuery = locationQuery.trim().toLowerCase();
  const isSearchingLocations = normalizedLocationQuery.length > 0;

  const filteredFacetCities = useMemo(() => {
    if (!normalizedLocationQuery) {
      return cityFacets;
    }

    return cityFacets.filter((facet) => {
      const name = facet.cityName.toLowerCase();
      const slug = facet.city.toLowerCase();
      return (
        name.includes(normalizedLocationQuery) ||
        slug.includes(normalizedLocationQuery)
      );
    });
  }, [cityFacets, normalizedLocationQuery]);

  const locationOptions = useMemo(() => {
    if (!isSearchingLocations) {
      return filteredFacetCities.map((facet) => ({
        city: facet.city,
        cityName: facet.cityName,
        count: facet.count,
      }));
    }

    if (normalizedLocationQuery.length < 2) {
      return filteredFacetCities.map((facet) => ({
        city: facet.city,
        cityName: facet.cityName,
        count: facet.count,
      }));
    }

    const merged = new Map<string, LocationOption>();
    for (const facet of filteredFacetCities) {
      merged.set(facet.city, {
        city: facet.city,
        cityName: facet.cityName,
        count: facet.count,
      });
    }
    for (const result of locationSearchResults) {
      const existing = merged.get(result.city);
      if (existing) {
        merged.set(result.city, {
          ...existing,
          count: existing.count ?? result.count,
        });
      } else {
        merged.set(result.city, result);
      }
    }

    return Array.from(merged.values());
  }, [
    filteredFacetCities,
    isSearchingLocations,
    locationSearchResults,
    normalizedLocationQuery.length,
  ]);

  const visibleCities = isSearchingLocations
    ? locationOptions
    : showAllCities
      ? locationOptions
      : locationOptions.slice(0, LOCATION_VISIBLE_COUNT);

  return (
    <aside
      className={cn(
        isPanel
          ? "bg-transparent"
          : "rounded-2xl border border-border-subtle bg-surface p-5 shadow-[0_8px_30px_rgba(26,43,60,0.06)] sm:p-6",
      )}
      aria-label="Job filters"
    >
      {!isPanel ? (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/30"
          >
            <RefreshCw
              className="size-3.5"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            Clear All
          </button>
        </div>
      ) : null}

      {showPanel("within") ? (
        <div className={cn(!isPanel && "mb-1")}>
          <label htmlFor={withinInputId} className="sr-only">
            Search within results
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              id={withinInputId}
              type="search"
              value={withinDraft}
              onChange={(event) => setWithinDraft(event.target.value)}
              placeholder="Search within results..."
              className="h-11 w-full rounded-xl border border-border bg-surface pr-3.5 pl-10 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-border focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20"
            />
          </div>
        </div>
      ) : null}

      {showPanel("location") ? (
        <FilterSection title="Location" collapsible={sectionCollapsible}
          showTitle={sectionShowTitle}
          showBorder={sectionShowBorder}>
          {!state.state ? (
            <p className="px-2 text-sm text-muted">
              Select a state above to see locations
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor={locationSearchId} className="sr-only">
                  Search locations in {stateLabel || "selected state"}
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <input
                    id={locationSearchId}
                    type="search"
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder={`Search in ${stateLabel || "state"}...`}
                    className="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted/80 hover:border-border focus:border-primary-soft focus:ring-2 focus:ring-primary-soft/20"
                  />
                </div>
              </div>

              {isLocationLoading || isLocationSearching ? (
                <LocationFilterSkeleton />
              ) : visibleCities.length === 0 ? (
                <p className="px-2 text-sm text-muted">No locations found</p>
              ) : (
                <ul className="space-y-0.5">
                  {visibleCities.map((option) => {
                    const checked = state.cities.includes(option.city);
                    return (
                      <li key={option.city}>
                        <FilterCheckboxRow
                          checked={checked}
                          label={option.cityName}
                          count={option.count}
                          onChange={() =>
                            onChange({
                              cities: toggleValue(state.cities, option.city),
                              page: 1,
                            })
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}

              {!isSearchingLocations &&
              !isLocationLoading &&
              locationOptions.length > LOCATION_VISIBLE_COUNT ? (
                <button
                  type="button"
                  onClick={() => setShowAllCities((current) => !current)}
                  className="px-2 text-sm font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/30"
                >
                  {showAllCities ? "Show Less" : "+ Show More"}
                </button>
              ) : null}
            </div>
          )}
        </FilterSection>
      ) : null}

      {showPanel("experience") ? (
        <FilterSection title="Experience" collapsible={sectionCollapsible}
          showTitle={sectionShowTitle}
          showBorder={sectionShowBorder}>
          <ul className="space-y-0.5">
            {JOB_SEARCH_EXPERIENCE_OPTIONS.map((option) => {
              const checked = state.experience.includes(option.value);
              return (
                <li key={option.value}>
                  <FilterCheckboxRow
                    checked={checked}
                    label={option.label}
                    onChange={() =>
                      onChange({
                        experience: toggleValue(state.experience, option.value),
                        page: 1,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        </FilterSection>
      ) : null}

      {showPanel("salary") ? (
        <FilterSection title="Salary Range" collapsible={sectionCollapsible}
          showTitle={sectionShowTitle}
          showBorder={sectionShowBorder}>
          <SalaryRangeFilter
            minSalary={state.minSalary}
            maxSalary={state.maxSalary}
            onChange={onChange}
          />
        </FilterSection>
      ) : null}

      {showPanel("jobType") ? (
        <FilterSection title="Job Type" collapsible={sectionCollapsible}
          showTitle={sectionShowTitle}
          showBorder={sectionShowBorder}>
          <ul className="space-y-0.5">
            {JOB_SEARCH_JOB_TYPE_OPTIONS.map((option) => {
              const checked = state.jobType.includes(option.value);
              return (
                <li key={option.value}>
                  <FilterCheckboxRow
                    checked={checked}
                    label={option.label}
                    onChange={() =>
                      onChange({
                        jobType: toggleValue(state.jobType, option.value),
                        page: 1,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        </FilterSection>
      ) : null}

      {showPanel("gender") ? (
        <FilterSection
          title="Gender Preference"
          collapsible={sectionCollapsible}
          showTitle={sectionShowTitle}
          showBorder={sectionShowBorder}
        >
          <ul className="space-y-0.5">
            {JOB_SEARCH_GENDER_OPTIONS.map((option) => (
              <li key={option.label}>
                <FilterRadioRow
                  name="job-search-gender"
                  checked={state.gender === option.value}
                  label={option.label}
                  onChange={() =>
                    onChange({
                      gender: option.value,
                      page: 1,
                    })
                  }
                />
              </li>
            ))}
          </ul>
        </FilterSection>
      ) : null}

      {showPanel("workMode") && (isPanel || showMoreFilters) ? (
        <FilterSection
          title="Work Mode"
          defaultOpen
          collapsible={sectionCollapsible}
          showTitle={sectionShowTitle}
          showBorder={sectionShowBorder}
        >
          <ul className="space-y-0.5">
            {JOB_SEARCH_WORK_MODE_OPTIONS.map((option) => {
              const checked = state.workMode.includes(option.value);
              return (
                <li key={option.value}>
                  <FilterCheckboxRow
                    checked={checked}
                    label={option.label}
                    onChange={() =>
                      onChange({
                        workMode: toggleValue(state.workMode, option.value),
                        page: 1,
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        </FilterSection>
      ) : null}

      {!isPanel ? (
        <button
          type="button"
          onClick={() => setShowMoreFilters((current) => !current)}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-bold text-foreground shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-primary-soft/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft/30"
        >
          <SlidersHorizontal
            className="size-4 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          {showMoreFilters ? "Hide More Filters" : "More Filters"}
        </button>
      ) : null}
    </aside>
  );
}
