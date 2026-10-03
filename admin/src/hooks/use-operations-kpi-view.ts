import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/** URL search param that keeps the selected overview KPI card across refreshes. */
export const OPERATIONS_KPI_VIEW_PARAM = "view";

/**
 * Selected overview KPI card, persisted in `?view=`. Selecting pushes a history
 * entry so browser back returns to the analytics overview; selecting the active
 * card again (or `null`) clears it.
 */
export function useOperationsKpiView<K extends string>(
  views: Readonly<Record<K, unknown>>,
): [K | null, (kpi: K | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(OPERATIONS_KPI_VIEW_PARAM);
  const activeKpi = raw && Object.hasOwn(views, raw) ? (raw as K) : null;

  const selectKpi = useCallback(
    (kpi: K | null) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (kpi == null || next.get(OPERATIONS_KPI_VIEW_PARAM) === kpi) {
          next.delete(OPERATIONS_KPI_VIEW_PARAM);
        } else {
          next.set(OPERATIONS_KPI_VIEW_PARAM, kpi);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  return [activeKpi, selectKpi];
}
