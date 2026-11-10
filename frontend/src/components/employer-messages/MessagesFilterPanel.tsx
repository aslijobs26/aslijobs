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
  translateMessagesOptions,
  type MessagesFiltersState,
  type MessagesJobFacet,
  type MessagesQuickDateFilter,
  type MessagesCategoryFilter,
  type MessagesConversationTypeFilter,
} from "@/components/employer-messages/messages-filters";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { useTranslate } from "@/i18n/translate";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import { Filter, Info, X } from "lucide-react";
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
  "employer-messages-filters__field h-9 w-full min-w-0 rounded-md border border-border-subtle bg-surface px-2.5 text-xs font-normal text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 lg:h-8 lg:px-2 lg:text-[11px]";

const sheetFieldClassName =
  "employer-messages-filters__field h-11 w-full min-w-0 rounded-md border border-border-subtle bg-surface px-3 text-sm font-normal text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] placeholder:text-muted hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 lg:h-8 lg:px-2 lg:text-[11px]";

const filterSelectTriggerClassName =
  "employer-messages-filters__select-trigger !h-9 lg:!h-8 !min-h-9 lg:!min-h-8 !px-2.5 lg:!px-2 !text-xs lg:!text-[11px] !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] h-9 w-full min-w-0 rounded-md border border-border-subtle bg-surface text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const sheetSelectTriggerClassName =
  "employer-messages-filters__select-trigger !h-11 !min-h-11 lg:!h-8 lg:!min-h-8 !px-3 lg:!px-2 !text-sm lg:!text-[11px] !font-medium !shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:!shadow-[0_1px_2px_rgba(15,23,42,0.06)] h-11 w-full min-w-0 rounded-md border border-border-subtle bg-surface text-foreground transition-[border-color,box-shadow] hover:border-primary/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const filterSelectOptionClassName =
  "employer-messages-filters__select-option !px-2.5 !py-2 !text-sm lg:!px-2 lg:!py-1.5 lg:!text-[11px]";

const filterSelectPanelClassName =
  "employer-messages-filters-select-panel";

const labelClassName =
  "employer-messages-filters__label block text-[0.6875rem] font-medium leading-none text-muted lg:text-[0.625rem]";

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
  const t = useTranslate();
  const [draft, setDraft] = useState<MessagesFiltersState>(filters);
  const [syncedFilters, setSyncedFilters] = useState(filters);
  const isSheet = presentation === "sheet";

  if (filters !== syncedFilters) {
    setSyncedFilters(filters);
    setDraft(filters);
  }

  const hasActiveFilters = messagesFiltersAreActive(draft);
  const allLabel = t("employer.messagesPage.filters.all");

  const jobOptions: EmployerRegisterSelectOption[] = [
    { value: "", label: t("employer.messagesPage.filters.allJobs") },
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

  const selectProps = {
    hideLabel: true,
    triggerClassName: selectTriggerClassName,
    panelClassName: filterSelectPanelClassName,
    optionClassName: filterSelectOptionClassName,
  } as const;

  const filterFields = (
    <>
      <FilterField label={t("employer.messagesPage.filters.job")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-job`}
          label={t("employer.messagesPage.filters.job")}
          hideSearch={jobOptions.length <= 8}
          value={draft.publicJobId}
          placeholder={t("employer.messagesPage.filters.allJobs")}
          options={jobOptions}
          onChange={(value) => patch({ publicJobId: value })}
        />
      </FilterField>

      <FilterField
        label={t("employer.messagesPage.filters.candidate")}
        htmlFor={`${idPrefix}messages-filter-candidate`}
      >
        <input
          id={`${idPrefix}messages-filter-candidate`}
          type="search"
          value={draft.candidateSearch}
          onChange={(event) => patch({ candidateSearch: event.target.value })}
          placeholder={t("employer.messagesPage.filters.candidatePlaceholder")}
          className={inputClassName}
        />
      </FilterField>

      <FilterField label={t("employer.messagesPage.filters.category")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-category`}
          label={t("employer.messagesPage.filters.category")}
          hideSearch
          value={draft.category}
          placeholder={allLabel}
          options={translateMessagesOptions(MESSAGES_CATEGORY_OPTIONS, t)}
          onChange={(value) =>
            patch({ category: value as MessagesCategoryFilter })
          }
        />
      </FilterField>

      <FilterField label={t("employer.messagesPage.filters.hiringStatus")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-status`}
          label={t("employer.messagesPage.filters.hiringStatus")}
          hideSearch
          value={draft.applicationStatus}
          placeholder={t("employer.messagesPage.filters.allStatus")}
          options={translateMessagesOptions(MESSAGES_STATUS_OPTIONS, t)}
          onChange={(value) => patch({ applicationStatus: value })}
        />
      </FilterField>

      <FilterField label={t("employer.messagesPage.filters.interviewStatus")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-interview`}
          label={t("employer.messagesPage.filters.interviewStatus")}
          hideSearch
          value={draft.interviewStatus}
          placeholder={allLabel}
          options={translateMessagesOptions(MESSAGES_INTERVIEW_STATUS_OPTIONS, t)}
          onChange={(value) =>
            patch({
              interviewStatus: value,
              offerStatus: value !== "all" ? "all" : draft.offerStatus,
            })
          }
        />
      </FilterField>

      <FilterField label={t("employer.messagesPage.filters.offerStatus")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-offer`}
          label={t("employer.messagesPage.filters.offerStatus")}
          hideSearch
          value={draft.offerStatus}
          placeholder={allLabel}
          options={translateMessagesOptions(MESSAGES_OFFER_STATUS_OPTIONS, t)}
          onChange={(value) =>
            patch({
              offerStatus: value,
              interviewStatus: value !== "all" ? "all" : draft.interviewStatus,
            })
          }
        />
        <p className="mt-1 flex items-start gap-1 text-[0.625rem] leading-snug text-muted">
          <Info className="mt-px size-3 shrink-0" aria-hidden="true" />
          {t("employer.messagesPage.filters.offerNote")}
        </p>
      </FilterField>

      <FilterField label={t("employer.messagesPage.filters.quickDate")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-date`}
          label={t("employer.messagesPage.filters.quickDate")}
          hideSearch
          value={draft.quickDate}
          placeholder={t("employer.messagesPage.options.quickDate.all")}
          options={translateMessagesOptions(MESSAGES_QUICK_DATE_OPTIONS, t)}
          onChange={(value) =>
            patch({
              quickDate: value as MessagesQuickDateFilter,
              dateFrom: value === "custom" ? draft.dateFrom : "",
              dateTo: value === "custom" ? draft.dateTo : "",
            })
          }
        />
      </FilterField>

      {draft.quickDate === "custom" ? (
        <div className="grid w-full grid-cols-2 gap-2">
          <FilterField
            label={t("employer.messagesPage.filters.from")}
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
          <FilterField
            label={t("employer.messagesPage.filters.to")}
            htmlFor={`${idPrefix}messages-filter-to`}
          >
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
          "flex w-full min-w-0 items-center gap-2 rounded-md border border-border-subtle px-2.5 text-xs text-foreground lg:py-1.5 lg:text-[11px]",
          isSheet ? "min-h-11 py-2.5 lg:min-h-8" : "py-2",
        )}
      >
        <input
          type="checkbox"
          checked={draft.unreadOnly}
          onChange={(event) => patch({ unreadOnly: event.target.checked })}
          className="size-3.5 shrink-0 rounded border-border-subtle text-primary focus-visible:ring-primary/30"
        />
        {t("employer.messagesPage.filters.unreadOnly")}
      </label>

      <FilterField label={t("employer.messagesPage.filters.employerActions")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-employer-action`}
          label={t("employer.messagesPage.filters.employerActions")}
          hideSearch
          value={draft.employerAction}
          placeholder={allLabel}
          options={translateMessagesOptions(MESSAGES_EMPLOYER_ACTION_OPTIONS, t)}
          onChange={(value) => patch({ employerAction: value })}
        />
      </FilterField>

      <FilterField label={t("employer.messagesPage.filters.candidateActions")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-candidate-action`}
          label={t("employer.messagesPage.filters.candidateActions")}
          hideSearch
          value={draft.candidateAction}
          placeholder={allLabel}
          options={translateMessagesOptions(MESSAGES_CANDIDATE_ACTION_OPTIONS, t)}
          onChange={(value) => patch({ candidateAction: value })}
        />
      </FilterField>

      <FilterField label={t("employer.messagesPage.filters.conversationType")}>
        <EmployerRegisterSearchableSelect
          {...selectProps}
          id={`${idPrefix}messages-filter-conversation-type`}
          label={t("employer.messagesPage.filters.conversationType")}
          hideSearch
          value={draft.conversationType}
          placeholder={allLabel}
          options={translateMessagesOptions(
            MESSAGES_CONVERSATION_TYPE_OPTIONS,
            t,
          )}
          onChange={(value) =>
            patch({
              conversationType: value as MessagesConversationTypeFilter,
            })
          }
        />
      </FilterField>
    </>
  );

  if (isSheet) {
    return (
      <section className="employer-messages-filters flex h-full min-h-0 w-full flex-col bg-surface">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
              <Filter className="size-3.5" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-foreground">
              {t("employer.messagesPage.filters.title")}
            </h2>
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              aria-label={t("employer.messagesPage.filters.close")}
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
            {t("employer.messagesPage.filters.apply")}
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
              {t("employer.messagesPage.filters.clear")}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface text-sm font-semibold text-muted hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t("employer.messagesPage.filters.cancel")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="employer-messages-filters flex h-full min-h-0 w-full flex-col bg-surface p-3 lg:p-2.5">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary lg:size-5">
            <Filter className="size-3 lg:size-2.5" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-foreground lg:text-xs">
            {t("employer.messagesPage.filters.title")}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft({ ...DEFAULT_MESSAGES_FILTERS });
            onClear();
          }}
          disabled={!hasActiveFilters && !messagesFiltersAreActive(filters)}
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[0.6875rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:text-[10px]",
            hasActiveFilters || messagesFiltersAreActive(filters)
              ? "text-primary hover:bg-primary-light"
              : "cursor-not-allowed text-muted/50",
          )}
        >
          <X className="size-3 lg:size-2.5" aria-hidden="true" />
          {t("employer.messagesPage.filters.clearAll")}
        </button>
      </div>

      <div className="mt-3 flex min-h-0 w-full flex-1 flex-col justify-start gap-2 overflow-x-hidden overflow-y-auto pr-0.5 scrollbar-thin lg:mt-2 lg:gap-1.5">
        {filterFields}
      </div>

      <button
        type="button"
        onClick={() => onApply(draft)}
        className="mt-3 inline-flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:mt-2 lg:h-8 lg:text-xs"
      >
        {t("employer.messagesPage.filters.applyFilters")}
      </button>
    </section>
  );
}
