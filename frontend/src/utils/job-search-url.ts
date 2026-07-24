import { JOB_SEARCH_PAGE_SIZE } from "@/constants/job-search";
import type { JobSearchUrlState } from "@/types/job-search";
import type {
  FetchPublicJobsParams,
  PublicJobSort,
} from "@/services/public-jobs.service";

const SORT_VALUES = new Set<PublicJobSort>([
  "relevant",
  "latest",
  "salary_desc",
  "salary_asc",
]);

export function toJobSearchLocationSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsv(value: string | null): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseLocationSlugs(value: string | null): string[] {
  const slugs: string[] = [];

  for (const part of parseCsv(value)) {
    const slug = toJobSearchLocationSlug(part);
    if (!slug || slugs.includes(slug)) {
      continue;
    }
    slugs.push(slug);
  }

  return slugs;
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function parseSort(value: string | null): PublicJobSort {
  if (value && SORT_VALUES.has(value as PublicJobSort)) {
    return value as PublicJobSort;
  }

  return "relevant";
}

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export function parseJobSearchUrlState(
  searchParams: URLSearchParams,
): JobSearchUrlState {
  const q = (searchParams.get("q") ?? searchParams.get("search") ?? "").trim();
  const within = (searchParams.get("within") ?? "").trim();
  const rawState = (searchParams.get("state") ?? "").trim();

  return {
    q,
    within,
    state: rawState ? toJobSearchLocationSlug(rawState) || rawState : "",
    cities: parseLocationSlugs(searchParams.get("city")),
    jobType: parseCsv(searchParams.get("jobType")),
    experience: parseCsv(searchParams.get("experience")),
    gender: (searchParams.get("gender") ?? "").trim(),
    workMode: parseCsv(searchParams.get("workMode")),
    minSalary: parseOptionalNumber(searchParams.get("minSalary")),
    maxSalary: parseOptionalNumber(searchParams.get("maxSalary")),
    sort: parseSort(searchParams.get("sort")),
    page: parsePage(searchParams.get("page")),
    job: (searchParams.get("job") ?? "").trim().toUpperCase(),
  };
}

export function jobSearchStateToSearchParams(
  state: JobSearchUrlState,
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.within) params.set("within", state.within);
  if (state.state) params.set("state", toJobSearchLocationSlug(state.state) || state.state);
  if (state.cities.length > 0) {
    params.set(
      "city",
      state.cities
        .map((city) => toJobSearchLocationSlug(city) || city)
        .filter(Boolean)
        .join(","),
    );
  }
  if (state.jobType.length > 0) params.set("jobType", state.jobType.join(","));
  if (state.experience.length > 0) {
    params.set("experience", state.experience.join(","));
  }
  if (state.gender) params.set("gender", state.gender);
  if (state.workMode.length > 0) {
    params.set("workMode", state.workMode.join(","));
  }
  if (state.minSalary !== undefined) {
    params.set("minSalary", String(state.minSalary));
  }
  if (state.maxSalary !== undefined) {
    params.set("maxSalary", String(state.maxSalary));
  }
  if (state.sort && state.sort !== "relevant") {
    params.set("sort", state.sort);
  }
  if (state.page > 1) params.set("page", String(state.page));
  if (state.job) params.set("job", state.job);

  return params;
}

export function buildFetchPublicJobsParams(
  state: JobSearchUrlState,
): FetchPublicJobsParams {
  const searchParts = [state.q, state.within]
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    search: searchParts.join(" ").trim() || undefined,
    state: state.state
      ? toJobSearchLocationSlug(state.state) || state.state
      : undefined,
    city:
      state.cities.length > 0
        ? state.cities
            .map((city) => toJobSearchLocationSlug(city) || city)
            .filter(Boolean)
            .join(",")
        : undefined,
    jobType: state.jobType.length > 0 ? state.jobType.join(",") : undefined,
    experience:
      state.experience.length > 0 ? state.experience.join(",") : undefined,
    gender: state.gender || undefined,
    workMode: state.workMode.length > 0 ? state.workMode.join(",") : undefined,
    minSalary: state.minSalary,
    maxSalary: state.maxSalary,
    sort: state.sort,
    page: state.page,
    limit: JOB_SEARCH_PAGE_SIZE,
  };
}

export function createEmptyJobSearchUrlState(): JobSearchUrlState {
  return {
    q: "",
    within: "",
    state: "",
    cities: [],
    jobType: [],
    experience: [],
    gender: "",
    workMode: [],
    minSalary: undefined,
    maxSalary: undefined,
    sort: "relevant",
    page: 1,
    job: "",
  };
}

export function hasActiveJobSearchFilters(state: JobSearchUrlState): boolean {
  return Boolean(
    state.q ||
      state.within ||
      state.state ||
      state.cities.length > 0 ||
      state.jobType.length > 0 ||
      state.experience.length > 0 ||
      state.gender ||
      state.workMode.length > 0 ||
      state.minSalary !== undefined ||
      state.maxSalary !== undefined,
  );
}

export function buildJobSearchLocationLabel(
  cityName: string,
  stateName: string,
  city: string,
  state: string,
): string {
  const cityLabel = cityName || city;
  const stateLabel = stateName || state;

  if (cityLabel && stateLabel) {
    return `${cityLabel}, ${stateLabel}`;
  }

  return cityLabel || stateLabel || "";
}
