import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { resumeService } from "./resume.service.js";

function requireAuthenticatedJobSeekerId(req: Request): string {
  const jobSeekerId = req.jobSeekerId?.trim();
  if (!jobSeekerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return jobSeekerId;
}

/**
 * HTTP handlers for the Resume module (owner-scoped via requireJobSeekerAuth).
 */
export class ResumeController {
  getActive = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireAuthenticatedJobSeekerId(req);
    const resume = await resumeService.findActiveByJobSeekerId(jobSeekerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: resume ? "Resume found." : "No active resume.",
      data: { resume },
    });
  };

  regenerate = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireAuthenticatedJobSeekerId(req);
    const resume = await resumeService.generateFromProfile(jobSeekerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Resume regenerated.",
      data: { resume },
    });
  };

  downloadPdf = async (req: Request, res: Response): Promise<void> => {
    const jobSeekerId = requireAuthenticatedJobSeekerId(req);
    const pdf = await resumeService.downloadPdf(jobSeekerId);

    res.setHeader("Content-Type", pdf.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdf.fileName}"`,
    );
    res.setHeader("Content-Length", String(pdf.buffer.length));
    res.status(HTTP_STATUS.OK).send(pdf.buffer);
  };
}

export const resumeController = new ResumeController();
