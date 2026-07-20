import type {
  JOB_SEEKER_GENDERS,
  JOB_SEEKER_JOB_ROLES,
  JOB_SEEKER_REGISTRATION_STATUSES,
} from "../../constants/job-seeker.constants.js";

export type JobSeekerRegistrationStatus =
  (typeof JOB_SEEKER_REGISTRATION_STATUSES)[number];

export type JobSeekerGender = (typeof JOB_SEEKER_GENDERS)[number];

export type JobSeekerJobRole = (typeof JOB_SEEKER_JOB_ROLES)[number];

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

export type CompleteJobSeekerRegistrationInput = {
  jobSeekerId: string;
  dateOfBirth: string;
  gender: JobSeekerGender;
  pincode: string;
  city: string;
  state: string;
  jobRole: string;
  preferredJobLocation: string;
};

export type JobSeekerLoginSendOtpInput = {
  whatsappNumber: string;
};

export type JobSeekerLoginVerifyOtpInput = {
  whatsappNumber: string;
  otp: string;
};
