"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  POST_JOB_PERK_OPTIONS,
  POST_JOB_SALARY_PERIOD_OPTIONS,
  POST_JOB_SALARY_TYPE_OPTIONS,
} from "@/constants/post-job";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import type {
  LocationAndSalaryFormData,
  PostJobPerkId,
  SalaryPeriod,
  SalaryType,
} from "@/types/post-job";
import { cn } from "@/utils/cn";
import { formatJobSearchPerk } from "@/utils/job-search-format";
import type { RefObject } from "react";
import { PostJobFormField } from "./PostJobFormField";
import { PostJobChipButton } from "./PostJobChipButton";
import { PostJobPlaceAutocomplete } from "./PostJobPlaceAutocomplete";
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

const SALARY_TYPE_KEYS: Record<SalaryType, MessageKey> = {
  fixed: "employer.postJob.salary.fixed",
  range: "employer.postJob.salary.range",
};

const SALARY_PERIOD_KEYS: Record<SalaryPeriod, MessageKey> = {
  "per-month": "employer.postJob.salary.perMonth",
  "per-year": "employer.postJob.salary.perYear",
};

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

export function LocationSalaryForm({
  formData,
  fieldErrors = {},
  onFieldChange,
  onBack,
  onContinue,
  scrollContainerRef,
}: LocationSalaryFormProps) {
  const t = useTranslate();
  const salaryTypeOptions = POST_JOB_SALARY_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(SALARY_TYPE_KEYS[option.value]),
  }));
  const salaryPeriodOptions = POST_JOB_SALARY_PERIOD_OPTIONS.map((option) => ({
    value: option.value,
    label: t(SALARY_PERIOD_KEYS[option.value]),
  }));

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
        {t("employer.postJob.steps.locationSalary.title")}
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
              label={t("employer.postJob.state")}
              error={fieldErrors.state}
            >
              <PostJobPlaceAutocomplete
                id="job-state"
                mode="state"
                value={formData.state}
                placeholder={t("employer.postJob.searchState")}
                hasError={Boolean(fieldErrors.state)}
                onChange={(value) => {
                  onFieldChange("state", value);
                  onFieldChange("city", "");
                }}
                onSelect={(suggestion) => {
                  onFieldChange("state", suggestion.state);
                  onFieldChange("city", "");
                }}
              />
            </PostJobFormField>
            <PostJobFormField
              id="job-city"
              label={t("employer.postJob.city")}
              error={fieldErrors.city}
            >
              <PostJobPlaceAutocomplete
                id="job-city"
                mode="city"
                value={formData.city}
                selectedState={formData.state}
                disabled={!formData.state.trim()}
                placeholder={
                  formData.state.trim()
                    ? t("employer.postJob.searchCity")
                    : t("jobs.selectStateFirst")
                }
                hasError={Boolean(fieldErrors.city)}
                onChange={(value) => onFieldChange("city", value)}
                onSelect={(suggestion) => {
                  onFieldChange("city", suggestion.city);
                }}
              />
            </PostJobFormField>
          </div>

          <PostJobFormField
            id="job-address"
            label={t("employer.postJob.jobAddress")}
            error={fieldErrors.address}
          >
            <textarea
              id="job-address"
              value={formData.address}
              onChange={(event) => onFieldChange("address", event.target.value)}
              placeholder={t("employer.postJob.jobAddressPlaceholder")}
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
            label={t("employer.postJob.landmarkOptional")}
            error={fieldErrors.landmark}
          >
            <input
              id="job-landmark"
              type="text"
              value={formData.landmark}
              onChange={(event) => onFieldChange("landmark", event.target.value)}
              placeholder={t("employer.postJob.landmarkPlaceholder")}
              className={postJobInputClassName}
            />
          </PostJobFormField>

          <div className={postJobFormSubsectionClassName}>
            <h3 className={postJobSectionHeadingClassName}>{t("jobs.salary")}</h3>

            <div
              className={cn(
                "grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6 lg-short:gap-4 lg-compact:gap-3 lg-tight:gap-2.5",
                formData.salaryType === "range" &&
                  "sm:grid-cols-[minmax(10.5rem,13rem)_minmax(10.5rem,13rem)_minmax(0,1fr)_minmax(0,1fr)]",
                formData.salaryType === "fixed" &&
                  "sm:grid-cols-[minmax(10.5rem,13rem)_minmax(10.5rem,13rem)_minmax(10.5rem,13rem)]",
                !formData.salaryType &&
                  "sm:grid-cols-2 sm:max-w-[28rem]",
              )}
            >
              <EmployerRegisterSearchableSelect
                id="salary-type"
                label={t("jobs.salaryRange")}
                value={formData.salaryType}
                placeholder={t("employer.postJob.salary.typePlaceholder")}
                options={salaryTypeOptions}
                hideSearch
                onChange={(value) =>
                  onFieldChange("salaryType", value as SalaryType)
                }
                error={fieldErrors.salaryType}
                aria-invalid={Boolean(fieldErrors.salaryType)}
              />

              <EmployerRegisterSearchableSelect
                id="salary-period"
                label={t("employer.postJob.salary.period")}
                value={formData.salaryPeriod}
                placeholder={t("employer.postJob.salary.periodPlaceholder")}
                options={salaryPeriodOptions}
                hideSearch
                onChange={(value) =>
                  onFieldChange("salaryPeriod", value as SalaryPeriod)
                }
                error={fieldErrors.salaryPeriod}
                aria-invalid={Boolean(fieldErrors.salaryPeriod)}
              />

              {formData.salaryType === "fixed" ? (
                <PostJobFormField
                  id="salary-incentives"
                  label={t("employer.postJob.salary.fixedSalary")}
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
                    label={t("employer.postJob.salary.minimum")}
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
                      placeholder={t("employer.postJob.salary.minimumPlaceholder")}
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
                    label={t("employer.postJob.salary.maximum")}
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
                      placeholder={t("employer.postJob.salary.maximumPlaceholder")}
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
            <legend className={postJobFieldLabelClassName}>
              {t("employer.postJob.additionalPerks")}
            </legend>
            <div className={postJobPerkWrapClassName}>
              {POST_JOB_PERK_OPTIONS.map((perk) => {
                const isSelected = formData.perks.includes(perk.value);

                return (
                  <PostJobChipButton
                    key={perk.value}
                    label={formatJobSearchPerk(perk.value)}
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
              {t("common.back")}
            </button>
            <button
              type="submit"
              className={cn(
                postJobContinueButtonClassName,
                "w-full sm:w-auto sm:min-w-[156px]",
              )}
            >
              {t("common.continue")}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
