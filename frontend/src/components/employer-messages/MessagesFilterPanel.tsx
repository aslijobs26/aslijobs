"use client";

import {
  DEFAULT_MESSAGES_FILTERS,
  MESSAGES_CANDIDATE_ACTION_OPTIONS,
  MESSAGES_CATEGORY_OPTIONS,
  MESSAGES_CONVERSATION_TYPE_OPTIONS,
  MESSAGES_EMPLOYER_ACTION_OPTIONS,
  MESSAGES_INTERVIEW_STATUS_OPTIONS,
  MESSAGES_OFFER_STATUS_OPTIONS,
  MESSAGES_QUICK_DATE_OPTIONS,
  MESSAGES_STATUS_OPTIONS,
  messagesFiltersAreActive,
  type MessagesFiltersState,
  type MessagesJobFacet,
  type MessagesQuickDateFilter,
  type MessagesCategoryFilter,
  type MessagesConversationTypeFilter,
} from "@/components/employer-messages/messages-filters";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { Filter, X } from "lucide-react";
import { useState, type ReactNode } from "react";

type MessagesFilterPanelProps = {
  filters: MessagesFiltersState;
  jobFacets: MessagesJobFacet[];
  onApply: (next: MessagesFiltersState) => void;
  onClear: () => void;
  onCancel?: () => void;
  presentation?: "sidebar" | "sheet";
  idPrefix?: string;
};

const fieldClassName =
  "h-9 w-full min-w-0 rounded-md border border-border-subtle bg-surface px-2.5 text-xs font-normal text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const sheetFieldClassName =
  "h-11 w-full min-w-0 rounded-md border border-border-subtle bg-surface px-3 text-sm font-normal text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const filterSelectTriggerClassName =
  "!h-9 lg:!h-9 !min-h-9 !px-2.5 !text-xs !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] h-9 w-full min-w-0 rounded-md border border-border-subtle bg-surface text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const sheetSelectTriggerClassName =
  "!h-11 !min-h-11 !px-3 !text-sm !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] h-11 w-full min-w-0 rounded-md border border-border-subtle bg-surface text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const labelClassName =
  "block text-[0.6875rem] font-medium leading-none text-muted";

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClassName}>
          {label}
        </label>
      ) : (
        <p className={labelClassName}>{label}</p>
      )}
      <div className="w-full min-w-0 [&_.employer-register-form-stack]:gap-0">
        {children}
      </div>
    </div>
  );
}

export function MessagesFilterPanel({
  filters,
  jobFacets,
  onApply,
  onClear,
  onCancel,
  presentation = "sidebar",
  idPrefix = "",
}: MessagesFilterPanelProps) {
  const [draft, setDraft] = useState<MessagesFiltersState>(filters);
  const [syncedFilters, setSyncedFilters] = useState(filters);
  const isSheet = presentation === "sheet";

  if (filters !== syncedFilters) {
    setSyncedFilters(filters);
    setDraft(filters);
  }

  const hasActiveFilters = messagesFiltersAreActive(draft);

  const jobOptions: EmployerRegisterSelectOption[] = [
    { value: "", label: "All Jobs" },
    ...jobFacets.map((facet) => ({
      value: facet.publicJobId,
      label: `${facet.jobTitle} (${facet.count})`,
    })),
  ];

  const patch = (partial: Partial<MessagesFiltersState>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const inputClassName = isSheet ? sheetFieldClassName : fieldClassName;
  const selectTriggerClassName = isSheet
    ? sheetSelectTriggerClassName
    : filterSelectTriggerClassName;

  const filterFields = (
    <>
      <FilterField label="Job">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-job`}
          label="Job"
          hideLabel
          hideSearch={jobOptions.length <= 8}
          value={draft.publicJobId}
          placeholder="All Jobs"
          options={jobOptions}
          onChange={(value) => patch({ publicJobId: value })}
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      <FilterField
        label="Candidate"
        htmlFor={`${idPrefix}messages-filter-candidate`}
      >
        <input
          id={`${idPrefix}messages-filter-candidate`}
          type="search"
          value={draft.candidateSearch}
          onChange={(event) => patch({ candidateSearch: event.target.value })}
          placeholder="Search by name, phone or App ID"
          className={inputClassName}
        />
      </FilterField>

      <FilterField label="Notification Category">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-category`}
          label="Notification Category"
          hideLabel
          hideSearch
          value={draft.category}
          placeholder="All"
          options={MESSAGES_CATEGORY_OPTIONS}
          onChange={(value) =>
            patch({ category: value as MessagesCategoryFilter })
          }
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      <FilterField label="Hiring Status">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-status`}
          label="Hiring Status"
          hideLabel
          hideSearch
          value={draft.applicationStatus}
          placeholder="All Status"
          options={MESSAGES_STATUS_OPTIONS}
          onChange={(value) => patch({ applicationStatus: value })}
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      <FilterField label="Interview Status">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-interview`}
          label="Interview Status"
          hideLabel
          hideSearch
          value={draft.interviewStatus}
          placeholder="All"
          options={MESSAGES_INTERVIEW_STATUS_OPTIONS}
          onChange={(value) =>
            patch({
              interviewStatus: value,
              offerStatus: value !== "all" ? "all" : draft.offerStatus,
            })
          }
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      <FilterField label="Offer Status">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-offer`}
          label="Offer Status"
          hideLabel
          hideSearch
          value={draft.offerStatus}
          placeholder="All"
          options={MESSAGES_OFFER_STATUS_OPTIONS}
          onChange={(value) =>
            patch({
              offerStatus: value,
              interviewStatus: value !== "all" ? "all" : draft.interviewStatus,
            })
          }
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      <FilterField label="Quick Date">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-date`}
          label="Quick Date"
          hideLabel
          hideSearch
          value={draft.quickDate}
          placeholder="Any Time"
          options={MESSAGES_QUICK_DATE_OPTIONS}
          onChange={(value) =>
            patch({
              quickDate: value as MessagesQuickDateFilter,
              dateFrom: value === "custom" ? draft.dateFrom : "",
              dateTo: value === "custom" ? draft.dateTo : "",
            })
          }
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      {draft.quickDate === "custom" ? (
        <div className="grid w-full grid-cols-2 gap-2">
          <FilterField
            label="From"
            htmlFor={`${idPrefix}messages-filter-from`}
          >
            <input
              id={`${idPrefix}messages-filter-from`}
              type="date"
              value={draft.dateFrom}
              onChange={(event) => patch({ dateFrom: event.target.value })}
              className={inputClassName}
            />
          </FilterField>
          <FilterField label="To" htmlFor={`${idPrefix}messages-filter-to`}>
            <input
              id={`${idPrefix}messages-filter-to`}
              type="date"
              value={draft.dateTo}
              onChange={(event) => patch({ dateTo: event.target.value })}
              className={inputClassName}
            />
          </FilterField>
        </div>
      ) : null}

      <label
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-md border border-border-subtle px-2.5 text-xs text-foreground",
          isSheet ? "min-h-11 py-2.5" : "py-2",
        )}
      >
        <input
          type="checkbox"
          checked={draft.unreadOnly}
          onChange={(event) => patch({ unreadOnly: event.target.checked })}
          className="size-3.5 shrink-0 rounded border-border-subtle text-primary focus-visible:ring-primary/30"
        />
        Unread only
      </label>

      <FilterField label="Employer Actions">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-employer-action`}
          label="Employer Actions"
          hideLabel
          hideSearch
          value={draft.employerAction}
          placeholder="All"
          options={MESSAGES_EMPLOYER_ACTION_OPTIONS}
          onChange={(value) => patch({ employerAction: value })}
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      <FilterField label="Candidate Actions">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-candidate-action`}
          label="Candidate Actions"
          hideLabel
          hideSearch
          value={draft.candidateAction}
          placeholder="All"
          options={MESSAGES_CANDIDATE_ACTION_OPTIONS}
          onChange={(value) => patch({ candidateAction: value })}
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>

      <FilterField label="Conversation Type">
        <EmployerRegisterSearchableSelect
          id={`${idPrefix}messages-filter-conversation-type`}
          label="Conversation Type"
          hideLabel
          hideSearch
          value={draft.conversationType}
          placeholder="All"
          options={MESSAGES_CONVERSATION_TYPE_OPTIONS}
          onChange={(value) =>
            patch({
              conversationType: value as MessagesConversationTypeFilter,
            })
          }
          triggerClassName={selectTriggerClassName}
        />
      </FilterField>
    </>
  );

  if (isSheet) {
    return (
      <section className="flex h-full min-h-0 w-full flex-col bg-surface">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
              <Filter className="size-3.5" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-foreground">Filters</h2>
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close filters"
              className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 scrollbar-hidden">
          {filterFields}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border-subtle px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Apply
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft({ ...DEFAULT_MESSAGES_FILTERS });
                onClear();
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface text-sm font-semibold text-muted hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-surface p-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
            <Filter className="size-3" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft({ ...DEFAULT_MESSAGES_FILTERS });
            onClear();
          }}
          disabled={!hasActiveFilters && !messagesFiltersAreActive(filters)}
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[0.6875rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            hasActiveFilters || messagesFiltersAreActive(filters)
              ? "text-primary hover:bg-primary-light"
              : "cursor-not-allowed text-muted/50",
          )}
        >
          <X className="size-3" aria-hidden="true" />
          Clear All
        </button>
      </div>

      <div className="mt-3 flex min-h-0 w-full flex-1 flex-col justify-between gap-2 overflow-x-hidden overflow-y-auto pr-0.5 scrollbar-thin">
        {filterFields}
      </div>

      <button
        type="button"
        onClick={() => onApply(draft)}
        className="mt-3 inline-flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Apply Filters
      </button>
    </section>
  );
}
