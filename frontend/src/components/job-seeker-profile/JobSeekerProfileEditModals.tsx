"use client";

import {
  EMPTY_EDUCATION,
  createEmptyExperience,
} from "@/components/job-seeker-register/JobSeekerRegisterEducationExperienceStep";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import { JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS } from "@/constants/job-seeker-profile";
import {
  JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS,
  JOB_SEEKER_EDUCATION_OPTIONS,
  JOB_SEEKER_JOB_TYPE_OPTIONS,
  JOB_SEEKER_LANGUAGE_OPTIONS,
  JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS,
  JOB_SEEKER_WORK_MODE_OPTIONS,
} from "@/constants/job-seeker-register";
import type {
  JobSeekerAvailabilityStatus,
  JobSeekerEducation,
  JobSeekerEducationLevel,
  JobSeekerExperienceEntry,
  JobSeekerJobType,
  JobSeekerLanguage,
  JobSeekerProfileVisibility,
  JobSeekerPublic,
  JobSeekerWorkMode,
  UpdateJobSeekerProfileInput,
} from "@/types/job-seeker";
import { cn } from "@/utils/cn";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { JobSeekerProfileDialog } from "./JobSeekerProfileDialog";

export type JobSeekerProfileEditModalState =
  | { type: "about" }
  | { type: "experience"; mode: "create" | "edit"; index: number }
  | { type: "education" }
  | { type: "skills" }
  | { type: "preferences" }
  | { type: "visibility" }
  | null;

type JobSeekerProfileEditModalsProps = {
  jobSeeker: JobSeekerPublic;
  activeModal: JobSeekerProfileEditModalState;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: UpdateJobSeekerProfileInput) => Promise<void>;
};

const inputClassName =
  "flex h-11 w-full rounded-lg border border-border-subtle bg-hero-bg px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "text-sm font-semibold text-foreground";

const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

function DialogFooter({
  onClose,
  isSaving,
  submitLabel = "Save changes",
}: {
  onClose: () => void;
  isSaving: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className={secondaryButtonClassName}
        onClick={onClose}
        disabled={isSaving}
      >
        Cancel
      </button>
      <button type="submit" className={primaryButtonClassName} disabled={isSaving}>
        {isSaving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}

function renderEducationFields(
  education: JobSeekerEducation,
  onChange: (patch: Partial<JobSeekerEducation>) => void,
) {
  const level = education.level;

  if (level === "no_formal_education") {
    return (
      <p className="text-sm text-muted">
        No additional education details are required for this level.
      </p>
    );
  }

  const field = (
    id: string,
    label: string,
    value: string,
    key: keyof JobSeekerEducation,
    placeholder?: string,
  ) => (
    <div key={id} className="space-y-1.5">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        className={inputClassName}
        onChange={(event) => onChange({ [key]: event.target.value })}
      />
    </div>
  );

  if (level === "below_10th") {
    return field("edu-school", "School Name*", education.schoolName, "schoolName");
  }

  if (level === "10th_pass") {
    return (
      <>
        {field("edu-school", "School Name*", education.schoolName, "schoolName")}
        {field("edu-board", "Board*", education.board, "board")}
        {field(
          "edu-year",
          "Passing Year*",
          education.passingYear,
          "passingYear",
          "YYYY",
        )}
      </>
    );
  }

  if (level === "intermediate") {
    return (
      <>
        {field(
          "edu-college",
          "College Name*",
          education.collegeName,
          "collegeName",
        )}
        {field("edu-stream", "Stream*", education.stream, "stream")}
        {field(
          "edu-year",
          "Passing Year*",
          education.passingYear,
          "passingYear",
          "YYYY",
        )}
      </>
    );
  }

  if (level === "iti") {
    return (
      <>
        {field(
          "edu-institute",
          "Institute Name*",
          education.instituteName,
          "instituteName",
        )}
        {field("edu-trade", "Trade*", education.trade, "trade")}
        {field(
          "edu-year",
          "Passing Year*",
          education.passingYear,
          "passingYear",
          "YYYY",
        )}
      </>
    );
  }

  if (level === "diploma") {
    return (
      <>
        {field(
          "edu-college",
          "College Name*",
          education.collegeName,
          "collegeName",
        )}
        {field("edu-branch", "Branch*", education.branch, "branch")}
        {field(
          "edu-year",
          "Passing Year*",
          education.passingYear,
          "passingYear",
          "YYYY",
        )}
      </>
    );
  }

  return (
    <>
      {field(
        "edu-college",
        "College Name*",
        education.collegeName,
        "collegeName",
      )}
      {field("edu-degree", "Degree*", education.degree, "degree")}
      {field(
        "edu-specialization",
        "Specialization*",
        education.specialization,
        "specialization",
      )}
      {field(
        "edu-year",
        "Passing Year*",
        education.passingYear,
        "passingYear",
        "YYYY",
      )}
    </>
  );
}

function getLocalTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AboutModal({
  jobSeeker,
  isSaving,
  onClose,
  onSave,
}: Omit<JobSeekerProfileEditModalsProps, "activeModal">) {
  const [summary, setSummary] = useState(
    jobSeeker.professionalSummary?.trim() ?? "",
  );

  useEffect(() => {
    setSummary(jobSeeker.professionalSummary?.trim() ?? "");
  }, [jobSeeker.professionalSummary]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ professionalSummary: summary.trim() });
    onClose();
  };

  return (
    <JobSeekerProfileDialog
      title="About me"
      description="Write a short professional summary employers will see on your profile."
      onClose={onClose}
      footer={
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogFooter onClose={onClose} isSaving={isSaving} />
        </form>
      }
    >
      <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="profile-summary" className={labelClassName}>
          Professional summary
        </label>
        <textarea
          id="profile-summary"
          rows={6}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className={`${inputClassName} min-h-[9rem] resize-y py-2.5`}
          placeholder="Describe your experience, strengths, and career goals…"
        />
      </form>
    </JobSeekerProfileDialog>
  );
}

function ExperienceModal({
  jobSeeker,
  activeModal,
  isSaving,
  onClose,
  onSave,
}: JobSeekerProfileEditModalsProps & {
  activeModal: Extract<
    JobSeekerProfileEditModalState,
    { type: "experience" }
  >;
}) {
  const todayIso = getLocalTodayIso();
  const initialEntry = useMemo(() => {
    if (activeModal.mode === "edit") {
      return (
        jobSeeker.experiences?.[activeModal.index] ?? createEmptyExperience()
      );
    }
    return createEmptyExperience();
  }, [activeModal, jobSeeker.experiences]);

  const [entry, setEntry] = useState<JobSeekerExperienceEntry>(initialEntry);

  useEffect(() => {
    setEntry(initialEntry);
  }, [initialEntry]);

  const patch = (partial: Partial<JobSeekerExperienceEntry>) => {
    setEntry((current) => ({ ...current, ...partial }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const experiences = [...(jobSeeker.experiences ?? [])];
    if (activeModal.mode === "edit") {
      experiences[activeModal.index] = entry;
    } else {
      experiences.push(entry);
    }
    await onSave({
      experienceType: "experienced",
      experiences,
    });
    onClose();
  };

  return (
    <JobSeekerProfileDialog
      title={
        activeModal.mode === "edit" ? "Edit experience" : "Add experience"
      }
      description="Include your role, company, and key details."
      onClose={onClose}
      wide
      footer={
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogFooter onClose={onClose} isSaving={isSaving} />
        </form>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="exp-company" className={labelClassName}>
            Company name*
          </label>
          <input
            id="exp-company"
            className={inputClassName}
            value={entry.companyName}
            onChange={(event) => patch({ companyName: event.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="exp-role" className={labelClassName}>
            Job role*
          </label>
          <input
            id="exp-role"
            className={inputClassName}
            value={entry.jobRole}
            onChange={(event) => patch({ jobRole: event.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="exp-industry" className={labelClassName}>
            Industry*
          </label>
          <input
            id="exp-industry"
            className={inputClassName}
            value={entry.industry}
            onChange={(event) => patch({ industry: event.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="exp-start" className={labelClassName}>
            Start date*
          </label>
          <PostJobDatePicker
            id="exp-start"
            value={entry.startDate}
            placeholder="DD/MM/YYYY"
            compact
            maxDate={todayIso}
            onChange={(startDate) =>
              patch({
                startDate,
                endDate:
                  entry.endDate && entry.endDate < startDate ? "" : entry.endDate,
              })
            }
            aria-label="Experience start date"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="exp-end" className={labelClassName}>
            End date{entry.currentlyWorking ? "" : "*"}
          </label>
          {entry.currentlyWorking ? (
            <div
              id="exp-end"
              className="flex h-11 items-center rounded-lg border border-border-subtle bg-hero-bg px-3 text-sm text-muted"
            >
              Present
            </div>
          ) : (
            <PostJobDatePicker
              id="exp-end"
              value={entry.endDate}
              placeholder="DD/MM/YYYY"
              compact
              minDate={entry.startDate || undefined}
              maxDate={todayIso}
              onChange={(endDate) => patch({ endDate })}
              aria-label="Experience end date"
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={entry.currentlyWorking}
              onChange={(event) =>
                patch({
                  currentlyWorking: event.target.checked,
                  endDate: event.target.checked ? "" : entry.endDate,
                })
              }
            />
            Currently working here
          </label>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="exp-duration" className={labelClassName}>
            Duration
          </label>
          <input
            id="exp-duration"
            className={inputClassName}
            value={entry.duration}
            placeholder="e.g. 2 years"
            onChange={(event) => patch({ duration: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="exp-salary" className={labelClassName}>
            Salary
          </label>
          <input
            id="exp-salary"
            className={inputClassName}
            value={entry.salary}
            onChange={(event) =>
              patch({
                salary: event.target.value.replace(/\D/g, "").slice(0, 8),
              })
            }
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="exp-location" className={labelClassName}>
            Location*
          </label>
          <input
            id="exp-location"
            className={inputClassName}
            value={entry.location}
            onChange={(event) => patch({ location: event.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="exp-responsibilities" className={labelClassName}>
            Responsibilities
          </label>
          <textarea
            id="exp-responsibilities"
            rows={3}
            className={`${inputClassName} min-h-[5rem] resize-y py-2.5`}
            value={entry.responsibilities ?? ""}
            onChange={(event) =>
              patch({ responsibilities: event.target.value })
            }
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="exp-achievements" className={labelClassName}>
            Achievements
          </label>
          <textarea
            id="exp-achievements"
            rows={3}
            className={`${inputClassName} min-h-[5rem] resize-y py-2.5`}
            value={entry.achievements ?? ""}
            onChange={(event) => patch({ achievements: event.target.value })}
          />
        </div>
      </form>
    </JobSeekerProfileDialog>
  );
}

function EducationModal({
  jobSeeker,
  isSaving,
  onClose,
  onSave,
}: Omit<JobSeekerProfileEditModalsProps, "activeModal">) {
  const [education, setEducation] = useState<JobSeekerEducation>(
    jobSeeker.education ?? { ...EMPTY_EDUCATION },
  );

  useEffect(() => {
    setEducation(jobSeeker.education ?? { ...EMPTY_EDUCATION });
  }, [jobSeeker.education]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ education });
    onClose();
  };

  return (
    <JobSeekerProfileDialog
      title="Education"
      description="Update your highest qualification."
      onClose={onClose}
      footer={
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogFooter onClose={onClose} isSaving={isSaving} />
        </form>
      }
    >
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <EmployerRegisterSearchableSelect
          id="profile-edu-level"
          label="Education level*"
          value={education.level}
          placeholder="Select education level"
          options={JOB_SEEKER_EDUCATION_OPTIONS}
          onChange={(value) =>
            setEducation({
              ...EMPTY_EDUCATION,
              level: value as JobSeekerEducationLevel,
            })
          }
          required
        />
        <div className="grid gap-4">
          {renderEducationFields(education, (patch) =>
            setEducation((current) => ({ ...current, ...patch })),
          )}
        </div>
      </form>
    </JobSeekerProfileDialog>
  );
}

function SkillsModal({
  jobSeeker,
  isSaving,
  onClose,
  onSave,
}: Omit<JobSeekerProfileEditModalsProps, "activeModal">) {
  const [raw, setRaw] = useState((jobSeeker.skills ?? []).join(", "));

  useEffect(() => {
    setRaw((jobSeeker.skills ?? []).join(", "));
  }, [jobSeeker.skills]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const skills = raw
      .split(/[,;\n]/)
      .map((skill) => skill.trim())
      .filter(Boolean)
      .filter((skill, index, list) => list.indexOf(skill) === index);
    await onSave({ skills });
    onClose();
  };

  return (
    <JobSeekerProfileDialog
      title="Skills"
      description="Separate skills with commas."
      onClose={onClose}
      footer={
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogFooter onClose={onClose} isSaving={isSaving} />
        </form>
      }
    >
      <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="profile-skills" className={labelClassName}>
          Your skills
        </label>
        <textarea
          id="profile-skills"
          rows={5}
          className={`${inputClassName} min-h-[7rem] resize-y py-2.5`}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder="e.g. Customer service, Excel, Hindi communication"
        />
      </form>
    </JobSeekerProfileDialog>
  );
}

function PreferencesModal({
  jobSeeker,
  isSaving,
  onClose,
  onSave,
}: Omit<JobSeekerProfileEditModalsProps, "activeModal">) {
  const [jobRole, setJobRole] = useState(jobSeeker.jobRole ?? "");
  const [jobType, setJobType] = useState(jobSeeker.jobType ?? "");
  const [workMode, setWorkMode] = useState(jobSeeker.workMode ?? "");
  const [preferredJobLocation, setPreferredJobLocation] = useState(
    jobSeeker.preferredJobLocation ?? "",
  );
  const [expectedSalary, setExpectedSalary] = useState(
    typeof jobSeeker.expectedSalary === "number"
      ? String(jobSeeker.expectedSalary)
      : "",
  );
  const [expectedSalaryPeriod, setExpectedSalaryPeriod] = useState(
    jobSeeker.expectedSalaryPeriod ?? "per-month",
  );
  const [city, setCity] = useState(jobSeeker.city ?? "");
  const [state, setState] = useState(jobSeeker.state ?? "");
  const [pincode, setPincode] = useState(jobSeeker.pincode ?? "");
  const [languages, setLanguages] = useState<JobSeekerLanguage[]>(
    jobSeeker.languages ?? [],
  );
  const [availabilityStatus, setAvailabilityStatus] = useState(
    jobSeeker.availabilityStatus ?? "",
  );

  useEffect(() => {
    setJobRole(jobSeeker.jobRole ?? "");
    setJobType(jobSeeker.jobType ?? "");
    setWorkMode(jobSeeker.workMode ?? "");
    setPreferredJobLocation(jobSeeker.preferredJobLocation ?? "");
    setExpectedSalary(
      typeof jobSeeker.expectedSalary === "number"
        ? String(jobSeeker.expectedSalary)
        : "",
    );
    setExpectedSalaryPeriod(jobSeeker.expectedSalaryPeriod ?? "per-month");
    setCity(jobSeeker.city ?? "");
    setState(jobSeeker.state ?? "");
    setPincode(jobSeeker.pincode ?? "");
    setLanguages(jobSeeker.languages ?? []);
    setAvailabilityStatus(jobSeeker.availabilityStatus ?? "");
  }, [jobSeeker]);

  const toggleLanguage = (value: JobSeekerLanguage) => {
    setLanguages((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const salaryNumber = Number(expectedSalary.replace(/\D/g, ""));
    await onSave({
      jobRole: jobRole.trim(),
      jobType: (jobType || undefined) as JobSeekerJobType | undefined,
      workMode: (workMode || undefined) as JobSeekerWorkMode | undefined,
      preferredJobLocation: preferredJobLocation.trim(),
      expectedSalary: salaryNumber > 0 ? salaryNumber : null,
      expectedSalaryPeriod:
        expectedSalaryPeriod === "per-year" ? "per-year" : "per-month",
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      languages,
      availabilityStatus: (availabilityStatus ||
        null) as JobSeekerAvailabilityStatus | null,
    });
    onClose();
  };

  return (
    <JobSeekerProfileDialog
      title="Career preferences"
      description="Help employers match you with the right roles."
      onClose={onClose}
      wide
      footer={
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogFooter onClose={onClose} isSaving={isSaving} />
        </form>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="pref-role" className={labelClassName}>
            Job role*
          </label>
          <input
            id="pref-role"
            className={inputClassName}
            value={jobRole}
            onChange={(event) => setJobRole(event.target.value)}
            required
          />
        </div>
        <EmployerRegisterSearchableSelect
          id="pref-job-type"
          label="Job type"
          value={jobType}
          placeholder="Select job type"
          options={JOB_SEEKER_JOB_TYPE_OPTIONS}
          onChange={setJobType}
        />
        <EmployerRegisterSearchableSelect
          id="pref-work-mode"
          label="Work mode"
          value={workMode}
          placeholder="Select work mode"
          options={JOB_SEEKER_WORK_MODE_OPTIONS}
          onChange={setWorkMode}
        />
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="pref-location" className={labelClassName}>
            Preferred job location*
          </label>
          <input
            id="pref-location"
            className={inputClassName}
            value={preferredJobLocation}
            onChange={(event) => setPreferredJobLocation(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pref-salary" className={labelClassName}>
            Expected salary*
          </label>
          <input
            id="pref-salary"
            className={inputClassName}
            value={expectedSalary}
            onChange={(event) =>
              setExpectedSalary(event.target.value.replace(/\D/g, "").slice(0, 9))
            }
            required
          />
        </div>
        <EmployerRegisterSearchableSelect
          id="pref-salary-period"
          label="Salary period"
          value={expectedSalaryPeriod}
          placeholder="Select period"
          options={JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS}
          onChange={(value) =>
            setExpectedSalaryPeriod(value === "per-year" ? "per-year" : "per-month")
          }
        />
        <div className="space-y-1.5">
          <label htmlFor="pref-city" className={labelClassName}>
            Current city
          </label>
          <input
            id="pref-city"
            className={inputClassName}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pref-state" className={labelClassName}>
            State
          </label>
          <input
            id="pref-state"
            className={inputClassName}
            value={state}
            onChange={(event) => setState(event.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="pref-pincode" className={labelClassName}>
            Pincode
          </label>
          <input
            id="pref-pincode"
            className={inputClassName}
            value={pincode}
            onChange={(event) =>
              setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <p className={labelClassName}>Languages</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {JOB_SEEKER_LANGUAGE_OPTIONS.map((option) => {
              const selected = languages.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      selected
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border-subtle bg-surface text-foreground hover:bg-hero-bg",
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
        </div>
        <div className="sm:col-span-2">
          <EmployerRegisterSearchableSelect
            id="pref-availability"
            label="Availability"
            value={availabilityStatus}
            placeholder="Select availability"
            options={JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS}
            onChange={setAvailabilityStatus}
          />
        </div>
      </form>
    </JobSeekerProfileDialog>
  );
}

function VisibilityModal({
  jobSeeker,
  isSaving,
  onClose,
  onSave,
}: Omit<JobSeekerProfileEditModalsProps, "activeModal">) {
  const [visibility, setVisibility] = useState<JobSeekerProfileVisibility>(
    jobSeeker.profileVisibility ?? "visible",
  );

  useEffect(() => {
    setVisibility(jobSeeker.profileVisibility ?? "visible");
  }, [jobSeeker.profileVisibility]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({ profileVisibility: visibility });
    onClose();
  };

  return (
    <JobSeekerProfileDialog
      title="Profile visibility"
      description="Control who can discover your profile."
      onClose={onClose}
      footer={
        <form onSubmit={(event) => void handleSubmit(event)}>
          <DialogFooter onClose={onClose} isSaving={isSaving} />
        </form>
      }
    >
      <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="space-y-2">
          <legend className="sr-only">Profile visibility</legend>
          {JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                visibility === option.value
                  ? "border-primary bg-primary-light/60"
                  : "border-border-subtle bg-hero-bg hover:border-primary/25",
              )}
            >
              <input
                type="radio"
                name="profile-visibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={() => setVisibility(option.value)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </form>
    </JobSeekerProfileDialog>
  );
}

export function JobSeekerProfileEditModals(props: JobSeekerProfileEditModalsProps) {
  const { activeModal } = props;
  if (!activeModal) {
    return null;
  }

  switch (activeModal.type) {
    case "about":
      return <AboutModal {...props} />;
    case "experience":
      return <ExperienceModal {...props} activeModal={activeModal} />;
    case "education":
      return <EducationModal {...props} />;
    case "skills":
      return <SkillsModal {...props} />;
    case "preferences":
      return <PreferencesModal {...props} />;
    case "visibility":
      return <VisibilityModal {...props} />;
    default:
      return null;
  }
}
