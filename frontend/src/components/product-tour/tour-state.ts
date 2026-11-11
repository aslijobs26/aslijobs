import type {
  ProductTourDefinition,
  ProductTourStatus,
  ProductTourStep,
} from "./types";

const STORAGE_PREFIX = "aslijobs.product-tours.v1.";

export type TourStateStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/** Only tour ids and a completed/skipped flag. No profile or contact data. */
export function readTourStatuses(
  store: TourStateStore,
  accountKey: string,
): Record<string, ProductTourStatus> {
  if (!isSafeAccountKey(accountKey)) {
    return {};
  }
  try {
    const raw = store.getItem(storageKey(accountKey));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const statuses: Record<string, ProductTourStatus> = {};
    for (const [tourId, status] of Object.entries(parsed)) {
      if (
        isSafeTourId(tourId) &&
        (status === "completed" || status === "skipped")
      ) {
        statuses[tourId] = status;
      }
    }
    return statuses;
  } catch {
    return {};
  }
}

export function writeTourStatus(
  store: TourStateStore,
  accountKey: string,
  tourId: string,
  status: ProductTourStatus,
): void {
  if (!isSafeAccountKey(accountKey) || !isSafeTourId(tourId)) {
    return;
  }
  const next = {
    ...readTourStatuses(store, accountKey),
    [tourId]: status,
  };
  store.setItem(storageKey(accountKey), JSON.stringify(next));
}

type TourRoute = ProductTourDefinition["routes"][number];

function routeMatchesPath(route: TourRoute, pathname: string): boolean {
  if (route.match === "exact") {
    return pathname === route.path;
  }
  if (route.match === "prefix") {
    return pathname.startsWith(`${route.path}/`);
  }
  const expected = route.path.split("/");
  const actual = pathname.split("/");
  return (
    expected.length === actual.length &&
    expected.every((segment, index) =>
      segment.startsWith(":") ? actual[index] !== "" : segment === actual[index],
    )
  );
}

export function tourMatchesPath(
  tour: ProductTourDefinition,
  pathname: string,
): boolean {
  return tour.routes.some((route) => routeMatchesPath(route, pathname));
}

/**
 * The most specific matching route wins, so a detail page does not run the list tour.
 * With `autoStartOnly`, a more specific tour that does not auto-start still blocks
 * less specific ones from starting on its page.
 */
export function selectTourForPath(
  tours: readonly ProductTourDefinition[],
  pathname: string,
  options?: { autoStartOnly?: boolean },
): ProductTourDefinition | null {
  let best: ProductTourDefinition | null = null;
  let bestScore = -1;
  for (const tour of tours) {
    for (const route of tour.routes) {
      if (!routeMatchesPath(route, pathname)) {
        continue;
      }
      const score = routeSpecificity(route);
      if (score > bestScore) {
        best = tour;
        bestScore = score;
      }
    }
  }
  if (!best || (options?.autoStartOnly && !best.autoStart)) {
    return null;
  }
  return best;
}

export function isTourTargetVisible(
  element: Element,
  viewportWidth: number,
): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const style = getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) {
    return false;
  }
  // Closed mobile sidebars sit off the left edge but stay in the document.
  if (rect.right <= 0 || rect.left >= viewportWidth) {
    return false;
  }
  return true;
}

export function findVisibleTourTarget(
  target: string,
  doc: Document,
  viewportWidth: number,
): Element | null {
  const nodes = doc.querySelectorAll(`[data-tour="${cssEscape(target)}"]`);
  for (const node of nodes) {
    if (isTourTargetVisible(node, viewportWidth)) {
      return node;
    }
  }
  return null;
}

export function visibleTourSteps(
  steps: readonly ProductTourStep[],
  doc: Document,
  viewportWidth: number,
): ProductTourStep[] {
  return steps.filter((step) => findVisibleTourTarget(step.target, doc, viewportWidth));
}

const TASK_FIELD = "input, textarea, select, [contenteditable='true']";

/** A tour must not open over a form, application, or message the user is writing. */
export function isUserInActiveTask(doc: Document): boolean {
  const active = doc.activeElement;
  if (
    active instanceof HTMLElement &&
    active.matches(TASK_FIELD) &&
    !active.hasAttribute("data-tour-control")
  ) {
    return true;
  }
  return doc.querySelector("[role='dialog'], [aria-modal='true']") != null;
}

function storageKey(accountKey: string): string {
  return `${STORAGE_PREFIX}${accountKey}`;
}

function isSafeAccountKey(value: string): boolean {
  return /^[a-z0-9:-]{3,120}$/i.test(value);
}

function isSafeTourId(value: string): boolean {
  return /^[a-z0-9-]{3,80}$/.test(value);
}

/** Longer literal paths win; on a tie, exact beats pattern and pattern beats prefix. */
function routeSpecificity(route: TourRoute): number {
  const literal = route.path
    .split("/")
    .filter((segment) => !segment.startsWith(":"))
    .join("/").length;
  const rank = route.match === "exact" ? 2 : route.match === "pattern" ? 1 : 0;
  return literal * 3 + rank;
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}
