"use client";

import {
  EMPTY_EDUCATION,
  createEmptyExperience,
} from "@/components/job-seeker-register/JobSeekerRegisterEducationExperienceStep";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { JobSeekerProfileDialog } from "@/components/job-seeker-profile/JobSeekerProfileDialog";
import { PostJobDatePicker } from "@/components/post-job/PostJobDatePicker";
import {
  JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS,
  JOB_SEEKER_EDUCATION_OPTIONS,
  JOB_SEEKER_GENDER_OPTIONS,
  JOB_SEEKER_JOB_TYPE_OPTIONS,
  JOB_SEEKER_LANGUAGE_OPTIONS,
  JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS,
  JOB_SEEKER_WORK_MODE_OPTIONS,
} from "@/constants/job-seeker-register";
import type { PublicResume } from "@/types/job-seeker-resume";
import type {
  JobSeekerAvailabilityStatus,
  JobSeekerEducation,
  JobSeekerEducationLevel,
  JobSeekerExperienceEntry,
  JobSeekerExperienceType,
  JobSeekerGender,
  JobSeekerJobType,
  JobSeekerLanguage,
  JobSeekerPublic,
  JobSeekerSalaryPeriod,
  JobSeekerWorkMode,
  UpdateJobSeekerProfileInput,
} from "@/types/job-seeker";
import { cn } from "@/utils/cn";
import {
  formatWhatsappNumber,
  resolveProfessionalSummary,
  resolveSkills,
} from "@/utils/job-seeker-profile";
import { showAppToast } from "@/utils/share-job";
import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";

type EditResumeModalProps = {
  isOpen: boolean;
  jobSeeker: JobSeekerPublic;
  resume: PublicResume | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: UpdateJobSeekerProfileInput) => Promise<void>;
};

const inputClassName =
  "flex h-11 w-full rounded-lg border border-border-subtle bg-hero-bg px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "text-sm font-semibold text-foreground";

const sectionClassName =
  "space-y-3 rounded-xl border border-border-subtle bg-hero-bg/40 p-4";

function normalizeExperienceEntry(
  entry: JobSeekerExperienceEntry,
): JobSeekerExperienceEntry {
  return {
    companyName: entry.companyName.trim(),
    jobRole: entry.jobRole.trim(),
    industry: entry.industry.trim(),
    startDate: entry.startDate.trim(),
    endDate: entry.currentlyWorking ? "" : entry.endDate.trim(),
    currentlyWorking: Boolean(entry.currentlyWorking),
    duration: entry.duration.trim(),
    salary: entry.salary.trim(),
    location: entry.location.trim(),
    responsibilities: (entry.responsibilities ?? "").trim(),
    achievements: (entry.achievements ?? "").trim(),
  };
}

function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function sameEducation(
  a: JobSeekerEducation | null | undefined,
  b: JobSeekerEducation | null | undefined,
): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function sameExperiences(
  a: JobSeekerExperienceEntry[],
  b: JobSeekerExperienceEntry[],
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
      {children}
    </h3>
  );
}

export function EditResumeModal({
  isOpen,
  jobSeeker,
  resume,
  isSaving,
  onClose,
  onSave,
}: EditResumeModalProps) {
  const formId = useId();

  const initialSummary = useMemo(
    () => resolveProfessionalSummary(jobSeeker, resume),
    [jobSeeker, resume],
  );
  const initialSkills = useMemo(
    () => resolveSkills(jobSeeker, resume),
    [jobSeeker, resume],
  );
  const careerObjectivePreview = useMemo(() => {
    const json = resume?.resumeJson;
    if (
      json &&
      "sections" in json &&
      typeof json.sections?.careerObjective === "string"
    ) {
      return json.sections.careerObjective;
    }
    return "";
  }, [resume]);

  const [fullName, setFullName] = useState(jobSeeker.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(jobSeeker.dateOfBirth ?? "");
  const [gender, setGender] = useState(jobSeeker.gender ?? "");
  const [summary, setSummary] = useState(initialSummary);
  const [skillsRaw, setSkillsRaw] = useState(initialSkills.join(", "));
  const [education, setEducation] = useState<JobSeekerEducation>(
    jobSeeker.education ?? { ...EMPTY_EDUCATION },
  );
  const [experienceType, setExperienceType] = useState<JobSeekerExperienceType>(
    jobSeeker.experienceType ?? "fresher",
  );
  const [experiences, setExperiences] = useState<JobSeekerExperienceEntry[]>(
    (jobSeeker.experiences ?? []).map(normalizeExperienceEntry),
  );
  const [languages, setLanguages] = useState<JobSeekerLanguage[]>(
    jobSeeker.languages ?? [],
  );
  const [jobRole, setJobRole] = useState(jobSeeker.jobRole ?? "");
  const [preferredJobLocation, setPreferredJobLocation] = useState(
    jobSeeker.preferredJobLocation ?? "",
  );
  const [expectedSalary, setExpectedSalary] = useState(
    typeof jobSeeker.expectedSalary === "number"
      ? String(jobSeeker.expectedSalary)
      : "",
  );
  const [expectedSalaryPeriod, setExpectedSalaryPeriod] = useState<
    JobSeekerSalaryPeriod
  >(jobSeeker.expectedSalaryPeriod ?? "per-month");
  const [jobType, setJobType] = useState(jobSeeker.jobType ?? "");
  const [workMode, setWorkMode] = useState(jobSeeker.workMode ?? "");
  const [availabilityStatus, setAvailabilityStatus] = useState(
    jobSeeker.availabilityStatus ?? "",
  );
  const [city, setCity] = useState(jobSeeker.city ?? "");
  const [state, setState] = useState(jobSeeker.state ?? "");
  const [pincode, setPincode] = useState(jobSeeker.pincode ?? "");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFullName(jobSeeker.fullName ?? "");
    setDateOfBirth(jobSeeker.dateOfBirth ?? "");
    setGender(jobSeeker.gender ?? "");
    setSummary(resolveProfessionalSummary(jobSeeker, resume));
    setSkillsRaw(resolveSkills(jobSeeker, resume).join(", "));
    setEducation(jobSeeker.education ?? { ...EMPTY_EDUCATION });
    setExperienceType(jobSeeker.experienceType ?? "fresher");
    setExperiences(
      (jobSeeker.experiences ?? []).map(normalizeExperienceEntry),
    );
    setLanguages(jobSeeker.languages ?? []);
    setJobRole(jobSeeker.jobRole ?? "");
    setPreferredJobLocation(jobSeeker.preferredJobLocation ?? "");
    setExpectedSalary(
      typeof jobSeeker.expectedSalary === "number"
        ? String(jobSeeker.expectedSalary)
        : "",
    );
    setExpectedSalaryPeriod(jobSeeker.expectedSalaryPeriod ?? "per-month");
    setJobType(jobSeeker.jobType ?? "");
    setWorkMode(jobSeeker.workMode ?? "");
    setAvailabilityStatus(jobSeeker.availabilityStatus ?? "");
    setCity(jobSeeker.city ?? "");
    setState(jobSeeker.state ?? "");
    setPincode(jobSeeker.pincode ?? "");
  }, [isOpen, jobSeeker, resume]);

  if (!isOpen) {
    return null;
  }

  const toggleLanguage = (value: JobSeekerLanguage) => {
    setLanguages((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const buildPayload = (): UpdateJobSeekerProfileInput | null => {
    const payload: UpdateJobSeekerProfileInput = {};
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      showAppToast("Full name is required.", "error");
      return null;
    }

    if (trimmedName !== (jobSeeker.fullName ?? "").trim()) {
      payload.fullName = trimmedName;
    }

    const nextDob = dateOfBirth.trim();
    const prevDob = (jobSeeker.dateOfBirth ?? "").trim();
    if (nextDob !== prevDob) {
      if (nextDob) {
        payload.dateOfBirth = nextDob;
      }
    }

    const nextGender = gender as JobSeekerGender | "";
    if (nextGender && nextGender !== (jobSeeker.gender ?? "")) {
      payload.gender = nextGender;
    }

    const nextSummary = summary.trim();
    const prevSummary = resolveProfessionalSummary(jobSeeker, resume).trim();
    if (nextSummary !== prevSummary) {
      payload.professionalSummary = nextSummary;
    }

    const nextSkills = skillsRaw
      .split(/[,;\n]/)
      .map((skill) => skill.trim())
      .filter(Boolean)
      .filter((skill, index, list) => list.indexOf(skill) === index);
    const prevSkills = resolveSkills(jobSeeker, resume);
    if (!sameStringArray(nextSkills, prevSkills)) {
      payload.skills = nextSkills;
    }

    const nextEducation = education;
    const prevEducation = jobSeeker.education ?? null;
    if (!sameEducation(nextEducation, prevEducation)) {
      payload.education = nextEducation;
    }

    const nextExperienceType = experienceType;
    if (nextExperienceType !== (jobSeeker.experienceType ?? "fresher")) {
      payload.experienceType = nextExperienceType;
    }

    const nextExperiences =
      nextExperienceType === "fresher"
        ? []
        : experiences.map(normalizeExperienceEntry);
    const prevExperiences = (jobSeeker.experiences ?? []).map(
      normalizeExperienceEntry,
    );
    if (
      nextExperienceType === "experienced" &&
      nextExperiences.length < 1
    ) {
      showAppToast("Add at least one work experience.", "error");
      return null;
    }
    if (
      nextExperienceType === "experienced" &&
      nextExperiences.some((entry) => !entry.salary.trim())
    ) {
      showAppToast("Salary is required for each work experience.", "error");
      return null;
    }
    if (
      nextExperienceType === "fresher" &&
      (jobSeeker.experienceType ?? "fresher") !== "fresher"
    ) {
      payload.experienceType = "fresher";
    } else if (!sameExperiences(nextExperiences, prevExperiences)) {
      if (nextExperienceType === "experienced") {
        payload.experienceType = "experienced";
        payload.experiences = nextExperiences;
      }
    }

    const nextLanguages = languages;
    const prevLanguages = jobSeeker.languages ?? [];
    if (!sameStringArray(nextLanguages, prevLanguages)) {
      if (nextLanguages.length < 1) {
        showAppToast("Select at least one language.", "error");
        return null;
      }
      payload.languages = nextLanguages;
    }

    const trimmedRole = jobRole.trim();
    if (!trimmedRole) {
      showAppToast("Preferred role is required.", "error");
      return null;
    }
    if (trimmedRole !== (jobSeeker.jobRole ?? "").trim()) {
      payload.jobRole = trimmedRole;
    }

    const trimmedLocation = preferredJobLocation.trim();
    if (!trimmedLocation) {
      showAppToast("Preferred location is required.", "error");
      return null;
    }
    if (trimmedLocation !== (jobSeeker.preferredJobLocation ?? "").trim()) {
      payload.preferredJobLocation = trimmedLocation;
    }

    const salaryNumber = Number(expectedSalary.replace(/\D/g, ""));
    const nextSalary = salaryNumber > 0 ? salaryNumber : null;
    const prevSalary =
      typeof jobSeeker.expectedSalary === "number"
        ? jobSeeker.expectedSalary
        : null;
    if (nextSalary !== prevSalary) {
      payload.expectedSalary = nextSalary;
    }

    if (
      expectedSalaryPeriod !==
      (jobSeeker.expectedSalaryPeriod ?? "per-month")
    ) {
      payload.expectedSalaryPeriod = expectedSalaryPeriod;
    }

    if (jobType && jobType !== (jobSeeker.jobType ?? "")) {
      payload.jobType = jobType as JobSeekerJobType;
    }
    if (workMode && workMode !== (jobSeeker.workMode ?? "")) {
      payload.workMode = workMode as JobSeekerWorkMode;
    }

    const nextAvailability = (availabilityStatus ||
      null) as JobSeekerAvailabilityStatus | null;
    if (nextAvailability !== (jobSeeker.availabilityStatus ?? null)) {
      payload.availabilityStatus = nextAvailability;
    }

    if (city.trim() !== (jobSeeker.city ?? "").trim()) {
      payload.city = city.trim();
    }
    if (state.trim() !== (jobSeeker.state ?? "").trim()) {
      payload.state = state.trim();
    }
    if (pincode.trim() !== (jobSeeker.pincode ?? "").trim()) {
      payload.pincode = pincode.trim();
    }

    return payload;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) {
      return;
    }
    if (Object.keys(payload).length === 0) {
      showAppToast("No changes to save.", "success");
      onClose();
      return;
    }
    await onSave(payload);
    onClose();
  };

  return (
    <JobSeekerProfileDialog
      title="Edit Resume"
      description="Update the profile fields that power your AsliJobs resume. Only changed fields are saved."
      onClose={onClose}
      wide
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      }
    >
      <form
        id={formId}
        className="space-y-5"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <section className={sectionClassName}>
          <SectionHeading>Personal Information</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="edit-resume-full-name" className={labelClassName}>
                Full Name*
              </label>
              <input
                id="edit-resume-full-name"
                className={inputClassName}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-resume-phone" className={labelClassName}>
                Phone
              </label>
              <input
                id="edit-resume-phone"
                className={inputClassName}
                value={formatWhatsappNumber(jobSeeker.whatsappNumber)}
                disabled
                readOnly
              />
              <p className="text-xs text-muted">
                Verified WhatsApp number cannot be changed here.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-resume-dob" className={labelClassName}>
                Date of Birth
              </label>
              <PostJobDatePicker
                id="edit-resume-dob"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                placeholder="Select date of birth"
                compact
                aria-label="Date of birth"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="edit-resume-gender" className={labelClassName}>
                Gender
              </label>
              <select
                id="edit-resume-gender"
                className={inputClassName}
                value={gender}
                onChange={(event) => setGender(event.target.value)}
              >
                <option value="">Select gender</option>
                {JOB_SEEKER_GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className={sectionClassName}>
          <SectionHeading>Professional Summary</SectionHeading>
          <textarea
            id="edit-resume-summary"
            rows={5}
            className={`${inputClassName} min-h-[8rem] resize-y py-2.5`}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Describe your experience, strengths, and goals…"
          />
        </section>

        <section className={sectionClassName}>
          <SectionHeading>Career Objective</SectionHeading>
          <p className="text-sm leading-relaxed text-muted">
            {careerObjectivePreview ||
              "Generated from your preferred role, location, work mode, and salary after you save."}
          </p>
          <p className="text-xs text-muted">
            Edit Career Preferences below to update this section on regenerate.
          </p>
        </section>

        <section className={sectionClassName}>
          <SectionHeading>Skills</SectionHeading>
          <textarea
            id="edit-resume-skills"
            rows={4}
            className={`${inputClassName} min-h-[6rem] resize-y py-2.5`}
            value={skillsRaw}
            onChange={(event) => setSkillsRaw(event.target.value)}
            placeholder="e.g. Carpentry, Measuring, Hindi"
          />
          <p className="text-xs text-muted">Separate skills with commas.</p>
        </section>

        <section className={sectionClassName}>
          <SectionHeading>Education</SectionHeading>
          <EmployerRegisterSearchableSelect
            id="edit-resume-edu-level"
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
          <div className="grid gap-3 sm:grid-cols-2">
            {education.level !== "no_formal_education" ? (
              <>
                {education.level === "below_10th" ||
                education.level === "10th_pass" ? (
                  <div className="space-y-1.5">
                    <label className={labelClassName} htmlFor="edu-school">
                      School Name*
                    </label>
                    <input
                      id="edu-school"
                      className={inputClassName}
                      value={education.schoolName}
                      onChange={(event) =>
                        setEducation((current) => ({
                          ...current,
                          schoolName: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
                {education.level === "10th_pass" ? (
                  <div className="space-y-1.5">
                    <label className={labelClassName} htmlFor="edu-board">
                      Board*
                    </label>
                    <input
                      id="edu-board"
                      className={inputClassName}
                      value={education.board}
                      onChange={(event) =>
                        setEducation((current) => ({
                          ...current,
                          board: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
                {(
                  [
                    "intermediate",
                    "diploma",
                    "graduation",
                    "post_graduation",
                  ] as JobSeekerEducationLevel[]
                ).includes(education.level) ? (
                  <div className="space-y-1.5">
                    <label className={labelClassName} htmlFor="edu-college">
                      College Name*
                    </label>
                    <input
                      id="edu-college"
                      className={inputClassName}
                      value={education.collegeName}
                      onChange={(event) =>
                        setEducation((current) => ({
                          ...current,
                          collegeName: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
                {education.level === "iti" ? (
                  <>
                    <div className="space-y-1.5">
                      <label className={labelClassName} htmlFor="edu-institute">
                        Institute Name*
                      </label>
                      <input
                        id="edu-institute"
                        className={inputClassName}
                        value={education.instituteName}
                        onChange={(event) =>
                          setEducation((current) => ({
                            ...current,
                            instituteName: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClassName} htmlFor="edu-trade">
                        Trade*
                      </label>
                      <input
                        id="edu-trade"
                        className={inputClassName}
                        value={education.trade}
                        onChange={(event) =>
                          setEducation((current) => ({
                            ...current,
                            trade: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                ) : null}
                {education.level === "intermediate" ? (
                  <div className="space-y-1.5">
                    <label className={labelClassName} htmlFor="edu-stream">
                      Stream*
                    </label>
                    <input
                      id="edu-stream"
                      className={inputClassName}
                      value={education.stream}
                      onChange={(event) =>
                        setEducation((current) => ({
                          ...current,
                          stream: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
                {education.level === "diploma" ? (
                  <div className="space-y-1.5">
                    <label className={labelClassName} htmlFor="edu-branch">
                      Branch*
                    </label>
                    <input
                      id="edu-branch"
                      className={inputClassName}
                      value={education.branch}
                      onChange={(event) =>
                        setEducation((current) => ({
                          ...current,
                          branch: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
                {(
                  ["graduation", "post_graduation"] as JobSeekerEducationLevel[]
                ).includes(education.level) ? (
                  <>
                    <div className="space-y-1.5">
                      <label className={labelClassName} htmlFor="edu-degree">
                        Degree*
                      </label>
                      <input
                        id="edu-degree"
                        className={inputClassName}
                        value={education.degree}
                        onChange={(event) =>
                          setEducation((current) => ({
                            ...current,
                            degree: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className={labelClassName}
                        htmlFor="edu-specialization"
                      >
                        Specialization*
                      </label>
                      <input
                        id="edu-specialization"
                        className={inputClassName}
                        value={education.specialization}
                        onChange={(event) =>
                          setEducation((current) => ({
                            ...current,
                            specialization: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                ) : null}
                {education.level !== "below_10th" ? (
                  <div className="space-y-1.5">
                    <label className={labelClassName} htmlFor="edu-year">
                      Passing Year*
                    </label>
                    <input
                      id="edu-year"
                      className={inputClassName}
                      value={education.passingYear}
                      placeholder="YYYY"
                      onChange={(event) =>
                        setEducation((current) => ({
                          ...current,
                          passingYear: event.target.value,
                        }))
                      }
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted sm:col-span-2">
                No additional education details are required for this level.
              </p>
            )}
          </div>
        </section>

        <section className={sectionClassName}>
          <SectionHeading>Experience</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "fresher", label: "Fresher" },
                { value: "experienced", label: "Experienced" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition-colors",
                  experienceType === option.value
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border-subtle bg-surface text-foreground hover:bg-hero-bg",
                )}
                onClick={() => setExperienceType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {experienceType === "fresher" ? (
            <p className="text-sm text-muted">
              Fresher profiles show as Fresher on the resume. Existing experience
              records are cleared only when you save as Fresher.
            </p>
          ) : (
            <div className="space-y-3">
              {experiences.map((entry, index) => (
                <div
                  key={`experience-${index}`}
                  className="space-y-3 rounded-lg border border-border-subtle bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Experience {index + 1}
                    </p>
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-pin-state hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                      onClick={() =>
                        setExperiences((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className={labelClassName}>Company*</label>
                      <input
                        className={inputClassName}
                        value={entry.companyName}
                        onChange={(event) =>
                          setExperiences((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, companyName: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClassName}>Job role*</label>
                      <input
                        className={inputClassName}
                        value={entry.jobRole}
                        onChange={(event) =>
                          setExperiences((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, jobRole: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClassName}>Industry</label>
                      <input
                        className={inputClassName}
                        value={entry.industry}
                        onChange={(event) =>
                          setExperiences((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, industry: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClassName}>Salary*</label>
                      <input
                        className={inputClassName}
                        value={entry.salary}
                        onChange={(event) =>
                          setExperiences((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    salary: event.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 8),
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className={labelClassName}>Location*</label>
                      <input
                        className={inputClassName}
                        value={entry.location}
                        onChange={(event) =>
                          setExperiences((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, location: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground hover:bg-hero-bg"
                onClick={() =>
                  setExperiences((current) => [
                    ...current,
                    createEmptyExperience(),
                  ])
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add experience
              </button>
            </div>
          )}
        </section>

        <section className={sectionClassName}>
          <SectionHeading>Languages</SectionHeading>
          <ul className="flex flex-wrap gap-2">
            {JOB_SEEKER_LANGUAGE_OPTIONS.map((option) => {
              const selected = languages.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors",
                      selected
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border-subtle bg-surface text-foreground hover:bg-hero-bg",
                    )}
                    onClick={() => toggleLanguage(option.value)}
                    aria-pressed={selected}
                  >
                    {selected ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : null}
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={sectionClassName}>
          <SectionHeading>Career Preferences</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="edit-resume-role" className={labelClassName}>
                Preferred Role*
              </label>
              <input
                id="edit-resume-role"
                className={inputClassName}
                value={jobRole}
                onChange={(event) => setJobRole(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="edit-resume-location" className={labelClassName}>
                Preferred Location*
              </label>
              <input
                id="edit-resume-location"
                className={inputClassName}
                value={preferredJobLocation}
                onChange={(event) =>
                  setPreferredJobLocation(event.target.value)
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-resume-city" className={labelClassName}>
                City
              </label>
              <input
                id="edit-resume-city"
                className={inputClassName}
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-resume-state" className={labelClassName}>
                State
              </label>
              <input
                id="edit-resume-state"
                className={inputClassName}
                value={state}
                onChange={(event) => setState(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-resume-pincode" className={labelClassName}>
                Pincode
              </label>
              <input
                id="edit-resume-pincode"
                className={inputClassName}
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-resume-salary" className={labelClassName}>
                Expected Salary
              </label>
              <input
                id="edit-resume-salary"
                className={inputClassName}
                value={expectedSalary}
                onChange={(event) =>
                  setExpectedSalary(
                    event.target.value.replace(/\D/g, "").slice(0, 8),
                  )
                }
                inputMode="numeric"
              />
            </div>
            <EmployerRegisterSearchableSelect
              id="edit-resume-salary-period"
              label="Salary period"
              value={expectedSalaryPeriod}
              placeholder="Select period"
              options={[...JOB_SEEKER_REGISTER_SALARY_PERIOD_OPTIONS]}
              onChange={(value) =>
                setExpectedSalaryPeriod(
                  value === "per-year" ? "per-year" : "per-month",
                )
              }
            />
            <EmployerRegisterSearchableSelect
              id="edit-resume-job-type"
              label="Job Type"
              value={jobType}
              placeholder="Select job type"
              options={JOB_SEEKER_JOB_TYPE_OPTIONS}
              onChange={setJobType}
            />
            <EmployerRegisterSearchableSelect
              id="edit-resume-work-mode"
              label="Work Mode"
              value={workMode}
              placeholder="Select work mode"
              options={JOB_SEEKER_WORK_MODE_OPTIONS}
              onChange={setWorkMode}
            />
            <EmployerRegisterSearchableSelect
              id="edit-resume-availability"
              label="Availability"
              value={availabilityStatus}
              placeholder="Select availability"
              options={JOB_SEEKER_AVAILABILITY_STATUS_OPTIONS}
              onChange={setAvailabilityStatus}
            />
          </div>
        </section>
      </form>
    </JobSeekerProfileDialog>
  );
}
