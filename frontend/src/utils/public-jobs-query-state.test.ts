import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { AxiosError, CanceledError } from "axios";
import {
  getSiteLanguageClientSnapshot,
  getSiteLanguageReadyClientSnapshot,
  getSiteLanguageReadyServerSnapshot,
} from "../i18n/site-language";
import { SITE_LANGUAGE_STORAGE_KEY } from "../constants/site-language";
import {
  isRequestCancellationError,
  isVisibleQueryError,
  normalizeAbortedRequestError,
  shouldRetryQuery,
} from "./query-error";
import {
  buildPublicJobsListParams,
  resolvePublicJobsCountView,
  resolvePublicJobsListView,
  shouldEnablePublicJobsQuery,
} from "./public-jobs-query-state";

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function installBrowser(language: string, stored?: string) {
  const values = new Map<string, string>();
  if (stored) {
    values.set(SITE_LANGUAGE_STORAGE_KEY, stored);
  }
  const storage: MemoryStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
  Object.assign(globalThis, {
    window: {
      localStorage: storage,
      navigator: { language },
      dispatchEvent: () => true,
    },
    document: { documentElement: { lang: "en" } },
  });
}

function httpError(status: number): AxiosError {
  return new AxiosError(
    `Request failed with status code ${status}`,
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: "Error",
      data: {},
      headers: {},
      config: {},
    } as never,
  );
}

function jobsFoundHeaderText(
  view: ReturnType<typeof resolvePublicJobsCountView>,
): string {
  if (view.type === "success") {
    return `${view.total} jobs found`;
  }
  if (view.type === "loading") {
    return "Loading";
  }
  return "";
}

describe("Find Jobs public query lifecycle", () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });
  it("waits for saved Telugu before the jobs query can run", () => {
    installBrowser("en-US", "telugu");
    assert.equal(shouldEnablePublicJobsQuery(getSiteLanguageReadyServerSnapshot()), false);
    assert.equal(getSiteLanguageClientSnapshot().code, "te");
    assert.equal(getSiteLanguageReadyClientSnapshot(), true);
    assert.equal(
      shouldEnablePublicJobsQuery(getSiteLanguageReadyClientSnapshot()),
      true,
    );
    assert.equal(
      buildPublicJobsListParams({ page: 1 }, getSiteLanguageClientSnapshot().code)
        .language,
      "te",
    );
  });

  it("does not make an English list request when Telugu is already saved", () => {
    installBrowser("en-US", "telugu");
    const isReady = getSiteLanguageReadyClientSnapshot();
    const language = getSiteLanguageClientSnapshot().code;
    assert.equal(shouldEnablePublicJobsQuery(isReady), true);
    assert.notEqual(language, "en");
    assert.equal(buildPublicJobsListParams({}, language).language, "te");
    assert.equal(shouldEnablePublicJobsQuery(false), false);
  });

  it("defaults to a single English request when nothing is saved", () => {
    installBrowser("fr-FR");
    assert.equal(getSiteLanguageClientSnapshot().code, "en");
    assert.equal(buildPublicJobsListParams({}, "en").language, "en");
  });

  it("does not treat Axios cancellation as a visible jobs query error", () => {
    const canceled = new CanceledError();
    assert.equal(isRequestCancellationError(canceled), true);
    assert.equal(isVisibleQueryError(true, canceled), false);
    assert.equal(shouldRetryQuery(0, canceled), false);

    const abortError = normalizeAbortedRequestError(canceled);
    assert.equal(isRequestCancellationError(abortError), true);
    assert.equal(
      resolvePublicJobsListView({
        isLanguageReady: true,
        isError: true,
        error: abortError,
        jobCount: 0,
        hasQueryData: false,
      }),
      "loading",
    );
    assert.equal(
      resolvePublicJobsCountView({
        isLanguageReady: true,
        isError: true,
        error: abortError,
        total: undefined,
        hasQueryData: false,
      }).type,
      "loading",
    );
  });

  it("still treats genuine API failures as errors", () => {
    for (const status of [401, 403, 404, 429, 500, 502]) {
      const error = httpError(status);
      assert.equal(isRequestCancellationError(error), false);
      assert.equal(isVisibleQueryError(true, error), true);
      assert.equal(
        resolvePublicJobsListView({
          isLanguageReady: true,
          isError: true,
          error,
          jobCount: 0,
          hasQueryData: false,
        }),
        "error",
      );
    }

    const networkError = new AxiosError("Network Error", "ERR_NETWORK");
    const timeoutError = new AxiosError("timeout of 30000ms exceeded", "ECONNABORTED");
    assert.equal(isVisibleQueryError(true, networkError), true);
    assert.equal(isVisibleQueryError(true, timeoutError), true);
    assert.equal(shouldRetryQuery(0, networkError), true);
    assert.equal(shouldRetryQuery(0, timeoutError), true);
    assert.equal(shouldRetryQuery(0, httpError(500)), true);
    assert.equal(shouldRetryQuery(0, httpError(429)), false);
  });

  it("does not show 0 jobs found while the query is in error", () => {
    const view = resolvePublicJobsCountView({
      isLanguageReady: true,
      isError: true,
      error: httpError(500),
      total: undefined,
      hasQueryData: false,
    });
    assert.equal(view.type, "error");
    assert.equal(jobsFoundHeaderText(view), "");
    assert.notEqual(jobsFoundHeaderText(view), "0 jobs found");
  });

  it("shows 0 jobs found only for a successful empty response", () => {
    const view = resolvePublicJobsCountView({
      isLanguageReady: true,
      isError: false,
      error: null,
      total: 0,
      hasQueryData: true,
    });
    assert.deepEqual(view, { type: "success", total: 0 });
    assert.equal(
      resolvePublicJobsListView({
        isLanguageReady: true,
        isError: false,
        error: null,
        jobCount: 0,
        hasQueryData: true,
      }),
      "empty",
    );
    assert.equal(jobsFoundHeaderText(view), "0 jobs found");
  });

  it("shows 5 jobs found for a successful 5-job response", () => {
    const view = resolvePublicJobsCountView({
      isLanguageReady: true,
      isError: false,
      error: null,
      total: 5,
      hasQueryData: true,
    });
    assert.deepEqual(view, { type: "success", total: 5 });
    assert.equal(
      resolvePublicJobsListView({
        isLanguageReady: true,
        isError: false,
        error: null,
        jobCount: 5,
        hasQueryData: true,
      }),
      "results",
    );
    assert.equal(jobsFoundHeaderText(view), "5 jobs found");
  });

  it("preserves previous jobs and count while a new language loads", () => {
    const countView = resolvePublicJobsCountView({
      isLanguageReady: true,
      isError: false,
      error: null,
      total: 5,
      hasQueryData: true,
    });
    const listView = resolvePublicJobsListView({
      isLanguageReady: true,
      isError: false,
      error: null,
      jobCount: 5,
      hasQueryData: true,
    });
    assert.deepEqual(countView, { type: "success", total: 5 });
    assert.equal(listView, "results");
    assert.notEqual(listView, "error");
    assert.notEqual(listView, "empty");
  });

  it("normalizes language aliases before they become query identity", () => {
    assert.equal(buildPublicJobsListParams({}, "telugu").language, "te");
    assert.equal(buildPublicJobsListParams({}, "te").language, "te");
    assert.equal(buildPublicJobsListParams({}, "hindi").language, "hi");
    assert.equal(buildPublicJobsListParams({}, "TA").language, "ta");
    assert.equal(buildPublicJobsListParams({}, "kannada").language, "kn");
    assert.equal(buildPublicJobsListParams({}, "ml").language, "ml");
    assert.deepEqual(buildPublicJobsListParams({}, "telugu"), buildPublicJobsListParams({}, "te"));
  });

  it("keeps the Find Jobs list on the public jobs endpoint with no Sarvam calls", () => {
    const servicePath = fileURLToPath(
      new URL("../services/public-jobs.service.ts", import.meta.url),
    );
    const pagePath = fileURLToPath(
      new URL("../components/job-search/JobSearchPageContent.tsx", import.meta.url),
    );
    const serviceSource = readFileSync(servicePath, "utf8");
    const pageSource = readFileSync(pagePath, "utf8");

    assert.match(serviceSource, /\/jobs\/public/);
    assert.doesNotMatch(serviceSource, /sarvam/i);
    assert.doesNotMatch(serviceSource, /translateJobContent|queueJobContentTranslation/);
    assert.doesNotMatch(pageSource, /sarvam/i);
    assert.match(pageSource, /enabled: isJobsQueryEnabled/);
    assert.match(pageSource, /placeholderData: \(previous\) => previous/);
  });

  it("renders filter checkboxes without a window branch that can desync SSR", () => {
    const filtersPath = fileURLToPath(
      new URL("../components/job-search/JobSearchFiltersSidebar.tsx", import.meta.url),
    );
    const source = readFileSync(filtersPath, "utf8");
    const checkboxRow = source.slice(
      source.indexOf("function FilterCheckboxRow"),
      source.indexOf("function FilterRadioRow"),
    );
    assert.match(checkboxRow, /suppressHydrationWarning/);
    assert.doesNotMatch(checkboxRow, /typeof window/);
    assert.match(checkboxRow, /type="checkbox"/);
  });
});
