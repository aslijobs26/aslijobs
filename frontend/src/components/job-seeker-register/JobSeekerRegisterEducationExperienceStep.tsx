"use client";

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
  disabled?: boolean;
  onEducationChange: (education: JobSeekerEducation) => void;
  onExperienceTypeChange: (value: JobSeekerExperienceType) => void;
  onExperiencesChange: (experiences: JobSeekerExperienceEntry[]) => void;
  onLanguagesChange: (languages: JobSeekerLanguage[]) => void;
  onAvailabilityStatusChange: (value: JobSeekerAvailabilityStatus) => void;
};

function Field({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="employer-register-form-stack">
      <label htmlFor={id} className="employer-register-form-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="employer-register-form-input"
        disabled={disabled}
      />
    </div>
  );
}

function renderEducationFields(
  education: JobSeekerEducation,
  disabled: boolean,
  onChange: (patch: Partial<JobSeekerEducation>) => void,
) {
  const level = education.level;

  if (level === "no_formal_education") {
    return null;
  }

  if (level === "below_10th") {
    return (
      <Field
        id="js-edu-school"
        label="School Name*"
        value={education.schoolName}
        onChange={(schoolName) => onChange({ schoolName })}
        disabled={disabled}
      />
    );
  }

  if (level === "10th_pass") {
    return (
      <>
        <Field
          id="js-edu-school"
          label="School Name*"
          value={education.schoolName}
          onChange={(schoolName) => onChange({ schoolName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-board"
          label="Board*"
          value={education.board}
          onChange={(board) => onChange({ board })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          label="Passing Year*"
          value={education.passingYear}
          onChange={(passingYear) =>
            onChange({ passingYear: passingYear.replace(/\D/g, "").slice(0, 4) })
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
          label="College Name*"
          value={education.collegeName}
          onChange={(collegeName) => onChange({ collegeName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-stream"
          label="Stream*"
          value={education.stream}
          onChange={(stream) => onChange({ stream })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          label="Passing Year*"
          value={education.passingYear}
          onChange={(passingYear) =>
            onChange({ passingYear: passingYear.replace(/\D/g, "").slice(0, 4) })
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
          label="Institute Name*"
          value={education.instituteName}
          onChange={(instituteName) => onChange({ instituteName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-trade"
          label="Trade*"
          value={education.trade}
          onChange={(trade) => onChange({ trade })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          label="Passing Year*"
          value={education.passingYear}
          onChange={(passingYear) =>
            onChange({ passingYear: passingYear.replace(/\D/g, "").slice(0, 4) })
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
          label="College Name*"
          value={education.collegeName}
          onChange={(collegeName) => onChange({ collegeName })}
          disabled={disabled}
        />
        <Field
          id="js-edu-branch"
          label="Branch*"
          value={education.branch}
          onChange={(branch) => onChange({ branch })}
          disabled={disabled}
        />
        <Field
          id="js-edu-year"
          label="Passing Year*"
          value={education.passingYear}
          onChange={(passingYear) =>
            onChange({ passingYear: passingYear.replace(/\D/g, "").slice(0, 4) })
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
        label="College Name*"
        value={education.collegeName}
        onChange={(collegeName) => onChange({ collegeName })}
        disabled={disabled}
      />
      <Field
        id="js-edu-degree"
        label="Degree*"
        value={education.degree}
        onChange={(degree) => onChange({ degree })}
        disabled={disabled}
      />
      <Field
        id="js-edu-specialization"
        label="Specialization*"
        value={education.specialization}
        onChange={(specialization) => onChange({ specialization })}
        disabled={disabled}
      />
      <Field
        id="js-edu-year"
        label="Passing Year*"
        value={education.passingYear}
        onChange={(passingYear) =>
          onChange({ passingYear: passingYear.replace(/\D/g, "").slice(0, 4) })
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
  disabled = false,
  onEducationChange,
  onExperienceTypeChange,
  onExperiencesChange,
  onLanguagesChange,
  onAvailabilityStatusChange,
}: JobSeekerRegisterEducationExperienceStepProps) {
  const todayIso = getLocalTodayIso();

  const updateEducation = (patch: Partial<JobSeekerEducation>) => {
    onEducationChange({ ...education, ...patch });
  };

  const updateExperience = (
    index: number,
    patch: Partial<JobSeekerExperienceEntry>,
  ) => {
    onExperiencesChange(
      experiences.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const toggleLanguage = (language: JobSeekerLanguage) => {
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
        <EmployerRegisterSearchableSelect
          id="job-seeker-register-education"
          label="Education*"
          value={education.level}
          placeholder="Select education"
          options={JOB_SEEKER_EDUCATION_OPTIONS}
          onChange={(value) =>
            onEducationChange({
              ...EMPTY_EDUCATION,
              level: value as JobSeekerEducationLevel,
            })
          }
          required
          disabled={disabled}
        />
        {renderEducationFields(education, disabled, updateEducation)}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Experience</h2>
        <fieldset className="space-y-2">
          <legend className="employer-register-form-label">
            Do you have work experience?*
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
                  name="job-seeker-experience-type"
                  value={option.value}
                  checked={experienceType === option.value}
                  disabled={disabled}
                  className="sr-only"
                  onChange={() => {
                    onExperienceTypeChange(option.value);
                    if (option.value === "experienced" && experiences.length === 0) {
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
        </fieldset>

        {experienceType === "experienced"
          ? experiences.map((entry, index) => (
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
                  label="Company Name*"
                  value={entry.companyName}
                  onChange={(companyName) =>
                    updateExperience(index, { companyName })
                  }
                  disabled={disabled}
                />
                <Field
                  id={`js-exp-role-${index}`}
                  label="Job Role*"
                  value={entry.jobRole}
                  onChange={(jobRole) => updateExperience(index, { jobRole })}
                  disabled={disabled}
                />
                <Field
                  id={`js-exp-industry-${index}`}
                  label="Industry*"
                  value={entry.industry}
                  onChange={(industry) => updateExperience(index, { industry })}
                  disabled={disabled}
                />
                <div className="employer-register-form-row">
                  <div className="employer-register-form-stack">
                    <label
                      htmlFor={`js-exp-start-${index}`}
                      className="employer-register-form-label"
                    >
                      Start Date*
                    </label>
                    <PostJobDatePicker
                      id={`js-exp-start-${index}`}
                      value={entry.startDate}
                      placeholder="DD/MM/YYYY"
                      compact
                      maxDate={todayIso}
                      disabled={disabled}
                      onChange={(startDate) =>
                        updateExperience(index, {
                          startDate,
                          endDate:
                            entry.endDate &&
                            entry.endDate < startDate
                              ? ""
                              : entry.endDate,
                        })
                      }
                      aria-label="Experience start date"
                    />
                  </div>
                  <div className="employer-register-form-stack">
                    <label
                      htmlFor={`js-exp-end-${index}`}
                      className="employer-register-form-label"
                    >
                      End Date{entry.currentlyWorking ? "" : "*"}
                    </label>
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
                      />
                    )}
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
                  label="Experience Duration"
                  value={entry.duration}
                  onChange={(duration) => updateExperience(index, { duration })}
                  disabled={disabled}
                  placeholder="e.g. 2 years"
                />
                <Field
                  id={`js-exp-salary-${index}`}
                  label="Salary*"
                  value={entry.salary}
                  onChange={(salary) =>
                    updateExperience(index, {
                      salary: salary.replace(/\D/g, "").slice(0, 8),
                    })
                  }
                  disabled={disabled}
                />
                <Field
                  id={`js-exp-location-${index}`}
                  label="Location*"
                  value={entry.location}
                  onChange={(location) => updateExperience(index, { location })}
                  disabled={disabled}
                />
              </div>
            ))
          : null}

        {experienceType === "experienced" ? (
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
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Known Languages*
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
      </section>

      <section className="space-y-4">
        <EmployerRegisterSearchableSelect
          id="job-seeker-register-availability"
          label="Availability Status *"
          value={availabilityStatus}
          placeholder="Select your availability"
          options={JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS}
          onChange={(value) =>
            onAvailabilityStatusChange(value as JobSeekerAvailabilityStatus)
          }
          required
          disabled={disabled}
        />
      </section>
    </>
  );
}
