import type mongoose from "mongoose";
import {
  buildLoginDedupeKey,
  isDuplicateKeyError,
  summarizeUserAgent,
} from "../accounts/login-client.js";
import {
  EmployerLoginEventModel,
  type EmployerLoginMethod,
} from "./employer-login-event.model.js";

export type RecordEmployerLoginInput = {
  employerId: mongoose.Types.ObjectId | string;
  method: EmployerLoginMethod;
  loggedInAt: Date;
  /**
   * Identifies the consumed sign-in challenge (e.g. the OTP hash that was
   * just cleared). Hashed before storage; retries of the same challenge
   * map to the same key and are ignored.
   */
  challengeKey: string;
  userAgent?: string | null;
};

export type RecordEmployerLoginResult = "recorded" | "duplicate" | "failed";

/**
 * Call only after authentication succeeded and the session was persisted.
 * Never throws: a history write failure must not block sign-in.
 */
export async function recordEmployerLogin(
  input: RecordEmployerLoginInput,
): Promise<RecordEmployerLoginResult> {
  try {
    await EmployerLoginEventModel.create({
      employerId: input.employerId,
      loggedInAt: input.loggedInAt,
      method: input.method,
      client: summarizeUserAgent(input.userAgent),
      dedupeKey: buildLoginDedupeKey(input.method, input.challengeKey),
    });
    return "recorded";
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return "duplicate";
    }
    console.error("[EmployerLoginHistory] failed to record sign-in", {
      employerId: String(input.employerId),
      method: input.method,
      message: error instanceof Error ? error.message : String(error),
    });
    return "failed";
  }
}
