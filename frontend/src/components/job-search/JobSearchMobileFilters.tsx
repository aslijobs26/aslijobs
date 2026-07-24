"use client";

import {
  JobSearchFiltersSidebar,
  type JobSearchFilterPanelId,
} from "@/components/job-search/JobSearchFiltersSidebar";
import {
  JOB_SEARCH_EXPERIENCE_LABELS,
  JOB_SEARCH_GENDER_LABELS,
  JOB_SEARCH_JOB_TYPE_LABELS,
  JOB_SEARCH_SORT_OPTIONS,
  JOB_SEARCH_WORK_MODE_LABELS,
} from "@/constants/job-search";
import type { PublicJobCityFacet, PublicJobSort } from "@/services/public-jobs.service";
import type { JobSearchUrlState } from "@/types/job-search";
import { cn } from "@/utils/cn";
import { formatJobSearchSalaryAmountShort } from "@/utils/job-search-format";
import {
  ArrowUpDown,
  Banknote,
  Briefcase,
  MapPin,
  SlidersHorizontal,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type MobileSheetId =
  | "location"
  | "experience"
  | "salary"
  | "jobType"
  | "gender"
  | "sort"
  | "more";

type JobSearchMobileFiltersProps = {
  state: JobSearchUrlState;
  cityFacets: PublicJobCityFacet[];
  isLocationLoading?: boolean;
  onChange: (patch: Partial<JobSearchUrlState>) => void;
  onClearFilters: () => void;
};

type ActiveChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

function cloneFilterSlice(state: JobSearchUrlState): JobSearchUrlState {
  return {
    ...state,
    cities: [...state.cities],
    jobType: [...state.jobType],
    experience: [...state.experience],
    workMode: [...state.workMode],
  };
}

function countForSheet(sheet: MobileSheetId, state: JobSearchUrlState): number {
  switch (sheet) {
    case "location":
      return state.cities.length;
    case "experience":
      return state.experience.length;
    case "salary":
      return state.minSalary !== undefined || state.maxSalary !== undefined
        ? 1
        : 0;
    case "jobType":
      return state.jobType.length;
    case "gender":
      return state.gender ? 1 : 0;
    case "sort":
      return state.sort !== "relevant" ? 1 : 0;
    case "more": {
      let count = 0;
      if (state.within.trim()) count += 1;
      count += state.workMode.length;
      return count;
    }
    default:
      return 0;
  }
}

function resetPatchForSheet(
  sheet: MobileSheetId,
): Partial<JobSearchUrlState> {
  switch (sheet) {
    case "location":
      return { cities: [], page: 1 };
    case "experience":
      return { experience: [], page: 1 };
    case "salary":
      return { minSalary: undefined, maxSalary: undefined, page: 1 };
    case "jobType":
      return { jobType: [], page: 1 };
    case "gender":
      return { gender: "", page: 1 };
    case "sort":
      return { sort: "relevant", page: 1 };
    case "more":
      return { within: "", workMode: [], page: 1 };
    default:
      return { page: 1 };
  }
}

function applyPatchForSheet(
  sheet: MobileSheetId,
  draft: JobSearchUrlState,
): Partial<JobSearchUrlState> {
  switch (sheet) {
    case "location":
      return { cities: draft.cities, page: 1 };
    case "experience":
      return { experience: draft.experience, page: 1 };
    case "salary":
      return {
        minSalary: draft.minSalary,
        maxSalary: draft.maxSalary,
        page: 1,
      };
    case "jobType":
      return { jobType: draft.jobType, page: 1 };
    case "gender":
      return { gender: draft.gender, page: 1 };
    case "sort":
      return { sort: draft.sort, page: 1, job: "" };
    case "more":
      return {
        within: draft.within,
        workMode: draft.workMode,
        experience: draft.experience,
        gender: draft.gender,
        jobType: draft.jobType,
        cities: draft.cities,
        minSalary: draft.minSalary,
        maxSalary: draft.maxSalary,
        page: 1,
      };
    default:
      return { page: 1 };
  }
}

function panelsForSheet(sheet: MobileSheetId): JobSearchFilterPanelId[] {
  switch (sheet) {
    case "location":
      return ["location"];
    case "experience":
      return ["experience"];
    case "salary":
      return ["salary"];
    case "jobType":
      return ["jobType"];
    case "gender":
      return ["gender"];
    case "more":
      return [
        "within",
        "location",
        "experience",
        "salary",
        "jobType",
        "gender",
        "workMode",
      ];
    default:
      return [];
  }
}

function sheetTitle(sheet: MobileSheetId): string {
  switch (sheet) {
    case "location":
      return "Location";
    case "experience":
      return "Experience";
    case "salary":
      return "Salary";
    case "jobType":
      return "Job Type";
    case "gender":
      return "Gender";
    case "sort":
      return "Sort by";
    case "more":
      return "More Filters";
    default:
      return "Filters";
  }
}

function formatSalaryChip(
  minSalary: number | undefined,
  maxSalary: number | undefined,
): string {
  if (minSalary === undefined && maxSalary === undefined) {
    return "";
  }
  if (minSalary !== undefined && maxSalary !== undefined) {
    return `₹${formatJobSearchSalaryAmountShort(minSalary)}–₹${formatJobSearchSalaryAmountShort(maxSalary)}`;
  }
  if (minSalary !== undefined) {
    return `₹${formatJobSearchSalaryAmountShort(minSalary)}+`;
  }
  return `Up to ₹${formatJobSearchSalaryAmountShort(maxSalary ?? 0)}`;
}

function MobileBottomSheet({
  open,
  title,
  onClose,
  children,
  footer,
  fullHeight = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  fullHeight?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="presentation">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-250"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
          className={cn(
            "job-search-mobile-sheet absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-[24px] bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.18)] outline-none",
            fullHeight && "h-[80vh]",
          )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#EEF1F4] px-5 py-4">
          <h2
            id={titleId}
            className="text-[18px] font-bold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-11 items-center justify-center rounded-full border border-[#E5E7EB] text-muted transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="size-5" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        <div className="shrink-0 border-t border-[#EEF1F4] bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        active
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-[#E5E7EB] bg-white text-foreground hover:shadow-[0_2px_10px_rgba(15,23,42,0.08)]",
      )}
    >
      <span className="inline-flex size-4 items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
      {count > 0 ? (
        <span
          className={cn(
            "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
            active ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function JobSearchMobileFilters({
  state,
  cityFacets,
  isLocationLoading = false,
  onChange,
  onClearFilters,
}: JobSearchMobileFiltersProps) {
  const [openSheet, setOpenSheet] = useState<MobileSheetId | null>(null);
  const [draft, setDraft] = useState<JobSearchUrlState>(() =>
    cloneFilterSlice(state),
  );

  useEffect(() => {
    if (openSheet) {
      setDraft(cloneFilterSlice(state));
    }
  }, [openSheet, state]);

  const cityNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const facet of cityFacets) {
      map.set(facet.city, facet.cityName);
    }
    return map;
  }, [cityFacets]);

  const activeChips = useMemo((): ActiveChip[] => {
    const chips: ActiveChip[] = [];

    for (const city of state.cities) {
      chips.push({
        id: `city-${city}`,
        label: cityNameBySlug.get(city) ?? city,
        onRemove: () =>
          onChange({
            cities: state.cities.filter((item) => item !== city),
            page: 1,
          }),
      });
    }

    for (const value of state.experience) {
      chips.push({
        id: `exp-${value}`,
        label: JOB_SEARCH_EXPERIENCE_LABELS[value] ?? value,
        onRemove: () =>
          onChange({
            experience: state.experience.filter((item) => item !== value),
            page: 1,
          }),
      });
    }

    const salaryLabel = formatSalaryChip(state.minSalary, state.maxSalary);
    if (salaryLabel) {
      chips.push({
        id: "salary",
        label: salaryLabel,
        onRemove: () =>
          onChange({
            minSalary: undefined,
            maxSalary: undefined,
            page: 1,
          }),
      });
    }

    for (const value of state.jobType) {
      chips.push({
        id: `type-${value}`,
        label: JOB_SEARCH_JOB_TYPE_LABELS[value] ?? value,
        onRemove: () =>
          onChange({
            jobType: state.jobType.filter((item) => item !== value),
            page: 1,
          }),
      });
    }

    if (state.gender) {
      chips.push({
        id: "gender",
        label: JOB_SEARCH_GENDER_LABELS[state.gender] ?? state.gender,
        onRemove: () => onChange({ gender: "", page: 1 }),
      });
    }

    for (const value of state.workMode) {
      chips.push({
        id: `mode-${value}`,
        label: JOB_SEARCH_WORK_MODE_LABELS[value] ?? value,
        onRemove: () =>
          onChange({
            workMode: state.workMode.filter((item) => item !== value),
            page: 1,
          }),
      });
    }

    if (state.within.trim()) {
      chips.push({
        id: "within",
        label: `“${state.within.trim()}”`,
        onRemove: () => onChange({ within: "", page: 1 }),
      });
    }

    return chips;
  }, [cityNameBySlug, onChange, state]);

  const closeSheet = () => setOpenSheet(null);

  const handleApply = () => {
    if (!openSheet) {
      return;
    }
    onChange(applyPatchForSheet(openSheet, draft));
    closeSheet();
  };

  const handleReset = () => {
    if (!openSheet) {
      return;
    }
    if (openSheet === "more") {
      onClearFilters();
      closeSheet();
      return;
    }
    const patch = resetPatchForSheet(openSheet);
    setDraft((current) => ({ ...current, ...patch }));
    onChange(patch);
  };

  const patchDraft = (patch: Partial<JobSearchUrlState>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const pills: {
    id: MobileSheetId;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: "location",
      label: "Location",
      icon: <MapPin className="size-3.5" strokeWidth={2} />,
    },
    {
      id: "experience",
      label: "Experience",
      icon: <TrendingUp className="size-3.5" strokeWidth={2} />,
    },
    {
      id: "salary",
      label: "Salary",
      icon: <Banknote className="size-3.5" strokeWidth={2} />,
    },
    {
      id: "jobType",
      label: "Job Type",
      icon: <Briefcase className="size-3.5" strokeWidth={2} />,
    },
    {
      id: "gender",
      label: "Gender",
      icon: <User className="size-3.5" strokeWidth={2} />,
    },
    {
      id: "sort",
      label: "Sort",
      icon: <ArrowUpDown className="size-3.5" strokeWidth={2} />,
    },
    {
      id: "more",
      label: "More",
      icon: <SlidersHorizontal className="size-3.5" strokeWidth={2} />,
    },
  ];

  return (
    <div className="md:hidden">
      <div className="-mx-4 overflow-x-auto px-4 scrollbar-hidden">
        <div className="flex w-max items-center gap-3 py-0.5">
          {pills.map((pill) => {
            const count = countForSheet(pill.id, state);
            return (
              <FilterPill
                key={pill.id}
                label={pill.label}
                icon={pill.icon}
                count={count}
                active={count > 0 || openSheet === pill.id}
                onClick={() => setOpenSheet(pill.id)}
              />
            );
          })}
        </div>
      </div>

      {activeChips.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <li key={chip.id}>
              <button
                type="button"
                onClick={chip.onRemove}
                className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="truncate">{chip.label}</span>
                <X className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                <span className="sr-only">Remove {chip.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <MobileBottomSheet
        open={openSheet !== null}
        title={openSheet ? sheetTitle(openSheet) : "Filters"}
        onClose={closeSheet}
        fullHeight={openSheet === "more"}
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[15px] font-bold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {openSheet === "more" ? "Done" : "Apply Filters"}
            </button>
          </div>
        }
      >
        {openSheet === "sort" ? (
          <ul className="space-y-1">
            {JOB_SEARCH_SORT_OPTIONS.map((option) => {
              const selected = draft.sort === option.value;
              return (
                <li key={option.value}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-2 py-3 transition-colors",
                      selected ? "bg-primary/5" : "hover:bg-hero-bg/80",
                    )}
                  >
                    <input
                      type="radio"
                      name="job-search-mobile-sort"
                      checked={selected}
                      onChange={() =>
                        patchDraft({
                          sort: option.value as PublicJobSort,
                        })
                      }
                      className="job-search-filter-radio"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {option.label === "Latest"
                        ? "Newest"
                        : option.label === "Highest Salary"
                          ? "Salary High to Low"
                          : option.label === "Lowest Salary"
                            ? "Salary Low to High"
                            : option.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : openSheet ? (
          <JobSearchFiltersSidebar
            state={draft}
            cityFacets={cityFacets}
            isLocationLoading={isLocationLoading}
            onChange={patchDraft}
            onClearFilters={() => {
              setDraft((current) => ({
                ...current,
                ...resetPatchForSheet(openSheet),
              }));
            }}
            presentation="panel"
            panels={panelsForSheet(openSheet)}
          />
        ) : null}
      </MobileBottomSheet>
    </div>
  );
}
