"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  POST_JOB_ADDITIONAL_REQUIREMENT_TOGGLES,
  POST_JOB_EDUCATION_OPTIONS,
  POST_JOB_EXPERIENCE_OPTIONS,
  POST_JOB_GENDER_OPTIONS,
  POST_JOB_LANGUAGE_OPTIONS,
  POST_JOB_LONG_TEXT_MAX_LENGTH,
  POST_JOB_WALK_IN_TIME_OPTIONS,
} from "@/constants/post-job";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import type {
  AdditionalRequirementsState,
  CandidateInterviewFormData,
  PostJobEducationId,
  PostJobExperienceId,
  PostJobGenderId,
  PostJobLanguageId,
  WalkInOption,
} from "@/types/post-job";
import { cn } from "@/utils/cn";
import {
  formatJobSearchEducation,
  formatJobSearchExperience,
  formatJobSearchGender,
} from "@/utils/job-search-format";
import type { RefObject } from "react";
import { PostJobChipButton } from "./PostJobChipButton";
import { PostJobFormField } from "./PostJobFormField";
import { PostJobDatePicker } from "./PostJobDatePicker";
import {
  postJobBackButtonClassName,
  postJobCardClassName,
  postJobCardHeadingClassName,
  postJobContactGridClassName,
  postJobFieldLabelClassName,
  postJobFormInlineActionsClassName,
  postJobFormRowGapClassName,
  postJobFormSectionsClassName,
  postJobFormShellClassName,
  postJobFormSubsectionClassName,
  postJobInputClassName,
  postJobPerkWrapClassName,
  postJobPostJobButtonClassName,
  postJobRequirementToggleClassName,
  postJobSalaryRangeGridClassName,
  postJobSectionHeadingClassName,
  postJobTextareaClassName,
  postJobWalkInSegmentClassName,
} from "./post-job-form-styles";

type CandidateInterviewFormProps = {
  formData: CandidateInterviewFormData;
  fieldErrors?: Record<string, string>;
  submitError?: string;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  onFieldChange: <K extends keyof CandidateInterviewFormData>(
    field: K,
    value: CandidateInterviewFormData[K],
  ) => void;
  onBack: () => void;
  onPostJob: () => void;
  scrollContainerRef?: RefObject<HTMLFormElement | null>;
};

const ADDITIONAL_REQUIREMENT_KEYS: Record<
  keyof AdditionalRequirementsState,
  MessageKey
> = {
  language: "employer.postJob.requirements.language",
  gender: "jobs.gender",
  age: "employer.postJob.requirements.age",
};

function sanitizeNumericInput(value: string) {
  return value.replace(/\D/g, "");
}

export function CandidateInterviewForm({
  formData,
  fieldErrors = {},
  submitError,
  isSubmitting = false,
  isEditMode = false,
  onFieldChange,
  onBack,
  onPostJob,
  scrollContainerRef,
}: CandidateInterviewFormProps) {
  const t = useTranslate();

  const toggleEducation = (educationId: PostJobEducationId) => {
    const isSelected = formData.education.includes(educationId);
    onFieldChange(
      "education",
      isSelected
        ? formData.education.filter((item) => item !== educationId)
        : [...formData.education, educationId],
    );
  };

  const selectExperience = (experienceId: PostJobExperienceId) => {
    onFieldChange(
      "experienceRequired",
      formData.experienceRequired === experienceId ? "" : experienceId,
    );
  };

  const toggleAdditionalRequirement = (
    key: keyof AdditionalRequirementsState,
  ) => {
    onFieldChange("additionalRequirements", {
      ...formData.additionalRequirements,
      [key]: !formData.additionalRequirements[key],
    });
  };

  const toggleLanguage = (languageId: PostJobLanguageId) => {
    const isSelected = formData.languages.includes(languageId);
    onFieldChange(
      "languages",
      isSelected
        ? formData.languages.filter((item) => item !== languageId)
        : [...formData.languages, languageId],
    );
  };

  const toggleGender = (genderId: PostJobGenderId) => {
    const isSelected = formData.gender.includes(genderId);
    onFieldChange(
      "gender",
      isSelected
        ? formData.gender.filter((item) => item !== genderId)
        : [...formData.gender, genderId],
    );
  };

  const handleAgeChange = (field: "ageMin" | "ageMax", value: string) => {
    const sanitized = sanitizeNumericInput(value);
    onFieldChange(field, sanitized);
  };

  const handleWalkInChange = (walkIn: WalkInOption) => {
    onFieldChange("walkIn", walkIn);
  };

  const handleWalkInStartDateChange = (value: string) => {
    onFieldChange("walkInStartDate", value);

    if (
      formData.walkInEndDate &&
      value &&
      formData.walkInEndDate < value
    ) {
      onFieldChange("walkInEndDate", "");
    }
  };

  const showWalkInFields = formData.walkIn === "yes";

  return (
    <section
      aria-labelledby="candidate-interview-heading"
      className={postJobCardClassName}
    >
      <h2
        id="candidate-interview-heading"
        className={postJobCardHeadingClassName}
      >
        {t("employer.postJob.steps.candidateInterview.title")}
      </h2>

      <form
        ref={scrollContainerRef}
        className={postJobFormShellClassName}
        onSubmit={(event) => {
          event.preventDefault();
          onPostJob();
        }}
        noValidate
      >
        <div className={postJobFormSectionsClassName}>
          <fieldset id="education-group" className={postJobFormSubsectionClassName}>
            <legend className={postJobFieldLabelClassName}>
              {t("employer.postJob.educationQualification")}
            </legend>
            <div className={postJobPerkWrapClassName}>
              {POST_JOB_EDUCATION_OPTIONS.map((option) => (
                <PostJobChipButton
                  key={option.value}
                  label={formatJobSearchEducation(option.value)}
                  isSelected={formData.education.includes(option.value)}
                  onClick={() => toggleEducation(option.value)}
                />
              ))}
            </div>
            {fieldErrors.education ? (
              <p className="text-xs font-medium text-red-600" role="alert">
                {fieldErrors.education}
              </p>
            ) : null}
          </fieldset>

          <fieldset id="experience-group" className={postJobFormSubsectionClassName}>
            <legend className={postJobFieldLabelClassName}>
              {t("employer.postJob.experienceRequired")}
            </legend>
            <div className={postJobPerkWrapClassName}>
              {POST_JOB_EXPERIENCE_OPTIONS.map((option) => (
                <PostJobChipButton
                  key={option.value}
                  label={formatJobSearchExperience(option.value)}
                  isSelected={formData.experienceRequired === option.value}
                  onClick={() => selectExperience(option.value)}
                />
              ))}
            </div>
            {fieldErrors.experienceRequired ? (
              <p className="text-xs font-medium text-red-600" role="alert">
                {fieldErrors.experienceRequired}
              </p>
            ) : null}
          </fieldset>

          <fieldset className={postJobFormSubsectionClassName}>
            <legend className={postJobFieldLabelClassName}>
              {t("employer.postJob.additionalRequirements")}
            </legend>
            <div className="flex flex-wrap gap-2.5 sm:gap-3 lg-short:gap-2 lg-compact:gap-2 lg-tight:gap-1.5">
              {POST_JOB_ADDITIONAL_REQUIREMENT_TOGGLES.map((toggle) => {
                const isActive =
                  formData.additionalRequirements[toggle.key];

                return (
                  <button
                    key={toggle.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => toggleAdditionalRequirement(toggle.key)}
                    className={cn(
                      postJobRequirementToggleClassName,
                      isActive
                        ? "border-primary-soft bg-primary-light text-primary"
                        : "border-border bg-surface text-foreground hover:border-primary/20",
                    )}
                  >
                    {t(ADDITIONAL_REQUIREMENT_KEYS[toggle.key])}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {formData.additionalRequirements.language ? (
            <fieldset id="language-group" className={postJobFormSubsectionClassName}>
              <legend className={postJobFieldLabelClassName}>
                {t("employer.postJob.languageRequired")}
              </legend>
              <div className={postJobPerkWrapClassName}>
                {POST_JOB_LANGUAGE_OPTIONS.map((option) => (
                  <PostJobChipButton
                    key={option.value}
                    label={option.label}
                    isSelected={formData.languages.includes(option.value)}
                    onClick={() => toggleLanguage(option.value)}
                  />
                ))}
              </div>
              {fieldErrors.languages ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.languages}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          {formData.additionalRequirements.gender ? (
            <fieldset id="gender-group" className={postJobFormSubsectionClassName}>
              <legend className={postJobFieldLabelClassName}>{t("jobs.gender")}</legend>
              <div className={postJobPerkWrapClassName}>
                {POST_JOB_GENDER_OPTIONS.map((option) => (
                  <PostJobChipButton
                    key={option.value}
                    label={formatJobSearchGender(option.value)}
                    isSelected={formData.gender.includes(option.value)}
                    onClick={() => toggleGender(option.value)}
                  />
                ))}
              </div>
              {fieldErrors.gender ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.gender}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          {formData.additionalRequirements.age ? (
            <fieldset className={postJobFormSubsectionClassName}>
              <legend className={postJobFieldLabelClassName}>
                {t("employer.postJob.ageRange")}
              </legend>
              <div className={postJobSalaryRangeGridClassName}>
                <input
                  id="age-min"
                  type="text"
                  inputMode="numeric"
                  value={formData.ageMin}
                  onChange={(event) =>
                    handleAgeChange("ageMin", event.target.value)
                  }
                  placeholder={t("employer.postJob.minimumAge")}
                  aria-label={t("employer.postJob.minimumAge")}
                  min={0}
                  className={cn(
                    postJobInputClassName,
                    fieldErrors.ageMin &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  )}
                  aria-invalid={Boolean(fieldErrors.ageMin)}
                />
                <input
                  id="age-max"
                  type="text"
                  inputMode="numeric"
                  value={formData.ageMax}
                  onChange={(event) =>
                    handleAgeChange("ageMax", event.target.value)
                  }
                  placeholder={t("employer.postJob.maximumAge")}
                  aria-label={t("employer.postJob.maximumAge")}
                  min={0}
                  className={cn(
                    postJobInputClassName,
                    fieldErrors.ageMax &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  )}
                  aria-invalid={Boolean(fieldErrors.ageMax)}
                />
              </div>
              {fieldErrors.ageMin ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.ageMin}
                </p>
              ) : null}
              {fieldErrors.ageMax ? (
                <p className="text-xs font-medium text-red-600" role="alert">
                  {fieldErrors.ageMax}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          <div className={postJobFormSubsectionClassName}>
            <h3 className={postJobSectionHeadingClassName}>
              {t("employer.postJob.interview")}
            </h3>

            <div className="space-y-3 lg-short:space-y-2.5 lg-compact:space-y-2 lg-tight:space-y-1.5">
              <div>
                <span className={postJobFieldLabelClassName}>
                  {t("employer.postJob.isWalkIn")}
                </span>
                <div
                  className="mt-2 flex flex-wrap gap-2.5 sm:gap-3"
                  role="group"
                  aria-label={t("employer.postJob.walkInInterview")}
                >
                  {(["yes", "no"] as const).map((option) => {
                    const isSelected = formData.walkIn === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleWalkInChange(option)}
                        className={cn(
                          postJobWalkInSegmentClassName,
                          isSelected
                            ? "border-primary-soft bg-primary-soft text-surface"
                            : "border-border bg-surface text-foreground hover:border-primary/20",
                        )}
                      >
                        {option === "yes" ? t("common.yes") : t("common.no")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showWalkInFields ? (
                <>
                  <PostJobFormField
                    id="walk-in-address"
                    label={t("employer.postJob.walkInAddress")}
                    error={fieldErrors.walkInAddress}
                  >
                    <textarea
                      id="walk-in-address"
                      value={formData.walkInAddress}
                      onChange={(event) =>
                        onFieldChange("walkInAddress", event.target.value)
                      }
                      placeholder={t("employer.postJob.walkInAddressPlaceholder")}
                      className={postJobTextareaClassName}
                    />
                  </PostJobFormField>

                  <div className={postJobFormRowGapClassName}>
                    <div className={postJobFormSubsectionClassName}>
                      <span className={postJobFieldLabelClassName}>
                        {t("employer.postJob.walkInDates")}
                      </span>
                      <div
                        className={cn(
                          postJobSalaryRangeGridClassName,
                          "mt-2",
                        )}
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          <PostJobDatePicker
                            id="walk-in-start-date"
                            value={formData.walkInStartDate}
                            placeholder={t("employer.postJob.startDate")}
                            aria-label={t("employer.postJob.walkInStartDate")}
                            onChange={handleWalkInStartDateChange}
                          />
                          {fieldErrors.walkInStartDate ? (
                            <p
                              className="text-xs font-medium text-red-600"
                              role="alert"
                            >
                              {fieldErrors.walkInStartDate}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                          <PostJobDatePicker
                            id="walk-in-end-date"
                            value={formData.walkInEndDate}
                            placeholder={t("employer.postJob.endDate")}
                            minDate={formData.walkInStartDate || undefined}
                            aria-label={t("employer.postJob.walkInEndDate")}
                            onChange={(value) =>
                              onFieldChange("walkInEndDate", value)
                            }
                          />
                          {fieldErrors.walkInEndDate ? (
                            <p
                              className="text-xs font-medium text-red-600"
                              role="alert"
                            >
                              {fieldErrors.walkInEndDate}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className={postJobFormSubsectionClassName}>
                      <span className={postJobFieldLabelClassName}>
                        {t("employer.postJob.walkInTime")}
                      </span>
                      <div
                        className={cn(
                          postJobSalaryRangeGridClassName,
                          "mt-2",
                        )}
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          <EmployerRegisterSearchableSelect
                            id="walk-in-start-time"
                            label={t("employer.postJob.walkInStartTime")}
                            hideLabel
                            hideSearch
                            value={formData.walkInStartTime}
                            placeholder={t("employer.postJob.partTime.startTime")}
                            options={POST_JOB_WALK_IN_TIME_OPTIONS}
                            onChange={(value) =>
                              onFieldChange("walkInStartTime", value)
                            }
                            error={fieldErrors.walkInStartTime}
                            aria-invalid={Boolean(fieldErrors.walkInStartTime)}
                          />
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                          <EmployerRegisterSearchableSelect
                            id="walk-in-end-time"
                            label={t("employer.postJob.walkInEndTime")}
                            hideLabel
                            hideSearch
                            value={formData.walkInEndTime}
                            placeholder={t("employer.postJob.partTime.endTime")}
                            options={POST_JOB_WALK_IN_TIME_OPTIONS}
                            onChange={(value) =>
                              onFieldChange("walkInEndTime", value)
                            }
                            error={fieldErrors.walkInEndTime}
                            aria-invalid={Boolean(fieldErrors.walkInEndTime)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <PostJobFormField
                id="other-instructions"
                label={t("jobs.otherInstructions")}
                error={fieldErrors.otherInstructions}
              >
                <textarea
                  id="other-instructions"
                  value={formData.otherInstructions}
                  onChange={(event) =>
                    onFieldChange(
                      "otherInstructions",
                      event.target.value.slice(0, POST_JOB_LONG_TEXT_MAX_LENGTH),
                    )
                  }
                  maxLength={POST_JOB_LONG_TEXT_MAX_LENGTH}
                  placeholder={t("employer.postJob.otherInstructionsPlaceholder")}
                  className={cn(
                    postJobTextareaClassName,
                    fieldErrors.otherInstructions &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  )}
                  aria-invalid={Boolean(fieldErrors.otherInstructions)}
                  aria-describedby="other-instructions-count"
                />
                <p
                  id="other-instructions-count"
                  className="text-right text-xs text-muted"
                >
                  {formData.otherInstructions.length}/
                  {POST_JOB_LONG_TEXT_MAX_LENGTH}
                </p>
              </PostJobFormField>
            </div>
          </div>

          <fieldset className={postJobFormSubsectionClassName}>
            <legend className={postJobFieldLabelClassName}>
              {t("employer.postJob.contactDetails")}
            </legend>
            <div className={postJobContactGridClassName}>
              <div className="flex min-w-0 flex-col gap-2">
                <input
                  id="contact-name"
                  type="text"
                  value={formData.contactName}
                  onChange={(event) =>
                    onFieldChange("contactName", event.target.value)
                  }
                  placeholder={t("employer.postJob.contactName")}
                  aria-label={t("employer.postJob.contactNameAria")}
                  className={cn(
                    postJobInputClassName,
                    fieldErrors.contactName &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  )}
                  aria-invalid={Boolean(fieldErrors.contactName)}
                />
                {fieldErrors.contactName ? (
                  <p className="text-xs font-medium text-red-600" role="alert">
                    {fieldErrors.contactName}
                  </p>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <input
                  id="contact-email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(event) =>
                    onFieldChange("contactEmail", event.target.value)
                  }
                  placeholder={t("employer.postJob.contactEmail")}
                  aria-label={t("employer.postJob.contactEmailAria")}
                  className={cn(
                    postJobInputClassName,
                    fieldErrors.contactEmail &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  )}
                  aria-invalid={Boolean(fieldErrors.contactEmail)}
                />
                {fieldErrors.contactEmail ? (
                  <p className="text-xs font-medium text-red-600" role="alert">
                    {fieldErrors.contactEmail}
                  </p>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <input
                  id="contact-mobile"
                  type="tel"
                  inputMode="numeric"
                  value={formData.contactMobile}
                  onChange={(event) =>
                    onFieldChange(
                      "contactMobile",
                      sanitizeNumericInput(event.target.value),
                    )
                  }
                  placeholder={t("employer.postJob.contactMobile")}
                  aria-label={t("employer.postJob.contactMobileAria")}
                  className={cn(
                    postJobInputClassName,
                    fieldErrors.contactMobile &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  )}
                  aria-invalid={Boolean(fieldErrors.contactMobile)}
                />
                {fieldErrors.contactMobile ? (
                  <p className="text-xs font-medium text-red-600" role="alert">
                    {fieldErrors.contactMobile}
                  </p>
                ) : null}
              </div>
            </div>
          </fieldset>

          {submitError ? (
            <div className="space-y-1.5" role="alert">
              <p className="break-words text-xs font-medium text-red-600">
                {submitError}
              </p>
            </div>
          ) : null}

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
              disabled={isSubmitting}
              className={cn(
                postJobPostJobButtonClassName,
                "w-full sm:w-auto sm:min-w-[156px]",
              )}
            >
              {isSubmitting
                ? isEditMode
                  ? t("employer.postJob.updatingShort")
                  : t("employer.postJob.postingShort")
                : isEditMode
                  ? t("employer.postJob.updateJob")
                  : t("employer.shell.postJob")}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
