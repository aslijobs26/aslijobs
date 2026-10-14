import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyWhatsAppTemplateFailure } from "../whatsapp.service.js";
import { WHATSAPP_NOTIFICATION_TEMPLATES } from "./whatsapp-notification.constants.js";
import {
  decideDispatchReclaim,
  shouldApplyWhatsAppDeliveryStatus,
  WHATSAPP_NOTIFICATION_STALE_CLAIM_MS,
} from "./whatsapp-notification.model.js";
import {
  buildWhatsAppNotificationBodyParameters,
  buildWhatsAppNotificationUrlButtonParameters,
  getWhatsAppNotificationTemplate,
} from "./whatsapp-notification.policy.js";

const approvedNames = [
  "employer_account_created",
  "jobseeker_account_created",
  "jobseeker_account_created_te",
  "jobseeker_profile_completion",
  "jobseeker_profile_completion_te",
  "employer_profile_completion_required",
  "aslijobs_account_approved",
  "employer_account_rejected",
  "job_post_submitted",
  "job_post_approved",
  "job_post_rejected_v1",
  "job_application_submitted",
  "job_application_submitted_te",
  "interview_scheduled_phone",
  "interview_scheduled_phone_te",
  "interview_scheduled_online",
  "interview_scheduled_online_te",
  "interview_scheduled_offline",
  "interview_scheduled_offline_te",
  "interview_rescheduled",
  "interview_rescheduled_te",
  "interview_cancelled",
  "interview_cancelled_te",
  "job_post_incomplete_",
] as const;

describe("WhatsApp notification lifecycle", () => {
  it("reclaims a failed dispatch and keeps an accepted one", () => {
    assert.equal(
      decideDispatchReclaim({ status: "failed", messageId: "" }),
      "reclaim",
    );
    assert.equal(
      decideDispatchReclaim({
        status: "accepted",
        messageId: "wamid.1",
      }),
      "duplicate",
    );
    assert.equal(
      decideDispatchReclaim({ status: "ambiguous", messageId: "" }),
      "duplicate",
    );
    const fresh = new Date();
    assert.equal(
      decideDispatchReclaim(
        { status: "processing", messageId: "", updatedAt: fresh },
        fresh,
      ),
      "duplicate",
    );
    assert.equal(
      decideDispatchReclaim(
        {
          status: "queued",
          messageId: "",
          updatedAt: new Date(fresh.getTime() - WHATSAPP_NOTIFICATION_STALE_CLAIM_MS),
        },
        fresh,
      ),
      "reclaim",
    );
  });

  it("does not let an older webhook overwrite a newer status", () => {
    assert.equal(shouldApplyWhatsAppDeliveryStatus("accepted", "sent"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("sent", "delivered"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("delivered", "read"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("read", "delivered"), false);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("delivered", "failed"), false);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("sent", "failed"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("sent", "sent"), false);
  });

  it("classifies Meta failures without retrying timeouts", () => {
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 0, timedOut: true }),
      "ambiguous",
    );
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 429, metaCode: 130429 }),
      "retryable",
    );
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 404, metaCode: 132001 }),
      "permanent",
    );
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 500, metaCode: 132001 }),
      "permanent",
    );
    assert.equal(classifyWhatsAppTemplateFailure({ status: 500 }), "retryable");
  });

  it("keeps every approved template name and leaves unused events unmapped", () => {
    const names = new Set<string>();
    for (const config of Object.values(WHATSAPP_NOTIFICATION_TEMPLATES)) {
      if (!config) continue;
      names.add(config.templateName);
      for (const localized of Object.values(config.localizedTemplateNames ?? {})) {
        if (localized) names.add(localized);
      }
    }
    for (const name of approvedNames) {
      assert.equal(names.has(name), true, name);
    }
    assert.equal(names.has("job_post_incomplete"), false);
    for (const event of [
      "EMPLOYER_PROFILE_COMPLETION_REMINDER",
      "JOB_APPROVED",
      "JOB_REJECTED",
      "APPLICATION_RECEIVED",
      "INTERVIEW_SCHEDULED",
      "APPLICATION_STATUS_UPDATED",
    ] as const) {
      assert.equal(getWhatsAppNotificationTemplate(event), null);
    }
  });

  it("omits button parameters for static profile completion and sends only the job id for incomplete posts", () => {
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters(
        "JOBSEEKER_PROFILE_COMPLETION",
        {
          event: "JOBSEEKER_PROFILE_COMPLETION",
          entityId: "64f0000000000000000000a1",
          phoneNumber: "9876543210",
        },
      ),
      [],
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters("JOB_POST_INCOMPLETE", {
        event: "JOB_POST_INCOMPLETE",
        entityId: "64f0000000000000000000dd",
        phoneNumber: "9876543210",
        employerName: "Acme",
      }),
      ["Acme"],
    );
    assert.deepEqual(
      buildWhatsAppNotificationUrlButtonParameters("JOB_POST_INCOMPLETE", {
        event: "JOB_POST_INCOMPLETE",
        entityId: "64f0000000000000000000dd",
        phoneNumber: "9876543210",
      }),
      ["64f0000000000000000000dd"],
    );
  });
});
