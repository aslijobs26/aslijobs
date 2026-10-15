import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { env } from "../../config/env.js";
import {
  WhatsAppService,
  WhatsAppTemplateDeliveryError,
  classifyWhatsAppTemplateFailure,
  maskWhatsAppRecipient,
} from "./whatsapp.service.js";

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

  it("sendTemplateMessage posts aslijobs_account_approved with profile type then post-job id", async () => {
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
      ["Company"],
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
    assert.equal(template.components[0]?.parameters[0]?.text, "Company");
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

  it("keeps Graph failure status and code without the recipient", async () => {
    mock.method(globalThis, "fetch", async () =>
      jsonResponse(400, {
        error: {
          message: "Recipient 919876543210 is not valid",
          type: "OAuthException",
          code: 132001,
        },
      }),
    );

    await assert.rejects(
      () =>
        new WhatsAppService().sendTemplateMessage(
          "9876543210",
          "jobseeker_account_created",
          "en",
        ),
      (error: unknown) => {
        assert.equal(error instanceof WhatsAppTemplateDeliveryError, true);
        const deliveryError = error as WhatsAppTemplateDeliveryError;
        assert.equal(deliveryError.status, 400);
        assert.equal(deliveryError.metaCode, 132001);
        assert.equal(deliveryError.failureClass, "permanent");
        assert.equal(deliveryError.message.includes("919876543210"), false);
        assert.equal(deliveryError.detail.includes("919876543210"), false);
        assert.equal(deliveryError.message.includes("Recipient"), false);
        assert.match(deliveryError.message, /status=400 code=132001/);
        assert.equal(
          classifyWhatsAppTemplateFailure({ status: 404, metaCode: 132001 }),
          "permanent",
        );
        return true;
      },
    );
  });
});

describe("Telugu template Cloud API payloads", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  const cases = [
    {
      name: "jobseeker_account_created_te",
      body: [] as string[],
    },
    {
      name: "jobseeker_profile_completion_te",
      body: [] as string[],
    },
    {
      name: "job_application_submitted_te",
      body: ["Welder", "Northwind"],
    },
    {
      name: "interview_scheduled_phone_te",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM"],
    },
    {
      name: "interview_scheduled_online_te",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM"],
    },
    {
      name: "interview_scheduled_offline_te",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM", "North gate"],
    },
    {
      name: "interview_rescheduled_te",
      body: ["Welder", "Northwind", "2 December 2026", "3:05 PM", "South gate"],
    },
    {
      name: "interview_cancelled_te",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM"],
    },
  ];

  for (const item of cases) {
    it(`posts ${item.name} with language te and ${item.body.length} body parameters`, async () => {
      const captured: { url?: string; body?: Record<string, unknown> } = {};
      mock.method(globalThis, "fetch", async (url: string | URL, init?: RequestInit) => {
        captured.url = String(url);
        captured.body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return jsonResponse(200, {
          messages: [{ id: "wamid.te", message_status: "accepted" }],
        });
      });

      const result = await new WhatsAppService().sendTemplateMessage(
        "9876543210",
        item.name,
        "te",
        item.body,
        [],
        { correlationId: "corr-te" },
      );

      const template = captured.body?.template as {
        name: string;
        language: { code: string };
        components?: Array<{ parameters: Array<{ text: string }> }>;
      };
      assert.equal(result.messageId, "wamid.te");
      assert.equal(result.messageStatus, "accepted");
      assert.equal(template.name, item.name);
      assert.equal(template.language.code, "te");
      assert.notEqual(template.language.code, "te_IN");
      assert.notEqual(template.language.code, "te-IN");
      if (item.body.length === 0) {
        assert.equal(template.components, undefined);
      } else {
        assert.deepEqual(
          template.components?.[0]?.parameters.map((parameter) => parameter.text),
          item.body,
        );
      }
      assert.equal(JSON.stringify(captured.body).includes("header"), false);
      const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID.trim();
      const version = env.WHATSAPP_API_VERSION.replace(/^\/+|\/+$/g, "");
      assert.equal(
        captured.url,
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      );
    });
  }

  it("records Meta 132001 as a permanent failure and does not treat acceptance as delivery", async () => {
    mock.method(globalThis, "fetch", async () =>
      jsonResponse(404, {
        error: {
          message: "(#132001) Template name does not exist in the translation",
          type: "OAuthException",
          code: 132001,
          error_user_title: "Template name does not exist in the translation",
        },
      }),
    );

    await assert.rejects(
      () =>
        new WhatsAppService().sendTemplateMessage(
          "9876543210",
          "jobseeker_account_created_te",
          "te",
          [],
          [],
          { correlationId: "corr-132001" },
        ),
      (error: unknown) => {
        assert.equal(error instanceof WhatsAppTemplateDeliveryError, true);
        const deliveryError = error as WhatsAppTemplateDeliveryError;
        assert.equal(deliveryError.status, 404);
        assert.equal(deliveryError.metaCode, 132001);
        assert.equal(deliveryError.failureClass, "permanent");
        assert.match(deliveryError.detail, /132001|does not exist/);
        assert.equal(deliveryError.detail.includes("9876543210"), false);
        return true;
      },
    );
  });
});

describe("Hindi template Cloud API payloads", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  const cases = [
    { name: "jobseeker_account_created_hi", body: [] as string[] },
    { name: "jobseeker_profile_completion_hi", body: [] as string[] },
    { name: "job_application_submitted_hi", body: ["Welder", "Northwind"] },
    {
      name: "interview_scheduled_phone_hi",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM"],
    },
    {
      name: "interview_scheduled_online_hi",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM"],
    },
    {
      name: "interview_scheduled_offline_hi",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM", "North gate"],
    },
    {
      name: "interview_rescheduled_hi",
      body: ["Welder", "Northwind", "2 December 2026", "3:05 PM", "South gate"],
    },
    {
      name: "interview_cancelled_hi",
      body: ["Welder", "Northwind", "1 December 2026", "11:00 AM"],
    },
  ];

  for (const item of cases) {
    it(`posts ${item.name} with language hi and ${item.body.length} body parameters`, async () => {
      const captured: { url?: string; body?: Record<string, unknown> } = {};
      mock.method(globalThis, "fetch", async (url: string | URL, init?: RequestInit) => {
        captured.url = String(url);
        captured.body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
        return jsonResponse(200, {
          messages: [{ id: "wamid.hi", message_status: "accepted" }],
        });
      });

      const result = await new WhatsAppService().sendTemplateMessage(
        "9876543210",
        item.name,
        "hi",
        item.body,
        [],
        { correlationId: "corr-hi" },
      );

      const template = captured.body?.template as {
        name: string;
        language: { code: string };
        components?: Array<{ parameters: Array<{ text: string }> }>;
      };
      assert.equal(result.messageId, "wamid.hi");
      assert.equal(template.name, item.name);
      assert.equal(template.language.code, "hi");
      assert.notEqual(template.language.code, "hi-IN");
      assert.notEqual(template.language.code, "hi_IN");
      if (item.body.length === 0) {
        assert.equal(template.components, undefined);
      } else {
        assert.deepEqual(
          template.components?.[0]?.parameters.map((parameter) => parameter.text),
          item.body,
        );
      }
      assert.equal(JSON.stringify(captured.body).includes("header"), false);
    });
  }
});

describe("maskWhatsAppRecipient", () => {
  it("masks all but the last four digits", () => {
    assert.equal(maskWhatsAppRecipient("919876543210"), "****3210");
  });
});
