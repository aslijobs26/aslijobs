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

const TEMPLATE_NAME = "interview_rescheduled";

export type InterviewRescheduledWhatsAppInput = {
  applicationId: string;
  jobId: string;
  employerId: string;
  jobSeekerId: string;
  /** Newly saved interview date, YYYY-MM-DD. */
  interviewDate: string;
  /** Newly saved interview time, HH:mm. */
  interviewTime: string;
  /** Newly saved offline interview venue. */
  interviewVenue: string;
};

/**
 * One notification per saved offline date and time. A later change to a
 * different slot gets a new key. Repeating the same slot does not.
 */
export function interviewRescheduledIdempotencyScope(
  interviewDate: string,
  interviewTime: string,
): string {
  const date = interviewDate.trim();
  const time = interviewTime.trim().replace(":", "");
  return `${date}-${time}`;
}

function skip(reason: string, applicationId: string): void {
  console.info(
    `[WhatsAppNotification] interview_rescheduled skipped - ${reason}`,
    { template: TEMPLATE_NAME, applicationId },
  );
}

export const interviewRescheduledWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: InterviewRescheduledWhatsAppInput): void {
    const applicationId = input.applicationId.trim();
    const jobId = input.jobId.trim();
    const employerId = input.employerId.trim();
    const jobSeekerId = input.jobSeekerId.trim();
    const rawDate = input.interviewDate.trim();
    const rawTime = input.interviewTime.trim();
    const interviewDate = formatInterviewScheduledDate(rawDate);
    const interviewTime = formatInterviewScheduledTime(rawTime);
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
      idempotencyScope: interviewRescheduledIdempotencyScope(rawDate, rawTime),
    }).catch((error: unknown) => {
      console.error("[WhatsAppNotification] interview_rescheduled failed", {
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
    idempotencyScope: string;
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
        "[WhatsAppNotification] interview_rescheduled skipped - invalid WhatsApp number",
        {
          template: TEMPLATE_NAME,
          applicationId: input.applicationId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }

    const result = await this.enqueue({
      event: "INTERVIEW_RESCHEDULED",
      entityId: input.applicationId,
      phoneNumber,
      jobTitle,
      companyName,
      interviewDate: input.interviewDate,
      interviewTime: input.interviewTime,
      interviewVenue: input.interviewVenue,
      idempotencyScope: input.idempotencyScope,
      preferredLanguage: "en",
    });

    console.info("[WhatsAppNotification] interview_rescheduled outcome", {
      template: TEMPLATE_NAME,
      outcome: result,
      applicationId: input.applicationId,
      language: "en",
    });
  },
};
