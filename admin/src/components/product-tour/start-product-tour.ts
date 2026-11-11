import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./product-tour.css";
import {
  findVisibleTourTarget,
  isUserInActiveTask,
  readTourStatuses,
  visibleTourSteps,
  writeTourStatus,
} from "./tour-state";
import type { ProductTourDefinition, ProductTourStatus } from "./types";

type StartOptions = {
  accountKey: string;
  manual?: boolean;
};

let activeTour: Driver | null = null;
let requester: ((tourId?: string) => void) | null = null;

export function setProductTourRequester(
  next: ((tourId?: string) => void) | null,
): void {
  requester = next;
}

export function requestProductTour(tourId?: string): void {
  requester?.(tourId);
}

export function destroyActiveProductTour(): void {
  activeTour?.destroy();
}

/**
 * Starts a tour only when at least one target is on screen.
 * Missing steps are dropped. A second start closes the tour already running.
 */
export async function startProductTour(
  tour: ProductTourDefinition,
  options: StartOptions,
): Promise<boolean> {
  if (typeof document === "undefined") {
    return false;
  }
  if (!options.manual && isUserInActiveTask(document)) {
    return false;
  }

  const steps = await waitForVisibleSteps(tour);
  const anchored = steps.flatMap((step) => {
    const element = findVisibleTourTarget(step.target, document, window.innerWidth);
    return element ? [{ step, element }] : [];
  });
  if (anchored.length === 0) {
    return false;
  }

  destroyActiveProductTour();

  let outcome: ProductTourStatus = "skipped";
  let shown = false;
  let previousIndex = 0;
  const total = anchored.length;
  const instance = driver({
    animate: true,
    // Smooth scrolling lets Driver.js place the popover while the target is still moving.
    smoothScroll: false,
    allowClose: true,
    allowKeyboardControl: true,
    overlayClickBehavior: "close",
    overlayColor: "#08161b",
    overlayOpacity: 0.6,
    stagePadding: window.innerWidth < 768 ? 6 : 8,
    stageRadius: 14,
    popoverOffset: 14,
    showProgress: false,
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Finish tour",
    showButtons: ["next", "previous", "close"],
    disableActiveInteraction: false,
    popoverClass: "aslijobs-tour-popover",
    steps: anchored.map(({ step, element }) => ({
      element,
      popover: {
        title: step.title,
        description: step.description,
        side: step.side ?? "bottom",
        align: step.align ?? "start",
      },
      onHighlighted: () => {
        shown = true;
      },
    })),
    onPopoverRender: (popover, { driver: current }) => {
      const index = current.getActiveIndex() ?? 0;
      popover.closeButton.setAttribute("aria-label", "Close tour");
      popover.nextButton.setAttribute("aria-label", current.isLastStep() ? "Finish tour" : "Next step");
      popover.previousButton.setAttribute("aria-label", "Previous step");
      popover.wrapper.insertBefore(
        createPopoverHead(tour.label ?? "Quick tour", index, previousIndex, total),
        popover.title,
      );
      previousIndex = index;
      // Driver.js focuses the close button after this hook; Next is the expected default.
      window.requestAnimationFrame(() => {
        if (popover.wrapper.isConnected) {
          popover.nextButton.focus({ preventScroll: true });
        }
      });
      if (popover.footer.querySelector("[data-tour-skip]")) {
        return;
      }
      const skip = document.createElement("button");
      skip.type = "button";
      skip.dataset.tourSkip = "true";
      skip.className = "aslijobs-tour-skip";
      skip.textContent = "Skip tour";
      skip.addEventListener("click", () => {
        outcome = "skipped";
        current.destroy();
      });
      popover.footerButtons.prepend(skip);
    },
    onNextClick: (_element, _step, { driver: current }) => {
      if (current.isLastStep()) {
        outcome = "completed";
      }
      current.moveNext();
    },
    onPrevClick: (_element, _step, { driver: current }) => {
      current.movePrevious();
    },
    onCloseClick: (_element, _step, { driver: current }) => {
      outcome = "skipped";
      current.destroy();
    },
    onDestroyed: () => {
      document.removeEventListener("scroll", refreshOnScroll, true);
      window.cancelAnimationFrame(refreshFrame);
      if (activeTour === instance) {
        activeTour = null;
      }
      if (shown) {
        writeTourStatus(window.localStorage, options.accountKey, tour.id, outcome);
      }
    },
  });

  // Driver.js only re-measures on window scroll, but app layouts scroll inside <main>.
  let refreshFrame = 0;
  function refreshOnScroll() {
    if (refreshFrame) {
      return;
    }
    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = 0;
      instance.refresh();
    });
  }
  document.addEventListener("scroll", refreshOnScroll, { capture: true, passive: true });

  activeTour = instance;
  instance.drive();
  return true;
}

export function hasSeenTour(accountKey: string, tourId: string): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return readTourStatuses(window.localStorage, accountKey)[tourId] != null;
}

function createPopoverHead(
  label: string,
  index: number,
  previousIndex: number,
  total: number,
): HTMLElement {
  const head = document.createElement("div");
  head.className = "aslijobs-tour-head";

  const eyebrow = document.createElement("span");
  eyebrow.className = "aslijobs-tour-eyebrow";
  eyebrow.textContent = label;
  head.append(eyebrow);

  if (total < 2) {
    return head;
  }

  const count = document.createElement("span");
  count.className = "aslijobs-tour-count";
  count.textContent = `${index + 1} of ${total}`;

  const meter = document.createElement("span");
  meter.className = "aslijobs-tour-meter";
  meter.setAttribute("role", "progressbar");
  meter.setAttribute("aria-label", "Tour progress");
  meter.setAttribute("aria-valuemin", "1");
  meter.setAttribute("aria-valuemax", String(total));
  meter.setAttribute("aria-valuenow", String(index + 1));

  const fill = document.createElement("span");
  fill.className = "aslijobs-tour-meter-fill";
  // Driver.js rebuilds the popover on every step, so start from the last width to animate.
  fill.style.width = `${((previousIndex + 1) / total) * 100}%`;
  meter.append(fill);
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      fill.style.width = `${((index + 1) / total) * 100}%`;
    });
  });

  head.append(count, meter);
  return head;
}

async function waitForVisibleSteps(tour: ProductTourDefinition) {
  const started = Date.now();
  const firstTarget = tour.steps[0]?.target;
  const pageReady = () =>
    firstTarget != null &&
    findVisibleTourTarget(firstTarget, document, window.innerWidth) != null;
  // Shared chrome (sidebar, header) renders before page content, so wait for the first step.
  while (!pageReady() && Date.now() - started < 4_000) {
    await delay(150);
  }
  let visible = visibleTourSteps(tour.steps, document, window.innerWidth);
  // Give late sections a short chance to appear, then keep the ones on screen.
  if (visible.length < tour.steps.length) {
    await delay(250);
    visible = visibleTourSteps(tour.steps, document, window.innerWidth);
  }
  return visible;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
