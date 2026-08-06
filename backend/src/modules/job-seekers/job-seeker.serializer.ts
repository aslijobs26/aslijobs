import type mongoose from "mongoose";

export type JobSeekerImageAssetPublic = {
  url: string;
  storagePath: string;
  publicId: string;
  storageProvider: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
} | null;

type JobSeekerLike = {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  whatsappNumber: string;
  dateOfBirth?: Date | null;
  gender?: string | null;
  pincode?: string;
  city?: string;
  state?: string;
  jobRole?: string;
  jobType?: string | null;
  workMode?: string | null;
  preferredJobLocation?: string;
  expectedSalary?: number | null;
  expectedSalaryPeriod?: string | null;
  education?: Record<string, unknown> | null;
  experienceType?: string | null;
  experiences?: unknown[];
  languages?: string[];
  availabilityStatus?: string | null;
  professionalSummary?: string | null;
  skills?: string[];
  profileVisibility?: string | null;
  profilePhoto?: {
    url?: string;
    storagePath?: string;
    publicId?: string;
    storageProvider?: string;
    originalName?: string;
    mimeType?: string;
    fileSize?: number;
  } | null;
  isWhatsappVerified: boolean;
  registrationStatus: string;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function toPublicImageAsset(
  asset?: JobSeekerLike["profilePhoto"],
): JobSeekerImageAssetPublic {
  if (!asset?.url?.trim() && !asset?.storagePath?.trim()) {
    return null;
  }

  return {
    url: asset.url ?? "",
    storagePath: asset.storagePath ?? "",
    publicId: asset.publicId ?? "",
    storageProvider: asset.storageProvider ?? "",
    originalName: asset.originalName ?? "",
    mimeType: asset.mimeType ?? "",
    fileSize: asset.fileSize ?? 0,
  };
}

export function toPublicJobSeeker(jobSeeker: JobSeekerLike) {
  return {
    id: jobSeeker._id.toString(),
    fullName: jobSeeker.fullName,
    whatsappNumber: jobSeeker.whatsappNumber,
    dateOfBirth: jobSeeker.dateOfBirth
      ? jobSeeker.dateOfBirth.toISOString().slice(0, 10)
      : null,
    gender: jobSeeker.gender ?? null,
    pincode: jobSeeker.pincode ?? "",
    city: jobSeeker.city ?? "",
    state: jobSeeker.state ?? "",
    jobRole: jobSeeker.jobRole ?? "",
    jobType: jobSeeker.jobType ?? null,
    workMode: jobSeeker.workMode ?? null,
    preferredJobLocation: jobSeeker.preferredJobLocation ?? "",
    expectedSalary: jobSeeker.expectedSalary ?? null,
    expectedSalaryPeriod: jobSeeker.expectedSalaryPeriod ?? "per-month",
    education: jobSeeker.education ?? null,
    experienceType: jobSeeker.experienceType ?? null,
    experiences: jobSeeker.experiences ?? [],
    languages: jobSeeker.languages ?? [],
    availabilityStatus: jobSeeker.availabilityStatus ?? null,
    professionalSummary: jobSeeker.professionalSummary ?? "",
    skills: Array.isArray(jobSeeker.skills)
      ? jobSeeker.skills.filter(
          (skill): skill is string =>
            typeof skill === "string" && skill.trim().length > 0,
        )
      : [],
    profileVisibility: jobSeeker.profileVisibility ?? "visible",
    profilePhoto: toPublicImageAsset(jobSeeker.profilePhoto),
    isWhatsappVerified: jobSeeker.isWhatsappVerified,
    registrationStatus: jobSeeker.registrationStatus,
    lastLoginAt: jobSeeker.lastLoginAt ?? null,
    createdAt: jobSeeker.createdAt,
    updatedAt: jobSeeker.updatedAt,
  };
}

export type PublicJobSeeker = ReturnType<typeof toPublicJobSeeker>;
