import mongoose from "mongoose";
import { parseJobContentLanguage } from "../jobs/job-content-language.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import {
  nationalPhone,
  type BotLanguage,
} from "./whatsapp-bot.logic.js";
import { WhatsAppSessionModel } from "./whatsapp-session.model.js";

function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export function parseBotWhatsAppLanguage(
  value: string | null | undefined,
): BotLanguage | null {
  return parseJobContentLanguage(value);
}

export async function readWhatsAppSessionLanguage(
  phoneNumber: string,
): Promise<BotLanguage | null> {
  if (!isMongoReady()) {
    return null;
  }

  const phone = nationalPhone(phoneNumber);
  if (!phone) {
    return null;
  }

  try {
    const session = await WhatsAppSessionModel.findOne({ phone })
      .select("language")
      .lean();
    return parseBotWhatsAppLanguage(session?.language);
  } catch (error) {
    console.error("[WhatsAppNotification] session language lookup failed", {
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

/**
 * Account UI/notification language stored on JobSeeker.whatsappLanguage.
 * Spoken-skill `languages[]` is a different field and must not be used here.
 *
 * Precedence for saving at registration:
 * 1. Already stored account preference
 * 2. Explicit website selection
 * 3. WhatsApp session language
 * 4. Empty — callers treat empty as English
 */
export function resolveJobSeekerAccountLanguage(input: {
  storedLanguage?: string | null;
  explicitLanguage?: string | null;
  sessionLanguage?: string | null;
}): BotLanguage | "" {
  return (
    parseBotWhatsAppLanguage(input.storedLanguage) ??
    parseBotWhatsAppLanguage(input.explicitLanguage) ??
    parseBotWhatsAppLanguage(input.sessionLanguage) ??
    ""
  );
}

/**
 * WhatsApp notification language for an identified Job Seeker.
 * 1. Explicit storedLanguage from the triggering interaction, when parseable
 * 2. Saved JobSeeker.whatsappLanguage for jobSeekerId (website or prior bot)
 * 3. WhatsApp session language for that phone, only when 1 and 2 are absent
 * 4. English
 *
 * A saved Hindi, Telugu, Tamil, or Kannada preference is not overridden by a stale session.
 * Unsupported values fall through; they are never sent to Meta as-is.
 */
export async function resolveJobSeekerNotificationLanguage(input: {
  phoneNumber: string;
  storedLanguage?: string | null;
  jobSeekerId?: string | null;
}): Promise<string> {
  const stored = parseBotWhatsAppLanguage(input.storedLanguage);
  if (stored) {
    return stored;
  }

  if (!isMongoReady()) {
    return "en";
  }

  const jobSeekerId = input.jobSeekerId?.trim() ?? "";
  if (jobSeekerId && mongoose.Types.ObjectId.isValid(jobSeekerId)) {
    try {
      const seeker = await JobSeekerModel.findById(jobSeekerId)
        .select("whatsappLanguage")
        .lean();
      const fromSeeker = parseBotWhatsAppLanguage(seeker?.whatsappLanguage);
      if (fromSeeker) {
        return fromSeeker;
      }
    } catch (error) {
      console.error("[WhatsAppNotification] job seeker language lookup failed", {
        errorCategory: error instanceof Error ? error.name : "unknown",
      });
    }
  }

  const fromSession = await readWhatsAppSessionLanguage(input.phoneNumber);
  return fromSession ?? "en";
}

export async function persistJobSeekerWhatsAppLanguage(input: {
  phone: string;
  language: string;
  jobSeekerId?: string | null;
}): Promise<void> {
  const language = parseBotWhatsAppLanguage(input.language);
  if (!language || !isMongoReady()) {
    return;
  }

  const phone = nationalPhone(input.phone);
  const jobSeekerId = input.jobSeekerId?.trim() ?? "";
  const filter =
    jobSeekerId && mongoose.Types.ObjectId.isValid(jobSeekerId)
      ? { _id: jobSeekerId }
      : phone
        ? { whatsappNumber: phone }
        : null;
  if (!filter) {
    return;
  }

  try {
    await JobSeekerModel.updateOne(filter, {
      $set: { whatsappLanguage: language },
    });
  } catch (error) {
    console.error("[WhatsAppNotification] job seeker language persist failed", {
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }
}

export async function copyWhatsAppSessionLanguageToJobSeeker(input: {
  phoneNumber: string;
  storedLanguage?: string | null;
  explicitLanguage?: string | null;
}): Promise<BotLanguage | ""> {
  return resolveJobSeekerAccountLanguage({
    storedLanguage: input.storedLanguage,
    explicitLanguage: input.explicitLanguage,
    sessionLanguage: await readWhatsAppSessionLanguage(input.phoneNumber),
  });
}
