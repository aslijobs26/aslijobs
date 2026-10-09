import { resolveEmployerRegistrationDisplayName } from "../../operations/registration-awareness/operations-registration-awareness.service.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

export type EmployerAccountApprovedWhatsAppInput = {
  employerId: string;
  whatsappNumber?: string | null;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /**
   * Changes on each saved approval (`verifiedAt` millis). A later approval
   * after rejection and resubmission can notify again. The same approval keeps
   * this value, so a repeat does not send another message.
   */
  reviewCycle: string;
};

/**
 * Sends aslijobs_account_approved only after Internal Team approval is stored.
 * Never throws: WhatsApp failure must not roll back the approval.
 */
export const employerAccountApprovedWhatsApp = {
  enqueue: enqueueWhatsAppNotification,

  schedule(input: EmployerAccountApprovedWhatsAppInput): void {
    const employerId = input.employerId.trim();
    const phoneNumber = input.whatsappNumber?.trim() ?? "";
    const reviewCycle = input.reviewCycle.trim();
    if (!employerId || !phoneNumber || !reviewCycle) {
      console.info(
        "[WhatsAppNotification] Employer approval notification skipped - no WhatsApp number",
        { employerId },
      );
      return;
    }

    const employerName = resolveEmployerRegistrationDisplayName({
      companyName: input.companyName,
      establishmentName: input.establishmentName,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    let pending: Promise<WhatsAppNotificationEnqueueResult>;
    try {
      pending = this.enqueue({
        event: "EMPLOYER_ACCOUNT_APPROVED",
        entityId: employerId,
        phoneNumber,
        employerName,
        preferredLanguage: "en",
        idempotencyScope: reviewCycle,
      });
    } catch (error) {
      console.error(
        "[WhatsAppNotification] Employer approval notification failed",
        {
          employerId,
          errorCategory: error instanceof Error ? error.name : "unknown",
        },
      );
      return;
    }

    void pending
      .then((result) => {
        if (result === "queued") {
          console.info(
            "[WhatsAppNotification] Employer approval notification queued",
            {
              employerId,
              template: "aslijobs_account_approved",
              language: "en",
            },
          );
          return;
        }
        if (result === "skipped_duplicate") {
          console.info(
            "[WhatsAppNotification] Employer approval notification skipped - already sent",
            { employerId },
          );
        }
      })
      .catch((error: unknown) => {
        console.error(
          "[WhatsAppNotification] Employer approval notification failed",
          {
            employerId,
            errorCategory: error instanceof Error ? error.name : "unknown",
          },
        );
      });
  },
};
