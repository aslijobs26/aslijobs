import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { OTP_MAX_ATTEMPTS } from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { JOB_SEEKER_JOB_ROLES } from "../../constants/job-seeker.constants.js";
import { AppError } from "../../middleware/error.middleware.js";
import { jwtService } from "../auth/jwt.service.js";
import { JobModel } from "../jobs/job.model.js";
import { otpService } from "../otp/otp.service.js";
import { resumeService } from "../resumes/resume.service.js";
import { JobSeekerModel } from "./job-seeker.model.js";
import { toPublicJobSeeker } from "./job-seeker.serializer.js";
import type {
  CompleteJobSeekerRegistrationInput,
  RegisterJobSeekerInput,
  ResendJobSeekerOtpInput,
  SaveJobSeekerPreferencesInput,
  UpdateJobSeekerProfileInput,
  VerifyJobSeekerOtpInput,
} from "./job-seeker.types.js";
import type { SearchJobSeekerRolesQuery } from "./job-seeker.validation.js";
import { storageService } from "../storage/storage.service.js";
import { JOB_SEEKER_IMAGE_MIME_TYPES } from "../../constants/job-seeker.constants.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function emptyImageAsset() {
  return {
    url: "",
    storagePath: "",
    publicId: "",
    storageProvider: "",
    originalName: "",
    mimeType: "",
    fileSize: 0,
  };
}

async function uploadJobSeekerImageAsset(input: {
  file: Express.Multer.File;
  folder: string;
  fileBaseName: string;
}) {
  if (
    !(JOB_SEEKER_IMAGE_MIME_TYPES as readonly string[]).includes(
      input.file.mimetype,
    )
  ) {
    throw new AppError(
      "Profile photo must be a PNG, JPG, JPEG, or WEBP image",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  try {
    const storedFile = await storageService.upload({
      buffer: input.file.buffer,
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
      folder: input.folder,
      fileBaseName: input.fileBaseName,
    });

    return {
      url: storedFile.url ?? "",
      storagePath: storedFile.storagePath,
      publicId: storedFile.publicId ?? "",
      storageProvider: storedFile.storageProvider,
      originalName: storedFile.originalName,
      mimeType: storedFile.mimeType,
      fileSize: storedFile.fileSize,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Upload failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function deleteJobSeekerImageAsset(asset?: {
  storagePath?: string;
  publicId?: string;
  storageProvider?: string;
} | null) {
  if (!asset?.storagePath) {
    return;
  }

  const provider =
    asset.storageProvider === "cloudinary" ? "cloudinary" : "local";

  try {
    await storageService.delete({
      storagePath: asset.storagePath,
      publicId: asset.publicId || undefined,
      storageProvider: provider,
    });
  } catch {
    // Best-effort cleanup.
  }
}

async function refreshResumeAfterProfileChange(jobSeekerId: string) {
  try {
    await resumeService.markOutdated(jobSeekerId, "profile_updated");
    await resumeService.generateFromProfile(jobSeekerId);
  } catch (error) {
    console.error("Resume refresh after profile update failed:", error);
  }
}

async function findJobSeekerOrThrow(jobSeekerId: string) {
  if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
    throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
  }

  const jobSeeker = await JobSeekerModel.findById(jobSeekerId).select(
    "+otpHash +otpExpiresAt +otpAttempts",
  );

  if (!jobSeeker) {
    throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
  }

  return jobSeeker;
}

async function assertNoCompletedDuplicateWhatsapp(
  whatsappNumber: string,
  excludeJobSeekerId?: mongoose.Types.ObjectId,
) {
  const query: Record<string, unknown> = {
    whatsappNumber,
    registrationStatus: "COMPLETED",
  };

  if (excludeJobSeekerId) {
    query._id = { $ne: excludeJobSeekerId };
  }

  const existing = await JobSeekerModel.findOne(query).select("_id");
  if (existing) {
    throw new AppError(
      "This WhatsApp number is already registered",
      HTTP_STATUS.CONFLICT,
    );
  }
}

export class JobSeekerService {
  async registerJobSeeker(input: RegisterJobSeekerInput) {
    await assertNoCompletedDuplicateWhatsapp(input.whatsappNumber);

    const existing = await JobSeekerModel.findOne({
      whatsappNumber: input.whatsappNumber,
      registrationStatus: "PENDING",
    });

    const generated = await otpService.createOtp();

    let jobSeeker = existing;

    try {
      if (jobSeeker) {
        jobSeeker.fullName = input.fullName;
        jobSeeker.whatsappNumber = input.whatsappNumber;
        jobSeeker.isWhatsappVerified = false;
        jobSeeker.registrationStatus = "PENDING";
        jobSeeker.otpHash = generated.otpHash;
        jobSeeker.otpExpiresAt = generated.expiresAt;
        jobSeeker.otpAttempts = 0;
        await jobSeeker.save();
      } else {
        jobSeeker = await JobSeekerModel.create({
          fullName: input.fullName,
          whatsappNumber: input.whatsappNumber,
          isWhatsappVerified: false,
          registrationStatus: "PENDING",
          otpHash: generated.otpHash,
          otpExpiresAt: generated.expiresAt,
          otpAttempts: 0,
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new AppError(
          "This WhatsApp number is already registered",
          HTTP_STATUS.CONFLICT,
        );
      }

      console.error("Job seeker registration persistence failed:", error);
      throw new AppError("Database error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    await otpService.deliverOtp(
      input.whatsappNumber,
      generated.otp,
      generated.expiresAt,
      {
        purpose: "registration",
        employerName: input.fullName,
      },
    );

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
      jobSeekerId: jobSeeker._id.toString(),
      otpExpiresAt: generated.expiresAt.toISOString(),
      ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
    };
  }

  async resendOtp(input: ResendJobSeekerOtpInput) {
    const jobSeeker = await findJobSeekerOrThrow(input.jobSeekerId);

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (jobSeeker.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number is already verified",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const generated = await otpService.createOtp();
    jobSeeker.otpHash = generated.otpHash;
    jobSeeker.otpExpiresAt = generated.expiresAt;
    jobSeeker.otpAttempts = 0;
    await jobSeeker.save();

    await otpService.deliverOtp(
      jobSeeker.whatsappNumber,
      generated.otp,
      generated.expiresAt,
      {
        purpose: "registration",
        employerName: jobSeeker.fullName,
      },
    );

    return {
      jobSeekerId: jobSeeker._id.toString(),
      otpExpiresAt: generated.expiresAt.toISOString(),
      ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
    };
  }

  async verifyOtp(input: VerifyJobSeekerOtpInput) {
    const jobSeeker = await findJobSeekerOrThrow(input.jobSeekerId);

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const acceptedViaTestOtp = otpService.matchesTestOtp(input.otp);

    // Test OTP bypasses delivery/expiry only — registration flow continues unchanged.
    if (!acceptedViaTestOtp) {
      if ((jobSeeker.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
        otpService.logVerificationFailure(
          jobSeeker.whatsappNumber,
          "MAX_ATTEMPTS",
        );
      } else if (
        !jobSeeker.otpExpiresAt ||
        jobSeeker.otpExpiresAt.getTime() < Date.now()
      ) {
        otpService.logVerificationFailure(jobSeeker.whatsappNumber, "EXPIRED");
      }

      otpService.assertCanAttempt(jobSeeker.otpAttempts ?? 0);
      otpService.assertNotExpired(jobSeeker.otpExpiresAt);
    }

    const isValid = await otpService.verifyOtpHash(
      input.otp,
      jobSeeker.otpHash,
    );

    if (!isValid) {
      jobSeeker.otpAttempts = (jobSeeker.otpAttempts ?? 0) + 1;
      await jobSeeker.save();
      otpService.logVerificationFailure(
        jobSeeker.whatsappNumber,
        "INVALID_OTP",
      );
      throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
    }

    otpService.logVerificationSuccess(jobSeeker.whatsappNumber, input.otp);

    jobSeeker.isWhatsappVerified = true;
    jobSeeker.otpHash = null;
    jobSeeker.otpExpiresAt = null;
    jobSeeker.otpAttempts = 0;
    jobSeeker.registrationStatus = "PENDING";
    await jobSeeker.save();

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
    };
  }

  async searchJobRoles(query: SearchJobSeekerRolesQuery) {
    const search = query.search.trim();
    const limit = query.limit;
    const roleSet = new Set<string>();

    for (const role of JOB_SEEKER_JOB_ROLES) {
      if (!search || role.toLowerCase().includes(search.toLowerCase())) {
        roleSet.add(role);
      }
    }

    if (search.length >= 2) {
      const titles = await JobModel.distinct("jobTitle", {
        status: "active",
        jobTitle: { $regex: escapeRegex(search), $options: "i" },
      });

      for (const title of titles) {
        if (typeof title === "string" && title.trim()) {
          roleSet.add(title.trim());
        }
      }
    }

    const roles = [...roleSet]
      .sort((left, right) => left.localeCompare(right))
      .slice(0, limit);

    return { roles };
  }

  async savePreferences(input: SaveJobSeekerPreferencesInput) {
    const jobSeeker = await findJobSeekerOrThrow(input.jobSeekerId);

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!jobSeeker.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number must be verified before saving preferences",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    jobSeeker.dateOfBirth = new Date(`${input.dateOfBirth}T00:00:00.000Z`);
    jobSeeker.gender = input.gender;
    jobSeeker.jobRole = input.jobRole;
    jobSeeker.jobType = input.jobType;
    jobSeeker.workMode = input.workMode;
    jobSeeker.preferredJobLocation = input.preferredJobLocation;
    jobSeeker.expectedSalary = input.expectedSalary;
    jobSeeker.expectedSalaryPeriod = input.expectedSalaryPeriod;
    jobSeeker.registrationStatus = "PENDING";
    await jobSeeker.save();

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
    };
  }

  async completeRegistration(input: CompleteJobSeekerRegistrationInput) {
    const jobSeeker = await findJobSeekerOrThrow(input.jobSeekerId);

    if (jobSeeker.registrationStatus === "COMPLETED") {
      throw new AppError(
        "Registration is already completed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!jobSeeker.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number must be verified before completing registration",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (
      !jobSeeker.dateOfBirth ||
      !jobSeeker.gender ||
      !jobSeeker.jobRole?.trim() ||
      !jobSeeker.jobType ||
      !jobSeeker.workMode ||
      !jobSeeker.preferredJobLocation?.trim() ||
      jobSeeker.expectedSalary == null ||
      !jobSeeker.expectedSalaryPeriod
    ) {
      throw new AppError(
        "Complete job preferences before creating your account",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await assertNoCompletedDuplicateWhatsapp(
      jobSeeker.whatsappNumber,
      jobSeeker._id,
    );

    jobSeeker.education = input.education;
    jobSeeker.experienceType = input.experienceType;
    jobSeeker.set(
      "experiences",
      input.experienceType === "experienced" ? input.experiences : [],
    );
    jobSeeker.languages = input.languages;
    jobSeeker.availabilityStatus = input.availabilityStatus;
    jobSeeker.registrationStatus = "COMPLETED";

    const tokens = jwtService.issueJobSeekerTokens({
      sub: jobSeeker._id.toString(),
      whatsappNumber: jobSeeker.whatsappNumber,
    });

    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    jobSeeker.refreshTokenHash = refreshTokenHash;
    jobSeeker.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    jobSeeker.lastLoginAt = new Date();
    await jobSeeker.save();

    try {
      await resumeService.generateFromProfile(jobSeeker._id.toString());
    } catch (error) {
      console.error("Automatic resume generation failed:", error);
    }

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
    };
  }

  async updateAuthenticatedProfile(
    jobSeekerId: string,
    input: UpdateJobSeekerProfileInput,
  ) {
    const jobSeeker = await findJobSeekerOrThrow(jobSeekerId);

    if (
      !jobSeeker.isWhatsappVerified ||
      jobSeeker.registrationStatus !== "COMPLETED"
    ) {
      throw new AppError(
        "Complete your registration before updating your profile",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (input.fullName !== undefined) {
      jobSeeker.fullName = input.fullName;
    }
    if (input.dateOfBirth !== undefined) {
      jobSeeker.dateOfBirth = input.dateOfBirth
        ? new Date(`${input.dateOfBirth}T00:00:00.000Z`)
        : null;
    }
    if (input.gender !== undefined) {
      jobSeeker.gender = input.gender;
    }
    if (input.pincode !== undefined) {
      jobSeeker.pincode = input.pincode;
    }
    if (input.city !== undefined) {
      jobSeeker.city = input.city;
    }
    if (input.state !== undefined) {
      jobSeeker.state = input.state;
    }
    if (input.jobRole !== undefined) {
      jobSeeker.jobRole = input.jobRole;
    }
    if (input.jobType !== undefined) {
      jobSeeker.jobType = input.jobType;
    }
    if (input.workMode !== undefined) {
      jobSeeker.workMode = input.workMode;
    }
    if (input.preferredJobLocation !== undefined) {
      jobSeeker.preferredJobLocation = input.preferredJobLocation;
    }
    if (input.expectedSalary !== undefined) {
      jobSeeker.expectedSalary = input.expectedSalary;
    }
    if (input.expectedSalaryPeriod !== undefined) {
      jobSeeker.expectedSalaryPeriod = input.expectedSalaryPeriod;
    }
    if (input.education !== undefined) {
      jobSeeker.set("education", input.education);
    }
    if (input.experienceType !== undefined) {
      jobSeeker.experienceType = input.experienceType;
    }
    if (input.experiences !== undefined) {
      jobSeeker.set("experiences", input.experiences);
    }
    if (input.languages !== undefined) {
      jobSeeker.languages = input.languages;
    }
    if (input.availabilityStatus !== undefined) {
      jobSeeker.availabilityStatus = input.availabilityStatus;
    }
    if (input.professionalSummary !== undefined) {
      jobSeeker.professionalSummary = input.professionalSummary;
    }
    if (input.skills !== undefined) {
      jobSeeker.skills = input.skills;
    }
    if (input.profileVisibility !== undefined) {
      jobSeeker.profileVisibility = input.profileVisibility;
    }

    if (
      jobSeeker.experienceType === "experienced" &&
      (!Array.isArray(jobSeeker.experiences) || jobSeeker.experiences.length < 1)
    ) {
      throw new AppError(
        "Add at least one work experience for experienced profiles",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Only clear experiences when this request explicitly switches to fresher.
    // Do not wipe experiences on unrelated partial updates (about/skills/preferences).
    if (input.experienceType === "fresher") {
      jobSeeker.set("experiences", []);
    }

    await jobSeeker.save();
    await refreshResumeAfterProfileChange(jobSeeker._id.toString());

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
    };
  }

  async updateProfilePhoto(
    jobSeekerId: string,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new AppError("Profile photo is required", HTTP_STATUS.BAD_REQUEST);
    }

    const jobSeeker = await findJobSeekerOrThrow(jobSeekerId);

    if (
      !jobSeeker.isWhatsappVerified ||
      jobSeeker.registrationStatus !== "COMPLETED"
    ) {
      throw new AppError(
        "Complete your registration before uploading a photo",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const previousPhoto = {
      storagePath: jobSeeker.profilePhoto?.storagePath ?? "",
      publicId: jobSeeker.profilePhoto?.publicId ?? "",
      storageProvider: jobSeeker.profilePhoto?.storageProvider ?? "",
    };

    const uploaded = await uploadJobSeekerImageAsset({
      file,
      folder: `job-seekers/${jobSeeker._id.toString()}/profile`,
      fileBaseName: "profile-photo",
    });

    jobSeeker.set("profilePhoto", uploaded);
    await jobSeeker.save();

    if (previousPhoto.storagePath) {
      await deleteJobSeekerImageAsset(previousPhoto);
    }

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
    };
  }

  async deleteProfilePhoto(jobSeekerId: string) {
    const jobSeeker = await findJobSeekerOrThrow(jobSeekerId);

    if (
      !jobSeeker.isWhatsappVerified ||
      jobSeeker.registrationStatus !== "COMPLETED"
    ) {
      throw new AppError(
        "Complete your registration before updating your photo",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await deleteJobSeekerImageAsset(jobSeeker.profilePhoto);
    jobSeeker.set("profilePhoto", emptyImageAsset());
    await jobSeeker.save();

    return {
      jobSeeker: toPublicJobSeeker(jobSeeker),
    };
  }
}

export const jobSeekerService = new JobSeekerService();
