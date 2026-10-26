import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  composeWhatsAppTemplateText,
  fillWhatsAppTemplateParameters,
  lookupWhatsAppTemplateText,
  notificationPlaceholderTemplateName,
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
