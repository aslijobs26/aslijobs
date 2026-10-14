import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import { resolveJobSeekerNotificationLanguage } from "../job-seeker-whatsapp-language.js";
import { resolveWhatsAppNotificationDelivery } from "./whatsapp-notification.policy.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

const TEMPLATE_NAME = "jobseeker_account_created";

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "delivery_failed";
  return message.replace(/\d{8,}/g, "****").slice(0, 180);
}

export type JobseekerAccountCreatedWhatsAppInput = {
  jobSeekerId: string;
  phoneNumber: string;
  correlationId?: string;
};

export const jobseekerAccountCreatedWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: JobseekerAccountCreatedWhatsAppInput): void {
    const jobSeekerId = input.jobSeekerId.trim();
    const phoneNumber = input.phoneNumber.trim();
    const correlationId = input.correlationId?.trim() || randomUUID();
    if (!jobSeekerId || !mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      console.info(
        "[WhatsAppNotification] jobseeker_account_created skipped - missing job seeker",
        { template: TEMPLATE_NAME, correlationId },
      );
      return;
    }
    if (!phoneNumber) {
      console.info(
        "[WhatsAppNotification] jobseeker_account_created skipped - no WhatsApp number",
        { template: TEMPLATE_NAME, jobSeekerId, correlationId },
      );
      return;
    }

    try {
      toWhatsAppCloudRecipient(phoneNumber);
    } catch (error) {
      console.info(
        "[WhatsAppNotification] jobseeker_account_created skipped - invalid WhatsApp number",
        {
          template: TEMPLATE_NAME,
          jobSeekerId,
          correlationId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }
    void (async () => {
      const preferredLanguage = await resolveJobSeekerNotificationLanguage({
        phoneNumber,
        jobSeekerId,
      });
      const delivery = resolveWhatsAppNotificationDelivery(
        "JOBSEEKER_ACCOUNT_CREATED",
        preferredLanguage,
      );
      console.info("[WhatsAppNotification] jobseeker_account_created requested", {
        correlationId,
        jobSeekerId,
        template: delivery?.templateName ?? TEMPLATE_NAME,
        language: delivery?.languageCode ?? "en",
      });
      const result = await this.enqueue({
        event: "JOBSEEKER_ACCOUNT_CREATED",
        entityId: jobSeekerId,
        phoneNumber,
        preferredLanguage,
        correlationId,
      });
      console.info("[WhatsAppNotification] jobseeker_account_created outcome", {
        correlationId,
        template: delivery?.templateName ?? TEMPLATE_NAME,
        outcome: result,
        jobSeekerId,
        language: delivery?.languageCode ?? preferredLanguage,
      });
    })().catch((error: unknown) => {
      console.error("[WhatsAppNotification] jobseeker_account_created failed", {
        correlationId,
        template: TEMPLATE_NAME,
        jobSeekerId,
        errorCategory: error instanceof Error ? error.name : "unknown",
        errorMessage: safeErrorMessage(error),
      });
    });
  },
};
