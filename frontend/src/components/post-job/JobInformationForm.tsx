"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS,
  EMPLOYER_REGISTER_INDUSTRY_OPTIONS,
  getEmployerRegisterBusinessCategoryOptions,
} from "@/constants/employer-register";
import {
  JOB_TYPE_OPTIONS,
  PART_TIME_FLEXIBLE_HOURS_OPTIONS,
  PART_TIME_MERIDIEM_OPTIONS,
  PART_TIME_SCHEDULE_OPTIONS,
  POST_JOB_CONTRACT_PERIOD_UNITS,
  POST_JOB_LONG_TEXT_MAX_LENGTH,
  buildContractPeriodStoredValue,
  buildPartTimeManualStoredValue,
  parseContractPeriodStoredValue,
  parsePartTimeManualStoredValue,
  WORK_MODE_OPTIONS,
  type PartTimeMeridiem,
} from "@/constants/post-job";
import type {
  ContractPeriodUnit,
  EmployerAccountType,
  JobType,
  PartTimeScheduleType,
  PostJobFormData,
  WorkMode,
} from "@/types/post-job";
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
  postJobWorkModeGridClassName,
} from "./post-job-form-styles";

const fieldLabelClassName = "text-sm font-bold text-foreground";

const inputClassName = postJobInputClassName;

function inputClassNameWithError(hasError?: string) {
  return cn(
    inputClassName,
    hasError && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
  );
}

const textareaClassName = cn(
  postJobTextareaClassName,
  "resize-none",
);

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  error?: string;
};

function FormField({ id, label, children, className, error }: FormFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
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

const contractPeriodFieldShellClassName =
  "flex h-12 w-full overflow-hidden rounded-md border border-border bg-surface text-sm text-foreground transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 lg-short:h-11 lg-compact:h-10 lg-tight:h-10";

function ContractPeriodField({
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
  const { amount, unit } = parseContractPeriodStoredValue(value);
  const unitSelectId = `${id}-unit`;

  const updateContractPeriod = (
    nextAmount: string,
    nextUnit: ContractPeriodUnit,
  ) => {
    onChange(buildContractPeriodStoredValue(nextAmount, nextUnit));
  };

  return (
    <div className={contractPeriodFieldShellClassName}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={amount}
        onChange={(event) =>
          updateContractPeriod(event.target.value.replace(/\D/g, ""), unit)
        }
        placeholder="0"
        aria-label={ariaLabel}
        className="min-w-0 flex-1 border-0 bg-transparent px-3.5 outline-none placeholder:text-muted"
      />
      <div className="relative flex shrink-0 items-center border-l border-border">
        <select
          id={unitSelectId}
          value={unit}
          aria-label={`${ariaLabel ?? "Contract period"} unit`}
          onChange={(event) =>
            updateContractPeriod(amount, event.target.value as ContractPeriodUnit)
          }
          className="h-full min-w-[5.75rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3 pr-8 text-sm outline-none sm:min-w-[6.25rem]"
        >
          {POST_JOB_CONTRACT_PERIOD_UNITS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground/70"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function ManualTimeField({
  id,
  value,
  placeholder,
  onChange,
  "aria-label": ariaLabel,
}: {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
}) {
  const { time, meridiem } = parsePartTimeManualStoredValue(value);
  const meridiemSelectId = `${id}-meridiem`;

  const updateManualTime = (
    nextTime: string,
    nextMeridiem: PartTimeMeridiem,
  ) => {
    onChange(buildPartTimeManualStoredValue(nextTime, nextMeridiem));
  };

  return (
    <div className={contractPeriodFieldShellClassName}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={time}
        onChange={(event) =>
          updateManualTime(
            event.target.value.replace(/[^\d:]/g, "").slice(0, 5),
            meridiem,
          )
        }
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="min-w-0 flex-1 border-0 bg-transparent px-3.5 outline-none placeholder:text-muted"
      />
      <div className="relative flex shrink-0 items-center border-l border-border">
        <select
          id={meridiemSelectId}
          value={meridiem}
          aria-label={`${ariaLabel ?? "Time"} AM or PM`}
          onChange={(event) =>
            updateManualTime(time, event.target.value as PartTimeMeridiem)
          }
          className="h-full min-w-[4.5rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3 pr-8 text-sm outline-none"
        >
          {PART_TIME_MERIDIEM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-foreground/70"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function TimingSelectInput({
  id,
  value,
  placeholder,
  options,
  onChange,
  "aria-label": ariaLabel,
}: {
  id: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
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
          {placeholder}
        </option>
        {options.map((option) => (
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
  fieldErrors = {},
  accountType = null,
  onFieldChange,
  onContinue,
  scrollContainerRef,
}: {
  formData: PostJobFormData;
  fieldErrors?: Record<string, string>;
  accountType?: EmployerAccountType | null;
  onFieldChange: <K extends keyof PostJobFormData>(
    field: K,
    value: PostJobFormData[K],
  ) => void;
  onContinue: () => void;
  scrollContainerRef?: RefObject<HTMLFormElement | null>;
}) {
  const isConsultancy = accountType === "consultancy";
  const isIndividual = accountType === "individual";
  const businessCategoryOptions =
    getEmployerRegisterBusinessCategoryOptions(formData.industry);

  const clearPartTimeFields = () => {
    onFieldChange("partTimeSchedule", "");
    onFieldChange("partTimeStartTime", "");
    onFieldChange("partTimeEndTime", "");
    onFieldChange("partTimeFlexibleHours", "");
  };

  const handleJobTypeChange = (nextJobType: JobType) => {
    onFieldChange("jobType", nextJobType);

    if (nextJobType !== "part-time") {
      clearPartTimeFields();
    }
  };

  const handlePartTimeScheduleChange = (
    nextSchedule: PartTimeScheduleType,
  ) => {
    onFieldChange("partTimeSchedule", nextSchedule);

    if (nextSchedule === "fixed-timings") {
      onFieldChange("partTimeFlexibleHours", "");
    } else {
      onFieldChange("partTimeStartTime", "");
      onFieldChange("partTimeEndTime", "");
    }
  };

  const handleIndustryChange = (nextIndustry: string) => {
    onFieldChange("industry", nextIndustry);
    onFieldChange("businessCategory", "");
  };

  const jobInformationFields = (
    <>
      {!isConsultancy ? (
        <div className={postJobFormGridGapClassName}>
          <FormField
            id="company-details"
            label={isIndividual ? "Establishment Name" : "Company Name"}
            error={fieldErrors.companyDetails}
          >
            <input
              id="company-details"
              type="text"
              value={formData.companyDetails}
              onChange={(event) =>
                onFieldChange("companyDetails", event.target.value)
              }
              placeholder={
                isIndividual
                  ? "Enter Establishment Name"
                  : "Enter company name"
              }
              className={inputClassNameWithError(fieldErrors.companyDetails)}
              autoComplete="organization"
            />
          </FormField>

          <FormField
            id="job-title"
            label="Job Title / Designation"
            error={fieldErrors.jobTitle}
          >
            <input
              id="job-title"
              type="text"
              value={formData.jobTitle}
              onChange={(event) => onFieldChange("jobTitle", event.target.value)}
              placeholder="Enter Job Title"
              className={inputClassNameWithError(fieldErrors.jobTitle)}
            />
          </FormField>
        </div>
      ) : (
        <FormField
          id="job-title"
          label="Job Title / Designation"
          error={fieldErrors.jobTitle}
        >
          <input
            id="job-title"
            type="text"
            value={formData.jobTitle}
            onChange={(event) => onFieldChange("jobTitle", event.target.value)}
            placeholder="Enter Job Title"
            className={inputClassNameWithError(fieldErrors.jobTitle)}
          />
        </FormField>
      )}

      <fieldset id="job-type-group" className="space-y-3">
        <legend className={fieldLabelClassName}>Job Type</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {JOB_TYPE_OPTIONS.map((option) => {
            const checked = formData.jobType === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-2.5 transition-colors sm:min-h-12 sm:py-3",
                  checked
                    ? "border-primary-soft ring-1 ring-primary-soft/30"
                    : fieldErrors.jobType
                      ? "border-red-500"
                      : "border-border hover:border-primary/20",
                )}
              >
                <input
                  type="radio"
                  name="job-type"
                  value={option.value}
                  checked={checked}
                  onChange={() =>
                    handleJobTypeChange(option.value as JobType)
                  }
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
        {fieldErrors.jobType ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {fieldErrors.jobType}
          </p>
        ) : null}
      </fieldset>

      {formData.jobType === "part-time" ? (
        <fieldset id="part-time-schedule-group" className="space-y-3">
          <legend className={fieldLabelClassName}>Part-time Schedule</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PART_TIME_SCHEDULE_OPTIONS.map((option) => {
              const checked = formData.partTimeSchedule === option.value;

              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-2.5 transition-colors sm:min-h-12 sm:py-3",
                    checked
                      ? "border-primary-soft ring-1 ring-primary-soft/30"
                      : fieldErrors.partTimeSchedule
                        ? "border-red-500"
                        : "border-border hover:border-primary/20",
                  )}
                >
                  <input
                    type="radio"
                    name="part-time-schedule"
                    value={option.value}
                    checked={checked}
                    onChange={() =>
                      handlePartTimeScheduleChange(
                        option.value as PartTimeScheduleType,
                      )
                    }
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
          {fieldErrors.partTimeSchedule ? (
            <p className="text-xs font-medium text-red-600" role="alert">
              {fieldErrors.partTimeSchedule}
            </p>
          ) : null}

          {formData.partTimeSchedule === "fixed-timings" ? (
            <div className={postJobSalaryRangeGridClassName}>
              <div className="flex min-w-0 flex-col gap-2">
                <ManualTimeField
                  id="part-time-start-time"
                  value={formData.partTimeStartTime}
                  placeholder="Start time"
                  aria-label="Part-time start time"
                  onChange={(value) =>
                    onFieldChange("partTimeStartTime", value)
                  }
                />
                {fieldErrors.partTimeStartTime ? (
                  <p className="text-xs font-medium text-red-600" role="alert">
                    {fieldErrors.partTimeStartTime}
                  </p>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <ManualTimeField
                  id="part-time-end-time"
                  value={formData.partTimeEndTime}
                  placeholder="End time"
                  aria-label="Part-time end time"
                  onChange={(value) => onFieldChange("partTimeEndTime", value)}
                />
                {fieldErrors.partTimeEndTime ? (
                  <p className="text-xs font-medium text-red-600" role="alert">
                    {fieldErrors.partTimeEndTime}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {formData.partTimeSchedule === "flexible-hours" ? (
            <div className="flex min-w-0 flex-col gap-2">
              <TimingSelectInput
                id="part-time-flexible-hours"
                value={formData.partTimeFlexibleHours}
                placeholder="Select hours"
                aria-label="Flexible working hours"
                options={PART_TIME_FLEXIBLE_HOURS_OPTIONS}
                onChange={(value) =>
                  onFieldChange("partTimeFlexibleHours", value)
                }
              />
              {fieldErrors.partTimeFlexibleHours ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.partTimeFlexibleHours}
                </p>
              ) : null}
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {formData.jobType === "contract" ? (
        <fieldset className="space-y-3">
          <legend className={fieldLabelClassName}>Contract Period</legend>
          <div className={postJobSalaryRangeGridClassName}>
            <div className="flex min-w-0 flex-col gap-2">
              <ContractPeriodField
                id="contract-period-from"
                value={formData.contractPeriodFrom}
                aria-label="Contract period start"
                onChange={(value) =>
                  onFieldChange("contractPeriodFrom", value)
                }
              />
              {fieldErrors.contractPeriodFrom ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.contractPeriodFrom}
                </p>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <ContractPeriodField
                id="contract-period-to"
                value={formData.contractPeriodTo}
                aria-label="Contract period end"
                onChange={(value) =>
                  onFieldChange("contractPeriodTo", value)
                }
              />
              {fieldErrors.contractPeriodTo ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.contractPeriodTo}
                </p>
              ) : null}
            </div>
          </div>
        </fieldset>
      ) : null}

      <fieldset id="work-mode-group" className="space-y-3">
        <legend className={fieldLabelClassName}>Work Mode</legend>
        <div className={postJobWorkModeGridClassName}>
          {WORK_MODE_OPTIONS.map((option) => {
            const checked = formData.workMode === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "flex min-h-[4.5rem] cursor-pointer items-start gap-2.5 rounded-md border bg-surface px-4 py-3.5 transition-colors md:min-h-[5.25rem] md:px-4 md:py-4",
                  checked
                    ? "border-primary-soft ring-1 ring-primary-soft/30"
                    : fieldErrors.workMode
                      ? "border-red-500"
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
                <span className="min-w-0 flex-1">
                  <span className="block truncate whitespace-nowrap text-[0.6875rem] font-bold leading-none text-foreground sm:text-xs lg:text-[0.8125rem]">
                    {option.label}
                  </span>
                  <span className="mt-1.5 block text-[0.625rem] leading-snug text-muted sm:text-[0.6875rem] lg:text-xs">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {fieldErrors.workMode ? (
          <p className="text-xs font-medium text-red-600" role="alert">
            {fieldErrors.workMode}
          </p>
        ) : null}
      </fieldset>

      <FormField
        id="job-vacancies"
        label="Number of Vacancies"
        error={fieldErrors.vacancies}
      >
        <input
          id="job-vacancies"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={formData.vacancies}
          onChange={(event) => onFieldChange("vacancies", event.target.value)}
          placeholder="Select number of vacancies"
          className={inputClassNameWithError(fieldErrors.vacancies)}
          aria-invalid={Boolean(fieldErrors.vacancies)}
        />
      </FormField>

      <FormField
        id="job-description"
        label="Job Description"
        error={fieldErrors.jobDescription}
      >
        <textarea
          id="job-description"
          value={formData.jobDescription}
          onChange={(event) =>
            onFieldChange(
              "jobDescription",
              event.target.value.slice(0, POST_JOB_LONG_TEXT_MAX_LENGTH),
            )
          }
          maxLength={POST_JOB_LONG_TEXT_MAX_LENGTH}
          placeholder="Describe the job role, responsibilities and requirements."
          className={cn(
            textareaClassName,
            fieldErrors.jobDescription &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          )}
          aria-invalid={Boolean(fieldErrors.jobDescription)}
          aria-describedby="job-description-count"
        />
        <p
          id="job-description-count"
          className="text-right text-xs text-muted"
        >
          {formData.jobDescription.length}/{POST_JOB_LONG_TEXT_MAX_LENGTH}
        </p>
      </FormField>

      <div className={cn(postJobFormInlineActionsClassName, "flex-row justify-end")}>
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary-soft px-8 text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:bg-primary-soft-hover sm:h-12 sm:w-auto sm:min-w-[148px]"
        >
          Continue
        </button>
      </div>
    </>
  );

  if (!isConsultancy) {
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
            {jobInformationFields}
          </div>
        </form>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="company-details-heading"
      className={postJobCardClassName}
    >
      <form
        ref={scrollContainerRef}
        className={postJobFormShellClassName}
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
      >
        <div className={postJobFormSectionsClassName}>
          <h2
            id="company-details-heading"
            className={postJobCardHeadingClassName}
          >
            Company Details
          </h2>

          <div className={postJobFormGridGapClassName}>
            <FormField
              id="company-details"
              label="Recruiting For *"
              error={fieldErrors.companyDetails}
            >
              <input
                id="company-details"
                type="text"
                value={formData.companyDetails}
                onChange={(event) =>
                  onFieldChange("companyDetails", event.target.value)
                }
                placeholder="Enter Company Name"
                className={inputClassNameWithError(fieldErrors.companyDetails)}
                autoComplete="organization"
              />
            </FormField>

            <div className="flex min-w-0 flex-col gap-2">
              <EmployerRegisterSearchableSelect
                id="job-company-size"
                label="Company Size"
                required
                allowCustom
                value={formData.companySize}
                placeholder="Select Company Size"
                options={EMPLOYER_REGISTER_COMPANY_STRENGTH_OPTIONS}
                onChange={(value) => onFieldChange("companySize", value)}
              />
              {fieldErrors.companySize ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.companySize}
                </p>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <EmployerRegisterSearchableSelect
                id="job-industry"
                label="Industry"
                required
                value={formData.industry}
                placeholder="Select Industry"
                options={EMPLOYER_REGISTER_INDUSTRY_OPTIONS}
                onChange={handleIndustryChange}
              />
              {fieldErrors.industry ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.industry}
                </p>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <EmployerRegisterSearchableSelect
                id="job-business-category"
                label="Business Category"
                required
                disabled={!formData.industry}
                value={formData.businessCategory}
                placeholder="Select Business Category"
                options={businessCategoryOptions}
                onChange={(value) => onFieldChange("businessCategory", value)}
              />
              {fieldErrors.businessCategory ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.businessCategory}
                </p>
              ) : null}
            </div>
          </div>

          <h2
            id="job-information-heading"
            className={postJobCardHeadingClassName}
          >
            Job Information
          </h2>

          {jobInformationFields}
        </div>
      </form>
    </section>
  );
}
