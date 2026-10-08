import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";

export type PhoneAccountKind = "job_seeker" | "employer";

export type PhoneAccountSnapshot = {
  id: string;
  registrationComplete: boolean;
} | null;

const JOB_SEEKER_EXISTS_MESSAGE =
  "This mobile number is already registered with a Job Seeker account. Please log in to continue.";

const EMPLOYER_EXISTS_MESSAGE =
  "This mobile number is already registered with an Employer account. Please log in to continue.";

export function phoneAlreadyRegisteredMessage(kind: PhoneAccountKind): string {
  return kind === "job_seeker"
    ? JOB_SEEKER_EXISTS_MESSAGE
    : EMPLOYER_EXISTS_MESSAGE;
}

export function phoneAlreadyRegisteredError(kind: PhoneAccountKind): AppError {
  const message = phoneAlreadyRegisteredMessage(kind);
  return new AppError(message, HTTP_STATUS.CONFLICT, {
    code: "PHONE_ALREADY_REGISTERED",
    accountKind: kind,
    fieldErrors: {
      whatsappNumber: message,
    },
  });
}

/**
 * Indian WhatsApp numbers are stored as 10 digits.
 * +91, spaces, and dashes collapse to that canonical value.
 */
export function normalizeRegisteredWhatsappNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  let national = digits;

  if (digits.length === 12 && digits.startsWith("91")) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    national = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(national)) {
    throw new AppError(
      "WhatsApp number must be exactly 10 digits",
      HTTP_STATUS.BAD_REQUEST,
      {
        fieldErrors: {
          whatsappNumber: "WhatsApp number must be exactly 10 digits",
        },
      },
    );
  }

  return national;
}

export function resolvePhoneRegistrationDecision(input: {
  intendedKind: PhoneAccountKind;
  jobSeeker: PhoneAccountSnapshot;
  employer: PhoneAccountSnapshot;
}):
  | { action: "allow"; resumeAccountId: string | null }
  | { action: "reject"; existingKind: PhoneAccountKind } {
  const other =
    input.intendedKind === "job_seeker" ? input.employer : input.jobSeeker;
  const same =
    input.intendedKind === "job_seeker" ? input.jobSeeker : input.employer;

  if (other) {
    return {
      action: "reject",
      existingKind: input.intendedKind === "job_seeker" ? "employer" : "job_seeker",
    };
  }

  if (same?.registrationComplete) {
    return { action: "reject", existingKind: input.intendedKind };
  }

  return {
    action: "allow",
    resumeAccountId: same?.id ?? null,
  };
}

export type PhoneIdentityLinkedAccount = {
  id: string;
  kind: PhoneAccountKind;
  ownsThisPhone: boolean;
  registrationComplete: boolean;
};

export type PhoneIdentityReservationDecision =
  | { action: "resume"; resumeAccountId: string }
  | { action: "reclaim" }
  | { action: "reject"; existingKind: PhoneAccountKind };

/**
 * Identity rows can outlive deleted employer/seeker documents.
 * Only a live owner of this phone may block a new reservation.
 */
export function resolvePhoneIdentityReservation(input: {
  intendedKind: PhoneAccountKind;
  liveResumeAccountId: string | null;
  linkedAccount: PhoneIdentityLinkedAccount | null;
}): PhoneIdentityReservationDecision {
  const linked =
    input.linkedAccount?.ownsThisPhone === true ? input.linkedAccount : null;

  if (linked) {
    if (linked.kind !== input.intendedKind || linked.registrationComplete) {
      return { action: "reject", existingKind: linked.kind };
    }
    return { action: "resume", resumeAccountId: linked.id };
  }

  if (input.liveResumeAccountId) {
    return { action: "resume", resumeAccountId: input.liveResumeAccountId };
  }

  return { action: "reclaim" };
}

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

type IdentityRow = {
  accountKind: PhoneAccountKind;
  accountId: string | null;
  lockToken: string | null;
  lockExpiresAt: number | null;
};

/**
 * In-process stand-in for the unique phone identity document.
 * Production uses the MongoDB unique index; this queue proves only one claim wins.
 */
export class InMemoryPhoneRegistry {
  private readonly rows = new Map<string, IdentityRow>();
  private readonly tails = new Map<string, Promise<unknown>>();

  async reserve(
    phone: string,
    intendedKind: PhoneAccountKind,
  ): Promise<{ lockToken: string }> {
    return this.enqueue(phone, () => {
      const existing = this.rows.get(phone);
      const token = `${phone}:${intendedKind}:${this.rows.size}:${Date.now()}`;
      const now = Date.now();

      if (!existing) {
        this.rows.set(phone, {
          accountKind: intendedKind,
          accountId: null,
          lockToken: token,
          lockExpiresAt: now + 120_000,
        });
        return { lockToken: token };
      }

      if (existing.accountKind !== intendedKind || existing.accountId) {
        throw phoneAlreadyRegisteredError(existing.accountKind);
      }

      const lockHeld =
        Boolean(existing.lockToken) &&
        (existing.lockExpiresAt ?? 0) > now;

      if (lockHeld) {
        throw phoneAlreadyRegisteredError(existing.accountKind);
      }

      existing.lockToken = token;
      existing.lockExpiresAt = now + 120_000;
      return { lockToken: token };
    });
  }

  private enqueue<T>(phone: string, task: () => T): Promise<T> {
    const previous = this.tails.get(phone) ?? Promise.resolve();
    const run = previous.then(() => task(), () => task());
    this.tails.set(
      phone,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run;
  }
}
