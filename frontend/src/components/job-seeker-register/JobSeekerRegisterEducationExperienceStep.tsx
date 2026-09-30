"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { useAuthMessageTranslator } from "@/components/employer-register/useAuthMessageTranslator";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import {
  JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS,
  JOB_SEEKER_EDUCATION_OPTIONS,
  JOB_SEEKER_LANGUAGE_OPTIONS,
} from "@/constants/job-seeker-register";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import type {
  JobSeekerAvailabilityStatus,
  JobSeekerEducation,
  JobSeekerEducationLevel,
  JobSeekerExperienceEntry,
  JobSeekerExperienceType,
  JobSeekerLanguage,
} from "@/types/job-seeker";
import type { AuthFieldErrors } from "@/utils/auth-field-errors";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react";
import {
  AVAILABILITY_LABEL_KEYS,
  EDUCATION_LEVEL_LABEL_KEYS,
  localizeOptions,
} from "./job-seeker-register-option-labels";

export const EMPTY_EDUCATION: JobSeekerEducation = {
  level: "no_formal_education",
  schoolName: "",
  collegeName: "",
  instituteName: "",
  board: "",
  stream: "",
  trade: "",
  branch: "",
  degree: "",
  specialization: "",
  passingYear: "",
  percentage: "",
  cgpa: "",
};

export function createEmptyExperience(): JobSeekerExperienceEntry {
  return {
    companyName: "",
    jobRole: "",
    industry: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    duration: "",
    salary: "",
    location: "",
    responsibilities: "",
    achievements: "",
  };
}

const EXPERIENCE_TYPE_OPTIONS: ReadonlyArray<{
  value: JobSeekerExperienceType;
  labelKey: MessageKey;
}> = [
  { value: "fresher", labelKey: "auth.jobSeekerRegister.fresher" },
  { value: "experienced", labelKey: "auth.jobSeekerRegister.experienced" },
];

type JobSeekerRegisterEducationExperienceStepProps = {
  education: JobSeekerEducation;
  experienceType: JobSeekerExperienceType | "";
  experiences: JobSeekerExperienceEntry[];
  languages: JobSeekerLanguage[];
  availabilityStatus: JobSeekerAvailabilityStatus | "";
  fieldErrors?: AuthFieldErrors;
  disabled?: boolean;
  onEducationChange: (education: JobSeekerEducation) => void;
  onExperienceTypeChange: (value: JobSeekerExperienceType) => void;
  onExperiencesChange: (experiences: JobSeekerExperienceEntry[]) => void;
  onLanguagesChange: (languages: JobSeekerLanguage[]) => void;
  onAvailabilityStatusChange: (value: JobSeekerAvailabilityStatus) => void;
  onClearFieldError?: (field: string) => void;
};

function Field({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
  placeholder,
  required = false,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
}) {
  const translateMessage = useAuthMessageTranslator();
  const errorId = `${id}-error`;

  return (
    <div className="employer-register-form-stack">
      <RequiredFieldLabel
        htmlFor={id}
        required={required}
        className="employer-register-form-label"
      >
        {label}
      </RequiredFieldLabel>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="employer-register-form-input"
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <FieldError id={errorId} message={translateMessage(error)} />
    </div>
  );
}

function renderEducationFields(
  education: JobSeekerEducation,
  disabled: boolean,
  fieldErrors: AuthFieldErrors,
  onChange: (patch: Partial<JobSeekerEducation>) => void,
  translateKey: (key: MessageKey) => string,
  onClearFieldError?: (field: string) => void,
) {
  const level = education.level;

  const clearAndPatch = (patch: Partial<JobSeekerEducation>) => {
    for (const key of Object.keys(patch)) {
      onClearFieldError?.(`education.${key}`);
    }
    onChange(patch);
  };

  if (level === "no_formal_education") {
    return null;
  }

  const passingYearField = (
    <Field
      id="js-edu-year"
      name="education.passingYear"
      label={translateKey("auth.jobSeekerRegister.passingYear")}
      value={education.passingYear}
      required
      error={fieldErrors["education.passingYear"]}
      onChange={(passingYear) =>
        clearAndPatch({
          passingYear: passingYear.replace(/\D/g, "").slice(0, 4),
        })
      }
      disabled={disabled}
      placeholder="YYYY"
    />
  );

  if (level === "below_10th") {
    return (
      <Field
        id="js-edu-school"
        name="education.schoolName"
        label={translateKey("auth.jobSeekerRegister.schoolName")}
        value={education.schoolName}
        required
        error={fieldErrors["education.schoolName"]}
        onChange={(schoolName) => clearAndPatch({ schoolName })}
        disabled={disabled}
      />
    );
  }

  if (level === "10th_pass") {
    return (
      <>
        <Field
          id="js-edu-school"
          name="education.schoolName"
          label={translateKey("auth.jobSeekerRegister.schoolName")}
          value={education.schoolName}
          required
          error={fieldErrors["education.schoolName"]}
          onChange={(schoolName) => clearAndPatch({ schoolName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-board"
          name="education.board"
          label={translateKey("auth.jobSeekerRegister.board")}
          value={education.board}
          required
          error={fieldErrors["education.board"]}
          onChange={(board) => clearAndPatch({ board })}
          disabled={disabled}
        />
        {passingYearField}
      </>
    );
  }

  if (level === "intermediate") {
    return (
      <>
        <Field
          id="js-edu-college"
          name="education.collegeName"
          label={translateKey("auth.jobSeekerRegister.collegeName")}
          value={education.collegeName}
          required
          error={fieldErrors["education.collegeName"]}
          onChange={(collegeName) => clearAndPatch({ collegeName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-stream"
          name="education.stream"
          label={translateKey("auth.jobSeekerRegister.stream")}
          value={education.stream}
          required
          error={fieldErrors["education.stream"]}
          onChange={(stream) => clearAndPatch({ stream })}
          disabled={disabled}
        />
        {passingYearField}
      </>
    );
  }

  if (level === "iti") {
    return (
      <>
        <Field
          id="js-edu-institute"
          name="education.instituteName"
          label={translateKey("auth.jobSeekerRegister.instituteName")}
          value={education.instituteName}
          required
          error={fieldErrors["education.instituteName"]}
          onChange={(instituteName) => clearAndPatch({ instituteName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-trade"
          name="education.trade"
          label={translateKey("auth.jobSeekerRegister.trade")}
          value={education.trade}
          required
          error={fieldErrors["education.trade"]}
          onChange={(trade) => clearAndPatch({ trade })}
          disabled={disabled}
        />
        {passingYearField}
      </>
    );
  }

  if (level === "diploma") {
    return (
      <>
        <Field
          id="js-edu-college"
          name="education.collegeName"
          label={translateKey("auth.jobSeekerRegister.collegeName")}
          value={education.collegeName}
          required
          error={fieldErrors["education.collegeName"]}
          onChange={(collegeName) => clearAndPatch({ collegeName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-branch"
          name="education.branch"
          label={translateKey("auth.jobSeekerRegister.branch")}
          value={education.branch}
          required
          error={fieldErrors["education.branch"]}
          onChange={(branch) => clearAndPatch({ branch })}
          disabled={disabled}
        />
        {passingYearField}
      </>
    );
  }

  return (
    <>
      <Field
        id="js-edu-college"
        name="education.collegeName"
        label={translateKey("auth.jobSeekerRegister.collegeName")}
        value={education.collegeName}
        required
        error={fieldErrors["education.collegeName"]}
        onChange={(collegeName) => clearAndPatch({ collegeName })}
        disabled={disabled}
      />
      <Field
        id="js-edu-degree"
        name="education.degree"
        label={translateKey("auth.jobSeekerRegister.degree")}
        value={education.degree}
        required
        error={fieldErrors["education.degree"]}
        onChange={(degree) => clearAndPatch({ degree })}
        disabled={disabled}
      />
      <Field
        id="js-edu-specialization"
        name="education.specialization"
        label={translateKey("auth.jobSeekerRegister.specialization")}
        value={education.specialization}
        required
        error={fieldErrors["education.specialization"]}
        onChange={(specialization) => clearAndPatch({ specialization })}
        disabled={disabled}
      />
      {passingYearField}
    </>
  );
}

function getLocalTodayIso() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function JobSeekerRegisterEducationExperienceStep({
  education,
  experienceType,
  experiences,
  languages,
  availabilityStatus,
  fieldErrors = {},
  disabled = false,
  onEducationChange,
  onExperienceTypeChange,
  onExperiencesChange,
  onLanguagesChange,
  onAvailabilityStatusChange,
  onClearFieldError,
}: JobSeekerRegisterEducationExperienceStepProps) {
  const t = useTranslate();
  const translateMessage = useAuthMessageTranslator();
  const todayIso = getLocalTodayIso();
  const educationLevelErrorId = "job-seeker-register-education-error";
  const experienceTypeErrorId = "job-seeker-experience-type-error";
  const experiencesErrorId = "job-seeker-experiences-error";
  const languagesErrorId = "job-seeker-languages-error";
  const availabilityErrorId = "job-seeker-register-availability-error";
  const educationOptions = localizeOptions(
    JOB_SEEKER_EDUCATION_OPTIONS,
    EDUCATION_LEVEL_LABEL_KEYS,
    t,
  );
  const availabilityOptions = localizeOptions(
    JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS,
    AVAILABILITY_LABEL_KEYS,
    t,
  );

  const updateEducation = (patch: Partial<JobSeekerEducation>) => {
    onEducationChange({ ...education, ...patch });
  };

  const updateExperience = (
    index: number,
    patch: Partial<JobSeekerExperienceEntry>,
  ) => {
    for (const key of Object.keys(patch)) {
      onClearFieldError?.(`experiences.${index}.${key}`);
    }
    onExperiencesChange(
      experiences.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const toggleLanguage = (language: JobSeekerLanguage) => {
    onClearFieldError?.("languages");
    if (languages.includes(language)) {
      onLanguagesChange(languages.filter((item) => item !== language));
      return;
    }
    onLanguagesChange([...languages, language]);
  };

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          {t("auth.jobSeekerRegister.educationTitle")}
        </h2>
        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-education"
            name="education.level"
            label={t("auth.jobSeekerRegister.educationLabel")}
            value={education.level}
            placeholder={t("auth.jobSeekerRegister.educationPlaceholder")}
            options={educationOptions}
            onChange={(value) => {
              onClearFieldError?.("education.level");
              onEducationChange({
                ...EMPTY_EDUCATION,
                level: value as JobSeekerEducationLevel,
              });
            }}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors["education.level"])}
            aria-describedby={
              fieldErrors["education.level"]
                ? educationLevelErrorId
                : undefined
            }
          />
          <FieldError
            id={educationLevelErrorId}
            message={translateMessage(fieldErrors["education.level"])}
          />
        </div>
        {renderEducationFields(
          education,
          disabled,
          fieldErrors,
          updateEducation,
          t,
          onClearFieldError,
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          {t("auth.jobSeekerRegister.experienceTitle")}
        </h2>
        <fieldset className="space-y-2" aria-describedby={experienceTypeErrorId}>
          <legend className="employer-register-form-label break-words">
            {t("auth.jobSeekerRegister.hasExperience")}{" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                  experienceType === option.value
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border-subtle bg-surface text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="experienceType"
                  value={option.value}
                  checked={experienceType === option.value}
                  disabled={disabled}
                  className="sr-only"
                  aria-required="true"
                  aria-invalid={
                    Boolean(fieldErrors.experienceType) || undefined
                  }
                  onChange={() => {
                    onClearFieldError?.("experienceType");
                    onClearFieldError?.("experiences");
                    onExperienceTypeChange(option.value);
                    if (
                      option.value === "experienced" &&
                      experiences.length === 0
                    ) {
                      onExperiencesChange([createEmptyExperience()]);
                    }
                    if (option.value === "fresher") {
                      onExperiencesChange([]);
                    }
                  }}
                />
                {t(option.labelKey)}
              </label>
            ))}
          </div>
          <FieldError
            id={experienceTypeErrorId}
            message={translateMessage(fieldErrors.experienceType)}
          />
        </fieldset>

        {experienceType === "experienced"
          ? experiences.map((entry, index) => {
              const startErrorId = `js-exp-start-${index}-error`;
              const endErrorId = `js-exp-end-${index}-error`;

              return (
                <div
                  key={`experience-${index}`}
                  className="space-y-3 rounded-xl border border-border-subtle p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 break-words text-sm font-semibold text-foreground">
                      {t("auth.jobSeekerRegister.experienceNumber", {
                        number: index + 1,
                      })}
                    </p>
                    {experiences.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600"
                        disabled={disabled}
                        onClick={() =>
                          onExperiencesChange(
                            experiences.filter((_, i) => i !== index),
                          )
                        }
                      >
                        {t("auth.common.remove")}
                      </button>
                    ) : null}
                  </div>
                  <Field
                    id={`js-exp-company-${index}`}
                    name={`experiences.${index}.companyName`}
                    label={t("auth.jobSeekerRegister.companyName")}
                    value={entry.companyName}
                    required
                    error={fieldErrors[`experiences.${index}.companyName`]}
                    onChange={(companyName) =>
                      updateExperience(index, { companyName })
                    }
                    disabled={disabled}
                  />
                  <Field
                    id={`js-exp-role-${index}`}
                    name={`experiences.${index}.jobRole`}
                    label={t("auth.jobSeekerRegister.jobRole")}
                    value={entry.jobRole}
                    required
                    error={fieldErrors[`experiences.${index}.jobRole`]}
                    onChange={(jobRole) => updateExperience(index, { jobRole })}
                    disabled={disabled}
                  />
                  <Field
                    id={`js-exp-industry-${index}`}
                    name={`experiences.${index}.industry`}
                    label={t("auth.jobSeekerRegister.industry")}
                    value={entry.industry}
                    required
                    error={fieldErrors[`experiences.${index}.industry`]}
                    onChange={(industry) =>
                      updateExperience(index, { industry })
                    }
                    disabled={disabled}
                  />
                  <div className="employer-register-form-row">
                    <div className="employer-register-form-stack">
                      <RequiredFieldLabel
                        htmlFor={`js-exp-start-${index}`}
                        required
                        className="employer-register-form-label"
                      >
                        {t("auth.jobSeekerRegister.startDate")}
                      </RequiredFieldLabel>
                      <PostJobDatePicker
                        id={`js-exp-start-${index}`}
                        name={`experiences.${index}.startDate`}
                        value={entry.startDate}
                        placeholder="DD/MM/YYYY"
                        compact
                        maxDate={todayIso}
                        disabled={disabled}
                        onChange={(startDate) =>
                          updateExperience(index, {
                            startDate,
                            endDate:
                              entry.endDate && entry.endDate < startDate
                                ? ""
                                : entry.endDate,
                          })
                        }
                        aria-label={t("auth.jobSeekerRegister.startDateAria")}
                        aria-required
                        aria-invalid={Boolean(
                          fieldErrors[`experiences.${index}.startDate`],
                        )}
                        aria-describedby={
                          fieldErrors[`experiences.${index}.startDate`]
                            ? startErrorId
                            : undefined
                        }
                      />
                      <FieldError
                        id={startErrorId}
                        message={translateMessage(
                          fieldErrors[`experiences.${index}.startDate`],
                        )}
                      />
                    </div>
                    <div className="employer-register-form-stack">
                      <RequiredFieldLabel
                        htmlFor={`js-exp-end-${index}`}
                        required={!entry.currentlyWorking}
                        className="employer-register-form-label"
                      >
                        {t("auth.jobSeekerRegister.endDate")}
                      </RequiredFieldLabel>
                      {entry.currentlyWorking ? (
                        <div
                          id={`js-exp-end-${index}`}
                          className="flex h-12 w-full items-center rounded-md border border-border bg-hero-bg px-3.5 text-sm font-medium text-muted"
                          aria-label={t(
                            "auth.jobSeekerRegister.endDatePresentAria",
                          )}
                        >
                          {t("auth.jobSeekerRegister.present")}
                        </div>
                      ) : (
                        <PostJobDatePicker
                          id={`js-exp-end-${index}`}
                          name={`experiences.${index}.endDate`}
                          value={entry.endDate}
                          placeholder="DD/MM/YYYY"
                          compact
                          minDate={entry.startDate || undefined}
                          maxDate={todayIso}
                          disabled={disabled}
                          onChange={(endDate) =>
                            updateExperience(index, { endDate })
                          }
                          aria-label={t("auth.jobSeekerRegister.endDateAria")}
                          aria-required
                          aria-invalid={Boolean(
                            fieldErrors[`experiences.${index}.endDate`],
                          )}
                          aria-describedby={
                            fieldErrors[`experiences.${index}.endDate`]
                              ? endErrorId
                              : undefined
                          }
                        />
                      )}
                      <FieldError
                        id={endErrorId}
                        message={translateMessage(
                          fieldErrors[`experiences.${index}.endDate`],
                        )}
                      />
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={entry.currentlyWorking}
                      disabled={disabled}
                      onChange={(event) =>
                        updateExperience(index, {
                          currentlyWorking: event.target.checked,
                          endDate: event.target.checked ? "" : entry.endDate,
                        })
                      }
                    />
                    {t("auth.jobSeekerRegister.currentlyWorking")}
                  </label>
                  <Field
                    id={`js-exp-duration-${index}`}
                    name={`experiences.${index}.duration`}
                    label={t("auth.jobSeekerRegister.duration")}
                    value={entry.duration}
                    onChange={(duration) =>
                      updateExperience(index, { duration })
                    }
                    disabled={disabled}
                    placeholder={t("auth.jobSeekerRegister.durationPlaceholder")}
                  />
                  <Field
                    id={`js-exp-salary-${index}`}
                    name={`experiences.${index}.salary`}
                    label={t("auth.jobSeekerRegister.salary")}
                    value={entry.salary}
                    required
                    error={fieldErrors[`experiences.${index}.salary`]}
                    onChange={(salary) =>
                      updateExperience(index, {
                        salary: salary.replace(/\D/g, "").slice(0, 8),
                      })
                    }
                    disabled={disabled}
                  />
                  <Field
                    id={`js-exp-location-${index}`}
                    name={`experiences.${index}.location`}
                    label={t("auth.jobSeekerRegister.location")}
                    value={entry.location}
                    required
                    error={fieldErrors[`experiences.${index}.location`]}
                    onChange={(location) =>
                      updateExperience(index, { location })
                    }
                    disabled={disabled}
                  />
                </div>
              );
            })
          : null}

        {experienceType === "experienced" ? (
          <>
            <FieldError
              id={experiencesErrorId}
              message={translateMessage(fieldErrors.experiences)}
            />
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary-light px-3 text-sm font-semibold text-primary"
              disabled={disabled}
              onClick={() =>
                onExperiencesChange([...experiences, createEmptyExperience()])
              }
            >
              {t("auth.jobSeekerRegister.addAnotherExperience")}
            </button>
          </>
        ) : null}
      </section>

      <section className="space-y-3" aria-describedby={languagesErrorId}>
        <h2 className="text-sm font-semibold text-foreground">
          {t("auth.jobSeekerRegister.languagesTitle")}{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {JOB_SEEKER_LANGUAGE_OPTIONS.map((option) => {
            const selected = languages.includes(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-invalid={Boolean(fieldErrors.languages) || undefined}
                  className={cn(
                    "flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
                    selected
                      ? "border-primary bg-primary-light text-primary shadow-[0_1px_0_rgba(14,133,133,0.12)]"
                      : "border-border-subtle bg-surface text-foreground hover:border-primary/25 hover:bg-hero-bg",
                  )}
                  onClick={() => toggleLanguage(option.value)}
                >
                  <span className="truncate">{option.label}</span>
                  <span
                    className={cn(
                      "inline-flex size-4 shrink-0 items-center justify-center rounded border",
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface",
                    )}
                    aria-hidden="true"
                  >
                    {selected ? (
                      <Check className="size-2.5" strokeWidth={3} />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <FieldError
          id={languagesErrorId}
          message={translateMessage(fieldErrors.languages)}
        />
      </section>

      <section className="space-y-4">
        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-availability"
            name="availabilityStatus"
            label={t("auth.jobSeekerRegister.availabilityLabel")}
            value={availabilityStatus}
            placeholder={t("auth.jobSeekerRegister.availabilityPlaceholder")}
            options={availabilityOptions}
            onChange={(value) => {
              onClearFieldError?.("availabilityStatus");
              onAvailabilityStatusChange(value as JobSeekerAvailabilityStatus);
            }}
            required
            disabled={disabled}
            aria-invalid={Boolean(fieldErrors.availabilityStatus)}
            aria-describedby={
              fieldErrors.availabilityStatus ? availabilityErrorId : undefined
            }
          />
          <FieldError
            id={availabilityErrorId}
            message={translateMessage(fieldErrors.availabilityStatus)}
          />
        </div>
      </section>
    </>
  );
}
