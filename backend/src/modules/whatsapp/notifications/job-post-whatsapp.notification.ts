import mongoose from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { resolveEmployerRegistrationDisplayName } from "../../operations/registration-awareness/operations-registration-awareness.service.js";
import type { WhatsAppNotificationEvent } from "./whatsapp-notification.constants.js";
import { enqueueWhatsAppNotification } from "./whatsapp-notification.service.js";

type EmployerWhatsAppSnapshot = {
  whatsappNumber?: string | null;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type JobPostWhatsAppInput = {
  employerId: string;
  publicJobId: string;
  /**
   * Distinguishes a later review cycle from a retry of the same one.
   * Submission uses the prior review count. Approval uses the saved timestamp.
   */
  cycle: string;
};

export function jobPostSubmissionCycle(reviewHistoryLength: number): string {
  const priorReviews =
    Number.isFinite(reviewHistoryLength) && reviewHistoryLength > 0
      ? Math.floor(reviewHistoryLength)
      : 0;
  return `submission:${priorReviews + 1}`;
}

export function jobPostApprovalCycle(approvedAt: Date): string {
  return `approval:${approvedAt.toISOString()}`;
}

async function loadEmployerForJobWhatsApp(
  employerId: string,
): Promise<EmployerWhatsAppSnapshot | null> {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    return null;
  }
  return EmployerModel.findById(employerId)
    .select("whatsappNumber companyName establishmentName firstName lastName")
    .lean();
}

function scheduleJobPostWhatsApp(
  owner: { enqueue: typeof enqueueWhatsAppNotification },
  event: Extract<WhatsAppNotificationEvent, "JOB_POST_SUBMITTED" | "JOB_POST_APPROVED">,
  templateName: "job_post_submitted" | "job_post_approved",
  input: JobPostWhatsAppInput,
): void {
  const employerId = input.employerId.trim();
  const publicJobId = input.publicJobId.trim();
  const cycle = input.cycle.trim();
  if (!employerId || !publicJobId || !cycle) {
    console.info("[WhatsAppNotification] Job notification skipped - missing employer or job", {
      event,
      employerId,
      publicJobId,
    });
    return;
  }

  void (async () => {
    const employer = await loadEmployerForJobWhatsApp(employerId);
    const phoneNumber = employer?.whatsappNumber?.trim() ?? "";
    if (!phoneNumber) {
      console.info(
        "[WhatsAppNotification] Job notification skipped - no employer WhatsApp number",
        { event, employerId, publicJobId },
      );
      return;
    }

    const result = await owner.enqueue({
      event,
      entityId: publicJobId,
      phoneNumber,
      employerName: resolveEmployerRegistrationDisplayName(employer ?? {}),
      preferredLanguage: "en",
      idempotencyScope: cycle,
    });
    if (result === "queued") {
      console.info("[WhatsAppNotification] Job notification queued", {
        event,
        template: templateName,
        language: "en",
        publicJobId,
      });
    }
  })().catch((error: unknown) => {
    console.error("[WhatsAppNotification] Job notification failed", {
      event,
      publicJobId,
      employerId,
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  });
}

export const jobPostSubmittedWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: JobPostWhatsAppInput): void {
    scheduleJobPostWhatsApp(this, "JOB_POST_SUBMITTED", "job_post_submitted", input);
  },
};

export const jobPostApprovedWhatsApp = {
  enqueue: enqueueWhatsAppNotification,
  schedule(input: JobPostWhatsAppInput): void {
    scheduleJobPostWhatsApp(this, "JOB_POST_APPROVED", "job_post_approved", input);
  },
};
