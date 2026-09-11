import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { AttentionSidePanels } from "../components/operations/attention/AttentionSidePanels";
import { AttentionSummaryCards } from "../components/operations/attention/AttentionSummaryCards";
import { AttentionWorkTable } from "../components/operations/attention/AttentionWorkTable";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsOverviewSplit } from "../components/operations/layout/OperationsOverviewSplit";
import { useOperationsAttention } from "../hooks/use-operations-attention";

export function OperationsAttentionPage() {
  const {
    data,
    activeTab,
    setTab,
    filters,
    updateFilters,
    filterOptions,
    filteredItems,
    pageItems,
    page,
    setPage,
    totalPages,
    pageSize,
    selectedIds,
    toggleRow,
    toggleVisibleRows,
    exportCsv,
    viewSaved,
    saveView,
  } = useOperationsAttention();

  return (
    <OperationsLayout
      title="What Needs Attention"
      subtitle="Items that require action from your teams"
      headerVariant="command"
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3 pb-4 sm:gap-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <nav
              className="flex flex-wrap items-center gap-1 text-[11px] text-muted"
              aria-label="Breadcrumb"
            >
              <Link
                to={OPERATIONS_ROUTES.HOME}
                className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Home
              </Link>
              <span aria-hidden="true">›</span>
              <span className="font-medium text-foreground">
                What Needs Attention
              </span>
            </nav>
            <h1 className="mt-1.5 text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">
              What Needs Attention
            </h1>
            <p className="mt-1 text-[12px] text-muted sm:text-[13px]">
              Items that require action from your teams
            </p>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-border-subtle bg-surface px-3 text-[12px] font-semibold text-foreground shadow-sm transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Download className="size-3.5" strokeWidth={2} aria-hidden="true" />
            Export
          </button>
        </div>

        <AttentionSummaryCards
          cards={data.summary}
          activeId={activeTab}
          onSelect={setTab}
        />

        <OperationsOverviewSplit
          variant="attention"
          rail={
            <AttentionSidePanels
              quickFilters={data.quickFilters}
              activeQuickFilter={filters.quickFilter}
              onQuickFilterChange={(id) =>
                updateFilters({ quickFilter: id })
              }
              onSaveView={saveView}
              viewSaved={viewSaved}
              slaStatus={data.slaStatus}
              workByType={data.workByType}
            />
          }
        >
          <AttentionWorkTable
            tabs={data.tabs}
            activeTab={activeTab}
            onTabChange={setTab}
            filters={filters}
            onFiltersChange={updateFilters}
            filterOptions={filterOptions}
            items={pageItems}
            totalFiltered={filteredItems.length}
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleVisibleRows={toggleVisibleRows}
          />
        </OperationsOverviewSplit>
      </div>
    </OperationsLayout>
  );
}
