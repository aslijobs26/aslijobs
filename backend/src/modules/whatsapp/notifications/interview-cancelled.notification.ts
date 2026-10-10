import mongoose from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import {
  formatInterviewScheduledDate,
  formatInterviewScheduledTime,
} from "./interview-scheduled-online.notification.js";
import { resolveApplicationCompanyName } from "./job-application-submitted.notification.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

const TEMPLATE_NAME = "interview_cancelled";


export type InterviewCancelledWhatsAppInput = {
  applicationId: string;
  jobId: string;
  employerId: string;
  jobSeekerId: string;
  /** Interview date captured before cancellation, YYYY-MM-DD. */
  interviewDate: string;
  /** Interview time captured before cancellation, HH:mm. */
  interviewTime: string;
};

function skip(reason: string, applicationId: string): void {
  console.info(
    `[WhatsAppNotification] interview_cancelled skipped - ${reason}`,
    { template: TEMPLATE_NAME, applicationId },
  );
}

export const interviewCancelledWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: InterviewCancelledWhatsAppInput): void {
    const applicationId = input.applicationId.trim();
    const jobId = input.jobId.trim();
    const employerId = input.employerId.trim();
    const jobSeekerId = input.jobSeekerId.trim();
    const interviewDate = formatInterviewScheduledDate(input.interviewDate);
    const interviewTime = formatInterviewScheduledTime(input.interviewTime);

    if (
      !applicationId ||
      !mongoose.Types.ObjectId.isValid(applicationId) ||
      !mongoose.Types.ObjectId.isValid(jobId) ||
      !mongoose.Types.ObjectId.isValid(employerId) ||
      !mongoose.Types.ObjectId.isValid(jobSeekerId)
    ) {
      skip("missing application", applicationId);
      return;
    }
    if (!interviewDate || !interviewTime) {
      skip("missing date or time", applicationId);
      return;
    }

    void this.loadAndEnqueue({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate,
      interviewTime,
    }).catch((error: unknown) => {
      console.error("[WhatsAppNotification] interview_cancelled failed", {
        template: TEMPLATE_NAME,
        applicationId,
        errorCategory: error instanceof Error ? error.name : "unknown",
      });
    });
  },
  async loadAndEnqueue(input: {
    applicationId: string;
    jobId: string;
    employerId: string;
    jobSeekerId: string;
    interviewDate: string;
    interviewTime: string;
  }): Promise<void> {
    const [job, employer, jobSeeker] = await Promise.all([
      JobModel.findById(input.jobId).select("jobTitle companyName").lean(),
      EmployerModel.findById(input.employerId)
        .select("companyName establishmentName")
        .lean(),
      JobSeekerModel.findById(input.jobSeekerId).select("whatsappNumber").lean(),
    ]);

    const jobTitle = job?.jobTitle?.trim() ?? "";
    const companyName = resolveApplicationCompanyName({
      jobCompanyName: job?.companyName,
      employerCompanyName: employer?.companyName,
      employerEstablishmentName: employer?.establishmentName,
    });
    const phoneNumber = jobSeeker?.whatsappNumber?.trim() ?? "";

    if (!jobTitle || !companyName) {
      skip("missing job or company", input.applicationId);
      return;
    }
    if (!phoneNumber) {
      skip("no WhatsApp number", input.applicationId);
      return;
    }

    try {
      toWhatsAppCloudRecipient(phoneNumber);
    } catch (error) {
      console.info(
        "[WhatsAppNotification] interview_cancelled skipped - invalid WhatsApp number",
        {
          template: TEMPLATE_NAME,
          applicationId: input.applicationId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }

    const result = await this.enqueue({
      event: "INTERVIEW_CANCELLED",
      entityId: input.applicationId,
      phoneNumber,
      jobTitle,
      companyName,
      interviewDate: input.interviewDate,
      interviewTime: input.interviewTime,
      preferredLanguage: "en",
    });

    console.info("[WhatsAppNotification] interview_cancelled outcome", {
      template: TEMPLATE_NAME,
      outcome: result,
      applicationId: input.applicationId,
      language: "en",
    });
  },
};
