"use client";

import { FieldError } from "@/components/auth/FieldError";
import { RequiredFieldLabel } from "@/components/auth/RequiredFieldLabel";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import {
  JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS,
  JOB_SEEKER_EDUCATION_OPTIONS,
  JOB_SEEKER_LANGUAGE_OPTIONS,
} from "@/constants/job-seeker-register";
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
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function renderEducationFields(
  education: JobSeekerEducation,
  disabled: boolean,
  fieldErrors: AuthFieldErrors,
  onChange: (patch: Partial<JobSeekerEducation>) => void,
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

  if (level === "below_10th") {
    return (
      <Field
        id="js-edu-school"
        name="education.schoolName"
        label="School Name"
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
          label="School Name"
          value={education.schoolName}
          required
          error={fieldErrors["education.schoolName"]}
          onChange={(schoolName) => clearAndPatch({ schoolName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-board"
          name="education.board"
          label="Board"
          value={education.board}
          required
          error={fieldErrors["education.board"]}
          onChange={(board) => clearAndPatch({ board })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          name="education.passingYear"
          label="Passing Year"
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
      </>
    );
  }

  if (level === "intermediate") {
    return (
      <>
        <Field
          id="js-edu-college"
          name="education.collegeName"
          label="College Name"
          value={education.collegeName}
          required
          error={fieldErrors["education.collegeName"]}
          onChange={(collegeName) => clearAndPatch({ collegeName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-stream"
          name="education.stream"
          label="Stream"
          value={education.stream}
          required
          error={fieldErrors["education.stream"]}
          onChange={(stream) => clearAndPatch({ stream })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          name="education.passingYear"
          label="Passing Year"
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
      </>
    );
  }

  if (level === "iti") {
    return (
      <>
        <Field
          id="js-edu-institute"
          name="education.instituteName"
          label="Institute Name"
          value={education.instituteName}
          required
          error={fieldErrors["education.instituteName"]}
          onChange={(instituteName) => clearAndPatch({ instituteName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-trade"
          name="education.trade"
          label="Trade"
          value={education.trade}
          required
          error={fieldErrors["education.trade"]}
          onChange={(trade) => clearAndPatch({ trade })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          name="education.passingYear"
          label="Passing Year"
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
      </>
    );
  }

  if (level === "diploma") {
    return (
      <>
        <Field
          id="js-edu-college"
          name="education.collegeName"
          label="College Name"
          value={education.collegeName}
          required
          error={fieldErrors["education.collegeName"]}
          onChange={(collegeName) => clearAndPatch({ collegeName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-branch"
          name="education.branch"
          label="Branch"
          value={education.branch}
          required
          error={fieldErrors["education.branch"]}
          onChange={(branch) => clearAndPatch({ branch })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          name="education.passingYear"
          label="Passing Year"
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
      </>
    );
  }

  return (
    <>
      <Field
        id="js-edu-college"
        name="education.collegeName"
        label="College Name"
        value={education.collegeName}
        required
        error={fieldErrors["education.collegeName"]}
        onChange={(collegeName) => clearAndPatch({ collegeName })}
        disabled={disabled}
      />
      <Field
        id="js-edu-degree"
        name="education.degree"
        label="Degree"
        value={education.degree}
        required
        error={fieldErrors["education.degree"]}
        onChange={(degree) => clearAndPatch({ degree })}
        disabled={disabled}
      />
      <Field
        id="js-edu-specialization"
        name="education.specialization"
        label="Specialization"
        value={education.specialization}
        required
        error={fieldErrors["education.specialization"]}
        onChange={(specialization) => clearAndPatch({ specialization })}
        disabled={disabled}
      />
      <Field
        id="js-edu-year"
        name="education.passingYear"
        label="Passing Year"
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
  const todayIso = getLocalTodayIso();
  const educationLevelErrorId = "job-seeker-register-education-error";
  const experienceTypeErrorId = "job-seeker-experience-type-error";
  const experiencesErrorId = "job-seeker-experiences-error";
  const languagesErrorId = "job-seeker-languages-error";
  const availabilityErrorId = "job-seeker-register-availability-error";

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
        <h2 className="text-sm font-semibold text-foreground">Education</h2>
        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-education"
            name="education.level"
            label="Education"
            value={education.level}
            placeholder="Select education"
            options={JOB_SEEKER_EDUCATION_OPTIONS}
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
            message={fieldErrors["education.level"]}
          />
        </div>
        {renderEducationFields(
          education,
          disabled,
          fieldErrors,
          updateEducation,
          onClearFieldError,
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Experience</h2>
        <fieldset className="space-y-2" aria-describedby={experienceTypeErrorId}>
          <legend className="employer-register-form-label">
            Do you have work experience?{" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "fresher", label: "Fresher" },
                { value: "experienced", label: "Experienced" },
              ] as const
            ).map((option) => (
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
                {option.label}
              </label>
            ))}
          </div>
          <FieldError
            id={experienceTypeErrorId}
            message={fieldErrors.experienceType}
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
                    <p className="text-sm font-semibold text-foreground">
                      Experience {index + 1}
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
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <Field
                    id={`js-exp-company-${index}`}
                    name={`experiences.${index}.companyName`}
                    label="Company Name"
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
                    label="Job Role"
                    value={entry.jobRole}
                    required
                    error={fieldErrors[`experiences.${index}.jobRole`]}
                    onChange={(jobRole) => updateExperience(index, { jobRole })}
                    disabled={disabled}
                  />
                  <Field
                    id={`js-exp-industry-${index}`}
                    name={`experiences.${index}.industry`}
                    label="Industry"
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
                        Start Date
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
                        aria-label="Experience start date"
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
                        message={
                          fieldErrors[`experiences.${index}.startDate`]
                        }
                      />
                    </div>
                    <div className="employer-register-form-stack">
                      <RequiredFieldLabel
                        htmlFor={`js-exp-end-${index}`}
                        required={!entry.currentlyWorking}
                        className="employer-register-form-label"
                      >
                        End Date
                      </RequiredFieldLabel>
                      {entry.currentlyWorking ? (
                        <div
                          id={`js-exp-end-${index}`}
                          className="flex h-12 w-full items-center rounded-md border border-border bg-hero-bg px-3.5 text-sm font-medium text-muted"
                          aria-label="Experience end date Present"
                        >
                          Present
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
                          aria-label="Experience end date"
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
                        message={fieldErrors[`experiences.${index}.endDate`]}
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
                    Currently Working
                  </label>
                  <Field
                    id={`js-exp-duration-${index}`}
                    name={`experiences.${index}.duration`}
                    label="Experience Duration"
                    value={entry.duration}
                    onChange={(duration) =>
                      updateExperience(index, { duration })
                    }
                    disabled={disabled}
                    placeholder="e.g. 2 years"
                  />
                  <Field
                    id={`js-exp-salary-${index}`}
                    name={`experiences.${index}.salary`}
                    label="Salary"
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
                    label="Location"
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
              message={fieldErrors.experiences}
            />
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary-light px-3 text-sm font-semibold text-primary"
              disabled={disabled}
              onClick={() =>
                onExperiencesChange([...experiences, createEmptyExperience()])
              }
            >
              Add Another Experience
            </button>
          </>
        ) : null}
      </section>

      <section className="space-y-3" aria-describedby={languagesErrorId}>
        <h2 className="text-sm font-semibold text-foreground">
          Known Languages{" "}
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
        <FieldError id={languagesErrorId} message={fieldErrors.languages} />
      </section>

      <section className="space-y-4">
        <div className="employer-register-form-stack">
          <EmployerRegisterSearchableSelect
            id="job-seeker-register-availability"
            name="availabilityStatus"
            label="Availability Status"
            value={availabilityStatus}
            placeholder="Select your availability"
            options={JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS}
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
            message={fieldErrors.availabilityStatus}
          />
        </div>
      </section>
    </>
  );
}
