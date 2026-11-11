import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getOperationsAuthUser } from "../../utils/operations-auth-storage";
import { OPERATIONS_TOURS } from "./operations-tours";
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
  pathname: string;
};

export function ProductTourHost({
  accountKey,
  tours,
  pathname,
}: ProductTourHostProps) {
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
    if (!accountKey) {
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
  }, [accountKey, pathname, tours]);

  return null;
}

export function TakeTourButton({
  className,
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      data-tour="ops-take-tour"
      data-tour-control="true"
      className={className}
      aria-label="Take a tour"
      onClick={() => requestProductTour()}
    >
      Tour
    </button>
  );
}

export function OperationsProductTour() {
  const { pathname } = useLocation();
  const user = getOperationsAuthUser();
  const accountKey = user?.id ? `ops:${user.id}` : null;

  return (
    <ProductTourHost
      accountKey={accountKey}
      tours={OPERATIONS_TOURS}
      pathname={pathname}
    />
  );
}
