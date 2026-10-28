import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import {
  parseBotWhatsAppLanguage,
  persistJobSeekerWhatsAppLanguage,
  resolveJobSeekerAccountLanguage,
  resolveJobSeekerNotificationLanguage,
} from "./job-seeker-whatsapp-language.js";
import { WhatsAppSessionModel } from "./whatsapp-session.model.js";

const connectionReadyState = Object.getOwnPropertyDescriptor(
  mongoose.connection,
  "readyState",
);

describe("job seeker WhatsApp language preference", () => {
  afterEach(() => {
    mock.restoreAll();
    if (connectionReadyState) {
      Object.defineProperty(mongoose.connection, "readyState", connectionReadyState);
    } else {
      delete (mongoose.connection as { readyState?: number }).readyState;
    }
  });

  it("parses bot languages and rejects unknown values", () => {
    assert.equal(parseBotWhatsAppLanguage("te"), "te");
    assert.equal(parseBotWhatsAppLanguage("Telugu"), "te");
    assert.equal(parseBotWhatsAppLanguage("en"), "en");
    assert.equal(parseBotWhatsAppLanguage("hi"), "hi");
    assert.equal(parseBotWhatsAppLanguage("hi-IN"), "hi");
    assert.equal(parseBotWhatsAppLanguage("te-IN"), "te");
    assert.equal(parseBotWhatsAppLanguage("en-US"), "en");
    assert.equal(parseBotWhatsAppLanguage("ta"), "ta");
    assert.equal(parseBotWhatsAppLanguage("Tamil"), "ta");
    assert.equal(parseBotWhatsAppLanguage("ta_IN"), "ta");
    assert.equal(parseBotWhatsAppLanguage("kn"), "kn");
    assert.equal(parseBotWhatsAppLanguage("Kannada"), "kn");
    assert.equal(parseBotWhatsAppLanguage("kn-IN"), "kn");
    assert.equal(parseBotWhatsAppLanguage("ml"), "ml");
    assert.equal(parseBotWhatsAppLanguage("Malayalam"), "ml");
    assert.equal(parseBotWhatsAppLanguage("ml-IN"), "ml");
    assert.equal(parseBotWhatsAppLanguage("ml_IN"), "ml");
    assert.equal(parseBotWhatsAppLanguage("ka"), null);
    assert.equal(parseBotWhatsAppLanguage(""), null);
    assert.equal(parseBotWhatsAppLanguage("fr"), null);
  });

  it("prefers stored then explicit website language then WhatsApp session", () => {
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "en",
        explicitLanguage: "te",
        sessionLanguage: "hi",
      }),
      "en",
    );
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "",
        explicitLanguage: "te",
        sessionLanguage: "hi",
      }),
      "te",
    );
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "",
        explicitLanguage: "",
        sessionLanguage: "te",
      }),
      "te",
    );
    assert.equal(
      resolveJobSeekerAccountLanguage({
        storedLanguage: "",
        explicitLanguage: "",
        sessionLanguage: "",
      }),
      "",
    );
  });

  it("uses the stored job-seeker language over session lookup", async () => {
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "te",
      }),
      "te",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "en",
      }),
      "en",
    );
  });

  it("defaults to English when no stored language exists and Mongo is disconnected", async () => {
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
      }),
      "en",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "en",
    );
  });

  it("does not query Mongo when persisting while disconnected", async () => {
    await persistJobSeekerWhatsAppLanguage({
      phone: "9876543210",
      language: "te",
      jobSeekerId: "64f0000000000000000000aa",
    });
  });

  it("seeds whatsappLanguage only when the saved preference is empty", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      get: () => 1,
    });
    const filters: unknown[] = [];
    mock.method(JobSeekerModel, "updateOne", async (filter: unknown) => {
      filters.push(filter);
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    });

    await persistJobSeekerWhatsAppLanguage({
      phone: "9876543210",
      language: "te",
      jobSeekerId: "64f0000000000000000000aa",
    });

    assert.equal(filters.length, 1);
    const filter = filters[0] as {
      _id: string;
      $or: Array<Record<string, unknown>>;
    };
    assert.equal(filter._id, "64f0000000000000000000aa");
    assert.ok(Array.isArray(filter.$or));
    assert.ok(
      filter.$or.some(
        (clause) =>
          clause.whatsappLanguage === "" ||
          (clause.whatsappLanguage as { $exists?: boolean })?.$exists === false,
      ),
    );
  });

  it("keeps a stored website preference over a conflicting WhatsApp session", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      get: () => 1,
    });
    let sessionLookups = 0;
    mock.method(WhatsAppSessionModel, "findOne", () => {
      sessionLookups += 1;
      return {
        select: () => ({
          lean: async () => ({ language: "te" }),
        }),
      };
    });

    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "hi",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "hi",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "te",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "te",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "ta",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "ta",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "kn",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "kn",
    );
    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "ml",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "ml",
    );
    assert.equal(sessionLookups, 0);
  });

  it("uses the WhatsApp session language when the saved preference is missing", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      get: () => 1,
    });
    mock.method(JobSeekerModel, "findById", () => ({
      select: () => ({
        lean: async () => ({ whatsappLanguage: "" }),
      }),
    }));
    mock.method(WhatsAppSessionModel, "findOne", () => ({
      select: () => ({
        lean: async () => ({ language: "hi" }),
      }),
    }));

    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "hi",
    );
  });

  it("uses a Malayalam session only when no saved preference exists", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      get: () => 1,
    });
    mock.method(JobSeekerModel, "findById", () => ({
      select: () => ({
        lean: async () => ({ whatsappLanguage: "" }),
      }),
    }));
    mock.method(WhatsAppSessionModel, "findOne", () => ({
      select: () => ({
        lean: async () => ({ language: "ml" }),
      }),
    }));

    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "ml",
    );
  });

  it("keeps a saved Malayalam preference ahead of an older session language", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      get: () => 1,
    });
    let sessionLookups = 0;
    mock.method(JobSeekerModel, "findById", () => {
      sessionLookups += 1;
      return {
        select: () => ({
          lean: async () => ({ whatsappLanguage: "ml" }),
        }),
      };
    });
    mock.method(WhatsAppSessionModel, "findOne", () => {
      sessionLookups += 1;
      return {
        select: () => ({
          lean: async () => ({ language: "te" }),
        }),
      };
    });

    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "ml",
    );
    assert.equal(sessionLookups, 1);
  });

  it("falls through unsupported stored values to English when no session exists", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      get: () => 1,
    });
    mock.method(JobSeekerModel, "findById", () => ({
      select: () => ({
        lean: async () => ({ whatsappLanguage: "fr" }),
      }),
    }));
    mock.method(WhatsAppSessionModel, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    }));

    assert.equal(
      await resolveJobSeekerNotificationLanguage({
        phoneNumber: "9876543210",
        storedLanguage: "not-a-language",
        jobSeekerId: "64f0000000000000000000aa",
      }),
      "en",
    );
  });
});
