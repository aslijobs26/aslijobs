import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { env } from "../../../config/env.js";
import { persistAcceptedWhatsAppTemplate } from "../notifications/whatsapp-notification-inbox-persist.js";
import { shouldApplyWhatsAppDeliveryStatus } from "../notifications/whatsapp-notification.model.js";
import { WHATSAPP_VERIFICATION_CODE_SENT } from "./whatsapp-inbox-redaction.js";
import {
  chooseTemplateParameters,
  historicalBodyParameters,
  resolveDispatchTemplateParameters,
} from "./whatsapp-template-parameter-recovery.js";
import {
  notificationInboxText,
  presentWhatsAppTemplateText,
  renderWhatsAppTemplateMessage,
} from "./whatsapp-template-text.js";

const EMPLOYER_PROFILE =
  "Hi {{1}},\n\n✅ Your AsliJobs account has been created successfully!\n\nPlease add your company details to complete your profile.\n\nOnce done, you can start posting jobs on AsliJobs.\nComplete Your Profile";
const SEEKER_PROFILE =
  "🎉Your AsliJobs account registration is successful.\n\nYou can access your account and update your profile details at any time.\nComplete Your Profile";
const APPLICATION =
  "✅ Your job application has been sent successfully!\n\nJob: {{1}}\nCompany: {{2}}\n\n📩 We’ll let you know when there is an update on your application.";
const APPLICATION_TE =
  "మీరు ఉద్యోగానికి విజయవంతంగా దరఖాస్తు చేశారు!\n\n💼 ఉద్యోగం: {{1}}\n🏢 కంపెనీ: {{2}}\n\nమీ దరఖాస్తు గురించి ఏదైనా సమాచారం ఉంటే మీకు మెసేజ్ చేస్తాము.";
const APPLICATION_HI =
  "✅ आपका नौकरी का आवेदन सफलतापूर्वक भेज दिया गया है!\n\nपद: {{1}}\nकंपनी: {{2}}\n\nआपके आवेदन से जुड़ा कोई भी अपडेट मिलने पर हम आपको सूचित करेंगे।";
const INTERVIEW =
  "💻 Your online interview is scheduled!\n\nJob: {{1}}\nCompany: {{2}}\nDate: {{3}}\nTime: {{4}}\nInterview Type: Online\n\nPlease join on time using the interview link below.";
const INTERVIEW_TE =
  "💻 మీ ఆన్‌లైన్ ఇంటర్వ్యూ షెడ్యూల్ చేయబడింది!\n\nఉద్యోగం: {{1}}\nకంపెనీ: {{2}}\nతేదీ: {{3}}\nసమయం: {{4}}\nఇంటర్వ్యూ విధానం: ఆన్‌లైన్\n\nకంపెనీ వారు పంపిన ఇంటర్వ్యూ లింక్‌పై క్లిక్ చేసి, ఇచ్చిన సమయానికి జాయిన్ అవ్వండి.";
const INTERVIEW_HI =
  "💻 आपका ऑनलाइन इंटरव्यू तय हो गया है!\n\nपद: {{1}}\nकंपनी: {{2}}\nतारीख: {{3}}\nसमय: {{4}}\nइंटरव्यू का प्रकार: ऑनलाइन\n\n कृपया नीचे दिए गए इंटरव्यू लिंक के ज़रिए समय पर जुड़ें।";
const ACCOUNT_CREATED =
  "🎉 Your AsliJobs account is ready!\n\nYou can now search for jobs, apply for jobs, check your applications and get interview updates on WhatsApp.";

describe("whatsapp inbox template rendering", () => {
  it("renders the employer profile-completion template with the saved name", () => {
    const rendered = renderWhatsAppTemplateMessage({
      templateText: EMPLOYER_PROFILE,
      bodyParameters: ["Veeresh Org"],
      templateName: "employer_profile_completion_required",
    });
    assert.equal(rendered.complete, true);
    assert.deepEqual(rendered.missingParameters, []);
    assert.equal(rendered.text.startsWith("Hi Veeresh Org,"), true);
    assert.equal(rendered.text.includes("{{"), false);
    assert.equal(rendered.text.endsWith("Complete Your Profile"), true);
  });

  it("renders the job seeker profile-completion template without inventing fields", () => {
    const rendered = presentWhatsAppTemplateText({
      templateText: SEEKER_PROFILE,
      bodyParameters: [],
      templateName: "jobseeker_profile_completion",
    });
    assert.equal(rendered, SEEKER_PROFILE);
    assert.equal(rendered.includes("{{"), false);
  });

  it("renders the application template with the job title and company that were sent", () => {
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: APPLICATION,
        bodyParameters: ["Delivery Boy", "ABC Logistics"],
        templateName: "job_application_submitted",
      }),
      APPLICATION.replace("{{1}}", "Delivery Boy").replace("{{2}}", "ABC Logistics"),
    );
  });

  it("renders the interview template with the formatted date and time", () => {
    const parameters = historicalBodyParameters({
      event: "INTERVIEW_SCHEDULED_ONLINE",
      jobTitle: "Delivery Boy",
      companyName: "ABC Logistics",
      interviewDate: "2026-12-30",
      interviewTime: "11:00",
    });
    assert.deepEqual(parameters, [
      "Delivery Boy",
      "ABC Logistics",
      "30 December 2026",
      "11:00 AM",
    ]);
    const rendered = presentWhatsAppTemplateText({
      templateText: INTERVIEW,
      bodyParameters: parameters ?? [],
      templateName: "interview_scheduled_online",
    });
    assert.equal(rendered.includes("Date: 30 December 2026"), true);
    assert.equal(rendered.includes("Time: 11:00 AM"), true);
    assert.equal(rendered.includes("{{"), false);
  });

  it("keeps the approved account-created wording when the template has no variables", () => {
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: ACCOUNT_CREATED,
        bodyParameters: [],
        templateName: "jobseeker_account_created",
      }),
      ACCOUNT_CREATED,
    );
  });

  it("keeps Telugu and Hindi parameter order", () => {
    const values = ["Welder", "Northwind", "30 December 2026", "11:00 AM"];
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: APPLICATION_TE,
        bodyParameters: ["Welder", "Northwind"],
        templateName: "job_application_submitted_te",
      }).includes("💼 ఉద్యోగం: Welder\n🏢 కంపెనీ: Northwind"),
      true,
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: APPLICATION_HI,
        bodyParameters: ["Welder", "Northwind"],
        templateName: "job_application_submitted_hi",
      }).includes("पद: Welder\nकंपनी: Northwind"),
      true,
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: INTERVIEW_TE,
        bodyParameters: values,
        templateName: "interview_scheduled_online_te",
      }).includes("ఉద్యోగం: Welder\nకంపెనీ: Northwind\nతేదీ: 30 December 2026\nసమయం: 11:00 AM"),
      true,
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: INTERVIEW_HI,
        bodyParameters: values,
        templateName: "interview_scheduled_online_hi",
      }).includes("पद: Welder\nकंपनी: Northwind\nतारीख: 30 December 2026\nसमय: 11:00 AM"),
      true,
    );
  });

  it("detects missing parameters instead of leaving placeholders", () => {
    const rendered = renderWhatsAppTemplateMessage({
      templateText: APPLICATION,
      bodyParameters: ["Welder"],
      templateName: "job_application_submitted",
    });
    assert.equal(rendered.complete, false);
    assert.deepEqual(rendered.missingParameters, [2]);
    assert.equal(rendered.text.includes("{{"), false);
    assert.equal(
      historicalBodyParameters({
        event: "JOB_APPLICATION_SUBMITTED",
        jobTitle: "Welder",
        companyName: "",
      }),
      null,
    );
    assert.equal(
      historicalBodyParameters({
        event: "INTERVIEW_SCHEDULED_OFFLINE",
        jobTitle: "Welder",
        companyName: "Northwind",
        interviewDate: "2026-12-30",
        interviewTime: "11:00",
        interviewVenue: "",
      }),
      null,
    );
  });

  it("uses stored send parameters and does not replace them with later records", async () => {
    let loaded = 0;
    const resolved = await resolveDispatchTemplateParameters({
      storedParameters: ["Original Co"],
      loadRecovered: async () => {
        loaded += 1;
        return ["Changed Co"];
      },
    });
    assert.deepEqual(resolved.parameters, ["Original Co"]);
    assert.equal(loaded, 0);
    assert.deepEqual(
      chooseTemplateParameters(["Original Co"], ["Changed Co"]),
      ["Original Co"],
    );
  });

  it("reconstructs a historical message only from recovered fields", async () => {
    const resolved = await resolveDispatchTemplateParameters({
      storedParameters: [],
      loadRecovered: async () => ["Veeresh Org"],
    });
    assert.deepEqual(resolved.parameters, ["Veeresh Org"]);
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: EMPLOYER_PROFILE,
        bodyParameters: resolved.parameters ?? [],
        templateName: "employer_profile_completion_required",
      }).includes("Hi Veeresh Org,"),
      true,
    );
  });

  it("does not fabricate a historical employer name", async () => {
    assert.equal(
      historicalBodyParameters({
        event: "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
        employerName: "",
      }),
      null,
    );
    const resolved = await resolveDispatchTemplateParameters({
      storedParameters: [],
      loadRecovered: async () => null,
    });
    assert.equal(resolved.parameters, null);
    const text = presentWhatsAppTemplateText({
      templateText: EMPLOYER_PROFILE,
      bodyParameters: [],
      templateName: "employer_profile_completion_required",
    });
    assert.equal(
      text,
      "Historical template details unavailable (employer_profile_completion_required).",
    );
    assert.equal(text.includes("Employer"), false);
  });

  it("never stores an OTP code in inbox text", async () => {
    const templateName = env.WHATSAPP_OTP_TEMPLATE_NAME.trim();
    assert.equal(templateName.length > 0, true);
    const text = await notificationInboxText({
      templateName,
      language: "en",
      bodyParameters: ["654321"],
    });
    assert.equal(text, WHATSAPP_VERIFICATION_CODE_SENT);
    assert.equal(text.includes("654321"), false);
    const source = readFileSync(new URL("../whatsapp.service.ts", import.meta.url), "utf8");
    const sendOtp = source.slice(
      source.indexOf("async sendOtpMessage"),
      source.indexOf("async sendTemplateMessage"),
    );
    assert.equal(sendOtp.includes("body: WHATSAPP_VERIFICATION_CODE_SENT"), true);
    assert.equal(sendOtp.includes("body: otp"), false);
  });

  it("does not record a successful inbox message when Meta rejects the send", () => {
    const source = readFileSync(
      new URL("../notifications/whatsapp-notification.queue.ts", import.meta.url),
      "utf8",
    );
    const deliver = source.slice(
      source.indexOf("export async function deliverWhatsAppNotificationJob"),
      source.indexOf("function waitForRetry"),
    );
    const rejected = deliver.indexOf("permanent template failure");
    const persisted = deliver.indexOf("persistAcceptedWhatsAppTemplate");
    assert.ok(rejected > 0);
    assert.ok(persisted > rejected);
    assert.equal(deliver.includes('status: "accepted"'), true);
    assert.equal(deliver.includes('status: "delivered"'), false);
    assert.equal(
      deliver.includes("templateParameters: job.bodyParameters"),
      true,
    );
    assert.equal(
      deliver.includes("bodyParameters: job.bodyParameters"),
      true,
    );
  });

  it("keeps a successful Meta send from being retried after a persistence failure", async () => {
    let accepted = 0;
    let inbox = 0;
    let locked = 0;
    const failed = await persistAcceptedWhatsAppTemplate({
      markAccepted: async () => {
        accepted += 1;
        throw new Error("mongo down");
      },
      recordInbox: async () => {
        inbox += 1;
      },
      stopRetry: async () => {
        locked += 1;
      },
    });
    assert.equal(failed, "not_retried");
    assert.equal(accepted, 1);
    assert.equal(inbox, 0);
    assert.equal(locked, 1);

    const inboxFailed = await persistAcceptedWhatsAppTemplate({
      markAccepted: async () => {
        accepted += 1;
      },
      recordInbox: async () => {
        throw new Error("inbox write failed");
      },
      stopRetry: async () => {
        locked += 1;
      },
    });
    assert.equal(inboxFailed, "inbox_failed");
    assert.equal(locked, 1);
  });

  it("returns the persisted body from the inbox API and advances status without rewriting it", () => {
    const api = readFileSync(
      new URL(
        "../../operations/whatsapp-inbox/operations-whatsapp-inbox.service.ts",
        import.meta.url,
      ),
      "utf8",
    );
    assert.equal(api.includes("body: row.body"), true);
    assert.equal(api.includes("presentWhatsAppTemplateText"), false);
    const store = readFileSync(new URL("./whatsapp-inbox-store.ts", import.meta.url), "utf8");
    const outbound = store.slice(
      store.indexOf("export async function recordOutboundMessage"),
      store.indexOf("export async function applyInboxDeliveryStatus"),
    );
    const status = store.slice(store.indexOf("export async function applyInboxDeliveryStatus"));
    assert.ok(outbound.indexOf("if (providerMessageId)") < outbound.indexOf("WhatsAppInboxMessageModel.create"));
    assert.equal(status.includes("message.status = mapped"), true);
    assert.equal(status.includes("message.body"), false);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("accepted", "sent"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("sent", "delivered"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("delivered", "read"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("read", "read"), false);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("delivered", "sent"), false);
  });
});
