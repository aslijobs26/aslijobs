"use client";

import {
  POST_JOB_PERK_OPTIONS,
  POST_JOB_SALARY_TYPE_OPTIONS,
} from "@/constants/post-job";
import type {
  LocationAndSalaryFormData,
  PostJobPerkId,
  SalaryType,
} from "@/types/post-job";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";
import type { RefObject } from "react";
import { PostJobFormField } from "./PostJobFormField";
import { PostJobChipButton } from "./PostJobChipButton";
import {
  postJobBackButtonClassName,
  postJobCardClassName,
  postJobCardHeadingClassName,
  postJobContinueButtonClassName,
  postJobFieldLabelClassName,
  postJobFormInlineActionsClassName,
  postJobFormGridGapClassName,
  postJobFormSectionsClassName,
  postJobFormShellClassName,
  postJobFormSubsectionClassName,
  postJobInputClassName,
  postJobPerkWrapClassName,
  postJobSectionHeadingClassName,
  postJobTextareaClassName,
} from "./post-job-form-styles";

type LocationSalaryFormProps = {
  formData: LocationAndSalaryFormData;
  fieldErrors?: Record<string, string>;
  onFieldChange: <K extends keyof LocationAndSalaryFormData>(
    field: K,
    value: LocationAndSalaryFormData[K],
  ) => void;
  onBack: () => void;
  onContinue: () => void;
  scrollContainerRef?: RefObject<HTMLFormElement | null>;
};

function SelectField({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <PostJobFormField id={id} label={label} error={error}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            postJobInputClassName,
            "cursor-pointer appearance-none pr-10",
            !value && "text-muted",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          )}
          aria-invalid={Boolean(error)}
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
    </PostJobFormField>
  );
}

export function LocationSalaryForm({
  formData,
  fieldErrors = {},
  onFieldChange,
  onBack,
  onContinue,
  scrollContainerRef,
}: LocationSalaryFormProps) {
  const togglePerk = (perkId: PostJobPerkId) => {
    const isSelected = formData.perks.includes(perkId);
    onFieldChange(
      "perks",
      isSelected
        ? formData.perks.filter((perk) => perk !== perkId)
        : [...formData.perks, perkId],
    );
  };

  return (
    <section
      aria-labelledby="location-salary-heading"
      className={postJobCardClassName}
    >
      <h2
        id="location-salary-heading"
        className={postJobCardHeadingClassName}
      >
        Location & Salary
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
            <PostJobFormField
              id="job-state"
              label="State"
              error={fieldErrors.state}
            >
              <input
                id="job-state"
                type="text"
                value={formData.state}
                onChange={(event) => onFieldChange("state", event.target.value)}
                placeholder="Enter state"
                autoComplete="address-level1"
                className={cn(
                  postJobInputClassName,
                  fieldErrors.state &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                )}
                aria-invalid={Boolean(fieldErrors.state)}
              />
            </PostJobFormField>
            <PostJobFormField
              id="job-city"
              label="City"
              error={fieldErrors.city}
            >
              <input
                id="job-city"
                type="text"
                value={formData.city}
                onChange={(event) => onFieldChange("city", event.target.value)}
                placeholder="Enter city"
                autoComplete="address-level2"
                className={cn(
                  postJobInputClassName,
                  fieldErrors.city &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                )}
                aria-invalid={Boolean(fieldErrors.city)}
              />
            </PostJobFormField>
          </div>

          <PostJobFormField
            id="job-address"
            label="Job Address"
            error={fieldErrors.address}
          >
            <textarea
              id="job-address"
              value={formData.address}
              onChange={(event) => onFieldChange("address", event.target.value)}
              placeholder="Enter complete job address"
              className={cn(
                postJobTextareaClassName,
                fieldErrors.address &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              )}
              aria-invalid={Boolean(fieldErrors.address)}
            />
          </PostJobFormField>

          <PostJobFormField
            id="job-landmark"
            label="Landmark (Optional)"
            error={fieldErrors.landmark}
          >
            <input
              id="job-landmark"
              type="text"
              value={formData.landmark}
              onChange={(event) => onFieldChange("landmark", event.target.value)}
              placeholder="Enter a nearby landmark"
              className={postJobInputClassName}
            />
          </PostJobFormField>

          <div className={postJobFormSubsectionClassName}>
            <h3 className={postJobSectionHeadingClassName}>Salary</h3>

            <div
              className={cn(
                "grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg-short:gap-4 lg-compact:gap-3 lg-tight:gap-2.5",
                formData.salaryType === "range" &&
                  "sm:grid-cols-[minmax(10.5rem,13rem)_minmax(0,1fr)_minmax(0,1fr)]",
                formData.salaryType === "fixed" &&
                  "sm:grid-cols-[minmax(10.5rem,13rem)_minmax(10.5rem,13rem)]",
                !formData.salaryType && "sm:max-w-[13rem]",
              )}
            >
              <SelectField
                id="salary-type"
                label="Salary Range"
                value={formData.salaryType}
                placeholder="Select salary type"
                options={POST_JOB_SALARY_TYPE_OPTIONS}
                onChange={(value) =>
                  onFieldChange("salaryType", value as SalaryType)
                }
                error={fieldErrors.salaryType}
              />

              {formData.salaryType === "fixed" ? (
                <PostJobFormField
                  id="salary-incentives"
                  label="Fixed Salary"
                  error={fieldErrors.incentives}
                >
                  <input
                    id="salary-incentives"
                    type="text"
                    inputMode="numeric"
                    value={formData.incentives}
                    onChange={(event) =>
                      onFieldChange("incentives", event.target.value)
                    }
                    placeholder="₹ 500"
                    className={cn(
                      postJobInputClassName,
                      fieldErrors.incentives &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                    )}
                    aria-invalid={Boolean(fieldErrors.incentives)}
                  />
                </PostJobFormField>      
              ) : null}

              {formData.salaryType === "range" ? (
                <>
                  <PostJobFormField
                    id="salary-min"
                    label="Minimum Salary"
                    error={fieldErrors.salaryMin}
                  >
                    <input
                      id="salary-min"
                      type="text"
                      inputMode="numeric"
                      value={formData.salaryMin}
                      onChange={(event) =>
                        onFieldChange("salaryMin", event.target.value)
                      }
                      placeholder="Enter minimum salary"
                      className={cn(
                        postJobInputClassName,
                        fieldErrors.salaryMin &&
                          "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                      )}
                      aria-invalid={Boolean(fieldErrors.salaryMin)}
                    />
                  </PostJobFormField>
                  <PostJobFormField
                    id="salary-max"
                    label="Maximum Salary"
                    error={fieldErrors.salaryMax}
                  >
                    <input
                      id="salary-max"
                      type="text"
                      inputMode="numeric"
                      value={formData.salaryMax}
                      onChange={(event) =>
                        onFieldChange("salaryMax", event.target.value)
                      }
                      placeholder="Enter maximum salary"
                      className={cn(
                        postJobInputClassName,
                        fieldErrors.salaryMax &&
                          "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                      )}
                      aria-invalid={Boolean(fieldErrors.salaryMax)}
                    />
                  </PostJobFormField>
                </>
              ) : null}
            </div>
          </div>

          <fieldset className={postJobFormSubsectionClassName}>
            <legend className={postJobFieldLabelClassName}>Additional Perks</legend>
            <div className={postJobPerkWrapClassName}>
              {POST_JOB_PERK_OPTIONS.map((perk) => {
                const isSelected = formData.perks.includes(perk.value);

                return (
                  <PostJobChipButton
                    key={perk.value}
                    label={perk.label}
                    isSelected={isSelected}
                    onClick={() => togglePerk(perk.value)}
                  />
                );
              })}
            </div>
          </fieldset>

          <div className={postJobFormInlineActionsClassName}>
            <button
              type="button"
              onClick={onBack}
              className={cn(postJobBackButtonClassName, "w-full sm:w-auto")}
            >
              Back
            </button>
            <button
              type="submit"
              className={cn(
                postJobContinueButtonClassName,
                "w-full sm:w-auto sm:min-w-[156px]",
              )}
            >
              Continue
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
