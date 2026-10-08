import { randomUUID } from "node:crypto";
import { EmployerModel } from "../employers/employer.model.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { PhoneAccountIdentityModel } from "./phone-account-identity.model.js";
import {
  isMongoDuplicateKeyError,
  normalizeRegisteredWhatsappNumber,
  phoneAlreadyRegisteredError,
  resolvePhoneIdentityReservation,
  resolvePhoneRegistrationDecision,
  type PhoneAccountKind,
  type PhoneIdentityLinkedAccount,
} from "./phone-account.policy.js";

const LOCK_MS = 2 * 60 * 1000;

export type PhoneReservation = {
  normalizedPhone: string;
  lockToken: string;
};

function snapshot(
  id: { toString(): string } | undefined,
  registrationComplete: boolean,
) {
  if (!id) {
    return null;
  }
  return { id: id.toString(), registrationComplete };
}

async function loadOwners(normalizedPhone: string) {
  const [jobSeeker, employer] = await Promise.all([
    JobSeekerModel.findOne({ whatsappNumber: normalizedPhone })
      .select("_id registrationStatus")
      .lean(),
    EmployerModel.findOne({ whatsappNumber: normalizedPhone })
      .select("_id registrationStatus")
      .lean(),
  ]);

  return {
    jobSeeker: snapshot(
      jobSeeker?._id,
      jobSeeker?.registrationStatus === "COMPLETED",
    ),
    employer: snapshot(
      employer?._id,
      employer?.registrationStatus === "completed",
    ),
  };
}

function phoneMatchesNormalized(
  storedPhone: string | undefined,
  normalizedPhone: string,
): boolean {
  if (!storedPhone) {
    return false;
  }
  if (storedPhone === normalizedPhone) {
    return true;
  }
  try {
    return normalizeRegisteredWhatsappNumber(storedPhone) === normalizedPhone;
  } catch {
    return false;
  }
}

async function loadIdentityLinkedAccount(input: {
  accountKind: PhoneAccountKind;
  accountId: { toString(): string } | null;
  normalizedPhone: string;
}): Promise<PhoneIdentityLinkedAccount | null> {
  if (!input.accountId) {
    return null;
  }

  if (input.accountKind === "employer") {
    const employer = await EmployerModel.findById(input.accountId)
      .select("whatsappNumber registrationStatus")
      .lean();
    if (!employer) {
      return null;
    }
    return {
      id: employer._id.toString(),
      kind: "employer",
      ownsThisPhone: phoneMatchesNormalized(
        employer.whatsappNumber,
        input.normalizedPhone,
      ),
      registrationComplete: employer.registrationStatus === "completed",
    };
  }

  const jobSeeker = await JobSeekerModel.findById(input.accountId)
    .select("whatsappNumber registrationStatus")
    .lean();
  if (!jobSeeker) {
    return null;
  }
  return {
    id: jobSeeker._id.toString(),
    kind: "job_seeker",
    ownsThisPhone: phoneMatchesNormalized(
      jobSeeker.whatsappNumber,
      input.normalizedPhone,
    ),
    registrationComplete: jobSeeker.registrationStatus === "COMPLETED",
  };
}

export async function reservePhoneAccount(input: {
  whatsappNumber: string;
  intendedKind: PhoneAccountKind;
}): Promise<PhoneReservation> {
  const normalizedPhone = normalizeRegisteredWhatsappNumber(input.whatsappNumber);
  const owners = await loadOwners(normalizedPhone);
  const decision = resolvePhoneRegistrationDecision({
    intendedKind: input.intendedKind,
    jobSeeker: owners.jobSeeker,
    employer: owners.employer,
  });

  if (decision.action === "reject") {
    throw phoneAlreadyRegisteredError(decision.existingKind);
  }

  const lockToken = randomUUID();
  const lockExpiresAt = new Date(Date.now() + LOCK_MS);
  const resumeAccountId = decision.resumeAccountId;

  try {
    await PhoneAccountIdentityModel.create({
      normalizedPhone,
      accountKind: input.intendedKind,
      accountId: null,
      lockToken,
      lockExpiresAt,
    });
    return { normalizedPhone, lockToken };
  } catch (error) {
    if (!isMongoDuplicateKeyError(error)) {
      throw error;
    }
  }

  const existing = await PhoneAccountIdentityModel.findOne({ normalizedPhone });
  if (!existing) {
    throw phoneAlreadyRegisteredError(input.intendedKind);
  }

  const linkedAccount = await loadIdentityLinkedAccount({
    accountKind: existing.accountKind,
    accountId: existing.accountId ?? null,
    normalizedPhone,
  });
  const identityDecision = resolvePhoneIdentityReservation({
    intendedKind: input.intendedKind,
    liveResumeAccountId: resumeAccountId,
    linkedAccount,
  });

  if (identityDecision.action === "reject") {
    throw phoneAlreadyRegisteredError(identityDecision.existingKind);
  }

  const nextResumeAccountId =
    identityDecision.action === "resume"
      ? identityDecision.resumeAccountId
      : null;

  const now = new Date();
  const locked = await PhoneAccountIdentityModel.findOneAndUpdate(
    {
      normalizedPhone,
      $or: [
        { lockToken: null },
        { lockExpiresAt: null },
        { lockExpiresAt: { $lt: now } },
        ...(nextResumeAccountId ? [{ accountId: nextResumeAccountId }] : []),
      ],
    },
    {
      $set: {
        accountKind: input.intendedKind,
        lockToken,
        lockExpiresAt,
        accountId: nextResumeAccountId,
      },
    },
    { new: true },
  );

  if (!locked) {
    throw phoneAlreadyRegisteredError(input.intendedKind);
  }

  if (identityDecision.action === "reclaim" && existing.accountId) {
    console.info(
      `[phone-account] reclaimed stale identity kind=${existing.accountKind} phone=****${normalizedPhone.slice(-4)}`,
    );
  }

  return { normalizedPhone, lockToken };
}

export async function commitPhoneAccount(input: {
  normalizedPhone: string;
  lockToken: string;
  accountId: string;
}): Promise<void> {
  await PhoneAccountIdentityModel.updateOne(
    {
      normalizedPhone: input.normalizedPhone,
      lockToken: input.lockToken,
    },
    {
      $set: {
        accountId: input.accountId,
        lockToken: null,
        lockExpiresAt: null,
      },
    },
  );
}

export async function releasePhoneReservation(
  reservation: PhoneReservation,
): Promise<void> {
  await PhoneAccountIdentityModel.deleteOne({
    normalizedPhone: reservation.normalizedPhone,
    lockToken: reservation.lockToken,
    accountId: null,
  });
}

export type WhatsAppEmployerRecord = {
  _id: { toString(): string };
  companyName?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  isProfileComplete?: boolean;
  registrationStatus?: string;
};

export type WhatsAppSeekerRecord = {
  _id: { toString(): string };
  fullName?: string;
  city?: string;
  jobRole?: string;
  skills?: string[];
  preferredJobLocation?: string;
  registrationStatus?: string;
};

export type WhatsAppLinkedAccount = {
  kind: "job_seeker" | "employer" | "none" | "both";
  jobSeeker: WhatsAppSeekerRecord | null;
  employer: WhatsAppEmployerRecord | null;
};

const SEEKER_LOOKUP =
  "fullName city jobRole skills preferredJobLocation registrationStatus";
const EMPLOYER_LOOKUP =
  "companyName verificationStatus isProfileComplete registrationStatus";

function isCompletedSeeker(seeker: { registrationStatus?: string } | null): boolean {
  return seeker?.registrationStatus === "COMPLETED";
}

function isCompletedEmployer(employer: { registrationStatus?: string } | null): boolean {
  return employer?.registrationStatus === "completed";
}

/**
 * Cheap identity lookup for WhatsApp. Never uses an LLM.
 * Prefers phone_account_identities, then completed seeker/employer rows.
 */
export async function resolveWhatsAppLinkedAccount(
  nationalPhone: string,
): Promise<WhatsAppLinkedAccount> {
  if (!/^\d{10}$/.test(nationalPhone)) {
    return { kind: "none", jobSeeker: null, employer: null };
  }

  const identity = await PhoneAccountIdentityModel.findOne({
    normalizedPhone: nationalPhone,
  })
    .select("accountKind accountId")
    .lean();

  if (identity?.accountId && identity.accountKind === "employer") {
    const employer = await EmployerModel.findById(identity.accountId)
      .select(EMPLOYER_LOOKUP)
      .lean();
    if (employer && isCompletedEmployer(employer)) {
      return { kind: "employer", jobSeeker: null, employer };
    }
  }

  if (identity?.accountId && identity.accountKind === "job_seeker") {
    const jobSeeker = await JobSeekerModel.findById(identity.accountId)
      .select(SEEKER_LOOKUP)
      .lean();
    if (jobSeeker && isCompletedSeeker(jobSeeker)) {
      return { kind: "job_seeker", employer: null, jobSeeker };
    }
  }

  const [jobSeeker, employer] = await Promise.all([
    JobSeekerModel.findOne({ whatsappNumber: nationalPhone })
      .select(SEEKER_LOOKUP)
      .lean(),
    EmployerModel.findOne({ whatsappNumber: nationalPhone })
      .select(EMPLOYER_LOOKUP)
      .lean(),
  ]);

  const seekerOk = jobSeeker && isCompletedSeeker(jobSeeker) ? jobSeeker : null;
  const employerOk = employer && isCompletedEmployer(employer) ? employer : null;
  const kind =
    seekerOk && employerOk
      ? "both"
      : seekerOk
        ? "job_seeker"
        : employerOk
          ? "employer"
          : "none";
  return { kind, jobSeeker: seekerOk, employer: employerOk };
}

/** Blocks the opposite account type even after OTP, before the account is finalized. */
export async function assertPhoneExclusiveToAccount(input: {
  whatsappNumber: string;
  intendedKind: PhoneAccountKind;
  accountId: string;
}): Promise<void> {
  const normalizedPhone = normalizeRegisteredWhatsappNumber(input.whatsappNumber);
  const owners = await loadOwners(normalizedPhone);
  const other =
    input.intendedKind === "job_seeker" ? owners.employer : owners.jobSeeker;

  if (other && other.id !== input.accountId) {
    throw phoneAlreadyRegisteredError(
      input.intendedKind === "job_seeker" ? "employer" : "job_seeker",
    );
  }

  const same =
    input.intendedKind === "job_seeker" ? owners.jobSeeker : owners.employer;
  if (
    same?.registrationComplete &&
    same.id !== input.accountId
  ) {
    throw phoneAlreadyRegisteredError(input.intendedKind);
  }
}
