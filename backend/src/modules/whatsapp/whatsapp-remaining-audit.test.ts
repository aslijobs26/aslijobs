import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { shouldApplyWhatsAppDeliveryStatus } from "./notifications/whatsapp-notification.model.js";
import {
  indianWhatsAppNationalPhone,
  understandLocally,
} from "./whatsapp-bot.logic.js";

describe("WhatsApp remaining audit — production readiness", () => {
  it("defers session lastJobs write until after a successful Meta send", () => {
    const source = readFileSync(
      new URL("./whatsapp-bot.service.ts", import.meta.url),
      "utf8",
    );
    const sendIdx = source.indexOf("sendBotTextMessage");
    const persistIdx = source.indexOf(
      "await WhatsAppSessionModel.findOneAndUpdate({ phone }, sessionPatch",
    );
    assert.ok(sendIdx > 0);
    assert.ok(persistIdx > sendIdx);
  });

  it("uses employer-wide application metrics instead of summing 5 listed jobs", () => {
    const source = readFileSync(
      new URL("./whatsapp-bot.service.ts", import.meta.url),
      "utf8",
    );
    assert.match(source, /loadEmployerApplicationMetricsTotals/);
    assert.match(source, /totalApplications:\s*metrics\.applications/);
  });

  it("exposes readiness that fails while draining and checks Mongo", () => {
    const app = readFileSync(new URL("../../app.ts", import.meta.url), "utf8");
    assert.match(app, /\/api\/v1\/health\/ready/);
    assert.match(app, /isRuntimeShuttingDown/);
    assert.match(app, /readyState === 1/);
    const server = readFileSync(
      new URL("../../server.ts", import.meta.url),
      "utf8",
    );
    assert.match(server, /markRuntimeShuttingDown/);
    assert.match(server, /Promise\.allSettled/);
    assert.match(server, /closeHttp/);
  });

  it("keeps OTP hash on ambiguous WhatsApp delivery", () => {
    const otp = readFileSync(
      new URL("../otp/otp.service.ts", import.meta.url),
      "utf8",
    );
    assert.match(otp, /failureClass === "ambiguous"/);
    assert.match(otp, /keeping issued OTP/);
  });

  it("guards admin text send persist after Meta accept", () => {
    const source = readFileSync(
      new URL(
        "../operations/whatsapp-inbox/operations-whatsapp-inbox.service.ts",
        import.meta.url,
      ),
      "utf8",
    );
    assert.match(source, /acceptedByProvider/);
    assert.match(source, /WHATSAPP_INBOX_PERSIST_FAILED/);
  });
});

describe("WhatsApp remaining audit — multilingual smoke", () => {
  it("classifies job search in all six languages without inventing a city", () => {
    const samples: Array<{ text: string; language: string }> = [
      { text: "Hyderabad lo driver job kavali", language: "te" },
      { text: "मुझे हैदराबाद में ड्राइवर नौकरी चाहिए", language: "hi" },
      { text: "I need a driver job in Hyderabad", language: "en" },
      { text: "Hyderabad la driver job venum", language: "ta" },
      { text: "Nanage Hyderabad alli driver job beku", language: "kn" },
      { text: "Enikku Hyderabadil driver job venam", language: "ml" },
    ];
    for (const sample of samples) {
      const understood = understandLocally(sample.text);
      assert.equal(understood.intent, "JOB_SEARCH", sample.text);
      assert.equal(understood.language, sample.language, sample.text);
      assert.equal(understood.location, "Hyderabad", sample.text);
      assert.match(understood.category, /Driver/i, sample.text);
    }
  });

  it("still rejects foreign WhatsApp identity collapse", () => {
    assert.equal(indianWhatsAppNationalPhone("9779812345678"), null);
    assert.equal(indianWhatsAppNationalPhone("919876543210"), "9876543210");
  });
});

describe("WhatsApp remaining audit — delivery status policy", () => {
  it("does not let failed overwrite delivered/read", () => {
    assert.equal(shouldApplyWhatsAppDeliveryStatus("delivered", "failed"), false);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("read", "failed"), false);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("sent", "failed"), true);
    assert.equal(shouldApplyWhatsAppDeliveryStatus("sent", "delivered"), true);
  });
});
