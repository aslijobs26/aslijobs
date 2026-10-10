import mongoose from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import { resolveApplicationCompanyName } from "./job-application-submitted.notification.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

const TEMPLATE_NAME = "interview_scheduled_online";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type InterviewScheduledOnlineWhatsAppInput = {
  applicationId: string;
  jobId: string;
  employerId: string;
  jobSeekerId: string;
  /** Saved interview date, YYYY-MM-DD. */
  interviewDate: string;
  /** Saved interview time, HH:mm. */
  interviewTime: string;
};

/**
 * Approved sample is "30 December 2026". The value is the saved calendar
 * date, not a timezone-shifted timestamp.
 */
export function formatInterviewScheduledDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  const monthName = MONTH_NAMES[month - 1];
  return monthName ? `${day} ${monthName} ${year}` : "";
}

/**
 * Approved sample is "11:00 AM". Stored interview times are 24-hour HH:mm.
 */
export function formatInterviewScheduledTime(time: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return "";
  }

  const hour24 = Number(match[1]);
  const minute = match[2];
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) {
    return "";
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

function skip(reason: string, applicationId: string): void {
  console.info(
    `[WhatsAppNotification] interview_scheduled_online skipped - ${reason}`,
    { template: TEMPLATE_NAME, applicationId },
  );
}

export const interviewScheduledOnlineWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: InterviewScheduledOnlineWhatsAppInput): void {
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
      console.error("[WhatsAppNotification] interview_scheduled_online failed", {
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
        "[WhatsAppNotification] interview_scheduled_online skipped - invalid WhatsApp number",
        {
          template: TEMPLATE_NAME,
          applicationId: input.applicationId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }

    const result = await this.enqueue({
      event: "INTERVIEW_SCHEDULED_ONLINE",
      entityId: input.applicationId,
      phoneNumber,
      jobTitle,
      companyName,
      interviewDate: input.interviewDate,
      interviewTime: input.interviewTime,
      preferredLanguage: "en",
    });

    console.info("[WhatsAppNotification] interview_scheduled_online outcome", {
      template: TEMPLATE_NAME,
      outcome: result,
      applicationId: input.applicationId,
      language: "en",
    });
  },
};
