import { MapPin, Search } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  OPERATIONS_ROUTES,
  operationsPlacementDetailPath,
} from "../../../constants/operations-routes";
import type {
  OperationsPlacementListItem,
  OperationsPlacementsTabCounts,
  OperationsPlacementsTableTab,
} from "../../../types/operations-placements";
import { cn } from "../../../utils/cn";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { formatEmployerDateTime } from "../employers/employers-format";
import {
  placementCandidateInitials,
  placementJoiningStatusBadgeVariant,
} from "./placements-format";

interface PlacementsTableSectionProps {
  items: OperationsPlacementListItem[];
  totalItems: number;
  tabCounts: OperationsPlacementsTabCounts;
  activeTab: OperationsPlacementsTableTab;
  onTabChange: (tab: OperationsPlacementsTableTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  showViewAll?: boolean;
  hideInlineSearch?: boolean;
  toolbar?: ReactNode;
}

const TABS: {
  id: OperationsPlacementsTableTab;
  label: string;
  shortLabel: string;
  countKey: keyof OperationsPlacementsTabCounts;
}[] = [
  { id: "all", label: "All", shortLabel: "All", countKey: "all" },
  { id: "joined", label: "Joined", shortLabel: "Joined", countKey: "joined" },
  {
    id: "joiningPending",
    label: "Joining Pending",
    shortLabel: "Pending",
    countKey: "joiningPending",
  },
  {
    id: "didNotJoin",
    label: "Did Not Join",
    shortLabel: "No-show",
    countKey: "didNotJoin",
  },
];

function TableMessage({
  children,
  colSpan = 8,
}: {
  children: ReactNode;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        {children}
      </td>
    </tr>
  );
}

const thClassName =
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[9px] xl:first:pl-3 xl:last:pr-3";

function dateLabel(iso: string | null): string {
  if (!iso) return "—";
  return formatEmployerDateTime(iso).date;
}

export function PlacementsTableSection({
  items,
  totalItems,
  tabCounts,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  showViewAll = true,
  hideInlineSearch = false,
  toolbar,
}: PlacementsTableSectionProps) {
  const emptyMessage = (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground xl:text-xs">
        No placements found
      </p>
      <p className="text-xs text-muted xl:text-[11px]">
        Try adjusting your search or status filters.
      </p>
    </div>
  );

  const errorBlock = (
    <div className="space-y-2">
      <p className="text-sm font-medium text-danger xl:text-xs">
        {errorMessage ?? "Failed to load placements."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-8 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:text-[11px]"
        >
          Retry
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="min-w-0 max-w-full">
      <div className="border-b border-border-subtle px-3 py-2.5 sm:px-4 xl:px-3 xl:py-2">
        <div className="flex min-w-0 flex-col gap-2.5 xl:gap-2">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground xl:text-[13px]">
              Recent Placements{" "}
              <span className="font-semibold tabular-nums text-muted xl:text-[12px]">
                ({totalItems.toLocaleString("en-IN")})
              </span>
            </h2>
            {showViewAll ? (
              <Link
                to={OPERATIONS_ROUTES.PLACEMENTS_LIST}
                className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:text-[11px]"
              >
                View all
              </Link>
            ) : null}
          </div>

          <div
            className="-mx-0.5 flex min-w-0 items-end gap-0 overflow-x-auto overscroll-x-contain border-b border-border-subtle px-0.5 scrollbar-hidden"
            role="tablist"
            aria-label="Placement status tabs"
          >
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              const count = tabCounts[tab.countKey];
              const countLabel = count.toLocaleString("en-IN");

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`${tab.label}, ${countLabel}`}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[12px] font-semibold whitespace-nowrap transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    "max-sm:h-8 max-sm:gap-1 max-sm:px-2.5 max-sm:text-[11px]",
                    "xl:h-8 xl:px-2.5 xl:text-[11px]",
                    selected
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      selected ? "text-primary" : "text-muted",
                    )}
                  >
                    ({countLabel})
                  </span>
                </button>
              );
            })}
          </div>

          {!hideInlineSearch ? (
            <label className="relative block min-w-0 max-w-md">
              <span className="sr-only">Search recent placements</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted xl:size-3"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search candidate, company, job"
                autoComplete="off"
                spellCheck={false}
                className={cn(
                  "h-8 w-full rounded-md border border-border-subtle bg-surface py-1.5 pr-2.5 pl-8 text-[11px] text-foreground outline-none",
                  "placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
                  "xl:h-7 xl:pl-7 xl:text-[10px]",
                  "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
                )}
              />
            </label>
          ) : null}

          {toolbar}
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 p-2.5 sm:hidden">
        {isLoading ? (
          <li className="px-2 py-10 text-center text-xs text-muted">
            Loading placements…
          </li>
        ) : null}
        {!isLoading && isError ? (
          <li className="p-4 text-center">{errorBlock}</li>
        ) : null}
        {!isLoading && !isError && items.length === 0 ? (
          <li className="p-6 text-center">{emptyMessage}</li>
        ) : null}
        {!isLoading &&
          !isError &&
          items.map((item) => {
            const detailPath = operationsPlacementDetailPath(item.id);
            return (
              <li
                key={item.id}
                className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.candidateName || "—"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {item.jobRole || "—"} · {item.company || "—"}
                    </p>
                  </div>
                  <OperationsBadge
                    variant={placementJoiningStatusBadgeVariant(
                      item.joiningStatus,
                    )}
                  >
                    {item.statusLabel}
                  </OperationsBadge>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {item.location?.trim() || "Not specified"}
                  </span>
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-muted">
                    Offer {dateLabel(item.offerDate)}
                  </p>
                  <Link
                    to={detailPath}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    View
                  </Link>
                </div>
              </li>
            );
          })}
      </ul>

      <div className="hidden overflow-x-auto overscroll-x-contain scrollbar-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:block">
        <table className="min-w-[980px] text-left text-xs xl:min-w-full xl:text-[11px]">
          <thead className="border-b border-border-subtle bg-hero-bg/60 text-muted">
            <tr>
              <th scope="col" className={thClassName}>
                Candidate
              </th>
              <th scope="col" className={thClassName}>
                Job Role
              </th>
              <th scope="col" className={thClassName}>
                Company
              </th>
              <th scope="col" className={thClassName}>
                Location
              </th>
              <th scope="col" className={thClassName}>
                Offer Date
              </th>
              <th scope="col" className={thClassName}>
                Joining Date
              </th>
              <th scope="col" className={thClassName}>
                Status
              </th>
              <th scope="col" className={`${thClassName} text-right`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading ? (
              <TableMessage>
                <span className="text-xs text-muted xl:text-[11px]">
                  Loading placements…
                </span>
              </TableMessage>
            ) : null}
            {!isLoading && isError ? (
              <TableMessage>{errorBlock}</TableMessage>
            ) : null}
            {!isLoading && !isError && items.length === 0 ? (
              <TableMessage>{emptyMessage}</TableMessage>
            ) : null}
            {!isLoading &&
              !isError &&
              items.map((item) => {
                const detailPath = operationsPlacementDetailPath(item.id);

                return (
                  <tr
                    key={item.id}
                    className="align-middle transition-colors hover:bg-hero-bg/30"
                  >
                    <td className="max-w-[14rem] px-3 py-3 pl-4 sm:px-3.5 xl:max-w-[11rem] xl:px-2.5 xl:py-2 xl:pl-3">
                      <Link
                        to={detailPath}
                        className="flex min-w-0 items-center gap-2.5 xl:gap-2"
                      >
                        <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-[11px] font-semibold text-primary xl:size-7 xl:text-[10px]">
                          {placementCandidateInitials(item.candidateName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-foreground hover:text-primary xl:text-[11px]">
                            {item.candidateName || "—"}
                          </span>
                          <span className="block truncate text-[10px] text-muted xl:text-[9px]">
                            {item.displayId || item.id.slice(-8).toUpperCase()}
                          </span>
                        </span>
                      </Link>
                    </td>

                    <td className="max-w-[10rem] px-3 py-3 text-foreground sm:px-3.5 xl:max-w-[8rem] xl:px-2.5 xl:py-2">
                      <span className="block truncate xl:text-[11px]">
                        {item.jobRole?.trim() || "—"}
                      </span>
                    </td>

                    <td className="max-w-[10rem] px-3 py-3 text-foreground sm:px-3.5 xl:max-w-[8rem] xl:px-2.5 xl:py-2">
                      <span className="block truncate xl:text-[11px]">
                        {item.company?.trim() || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-muted sm:px-3.5 xl:px-2.5 xl:py-2">
                      <span className="inline-flex max-w-[11rem] items-center gap-1 xl:max-w-[9rem]">
                        <MapPin
                          className="size-3 shrink-0 text-muted xl:size-2.5"
                          aria-hidden="true"
                        />
                        <span className="truncate xl:text-[11px]">
                          {item.location?.trim() && item.location.trim() !== "—"
                            ? item.location
                            : "Not specified"}
                        </span>
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-foreground sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[11px]">
                      {dateLabel(item.offerDate)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-foreground sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[11px]">
                      {dateLabel(item.joiningDate)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 sm:px-3.5 xl:px-2.5 xl:py-2 [&>span]:xl:px-1.5 [&>span]:xl:py-0 [&>span]:xl:text-[10px]">
                      <OperationsBadge
                        variant={placementJoiningStatusBadgeVariant(
                          item.joiningStatus,
                        )}
                      >
                        {item.statusLabel}
                      </OperationsBadge>
                    </td>

                    <td className="whitespace-nowrap py-3 pl-3 pr-4 text-right sm:pl-3.5 xl:py-2 xl:pl-2.5 xl:pr-3">
                      <Link
                        to={detailPath}
                        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:px-2 xl:text-[10px]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
