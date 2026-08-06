import type {
  JOB_SEEKER_EDUCATION_LEVELS,
  JOB_SEEKER_EXPERIENCE_TYPES,
  JOB_SEEKER_GENDERS,
  JOB_SEEKER_JOB_ROLES,
  JOB_SEEKER_JOB_TYPES,
  JOB_SEEKER_LANGUAGES,
  JOB_SEEKER_REGISTRATION_STATUSES,
  JOB_SEEKER_WORK_MODES,
} from "../../constants/job-seeker.constants.js";
import type {
  CompleteJobSeekerRegistrationSchema,
  SaveJobSeekerPreferencesSchema,
  UpdateJobSeekerProfileSchema,
} from "./job-seeker.validation.js";

export type JobSeekerRegistrationStatus =
  (typeof JOB_SEEKER_REGISTRATION_STATUSES)[number];

export type JobSeekerGender = (typeof JOB_SEEKER_GENDERS)[number];

export type JobSeekerJobRole = (typeof JOB_SEEKER_JOB_ROLES)[number];

export type JobSeekerJobType = (typeof JOB_SEEKER_JOB_TYPES)[number];

export type JobSeekerWorkMode = (typeof JOB_SEEKER_WORK_MODES)[number];

export type JobSeekerEducationLevel =
  (typeof JOB_SEEKER_EDUCATION_LEVELS)[number];

export type JobSeekerExperienceType =
  (typeof JOB_SEEKER_EXPERIENCE_TYPES)[number];

export type JobSeekerLanguage = (typeof JOB_SEEKER_LANGUAGES)[number];

export type RegisterJobSeekerInput = {
  fullName: string;
  whatsappNumber: string;
};

export type VerifyJobSeekerOtpInput = {
  jobSeekerId: string;
  otp: string;
};

export type ResendJobSeekerOtpInput = {
  jobSeekerId: string;
};

export type SaveJobSeekerPreferencesInput = SaveJobSeekerPreferencesSchema;

export type CompleteJobSeekerRegistrationInput =
  CompleteJobSeekerRegistrationSchema;

export type UpdateJobSeekerProfileInput = UpdateJobSeekerProfileSchema;

export type JobSeekerLoginSendOtpInput = {
  whatsappNumber: string;
};

export type JobSeekerLoginVerifyOtpInput = {
  whatsappNumber: string;
  otp: string;
};
