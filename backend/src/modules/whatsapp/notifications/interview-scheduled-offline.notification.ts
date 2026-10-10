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

const TEMPLATE_NAME = "interview_scheduled_offline";

export type InterviewScheduledOfflineWhatsAppInput = {
  applicationId: string;
  jobId: string;
  employerId: string;
  jobSeekerId: string;
  /** Saved interview date, YYYY-MM-DD. */
  interviewDate: string;
  /** Saved interview time, HH:mm. */
  interviewTime: string;
  /** Saved offline interview venue. */
  interviewVenue: string;
};

function skip(reason: string, applicationId: string): void {
  console.info(
    `[WhatsAppNotification] interview_scheduled_offline skipped - ${reason}`,
    { template: TEMPLATE_NAME, applicationId },
  );
}

export const interviewScheduledOfflineWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: InterviewScheduledOfflineWhatsAppInput): void {
    const applicationId = input.applicationId.trim();
    const jobId = input.jobId.trim();
    const employerId = input.employerId.trim();
    const jobSeekerId = input.jobSeekerId.trim();
    const interviewDate = formatInterviewScheduledDate(input.interviewDate);
    const interviewTime = formatInterviewScheduledTime(input.interviewTime);
    const interviewVenue = input.interviewVenue.trim();

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
    if (!interviewVenue) {
      skip("missing location", applicationId);
      return;
    }

    void this.loadAndEnqueue({
      applicationId,
      jobId,
      employerId,
      jobSeekerId,
      interviewDate,
      interviewTime,
      interviewVenue,
    }).catch((error: unknown) => {
      console.error("[WhatsAppNotification] interview_scheduled_offline failed", {
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
    interviewVenue: string;
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
        "[WhatsAppNotification] interview_scheduled_offline skipped - invalid WhatsApp number",
        {
          template: TEMPLATE_NAME,
          applicationId: input.applicationId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }

    const result = await this.enqueue({
      event: "INTERVIEW_SCHEDULED_OFFLINE",
      entityId: input.applicationId,
      phoneNumber,
      jobTitle,
      companyName,
      interviewDate: input.interviewDate,
      interviewTime: input.interviewTime,
      interviewVenue: input.interviewVenue,
      preferredLanguage: "en",
    });

    console.info("[WhatsAppNotification] interview_scheduled_offline outcome", {
      template: TEMPLATE_NAME,
      outcome: result,
      applicationId: input.applicationId,
      language: "en",
    });
  },
};
