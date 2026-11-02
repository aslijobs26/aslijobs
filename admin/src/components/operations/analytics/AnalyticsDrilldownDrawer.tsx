import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOperationsAnalyticsDrilldown, downloadOperationsAnalyticsDrilldown } from "../../../services/operations-analytics.service";
import type { OperationsAnalyticsOverviewParams } from "../../../types/operations-analytics";
import type { DrilldownMetric } from "./analytics-drilldown";

export function AnalyticsDrilldownDrawer({
  metric,
  params,
  onClose,
}: {
  metric: DrilldownMetric;
  params: OperationsAnalyticsOverviewParams;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"date" | "name">("date");
  const query = useQuery({
    queryKey: ["operations", "analytics", "drilldown", metric, params, page, q, sort],
    queryFn: () =>
      fetchOperationsAnalyticsDrilldown({
        ...params,
        metric,
        page,
        limit: 25,
        q,
        sort,
        dir: "desc",
      }),
  });
  const data = query.data;
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / (data?.limit || 25)));

  const exportPage = () => {
    const lines = rows.map((row) =>
      Object.values(row)
        .map((value) => {
          const text = value == null ? "" : String(value);
          const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aslijobs-analytics-${metric}-page-${page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="presentation" onClick={onClose}>
      <aside
        role="dialog"
        aria-label="Analytics breakdown"
        className="h-full w-full max-w-xl overflow-y-auto bg-surface p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold capitalize">{metric.replace("-", " ")}</h2>
            <p className="mt-1 text-[12px] text-muted">{data?.definition}</p>
          </div>
          <button type="button" className="rounded-md border border-border-subtle px-2 py-1 text-[12px]" onClick={onClose}>
            Close
          </button>
        </div>
        <button type="button" className="mt-3 mr-2 rounded-md border border-border-subtle px-2 py-1 text-[12px]" onClick={exportPage} disabled={rows.length === 0}>
          Export this page
        </button>
        <button
          type="button"
          className="mt-3 rounded-md border border-border-subtle px-2 py-1 text-[12px]"
          onClick={() => void downloadOperationsAnalyticsDrilldown({ ...params, metric, q }).catch(() => undefined)}
        >
          Export filtered rows
        </button>
        <dl className="mt-3 grid grid-cols-1 gap-1 text-[12px] text-muted">
          <div>Source: {data?.source ?? "Loading"}</div>
          <div>Date field: {data?.dateField ?? "—"}</div>
          <div>{data?.limitation}</div>
        </dl>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="text-[12px]">
            Search
            <input
              value={q}
              onChange={(event) => {
                setPage(1);
                setQ(event.target.value.slice(0, 80));
              }}
              className="ml-2 h-8 rounded-md border border-border-subtle px-2"
              aria-label="Search breakdown"
            />
          </label>
          <label className="text-[12px]">
            Sort
            <select
              aria-label="Sort breakdown"
              value={sort}
              onChange={(event) => setSort(event.target.value as "date" | "name")}
              className="ml-2 h-8 rounded-md border border-border-subtle px-2"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        {query.isLoading ? <p className="mt-4 text-[12px] text-muted">Loading records…</p> : null}
        {query.isError ? <p className="mt-4 text-[12px] text-rose-700">Unable to load this breakdown.</p> : null}
        {!query.isLoading && !query.isError && rows.length === 0 ? (
          <p className="mt-4 text-[12px] text-muted">No records for these filters.</p>
        ) : null}
        {rows.length > 0 ? (
          <ul className="mt-3 divide-y divide-border-subtle text-[12px]">
            {rows.map((row, index) => (
              <li key={`${page}-${index}`} className="py-2">
                {"employerName" in row && row.employerName ? <span>{String(row.employerName)}</span> : null}
                {"publicJobId" in row && row.publicJobId ? <span>Job {String(row.publicJobId)}</span> : null}
                {"visitorId" in row ? <span>Visitor {String(row.visitorId).slice(0, 8)} · {String(row.pageViews ?? 0)} views</span> : null}
                {"city" in row && row.city ? <span className="text-muted"> · {String(row.city)}</span> : null}
                {"status" in row && row.status ? <span className="text-muted"> · {String(row.status)}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span>{total.toLocaleString("en-IN")} records</span>
          <span className="flex gap-2">
            <button type="button" disabled={page <= 1} className="rounded border px-2 py-1 disabled:opacity-50" onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Previous
            </button>
            <span>
              {page} / {pages}
            </span>
            <button type="button" disabled={page >= pages} className="rounded border px-2 py-1 disabled:opacity-50" onClick={() => setPage((value) => value + 1)}>
              Next
            </button>
          </span>
        </div>
      </aside>
    </div>
  );
}
