import mongoose from "mongoose";
import { toWhatsAppCloudRecipient } from "../../../utils/whatsapp-phone.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

const TEMPLATE_NAME = "jobseeker_account_created";

export type JobseekerAccountCreatedWhatsAppInput = {
  jobSeekerId: string;
  phoneNumber: string;
};

export const jobseekerAccountCreatedWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: JobseekerAccountCreatedWhatsAppInput): void {
    const jobSeekerId = input.jobSeekerId.trim();
    const phoneNumber = input.phoneNumber.trim();
    if (!jobSeekerId || !mongoose.Types.ObjectId.isValid(jobSeekerId)) {
      console.info(
        "[WhatsAppNotification] jobseeker_account_created skipped - missing job seeker",
        { template: TEMPLATE_NAME },
      );
      return;
    }
    if (!phoneNumber) {
      console.info(
        "[WhatsAppNotification] jobseeker_account_created skipped - no WhatsApp number",
        { template: TEMPLATE_NAME, jobSeekerId },
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
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }

    void this.enqueue({
      event: "JOBSEEKER_ACCOUNT_CREATED",
      entityId: jobSeekerId,
      phoneNumber,
      preferredLanguage: "en",
    })
      .then((result) => {
        console.info("[WhatsAppNotification] jobseeker_account_created outcome", {
          template: TEMPLATE_NAME,
          outcome: result,
          jobSeekerId,
          language: "en",
        });
      })
      .catch((error: unknown) => {
        console.error("[WhatsAppNotification] jobseeker_account_created failed", {
          template: TEMPLATE_NAME,
          jobSeekerId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      });
  },
};
