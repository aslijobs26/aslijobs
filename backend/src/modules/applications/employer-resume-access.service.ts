import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { applicationService } from "./application.service.js";
import type {
  EmployerResumeAccessTokenPayload,
  ResolveEmployerResumeAccessUrlInput,
} from "./employer-resume-access.types.js";

/**
 * Builds signed resume access URLs for exports.
 * Swap this implementation later for cloud-storage signed URLs without
 * changing export generators.
 */
export class EmployerResumeAccessService {
  createAccessToken(input: ResolveEmployerResumeAccessUrlInput): string {
    const payload: EmployerResumeAccessTokenPayload = {
      typ: "employer_resume_access",
      applicationId: input.applicationId,
      employerId: input.employerId,
    };

    return jwt.sign(payload, env.RESUME_ACCESS_SECRET, {
      expiresIn: env.RESUME_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  verifyAccessToken(token: string): EmployerResumeAccessTokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        env.RESUME_ACCESS_SECRET,
      ) as EmployerResumeAccessTokenPayload;

      if (
        decoded.typ !== "employer_resume_access" ||
        typeof decoded.applicationId !== "string" ||
        !decoded.applicationId.trim() ||
        typeof decoded.employerId !== "string" ||
        !decoded.employerId.trim()
      ) {
        throw new AppError(
          "Invalid resume access link",
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      return {
        typ: "employer_resume_access",
        applicationId: decoded.applicationId.trim(),
        employerId: decoded.employerId.trim(),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Resume access link is invalid or expired",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
  }

  /**
   * Future cloud storage: return a provider signed URL here instead.
   * Export generators only consume the returned absolute URL string.
   */
  resolveResumeAccessUrl(input: ResolveEmployerResumeAccessUrlInput): string {
    const token = this.createAccessToken(input);
    return `${env.PUBLIC_API_URL}/applications/employer/resume-access/${encodeURIComponent(token)}/pdf`;
  }

  async openResumePdfFromToken(token: string) {
    const claims = this.verifyAccessToken(token);
    return applicationService.downloadSnapshotPdfForEmployer({
      employerId: claims.employerId,
      applicationId: claims.applicationId,
    });
  }
}

export const employerResumeAccessService = new EmployerResumeAccessService();
