import mongoose from "mongoose";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

const TEMPLATE_NAME = "job_application_submitted";

export type JobApplicationSubmittedWhatsAppInput = {
  applicationId: string;
  phoneNumber: string;
  jobTitle: string;
  companyName: string;
  employerCompanyName?: string | null;
  employerEstablishmentName?: string | null;
};

export function resolveApplicationCompanyName(input: {
  jobCompanyName?: string | null;
  employerCompanyName?: string | null;
  employerEstablishmentName?: string | null;
}): string {
  return (
    input.jobCompanyName?.trim() ||
    input.employerCompanyName?.trim() ||
    input.employerEstablishmentName?.trim() ||
    ""
  );
}

export const jobApplicationSubmittedWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: JobApplicationSubmittedWhatsAppInput): void {
    const applicationId = input.applicationId.trim();
    const phoneNumber = input.phoneNumber.trim();
    const jobTitle = input.jobTitle.trim();
    const companyName = resolveApplicationCompanyName({
      jobCompanyName: input.companyName,
      employerCompanyName: input.employerCompanyName,
      employerEstablishmentName: input.employerEstablishmentName,
    });

    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      console.info(
        "[WhatsAppNotification] job_application_submitted skipped - missing application",
        { template: TEMPLATE_NAME },
      );
      return;
    }
    if (!jobTitle || !companyName) {
      console.info(
        "[WhatsAppNotification] job_application_submitted skipped - missing job or company",
        { template: TEMPLATE_NAME, applicationId },
      );
      return;
    }
    if (!phoneNumber) {
      console.info(
        "[WhatsAppNotification] job_application_submitted skipped - no WhatsApp number",
        { template: TEMPLATE_NAME, applicationId },
      );
      return;
    }

    try {
      toWhatsAppCloudRecipient(phoneNumber);
    } catch (error) {
      console.info(
        "[WhatsAppNotification] job_application_submitted skipped - invalid WhatsApp number",
        {
          template: TEMPLATE_NAME,
          applicationId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }

    void this.enqueue({
      event: "JOB_APPLICATION_SUBMITTED",
      entityId: applicationId,
      phoneNumber,
      jobTitle,
      companyName,
      preferredLanguage: "en",
    })
      .then((result) => {
        console.info("[WhatsAppNotification] job_application_submitted outcome", {
          template: TEMPLATE_NAME,
          outcome: result,
          applicationId,
          language: "en",
        });
      })
      .catch((error: unknown) => {
        console.error("[WhatsAppNotification] job_application_submitted failed", {
          template: TEMPLATE_NAME,
          applicationId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      });
  },
};
