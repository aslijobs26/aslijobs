import type mongoose from "mongoose";
import {
  buildLoginDedupeKey,
  isDuplicateKeyError,
  summarizeUserAgent,
  type LoginClientSummary,
} from "../accounts/login-client.js";
import {
  JobSeekerLoginEventModel,
  type JobSeekerLoginMethod,
} from "./job-seeker-login-event.model.js";

export { summarizeUserAgent } from "../accounts/login-client.js";

export type JobSeekerLoginClientSummary = LoginClientSummary;

export type RecordJobSeekerLoginInput = {
  jobSeekerId: mongoose.Types.ObjectId | string;
  method: JobSeekerLoginMethod;
  loggedInAt: Date;
  /**
   * Identifies the consumed sign-in challenge (e.g. the OTP hash that was
   * just cleared). Hashed before storage; retries of the same challenge
   * map to the same key and are ignored.
   */
  challengeKey: string;
  userAgent?: string | null;
};

export type RecordJobSeekerLoginResult = "recorded" | "duplicate" | "failed";

export function buildJobSeekerLoginDedupeKey(
  method: JobSeekerLoginMethod,
  challengeKey: string,
): string {
  return buildLoginDedupeKey(method, challengeKey);
}

/**
 * Call only after authentication succeeded and the session was persisted.
 * Never throws: a history write failure must not block sign-in.
 */
export async function recordJobSeekerLogin(
  input: RecordJobSeekerLoginInput,
): Promise<RecordJobSeekerLoginResult> {
  try {
    await JobSeekerLoginEventModel.create({
      jobSeekerId: input.jobSeekerId,
      loggedInAt: input.loggedInAt,
      method: input.method,
      client: summarizeUserAgent(input.userAgent),
      dedupeKey: buildJobSeekerLoginDedupeKey(input.method, input.challengeKey),
    });
    return "recorded";
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return "duplicate";
    }
    console.error("[JobSeekerLoginHistory] failed to record sign-in", {
      jobSeekerId: String(input.jobSeekerId),
      method: input.method,
      message: error instanceof Error ? error.message : String(error),
    });
    return "failed";
  }
}
