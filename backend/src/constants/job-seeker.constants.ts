export const JOB_SEEKER_REGISTRATION_STATUSES = [
  "PENDING",
  "COMPLETED",
] as const;

export const JOB_SEEKER_GENDERS = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
] as const;

export const JOB_SEEKER_JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
] as const;

export const JOB_SEEKER_WORK_MODES = [
  "on-site",
  "work-from-home",
  "hybrid",
  "field-work",
  "any",
] as const;

export const JOB_SEEKER_EDUCATION_LEVELS = [
  "no_formal_education",
  "below_10th",
  "10th_pass",
  "intermediate",
  "iti",
  "diploma",
  "graduation",
  "post_graduation",
] as const;

export const JOB_SEEKER_EXPERIENCE_TYPES = ["fresher", "experienced"] as const;

export const JOB_SEEKER_LANGUAGES = [
  "telugu",
  "english",
  "hindi",
  "kannada",
  "tamil",
  "malayalam",
] as const;

/** Hiring availability — independent of ATS resume generation. */
export const JOB_SEEKER_AVAILABILITY_STATUSES = [
  "immediate",
  "within_7",
  "within_15",
  "within_30",
  "currently_working",
] as const;

export const JOB_SEEKER_AVAILABILITY_STATUS_LABELS: Record<
  (typeof JOB_SEEKER_AVAILABILITY_STATUSES)[number],
  string
> = {
  immediate: "Immediately Available",
  within_7: "Within 7 Days",
  within_15: "Within 15 Days",
  within_30: "Within 30 Days",
  currently_working: "Currently Working",
};

export const JOB_SEEKER_SALARY_PERIODS = ["per-month", "per-year"] as const;

export const JOB_SEEKER_PROFILE_VISIBILITY = [
  "visible",
  "private",
  "recruiter_only",
] as const;

export const JOB_SEEKER_PROFILE_VISIBILITY_LABELS: Record<
  (typeof JOB_SEEKER_PROFILE_VISIBILITY)[number],
  string
> = {
  visible: "Visible to Employers",
  private: "Private",
  recruiter_only: "Recruiter Only",
};

export const JOB_SEEKER_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const JOB_SEEKER_PROFILE_PHOTO_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const JOB_SEEKER_JOB_ROLES = [
  "Delivery Boy",
  "Driver",
  "Sales Executive",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Security Guard",
  "Warehouse Associate",
  "Office Assistant",
  "Housekeeping",
  "Cook",
  "Receptionist",
  "Machine Operator",
  "Data Entry Operator",
  "Helper",
  "Painter",
  "Wall Painter",
  "Spray Painter",
  "Industrial Painter",
  "House Painter",
  "Painting Supervisor",
] as const;
