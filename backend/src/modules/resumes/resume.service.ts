import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import {
  RESUME_DEFAULT_GENERATION_SOURCE,
  RESUME_DEFAULT_STATUS,
  RESUME_DEFAULT_TEMPLATE_ID,
  RESUME_TEMPLATE_VERSION,
} from "./resume.constants.js";
import { ResumeModel } from "./resume.model.js";
import type {
  JobSeekerProfileForResume,
  PublicResume,
  ResumeJson,
} from "./resume.types.js";
import { calculateProfileCompleteness } from "./utils/profile-completeness.js";
import {
  buildAtsResumeJson,
  createEmptyResumeJson,
} from "./utils/profile-to-resume-mapping.js";
import { generateResumePdfFromJson } from "./pdf/index.js";

function toPublicResume(resume: {
  _id: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  isActive: boolean;
  status: PublicResume["status"];
  templateId: PublicResume["templateId"];
  templateVersion?: string;
  versionNumber: number;
  generationSource: PublicResume["generationSource"];
  profileCompletionPercent: number;
  resumeJson?: ResumeJson | Record<string, never>;
  resumeHtml?: string;
  pdfUrl?: string;
  pdfStorageProvider?: string;
  pdfPublicId?: string;
  pdfStoragePath?: string;
  lastGeneratedAt?: Date | null;
  lastProfileSnapshotAt?: Date | null;
  failureReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicResume {
  return {
    id: resume._id.toString(),
    jobSeekerId: resume.jobSeekerId.toString(),
    isActive: resume.isActive,
    status: resume.status,
    templateId: resume.templateId,
    templateVersion: resume.templateVersion ?? RESUME_TEMPLATE_VERSION,
    versionNumber: resume.versionNumber,
    generationSource: resume.generationSource,
    profileCompletionPercent: resume.profileCompletionPercent,
    resumeJson: resume.resumeJson ?? {},
    resumeHtml: resume.resumeHtml ?? "",
    pdfUrl: resume.pdfUrl ?? "",
    pdfStorageProvider: resume.pdfStorageProvider ?? "",
    pdfPublicId: resume.pdfPublicId ?? "",
    pdfStoragePath: resume.pdfStoragePath ?? "",
    lastGeneratedAt: resume.lastGeneratedAt ?? null,
    lastProfileSnapshotAt: resume.lastProfileSnapshotAt ?? null,
    failureReason: resume.failureReason ?? "",
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

function toProfileForResume(jobSeeker: {
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
  professionalSummary?: string | null;
  skills?: string[];
}): JobSeekerProfileForResume {
  return {
    id: jobSeeker._id.toString(),
    fullName: jobSeeker.fullName,
    whatsappNumber: jobSeeker.whatsappNumber,
    dateOfBirth: jobSeeker.dateOfBirth ?? null,
    gender: jobSeeker.gender ?? null,
    pincode: jobSeeker.pincode ?? "",
    city: jobSeeker.city ?? "",
    state: jobSeeker.state ?? "",
    jobRole: jobSeeker.jobRole ?? "",
    jobType: jobSeeker.jobType ?? null,
    workMode: jobSeeker.workMode ?? null,
    preferredJobLocation: jobSeeker.preferredJobLocation ?? "",
    expectedSalary: jobSeeker.expectedSalary ?? null,
    expectedSalaryPeriod: jobSeeker.expectedSalaryPeriod ?? null,
    education: jobSeeker.education ?? null,
    experienceType: jobSeeker.experienceType ?? null,
    experiences: (jobSeeker.experiences ??
      []) as JobSeekerProfileForResume["experiences"],
    languages: jobSeeker.languages ?? [],
    professionalSummary: jobSeeker.professionalSummary ?? "",
    skills: Array.isArray(jobSeeker.skills) ? jobSeeker.skills : [],
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 500);
  }
  return "Unknown resume generation error";
}

/**
 * Resume domain service — Phase 2 generates structured ATS ResumeJson from profile.
 * Does not generate HTML/PDF and does not mount HTTP routes.
 */
export class ResumeService {
  async findActiveByJobSeekerId(jobSeekerId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
    }

    const resume = await ResumeModel.findOne({
      jobSeekerId,
      isActive: true,
    }).lean();

    return resume ? toPublicResume(resume) : null;
  }

  /**
   * Ensures an active skeleton resume document exists for the job seeker.
   * Does not generate resume content.
   */
  async ensureResumeRecord(jobSeekerId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
    }

    const jobSeeker = await JobSeekerModel.findById(jobSeekerId).lean();
    if (!jobSeeker) {
      throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await ResumeModel.findOne({
      jobSeekerId,
      isActive: true,
    });

    const completeness = calculateProfileCompleteness(
      toProfileForResume(jobSeeker),
    );

    if (existing) {
      existing.profileCompletionPercent = completeness.percent;
      await existing.save();
      return {
        resume: toPublicResume(existing),
        created: false,
      };
    }

    const created = await ResumeModel.create({
      jobSeekerId,
      isActive: true,
      status: RESUME_DEFAULT_STATUS,
      templateId: RESUME_DEFAULT_TEMPLATE_ID,
      templateVersion: RESUME_TEMPLATE_VERSION,
      versionNumber: 1,
      generationSource: RESUME_DEFAULT_GENERATION_SOURCE,
      profileCompletionPercent: completeness.percent,
      resumeJson: createEmptyResumeJson(),
      resumeHtml: "",
      pdfUrl: "",
      pdfStorageProvider: "",
      pdfPublicId: "",
      pdfStoragePath: "",
      lastGeneratedAt: null,
      lastProfileSnapshotAt: null,
      failureReason: "",
    });

    return {
      resume: toPublicResume(created),
      created: true,
    };
  }

  /**
   * Marks the active resume as outdated when the seeker profile changes.
   */
  async markOutdated(jobSeekerId: string, reason?: string) {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
    }

    const resume = await ResumeModel.findOne({
      jobSeekerId,
      isActive: true,
    });

    if (!resume) {
      return null;
    }

    if (resume.status === "NOT_GENERATED") {
      return toPublicResume(resume);
    }

    resume.status = "OUTDATED";
    if (reason?.trim()) {
      resume.failureReason = reason.trim();
    }
    await resume.save();

    return toPublicResume(resume);
  }

  /**
   * Generates structured ATS resume JSON from a completed job seeker profile
   * and persists it on the active resume document (version 1 on first create).
   */
  async generateFromProfile(jobSeekerId: string) {
    const startedAt = Date.now();

    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
    }

    let resume = await ResumeModel.findOne({
      jobSeekerId,
      isActive: true,
    });

    try {
      const jobSeeker = await JobSeekerModel.findById(jobSeekerId).lean();
      if (!jobSeeker) {
        throw new AppError("Job seeker not found", HTTP_STATUS.NOT_FOUND);
      }

      if (jobSeeker.registrationStatus !== "COMPLETED") {
        throw new AppError(
          "Resume can only be generated after registration is completed",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (resume) {
        resume.status = "REGENERATING";
        await resume.save();
      } else {
        resume = await ResumeModel.create({
          jobSeekerId,
          isActive: true,
          status: "REGENERATING",
          templateId: RESUME_DEFAULT_TEMPLATE_ID,
          templateVersion: RESUME_TEMPLATE_VERSION,
          versionNumber: 1,
          generationSource: RESUME_DEFAULT_GENERATION_SOURCE,
          profileCompletionPercent: 0,
          resumeJson: createEmptyResumeJson(),
          resumeHtml: "",
          pdfUrl: "",
          pdfStorageProvider: "",
          pdfPublicId: "",
          pdfStoragePath: "",
          lastGeneratedAt: null,
          lastProfileSnapshotAt: null,
          failureReason: "",
        });
      }

      const priorLastGeneratedAt = resume.lastGeneratedAt;
      const profile = toProfileForResume(jobSeeker);
      const generatedAt = new Date();
      const hadPriorGeneration = Boolean(priorLastGeneratedAt);
      const nextVersion = hadPriorGeneration
        ? Math.max(1, resume.versionNumber || 1) + 1
        : 1;

      const resumeJson = buildAtsResumeJson(profile, {
        templateId: RESUME_DEFAULT_TEMPLATE_ID,
        templateVersion: RESUME_TEMPLATE_VERSION,
        generatedAt,
      });
      const completeness = calculateProfileCompleteness(profile);

      resume.resumeJson = resumeJson;
      resume.status = "READY";
      resume.generationSource = RESUME_DEFAULT_GENERATION_SOURCE;
      resume.templateId = RESUME_DEFAULT_TEMPLATE_ID;
      resume.templateVersion = RESUME_TEMPLATE_VERSION;
      resume.profileCompletionPercent = completeness.percent;
      resume.lastGeneratedAt = generatedAt;
      resume.lastProfileSnapshotAt = generatedAt;
      resume.failureReason = "";
      resume.versionNumber = nextVersion;
      await resume.save();

      const durationMs = Date.now() - startedAt;
      console.info(
        `[Resume] Generated jobSeekerId=${jobSeekerId} resumeId=${resume._id.toString()} version=${resume.versionNumber} status=READY durationMs=${durationMs}`,
      );

      return toPublicResume(resume);
    } catch (error) {
      const failureReason = getErrorMessage(error);

      try {
        if (resume) {
          resume.status = "FAILED";
          resume.failureReason = failureReason;
          await resume.save();
        } else if (mongoose.Types.ObjectId.isValid(jobSeekerId)) {
          resume = await ResumeModel.findOneAndUpdate(
            { jobSeekerId, isActive: true },
            {
              $setOnInsert: {
                jobSeekerId,
                isActive: true,
                templateId: RESUME_DEFAULT_TEMPLATE_ID,
                templateVersion: RESUME_TEMPLATE_VERSION,
                versionNumber: 1,
                generationSource: RESUME_DEFAULT_GENERATION_SOURCE,
                profileCompletionPercent: 0,
                resumeJson: createEmptyResumeJson(),
                resumeHtml: "",
                pdfUrl: "",
                pdfStorageProvider: "",
                pdfPublicId: "",
                pdfStoragePath: "",
                lastGeneratedAt: null,
                lastProfileSnapshotAt: null,
              },
              $set: {
                status: "FAILED",
                failureReason,
              },
            },
            { upsert: true, new: true },
          );
        }
      } catch (persistError) {
        console.error(
          `[Resume] Failed to persist FAILED status jobSeekerId=${jobSeekerId}:`,
          persistError,
        );
      }

      console.error(
        `[Resume] Generation failed jobSeekerId=${jobSeekerId} version=${resume?.versionNumber ?? "n/a"} durationMs=${Date.now() - startedAt}:`,
        error,
      );

      throw error;
    }
  }

  /**
   * Builds an ATS PDF from the stored resumeJson for the authenticated owner.
   * Does not remap from the live profile.
   */
  async downloadPdf(jobSeekerId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
    }

    const resume = await ResumeModel.findOne({
      jobSeekerId,
      isActive: true,
    }).lean();

    if (!resume) {
      throw new AppError("Resume not found", HTTP_STATUS.NOT_FOUND);
    }

    if (resume.status === "NOT_GENERATED") {
      throw new AppError(
        "Resume has not been generated yet",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const resumeJson = resume.resumeJson as ResumeJson | Record<string, never> | null;
    if (
      !resumeJson ||
      typeof resumeJson !== "object" ||
      !("header" in resumeJson) ||
      !("sections" in resumeJson)
    ) {
      throw new AppError(
        resume.status === "FAILED"
          ? "Resume generation failed. Please regenerate before downloading."
          : "Resume content is not available for download",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const fullName =
      typeof resumeJson.header?.fullName === "string"
        ? resumeJson.header.fullName.trim()
        : "";
    const safeName = (fullName || "resume")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const pdf = await generateResumePdfFromJson(resumeJson as ResumeJson, {
      fileName: `${safeName || "resume"}-aslijobs.pdf`,
    });

    return pdf;
  }

  /**
   * Ensures an active READY resume for apply.
   * Regenerates only when missing, NOT_GENERATED, OUTDATED, or FAILED.
   */
  async ensureReadyResumeForApply(jobSeekerId: string): Promise<PublicResume> {
    if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      throw new AppError("Invalid job seeker id", HTTP_STATUS.BAD_REQUEST);
    }

    const friendlyFailure = new AppError(
      "We couldn't prepare your resume right now. Please try again in a few moments.",
      HTTP_STATUS.BAD_REQUEST,
    );

    const hasUsableJson = (resume: PublicResume | null): resume is PublicResume => {
      if (!resume || resume.status !== "READY") {
        return false;
      }
      const json = resume.resumeJson;
      return (
        typeof json === "object" &&
        json !== null &&
        "header" in json &&
        "sections" in json
      );
    };

    try {
      let resume = await this.findActiveByJobSeekerId(jobSeekerId);

      const needsGeneration =
        !resume ||
        resume.status === "NOT_GENERATED" ||
        resume.status === "OUTDATED" ||
        resume.status === "FAILED" ||
        resume.status === "REGENERATING";

      if (needsGeneration) {
        resume = await this.generateFromProfile(jobSeekerId);
      }

      if (!hasUsableJson(resume)) {
        throw friendlyFailure;
      }

      return resume;
    } catch (error) {
      if (error instanceof AppError && error.message === friendlyFailure.message) {
        throw error;
      }

      console.error(
        `[Resume] ensureReadyResumeForApply failed jobSeekerId=${jobSeekerId}:`,
        error,
      );
      throw friendlyFailure;
    }
  }
}

export const resumeService = new ResumeService();
