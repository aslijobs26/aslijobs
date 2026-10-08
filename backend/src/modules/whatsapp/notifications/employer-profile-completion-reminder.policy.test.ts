import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { env } from "../../../config/env.js";
import {
  employerProfileCompletionReminderDelayMs,
  shouldSendEmployerProfileCompletionReminder,
} from "./employer-profile-completion-reminder.policy.js";
import { getEmployerProfileCompletionReminderDelayMs } from "./employer-profile-completion-reminder.service.js";
import {
  buildWhatsAppNotificationBodyParameters,
  getWhatsAppNotificationTemplate,
  resolveWhatsAppNotificationLanguage,
} from "./whatsapp-notification.policy.js";

describe("employer profile completion reminder policy", () => {
  it("derives delay from configured minutes instead of a hardcoded duration", () => {
    assert.equal(employerProfileCompletionReminderDelayMs(1), 60_000);
    assert.equal(employerProfileCompletionReminderDelayMs(30), 1_800_000);
    assert.equal(
      employerProfileCompletionReminderDelayMs(
        env.EMPLOYER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES,
      ),
      getEmployerProfileCompletionReminderDelayMs(),
    );
    assert.equal(
      getEmployerProfileCompletionReminderDelayMs(),
      env.EMPLOYER_PROFILE_COMPLETION_REMINDER_DELAY_MINUTES * 60_000,
    );
  });

  it("sends only when the latest employer profile is still incomplete", () => {
    assert.equal(
      shouldSendEmployerProfileCompletionReminder({
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
      }),
      true,
    );
  });

  it("keeps a Company Profile employer eligible after OTP when details are incomplete", () => {
    assert.equal(
      shouldSendEmployerProfileCompletionReminder({
        isProfileComplete: false,
        registrationStatus: "otp_verified",
        whatsappNumber: "9876543210",
        companyName: "Veeresh",
      }),
      true,
    );
  });

  it("does not send when the employer completed the profile before the delay elapsed", () => {
    assert.equal(
      shouldSendEmployerProfileCompletionReminder({
        isProfileComplete: true,
        registrationStatus: "completed",
        whatsappNumber: "9876543210",
      }),
      false,
    );
  });

  it("maps the reminder event to the approved Meta template and {{1}} employer name", () => {
    const config = getWhatsAppNotificationTemplate(
      "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
    );
    assert.equal(config?.templateName, "employer_profile_completion_required");
    assert.equal(
      resolveWhatsAppNotificationLanguage(
        "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
        "en",
      ),
      "en",
    );
    assert.deepEqual(
      buildWhatsAppNotificationBodyParameters(
        "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
        {
          event: "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
          entityId: "abc",
          phoneNumber: "9876543210",
          employerName: "Test Employer",
        },
      ),
      ["Test Employer"],
    );
  });
});
