export type JobSeekerGender = "male" | "female" | "other";

export type JobSeekerRegistrationStep =
  | "account"
  | "otp"
  | "profile"
  | "complete";

export type JobSeekerPublic = {
  id: string;
  fullName: string;
  whatsappNumber: string;
  dateOfBirth: string | null;
  gender: JobSeekerGender | null;
  pincode: string;
  city: string;
  state: string;
  jobRole: string;
  preferredJobLocation: string;
  isWhatsappVerified: boolean;
  registrationStatus: "PENDING" | "COMPLETED" | string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
