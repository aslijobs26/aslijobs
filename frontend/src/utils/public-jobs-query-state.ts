import {
  normalizeSiteLanguageCode,
  type SiteLanguageCode,
} from "../constants/site-language";
import { isVisibleQueryError } from "./query-error";

export function shouldEnablePublicJobsQuery(isLanguageReady: boolean): boolean {
  return isLanguageReady;
}

export function resolvePublicJobsQueryLanguage(
  language: string | null | undefined,
): SiteLanguageCode {
  return normalizeSiteLanguageCode(language);
}

export function buildPublicJobsListParams<T extends object>(
  filters: T,
  language: string | null | undefined,
): T & { language: SiteLanguageCode } {
  return {
    ...filters,
    language: resolvePublicJobsQueryLanguage(language),
  };
}

export type PublicJobsListView = "loading" | "error" | "empty" | "results";

export function resolvePublicJobsListView(input: {
  isLanguageReady: boolean;
  isError: boolean;
  error: unknown;
  jobCount: number;
  hasQueryData: boolean;
}): PublicJobsListView {
  if (isVisibleQueryError(input.isError, input.error)) {
    return "error";
  }

  if (!input.isLanguageReady || !input.hasQueryData) {
    return "loading";
  }

  if (input.jobCount === 0) {
    return "empty";
  }

  return "results";
}

export type PublicJobsCountView =
  | { type: "loading" }
  | { type: "error" }
  | { type: "success"; total: number };

export function resolvePublicJobsCountView(input: {
  isLanguageReady: boolean;
  isError: boolean;
  error: unknown;
  total: number | undefined;
  hasQueryData: boolean;
}): PublicJobsCountView {
  if (isVisibleQueryError(input.isError, input.error)) {
    return { type: "error" };
  }

  if (!input.isLanguageReady || !input.hasQueryData || input.total === undefined) {
    return { type: "loading" };
  }

  return { type: "success", total: input.total };
}
