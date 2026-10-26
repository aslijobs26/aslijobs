import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HISTORICAL_TEMPLATE_DETAILS_UNAVAILABLE,
  composeWhatsAppTemplateText,
  fillWhatsAppTemplateParameters,
  lookupWhatsAppTemplateText,
  notificationPlaceholderTemplateName,
  presentWhatsAppTemplateText,
} from "./whatsapp-template-text.js";

describe("whatsapp template text", () => {
  it("reads the template name stored on older inbox rows", () => {
    assert.equal(
      notificationPlaceholderTemplateName(
        "WhatsApp notification sent (jobseeker_account_created).",
      ),
      "jobseeker_account_created",
    );
    assert.equal(notificationPlaceholderTemplateName("Hello"), null);
  });

  it("renders the job application template with the real job and company", () => {
    const template =
      "Your job application has been sent successfully!\nJob: {{1}}\nCompany: {{2}}";
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: template,
        bodyParameters: ["Delivery Executive", "BlinkKart Logistics"],
        templateName: "job_application_submitted",
      }),
      "Your job application has been sent successfully!\nJob: Delivery Executive\nCompany: BlinkKart Logistics",
    );
  });

  it("fills one, many, and zero parameters without leaving raw placeholders", () => {
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: "Hello {{1}}",
        bodyParameters: ["రవి 🎉"],
        templateName: "greeting",
      }),
      "Hello రవి 🎉",
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: "{{1}} / {{2}} / {{3}}\n{{4}}",
        bodyParameters: ["Welder", "Northwind", "11:00 AM", "नमस्ते"],
        templateName: "interview",
      }),
      "Welder / Northwind / 11:00 AM\nनमस्ते",
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: "Your account is ready.",
        bodyParameters: [],
        templateName: "jobseeker_account_created",
      }),
      "Your account is ready.",
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: "Job: {{1}}\nCompany: {{2}}",
        bodyParameters: [],
        templateName: "job_application_submitted",
      }),
      `${HISTORICAL_TEMPLATE_DETAILS_UNAVAILABLE} (job_application_submitted).`,
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: "Job: {{1}} note {{2}}",
        bodyParameters: ["Welder", ""],
        templateName: "job_application_submitted",
      }),
      "Job: Welder note unavailable",
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: "Code {{1}}",
        bodyParameters: ["{{2}} stays"],
        templateName: "code",
      }),
      "Code {{2}} stays",
    );
    assert.equal(
      presentWhatsAppTemplateText({
        templateText: "Hello {{1}}\nWelcome",
        bodyParameters: ["తెలుగు हिंदी தமிழ் ಕನ್ನಡ മലയാളം 🙂"],
        templateName: "greeting",
      }),
      "Hello తెలుగు हिंदी தமிழ் ಕನ್ನಡ മലയാളം 🙂\nWelcome",
    );
  });

  it("fills positional variables and keeps missing ones visible", () => {
    assert.equal(
      fillWhatsAppTemplateParameters(
        "You applied for {{1}} at {{2}}.",
        ["Welder", "Northwind"],
      ),
      "You applied for Welder at Northwind.",
    );
    assert.equal(
      fillWhatsAppTemplateParameters("Interview on {{1}}.", []),
      "Interview on {{1}}.",
    );
  });

  it("joins the approved header, body, footer, and button labels", () => {
    assert.equal(
      composeWhatsAppTemplateText([
        { type: "HEADER", text: "AsliJobs" },
        { type: "BODY", text: "Your account is ready." },
        { type: "FOOTER", text: "AsliJobs" },
        {
          type: "BUTTONS",
          buttons: [{ text: "Complete your profile" }],
        },
      ]),
      "AsliJobs\nYour account is ready.\nAsliJobs\nComplete your profile",
    );
  });

  it("prefers the requested language and falls back to English", () => {
    const catalog = new Map<string, string>([
      ["jobseeker_account_created:en", "English account message"],
      ["jobseeker_account_created_te:te", "Telugu account message"],
    ]);
    assert.equal(
      lookupWhatsAppTemplateText(catalog, "jobseeker_account_created_te", "te"),
      "Telugu account message",
    );
    assert.equal(
      lookupWhatsAppTemplateText(catalog, "jobseeker_account_created", "en_US"),
      "English account message",
    );
  });
});
