"use client";

import {
  POST_JOB_ADDITIONAL_REQUIREMENT_TOGGLES,
  POST_JOB_EDUCATION_OPTIONS,
  POST_JOB_EXPERIENCE_OPTIONS,
  POST_JOB_GENDER_OPTIONS,
  POST_JOB_LANGUAGE_OPTIONS,
  POST_JOB_LONG_TEXT_MAX_LENGTH,
  POST_JOB_WALK_IN_TIME_OPTIONS,
} from "@/constants/post-job";
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
import { ChevronDown } from "lucide-react";
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

function SelectInput({
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
  );
}

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
        Candidate & Interview
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
            <legend className={postJobFieldLabelClassName}>Education Qualification</legend>
            <div className={postJobPerkWrapClassName}>
              {POST_JOB_EDUCATION_OPTIONS.map((option) => (
                <PostJobChipButton
                  key={option.value}
                  label={option.label}
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
              Experience Required
            </legend>
            <div className={postJobPerkWrapClassName}>
              {POST_JOB_EXPERIENCE_OPTIONS.map((option) => (
                <PostJobChipButton
                  key={option.value}
                  label={option.label}
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
              Additional Requirements
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
                    {toggle.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {formData.additionalRequirements.language ? (
            <fieldset id="language-group" className={postJobFormSubsectionClassName}>
              <legend className={postJobFieldLabelClassName}>Language Required</legend>
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
              <legend className={postJobFieldLabelClassName}>Gender</legend>
              <div className={postJobPerkWrapClassName}>
                {POST_JOB_GENDER_OPTIONS.map((option) => (
                  <PostJobChipButton
                    key={option.value}
                    label={option.label}
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
              <legend className={postJobFieldLabelClassName}>Age Range</legend>
              <div className={postJobSalaryRangeGridClassName}>
                <input
                  id="age-min"
                  type="text"
                  inputMode="numeric"
                  value={formData.ageMin}
                  onChange={(event) =>
                    handleAgeChange("ageMin", event.target.value)
                  }
                  placeholder="Minimum Age"
                  aria-label="Minimum age"
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
                  placeholder="Maximum Age"
                  aria-label="Maximum age"
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
            <h3 className={postJobSectionHeadingClassName}>Interview</h3>

            <div className="space-y-3 lg-short:space-y-2.5 lg-compact:space-y-2 lg-tight:space-y-1.5">
              <div>
                <span className={postJobFieldLabelClassName}>
                  Is this a walk-in interview?
                </span>
                <div
                  className="mt-2 flex flex-wrap gap-2.5 sm:gap-3"
                  role="group"
                  aria-label="Walk-in interview"
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
                        {option === "yes" ? "Yes" : "No"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {showWalkInFields ? (
                <>
                  <PostJobFormField
                    id="walk-in-address"
                    label="Walk-in Interview Address"
                    error={fieldErrors.walkInAddress}
                  >
                    <textarea
                      id="walk-in-address"
                      value={formData.walkInAddress}
                      onChange={(event) =>
                        onFieldChange("walkInAddress", event.target.value)
                      }
                      placeholder="Enter Complete interview Address"
                      className={postJobTextareaClassName}
                    />
                  </PostJobFormField>

                  <div className={postJobFormRowGapClassName}>
                    <div className={postJobFormSubsectionClassName}>
                      <span className={postJobFieldLabelClassName}>
                        Walk-in Dates*
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
                            placeholder="Start date"
                            aria-label="Walk-in start date"
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
                            placeholder="End date"
                            minDate={formData.walkInStartDate || undefined}
                            aria-label="Walk-in end date"
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
                        Walk-in Time
                      </span>
                      <div
                        className={cn(
                          postJobSalaryRangeGridClassName,
                          "mt-2",
                        )}
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          <SelectInput
                            id="walk-in-start-time"
                            value={formData.walkInStartTime}
                            placeholder="Start time"
                            aria-label="Walk-in start time"
                            options={POST_JOB_WALK_IN_TIME_OPTIONS}
                            onChange={(value) =>
                              onFieldChange("walkInStartTime", value)
                            }
                          />
                          {fieldErrors.walkInStartTime ? (
                            <p
                              className="text-xs font-medium text-red-600"
                              role="alert"
                            >
                              {fieldErrors.walkInStartTime}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                          <SelectInput
                            id="walk-in-end-time"
                            value={formData.walkInEndTime}
                            placeholder="End time"
                            aria-label="Walk-in end time"
                            options={POST_JOB_WALK_IN_TIME_OPTIONS}
                            onChange={(value) =>
                              onFieldChange("walkInEndTime", value)
                            }
                          />
                          {fieldErrors.walkInEndTime ? (
                            <p
                              className="text-xs font-medium text-red-600"
                              role="alert"
                            >
                              {fieldErrors.walkInEndTime}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <PostJobFormField
                id="other-instructions"
                label="Other Instructions"
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
                  placeholder="Mention required documents, or any other interview instruction"
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
              Contact Details
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
                  placeholder="Name"
                  aria-label="Contact name"
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
                  placeholder="Email"
                  aria-label="Contact email"
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
                  placeholder="Mobile Number"
                  aria-label="Contact mobile number"
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
            <p className="text-xs font-medium text-red-600" role="alert">
              {submitError}
            </p>
          ) : null}

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
              disabled={isSubmitting}
              className={cn(
                postJobPostJobButtonClassName,
                "w-full sm:w-auto sm:min-w-[156px]",
              )}
            >
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Posting..."
                : isEditMode
                  ? "Update Job"
                  : "Post Job"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
