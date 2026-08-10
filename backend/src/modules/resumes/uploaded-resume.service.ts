import path from "node:path";
import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { STORAGE_FOLDERS } from "../storage/storage.constants.js";
import { storageService } from "../storage/storage.service.js";
import {
  APPLICATION_RESUME_SOURCES,
  JOB_SEEKER_UPLOADED_RESUME_EXTENSIONS,
  JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES,
  JOB_SEEKER_UPLOADED_RESUME_MIME_TYPES,
} from "./resume.constants.js";
import type { ApplicationResumeSource, PublicUploadedResume } from "./resume.types.js";

function hasAllowedExtension(originalName: string): boolean {
  const extension = path.extname(originalName).toLowerCase();
  return (JOB_SEEKER_UPLOADED_RESUME_EXTENSIONS as readonly string[]).includes(
    extension,
  );
}

function isAllowedMimeType(mimeType: string): boolean {
  return (JOB_SEEKER_UPLOADED_RESUME_MIME_TYPES as readonly string[]).includes(
    mimeType,
  );
}

function toPublicUploadedResume(value: {
  url?: string;
  storagePath?: string;
  publicId?: string;
  storageProvider?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedAt?: Date | null;
} | null | undefined): PublicUploadedResume | null {
  if (!value?.storagePath && !value?.url) {
    return null;
  }

  return {
    fileName: value.originalName?.trim() || "resume",
    fileUrl: value.url?.trim() || "",
    mimeType: value.mimeType?.trim() || "",
    fileSize: typeof value.fileSize === "number" ? value.fileSize : 0,
    storageProvider: value.storageProvider?.trim() || "",
    uploadedAt: value.uploadedAt ? value.uploadedAt.toISOString() : null,
  };
}

function snapshotUploadedResume(value: {
  url?: string;
  storagePath?: string;
  publicId?: string;
  storageProvider?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  uploadedAt?: Date | null;
}) {
  return {
    url: value.url?.trim() || "",
    storagePath: value.storagePath?.trim() || "",
    publicId: value.publicId?.trim() || "",
    storageProvider: value.storageProvider?.trim() || "",
    originalName: value.originalName?.trim() || "resume",
    mimeType: value.mimeType?.trim() || "",
    fileSize: typeof value.fileSize === "number" ? value.fileSize : 0,
    uploadedAt: value.uploadedAt ? value.uploadedAt.toISOString() : null,
  };
}

export class UploadedResumeService {
  async getForJobSeeker(jobSeekerId: string): Promise<{
    uploadedResume: PublicUploadedResume | null;
    defaultResumeSource: ApplicationResumeSource;
  }> {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const jobSeeker = await JobSeekerModel.findById(jobSeekerId)
      .select("uploadedResume defaultResumeSource")
      .lean();

    if (!jobSeeker) {
      throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
    }

    const uploadedResume = toPublicUploadedResume(jobSeeker.uploadedResume);
    let defaultResumeSource =
      (jobSeeker.defaultResumeSource as ApplicationResumeSource | undefined) ??
      "generated";

    if (defaultResumeSource === "uploaded" && !uploadedResume) {
      defaultResumeSource = "generated";
    }

    return { uploadedResume, defaultResumeSource };
  }

  async upload(input: {
    jobSeekerId: string;
    file: Express.Multer.File | undefined;
  }): Promise<{
    uploadedResume: PublicUploadedResume;
    defaultResumeSource: ApplicationResumeSource;
  }> {
    if (!mongoose.Types.ObjectId.isValid(input.jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const file = input.file;
    if (!file) {
      throw new AppError("Resume file is required", HTTP_STATUS.BAD_REQUEST);
    }

    if (file.size > JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES) {
      throw new AppError(
        "Resume file must be 5 MB or smaller",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (
      !isAllowedMimeType(file.mimetype) ||
      !hasAllowedExtension(file.originalname)
    ) {
      throw new AppError(
        "Invalid file type. Only PDF, DOC, and DOCX files are allowed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const jobSeeker = await JobSeekerModel.findById(input.jobSeekerId);
    if (!jobSeeker) {
      throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
    }

    if (
      !jobSeeker.isWhatsappVerified ||
      jobSeeker.registrationStatus !== "COMPLETED"
    ) {
      throw new AppError(
        "Complete your registration before uploading a resume",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let storedFile;
    try {
      storedFile = await storageService.upload({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: `${STORAGE_FOLDERS.RESUMES}/${input.jobSeekerId}`,
        fileBaseName: "uploaded-resume",
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Upload failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Keep previous storage object so historical applications remain valid.
    jobSeeker.set("uploadedResume", {
      url: storedFile.url ?? "",
      storagePath: storedFile.storagePath,
      publicId: storedFile.publicId ?? "",
      storageProvider: storedFile.storageProvider,
      originalName: storedFile.originalName || file.originalname,
      mimeType: storedFile.mimeType || file.mimetype,
      fileSize: storedFile.fileSize || file.size,
      uploadedAt: new Date(),
    });

    if (
      !jobSeeker.defaultResumeSource ||
      jobSeeker.defaultResumeSource === "generated"
    ) {
      // First upload: leave default as generated unless none was set.
      jobSeeker.defaultResumeSource = jobSeeker.defaultResumeSource || "generated";
    }

    await jobSeeker.save();

    const uploadedResume = toPublicUploadedResume(jobSeeker.uploadedResume);
    if (!uploadedResume) {
      throw new AppError(
        "Uploaded resume could not be saved",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      uploadedResume,
      defaultResumeSource:
        (jobSeeker.defaultResumeSource as ApplicationResumeSource) ||
        "generated",
    };
  }

  async delete(jobSeekerId: string): Promise<{
    uploadedResume: null;
    defaultResumeSource: ApplicationResumeSource;
  }> {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const jobSeeker = await JobSeekerModel.findById(jobSeekerId);
    if (!jobSeeker) {
      throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
    }

    // Do not delete storage object — applications may still reference it.
    jobSeeker.set("uploadedResume", null);
    jobSeeker.defaultResumeSource = "generated";
    await jobSeeker.save();

    return {
      uploadedResume: null,
      defaultResumeSource: "generated",
    };
  }

  async setDefaultSource(input: {
    jobSeekerId: string;
    source: ApplicationResumeSource;
  }): Promise<{
    uploadedResume: PublicUploadedResume | null;
    defaultResumeSource: ApplicationResumeSource;
  }> {
    if (!mongoose.Types.ObjectId.isValid(input.jobSeekerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    if (
      !(APPLICATION_RESUME_SOURCES as readonly string[]).includes(input.source)
    ) {
      throw new AppError("Invalid resume source", HTTP_STATUS.BAD_REQUEST);
    }

    const jobSeeker = await JobSeekerModel.findById(input.jobSeekerId);
    if (!jobSeeker) {
      throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
    }

    const uploadedResume = toPublicUploadedResume(jobSeeker.uploadedResume);
    if (input.source === "uploaded" && !uploadedResume) {
      throw new AppError(
        "Upload a resume before selecting it for applications",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    jobSeeker.defaultResumeSource = input.source;
    await jobSeeker.save();

    return {
      uploadedResume,
      defaultResumeSource: input.source,
    };
  }

  getUploadedSnapshotForApply(jobSeekerId: string) {
    return JobSeekerModel.findById(jobSeekerId)
      .select("uploadedResume defaultResumeSource")
      .lean()
      .then((jobSeeker) => {
        if (!jobSeeker) {
          throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
        }

        const uploaded = jobSeeker.uploadedResume;
        if (!uploaded?.storagePath && !uploaded?.url) {
          return null;
        }

        return snapshotUploadedResume(uploaded);
      });
  }
}

export const uploadedResumeService = new UploadedResumeService();
