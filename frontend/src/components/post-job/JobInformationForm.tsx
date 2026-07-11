"use client";

import {
  JOB_TYPE_OPTIONS,
  POST_JOB_CONTRACT_PERIOD_OPTIONS,
  WORK_MODE_OPTIONS,
} from "@/constants/post-job";
import type { JobType, PostJobFormData, WorkMode } from "@/types/post-job";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import {
  postJobCardClassName,
  postJobCardHeadingClassName,
  postJobFormInlineActionsClassName,
  postJobFormGridGapClassName,
  postJobFormSectionsClassName,
  postJobFormShellClassName,
  postJobInputClassName,
  postJobSalaryRangeGridClassName,
  postJobTextareaClassName,
} from "./post-job-form-styles";

const fieldLabelClassName = "text-sm font-bold text-foreground";

const inputClassName = postJobInputClassName;

const textareaClassName = cn(
  postJobTextareaClassName,
  "resize-none",
);

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
};

function FormField({ id, label, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      {children}
    </div>
  );
}

type RadioIndicatorProps = {
  checked: boolean;
};

function RadioIndicator({ checked }: RadioIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        checked
          ? "border-primary-soft bg-primary-soft"
          : "border-border bg-surface",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full bg-surface transition-opacity",
          checked ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}

function ContractPeriodSelect({
  id,
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          inputClassName,
          "cursor-pointer appearance-none pr-10",
          !value && "text-muted",
        )}
      >
        <option value="" disabled>
          Select
        </option>
        {POST_JOB_CONTRACT_PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/70"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
}

export function JobInformationForm({
  formData,
  onFieldChange,
  onContinue,
  scrollContainerRef,
}: {
  formData: PostJobFormData;
  onFieldChange: <K extends keyof PostJobFormData>(
    field: K,
    value: PostJobFormData[K],
  ) => void;
  onContinue: () => void;
  scrollContainerRef?: RefObject<HTMLFormElement | null>;
}) {
  return (
    <section
      aria-labelledby="job-information-heading"
      className={postJobCardClassName}
    >
      <h2
        id="job-information-heading"
        className={postJobCardHeadingClassName}
      >
        Job Information
      </h2>

      <form
        ref={scrollContainerRef}
        className={postJobFormShellClassName}
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
      >
        <div className={postJobFormSectionsClassName}>
        <div className={postJobFormGridGapClassName}>
          <FormField id="company-details" label="Company Name">
            <input
              id="company-details"
              type="text"
              value={formData.companyDetails}
              onChange={(event) =>
                onFieldChange("companyDetails", event.target.value)
              }
              placeholder="Enter company name"
              className={inputClassName}
              autoComplete="organization"
            />
          </FormField>

          <FormField id="job-title" label="Job Title / Designation">
            <input
              id="job-title"
              type="text"
              value={formData.jobTitle}
              onChange={(event) => onFieldChange("jobTitle", event.target.value)}
              placeholder="Enter Job Title"
              className={inputClassName}
            />
          </FormField>
        </div>

        <fieldset className="space-y-3">
          <legend className={fieldLabelClassName}>Job Type</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {JOB_TYPE_OPTIONS.map((option) => {
              const checked = formData.jobType === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-2.5 transition-colors sm:min-h-12 sm:py-3 lg-short:min-h-10 lg-short:py-2 lg-compact:min-h-9",
                    checked
                      ? "border-primary-soft ring-1 ring-primary-soft/30"
                      : "border-border hover:border-primary/20",
                  )}
                >
                  <input
                    type="radio"
                    name="job-type"
                    value={option.value}
                    checked={checked}
                    onChange={() => onFieldChange("jobType", option.value as JobType)}
                    className="sr-only"
                  />
                  <RadioIndicator checked={checked} />
                  <span className="text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {formData.jobType === "contract" ? (
          <fieldset className="space-y-3">
            <legend className={fieldLabelClassName}>Contract Period</legend>
            <div className={postJobSalaryRangeGridClassName}>
              <ContractPeriodSelect
                id="contract-period-from"
                value={formData.contractPeriodFrom}
                aria-label="Contract period start"
                onChange={(value) => onFieldChange("contractPeriodFrom", value)}
              />
              <ContractPeriodSelect
                id="contract-period-to"
                value={formData.contractPeriodTo}
                aria-label="Contract period end"
                onChange={(value) => onFieldChange("contractPeriodTo", value)}
              />
            </div>
          </fieldset>
        ) : null}

        <fieldset className="space-y-3">
          <legend className={fieldLabelClassName}>Work Mode</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {WORK_MODE_OPTIONS.map((option) => {
              const checked = formData.workMode === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex min-h-[4.75rem] cursor-pointer items-start gap-3 rounded-md border bg-surface px-4 py-3 transition-colors md:min-h-[5.25rem] md:py-4 lg-short:min-h-[4.25rem] lg-short:py-2.5 lg-compact:min-h-[3.75rem] lg-compact:py-2",
                    checked
                      ? "border-primary-soft ring-1 ring-primary-soft/30"
                      : "border-border hover:border-primary/20",
                  )}
                >
                  <input
                    type="radio"
                    name="work-mode"
                    value={option.value}
                    checked={checked}
                    onChange={() =>
                      onFieldChange("workMode", option.value as WorkMode)
                    }
                    className="sr-only"
                  />
                  <RadioIndicator checked={checked} />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <FormField id="job-vacancies" label="Number of Vacancies">
          <input
            id="job-vacancies"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={formData.vacancies}
            onChange={(event) => onFieldChange("vacancies", event.target.value)}
            placeholder="Select number of vacancies"
            className={inputClassName}
          />
        </FormField>

        <FormField id="job-description" label="Job Description">
          <textarea
            id="job-description"
            value={formData.jobDescription}
            onChange={(event) =>
              onFieldChange("jobDescription", event.target.value)
            }
            placeholder="Describe the job role, responsibilities and requirements."
            className={textareaClassName}
          />
        </FormField>

        <div className={cn(postJobFormInlineActionsClassName, "flex-row justify-end")}>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary-soft px-8 text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:bg-primary-soft-hover sm:h-12 sm:w-auto sm:min-w-[148px]"
          >
            Continue
          </button>
        </div>
        </div>
      </form>
    </section>
  );
}
