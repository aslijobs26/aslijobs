"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  destroyActiveProductTour,
  hasSeenTour,
  requestProductTour,
  setProductTourRequester,
  startProductTour,
} from "./start-product-tour";
import { isUserInActiveTask, selectTourForPath } from "./tour-state";
import type { ProductTourDefinition } from "./types";

type ProductTourHostProps = {
  accountKey: string | null;
  tours: readonly ProductTourDefinition[];
  /** First-visit tours. Manual "Take a tour" still works when this is false. */
  autoStart?: boolean;
};

export function ProductTourHost({
  accountKey,
  tours,
  autoStart = true,
}: ProductTourHostProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!accountKey) {
      setProductTourRequester(null);
      return;
    }

    setProductTourRequester((tourId) => {
      const tour = tourId
        ? tours.find((item) => item.id === tourId) ?? null
        : selectTourForPath(tours, pathname);
      if (!tour) {
        return;
      }
      void startProductTour(tour, { accountKey, manual: true });
    });

    return () => {
      setProductTourRequester(null);
      destroyActiveProductTour();
    };
  }, [accountKey, pathname, tours]);

  useEffect(() => {
    if (!accountKey || !autoStart) {
      return;
    }
    const tour = selectTourForPath(tours, pathname, { autoStartOnly: true });
    if (!tour || hasSeenTour(accountKey, tour.id)) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || isUserInActiveTask(document)) {
        return;
      }
      void startProductTour(tour, { accountKey });
    }, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      destroyActiveProductTour();
    };
  }, [accountKey, autoStart, pathname, tours]);

  return null;
}

export function TakeTourButton({
  className,
  label = "Take a tour",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      data-tour="take-tour"
      data-tour-control="true"
      className={className}
      onClick={() => requestProductTour()}
    >
      {label}
    </button>
  );
}
