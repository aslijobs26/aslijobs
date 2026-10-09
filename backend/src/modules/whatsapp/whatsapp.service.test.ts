import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { env } from "../../config/env.js";
import { WhatsAppService, maskWhatsAppRecipient } from "./whatsapp.service.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("WhatsAppService template and existing senders", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("sendTemplateMessage posts employer_account_created with {{1}} as employer name", async () => {
    const captured: { url?: string; body?: Record<string, unknown> } = {};
    mock.method(globalThis, "fetch", async (url: string | URL, init?: RequestInit) => {
      captured.url = String(url);
      captured.body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return jsonResponse(200, {
        messages: [{ id: "wamid.test", message_status: "accepted" }],
      });
    });

    const service = new WhatsAppService();
    const result = await service.sendTemplateMessage(
      "9876543210",
      "employer_account_created",
      "en",
      ["Test Employer"],
    );

    assert.equal(result.messageId, "wamid.test");
    assert.equal(captured.body?.messaging_product, "whatsapp");
    assert.equal(captured.body?.type, "template");
    assert.equal(captured.body?.to, "919876543210");
    const template = captured.body?.template as {
      name: string;
      language: { code: string };
      components: Array<{ type: string; parameters: Array<{ text: string }> }>;
    };
    assert.equal(template.name, "employer_account_created");
    assert.equal(template.language.code, "en");
    assert.equal(template.components[0]?.type, "body");
    assert.equal(template.components[0]?.parameters[0]?.text, "Test Employer");
    assert.match(String(captured.url), /graph\.facebook\.com\/.+\/messages$/);
  });

  it("sendTemplateMessage posts aslijobs_account_approved with name and post-job id", async () => {
    const captured: { body?: Record<string, unknown> } = {};
    mock.method(globalThis, "fetch", async (_url: string | URL, init?: RequestInit) => {
      captured.body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return jsonResponse(200, {
        messages: [{ id: "wamid.approved", message_status: "accepted" }],
      });
    });

    const employerId = "6ac746ac72aed3c70a82de5b";
    await new WhatsAppService().sendTemplateMessage(
      "9876543210",
      "aslijobs_account_approved",
      "en",
      ["Acme Pvt Ltd"],
      [employerId],
    );

    const template = captured.body?.template as {
      name: string;
      language: { code: string };
      components: Array<{
        type: string;
        sub_type?: string;
        index?: string;
        parameters: Array<{ type: string; text: string }>;
      }>;
    };
    assert.equal(template.name, "aslijobs_account_approved");
    assert.equal(template.language.code, "en");
    assert.equal(template.components[0]?.type, "body");
    assert.equal(template.components[0]?.parameters[0]?.text, "Acme Pvt Ltd");
    assert.equal(template.components[1]?.type, "button");
    assert.equal(template.components[1]?.sub_type, "url");
    assert.equal(template.components[1]?.index, "0");
    assert.equal(template.components[1]?.parameters[0]?.text, employerId);
    assert.equal(
      `https://www.aslijobs.com/post-job/${template.components[1]?.parameters[0]?.text}`,
      `https://www.aslijobs.com/post-job/${employerId}`,
    );
  });

  it("formats the recipient through toWhatsAppCloudRecipient", async () => {
    let to = "";
    mock.method(globalThis, "fetch", async (_url: string | URL, init?: RequestInit) => {
      to = (JSON.parse(String(init?.body ?? "{}")) as { to?: string }).to ?? "";
      return jsonResponse(200, { messages: [{ id: "wamid.x" }] });
    });

    await new WhatsAppService().sendTemplateMessage(
      "9876543210",
      "employer_account_created",
      "en",
      ["Acme"],
    );
    assert.equal(to, "919876543210");
  });

  it("never logs the access token", async () => {
    const logs: string[] = [];
    const token = env.WHATSAPP_ACCESS_TOKEN;
    mock.method(console, "info", (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    mock.method(console, "error", (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
    mock.method(globalThis, "fetch", async () =>
      jsonResponse(200, { messages: [{ id: "wamid.safe" }] }),
    );

    await new WhatsAppService().sendTemplateMessage(
      "9876543210",
      "employer_account_created",
      "en",
      ["Safe Co"],
    );

    const joined = logs.join("\n");
    assert.equal(joined.includes("Bearer "), false);
    if (token.trim()) {
      assert.equal(joined.includes(token), false);
    }
    assert.match(joined, /to=\*\*\*\*3210/);
  });

  it("sendOtpMessage still sends the OTP template payload", async () => {
    const captured: Record<string, unknown> = {};
    mock.method(globalThis, "fetch", async (_url: string | URL, init?: RequestInit) => {
      Object.assign(
        captured,
        JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
      );
      return jsonResponse(200, { messages: [{ id: "wamid.otp" }] });
    });

    await new WhatsAppService().sendOtpMessage("9876543210", "123456");
    assert.equal(captured.type, "template");
    const template = captured.template as { name: string };
    assert.equal(template.name, env.WHATSAPP_OTP_TEMPLATE_NAME);
    assert.notEqual(template.name, "employer_account_created");
  });

  it("sendTextMessage still sends a session text payload", async () => {
    const captured: Record<string, unknown> = {};
    mock.method(globalThis, "fetch", async (_url: string | URL, init?: RequestInit) => {
      Object.assign(
        captured,
        JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
      );
      return jsonResponse(200, { messages: [{ id: "wamid.text" }] });
    });

    await new WhatsAppService().sendTextMessage("9876543210", "Hello from bot");
    assert.equal(captured.type, "text");
    assert.equal((captured.text as { body: string }).body, "Hello from bot");
  });
});

describe("maskWhatsAppRecipient", () => {
  it("masks all but the last four digits", () => {
    assert.equal(maskWhatsAppRecipient("919876543210"), "****3210");
  });
});
