"use client";

import {
  POST_JOB_CITY_OPTIONS,
  POST_JOB_PERK_OPTIONS,
  POST_JOB_SALARY_TYPE_OPTIONS,
  POST_JOB_STATE_OPTIONS,
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
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <PostJobFormField id={id} label={label}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            postJobInputClassName,
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
    </PostJobFormField>
  );
}

export function LocationSalaryForm({
  formData,
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
            <SelectField
              id="job-state"
              label="State"
              value={formData.state}
              placeholder="Select state"
              options={POST_JOB_STATE_OPTIONS}
              onChange={(value) => onFieldChange("state", value)}
            />
            <SelectField
              id="job-city"
              label="City"
              value={formData.city}
              placeholder="Select city"
              options={POST_JOB_CITY_OPTIONS}
              onChange={(value) => onFieldChange("city", value)}
            />
          </div>

          <PostJobFormField id="job-address" label="Job Address">
            <textarea
              id="job-address"
              value={formData.address}
              onChange={(event) => onFieldChange("address", event.target.value)}
              placeholder="Enter complete job address"
              className={postJobTextareaClassName}
            />
          </PostJobFormField>

          <PostJobFormField id="job-landmark" label="Landmark (Optional)">
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
              />

              {formData.salaryType === "fixed" ? (
                <PostJobFormField id="salary-incentives" label="Incentives">
                  <input
                    id="salary-incentives"
                    type="text"
                    inputMode="numeric"
                    value={formData.incentives}
                    onChange={(event) =>
                      onFieldChange("incentives", event.target.value)
                    }
                    placeholder="₹ 500"
                    className={postJobInputClassName}
                  />
                </PostJobFormField>      
              ) : null}

              {formData.salaryType === "range" ? (
                <>
                  <PostJobFormField id="salary-min" label="Minimum Salary">
                    <input
                      id="salary-min"
                      type="text"
                      inputMode="numeric"
                      value={formData.salaryMin}
                      onChange={(event) =>
                        onFieldChange("salaryMin", event.target.value)
                      }
                      placeholder="Enter minimum salary"
                      className={postJobInputClassName}
                    />
                  </PostJobFormField>
                  <PostJobFormField id="salary-max" label="Maximum Salary">
                    <input
                      id="salary-max"
                      type="text"
                      inputMode="numeric"
                      value={formData.salaryMax}
                      onChange={(event) =>
                        onFieldChange("salaryMax", event.target.value)
                      }
                      placeholder="Enter maximum salary"
                      className={postJobInputClassName}
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
