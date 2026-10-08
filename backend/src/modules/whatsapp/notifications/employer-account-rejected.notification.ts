import { resolveEmployerRegistrationDisplayName } from "../../operations/registration-awareness/operations-registration-awareness.service.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";
import type { WhatsAppNotificationEnqueueResult } from "./whatsapp-notification.types.js";

export type EmployerAccountRejectedWhatsAppInput = {
  employerId: string;
  whatsappNumber?: string | null;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /**
   * Changes on each saved rejection (`rejectedAt` millis). A later review
   * cycle can notify again. Repeating the same rejection keeps this value.
   */
  reviewCycle: string;
};

/**
 * Sends employer_account_rejected only after Internal Team rejection is stored.
 * Never throws: WhatsApp failure must not roll back the rejection.
 */
export const employerAccountRejectedWhatsApp = {
  enqueue: enqueueWhatsAppNotification,

  schedule(input: EmployerAccountRejectedWhatsAppInput): void {
    const employerId = input.employerId.trim();
    const phoneNumber = input.whatsappNumber?.trim() ?? "";
    const reviewCycle = input.reviewCycle.trim();
    if (!employerId || !phoneNumber || !reviewCycle) {
      console.info(
        "[WhatsAppNotification] Employer rejection notification skipped - no WhatsApp number",
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
        event: "EMPLOYER_ACCOUNT_REJECTED",
        entityId: employerId,
        phoneNumber,
        employerName,
        preferredLanguage: "en",
        idempotencyScope: reviewCycle,
      });
    } catch (error) {
      console.error(
        "[WhatsAppNotification] Employer rejection notification failed",
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
            "[WhatsAppNotification] Employer rejection notification queued",
            {
              employerId,
              template: "employer_account_rejected",
              language: "en",
            },
          );
          return;
        }
        if (result === "skipped_duplicate") {
          console.info(
            "[WhatsAppNotification] Employer rejection notification skipped - already sent",
            { employerId },
          );
        }
      })
      .catch((error: unknown) => {
        console.error(
          "[WhatsAppNotification] Employer rejection notification failed",
          {
            employerId,
            errorCategory: error instanceof Error ? error.name : "unknown",
          },
        );
      });
  },
};
