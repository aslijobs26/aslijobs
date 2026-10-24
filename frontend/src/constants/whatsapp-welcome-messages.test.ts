import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WHATSAPP_CONTACT_URL } from "./cta";
import {
  WHATSAPP_FAB_ACTION_DEFINITIONS,
  WHATSAPP_FAB_ACTION_MESSAGES,
  WHATSAPP_WELCOME_EMPLOYER_MESSAGES,
  WHATSAPP_WELCOME_SEEKER_MESSAGES,
  buildWhatsAppActionUrl,
  buildWhatsAppWelcomeUrl,
  getWhatsAppActionMessage,
  getWhatsAppBusinessPhoneDigits,
  getWhatsAppWelcomeMessage,
  listWhatsAppFabActionIds,
  type WhatsAppFabActionId,
} from "./whatsapp-welcome-messages";

const LANGUAGES = ["en", "hi", "te", "ta", "kn", "ml"] as const;

describe("whatsapp welcome messages", () => {
  it("returns the configured business phone digits from wa.me", () => {
    const phone = getWhatsAppBusinessPhoneDigits();
    assert.match(phone, /^\d{10,15}$/);
    assert.match(WHATSAPP_CONTACT_URL, new RegExp(`wa\\.me/${phone}`));
    assert.doesNotMatch(phone, /\s/);
  });

  it("returns the correct seeker and employer guest messages for every language", () => {
    for (const language of LANGUAGES) {
      assert.equal(
        getWhatsAppWelcomeMessage("seeker", language),
        WHATSAPP_WELCOME_SEEKER_MESSAGES[language],
      );
      assert.equal(
        getWhatsAppWelcomeMessage("employer", language),
        WHATSAPP_WELCOME_EMPLOYER_MESSAGES[language],
      );
    }
  });

  it("falls back to English for unsupported languages", () => {
    assert.equal(
      getWhatsAppWelcomeMessage("seeker", "fr"),
      WHATSAPP_WELCOME_SEEKER_MESSAGES.en,
    );
    assert.equal(
      getWhatsAppWelcomeMessage("employer", "unknown"),
      WHATSAPP_WELCOME_EMPLOYER_MESSAGES.en,
    );
  });

  it("builds encoded wa.me URLs for every role action and language", () => {
    const actionIds = WHATSAPP_FAB_ACTION_DEFINITIONS.map((action) => action.id);
    for (const language of LANGUAGES) {
      for (const actionId of actionIds) {
        const url = buildWhatsAppActionUrl(actionId, language);
        const phone = getWhatsAppBusinessPhoneDigits();
        const message = getWhatsAppActionMessage(actionId, language);
        assert.equal(
          url,
          `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        );
        assert.equal((url.match(/[?&]text=/g) ?? []).length, 1);
        assert.doesNotMatch(url, /localhost|127\.0\.0\.1|access_token|WHATSAPP_ACCESS/i);
      }
    }
  });

  it("keeps guest welcome URL helpers aligned with find_job and hire_staff", () => {
    assert.equal(
      buildWhatsAppWelcomeUrl("seeker", "hi"),
      buildWhatsAppActionUrl("find_job", "hi"),
    );
    assert.equal(
      buildWhatsAppWelcomeUrl("employer", "te"),
      buildWhatsAppActionUrl("hire_staff", "te"),
    );
  });

  it("stores distinct messages for authenticated role actions", () => {
    const seekerOnly: WhatsAppFabActionId[] = [
      "find_jobs",
      "profile_jobs",
      "application_status",
      "seeker_help",
    ];
    const employerOnly: WhatsAppFabActionId[] = [
      "post_job",
      "my_jobs",
      "employer_applications",
      "employer_help",
    ];
    assert.deepEqual(listWhatsAppFabActionIds("jobseeker"), seekerOnly);
    assert.deepEqual(listWhatsAppFabActionIds("employer"), employerOnly);
    for (const language of LANGUAGES) {
      assert.match(WHATSAPP_FAB_ACTION_MESSAGES.profile_jobs[language], /profile|ప్రొఫైల్|प्रोफाइल|suitable/i);
      assert.match(
        WHATSAPP_FAB_ACTION_MESSAGES.application_status[language],
        /applications?|status|అప్లికేషన్|आवेदन/i,
      );
      assert.match(WHATSAPP_FAB_ACTION_MESSAGES.my_jobs[language], /posted|my jobs/i);
      assert.match(
        WHATSAPP_FAB_ACTION_MESSAGES.employer_applications[language],
        /application|my jobs/i,
      );
    }
  });
});
