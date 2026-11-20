import mongoose, { type Types } from "mongoose";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  NO_JOB_CREDITS_CODE,
  PLAN_CITY_LIMIT_CODE,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanCode,
} from "./subscription.constants.js";
import {
  SubscriptionGrantModel,
  type SubscriptionGrantLean,
} from "./subscription-grant.model.js";
import { subscriptionService } from "./subscription.service.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Job statuses where the listing has never been public (credit is refundable). */
const NEVER_LIVE_STATUSES = new Set(["draft", "pending_approval", "rejected"]);

export type JobCreditAttachment = {
  grantId: Types.ObjectId | null;
  planCode: SubscriptionPlanCode | null;
  packageLabel: string;
  listingValidityDays: number | null;
};

export type CreditErrorExtras = {
  draftSaved?: boolean;
  jobId?: string;
  jobPublicId?: string;
};

type GrantForEvaluation = {
  status: string;
  jobCredits: number;
  jobCreditsUsed: number;
  maxCities: number;
  consumedJobs: Array<{ jobId: Types.ObjectId | string; cityKey?: string | null }>;
};

function normalizeLocationPart(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Stable key for the per-plan city limit: "<state>::<city>". */
export function buildJobCityKey(input: {
  state?: string | null;
  stateName?: string | null;
  city?: string | null;
  cityName?: string | null;
}): string {
  const city = normalizeLocationPart(input.city) || normalizeLocationPart(input.cityName);
  if (!city) {
    return "";
  }
  const state =
    normalizeLocationPart(input.state) || normalizeLocationPart(input.stateName);
  return `${state}::${city}`;
}

/**
 * Pure mirror of the atomic Mongo filter in `consumeCredit`.
 * `excludeJobId` ignores one job's own entry (used when a job changes city).
 */
export function grantAcceptsCity(
  grant: GrantForEvaluation,
  cityKey: string,
  excludeJobId?: string,
): boolean {
  const cities = new Set(
    grant.consumedJobs
      .filter((entry) => !excludeJobId || String(entry.jobId) !== excludeJobId)
      .map((entry) => entry.cityKey ?? ""),
  );
  return cities.has(cityKey) || cities.size < grant.maxCities;
}

export function grantHasFreeCredit(grant: GrantForEvaluation): boolean {
  return grant.status === "active" && grant.jobCreditsUsed < grant.jobCredits;
}

export function computeListingValidUntil(from: Date, validityDays: number): Date {
  return new Date(from.getTime() + validityDays * MS_PER_DAY);
}

/**
 * A credit is refunded on delete only if the listing never went public.
 * Reactivated / approved jobs have used their listing time.
 */
export function isCreditRefundable(job: {
  status?: string | null;
  publishedAt?: Date | null;
  reviewDecision?: string | null;
  subscriptionGrantId?: Types.ObjectId | null;
}): boolean {
  return (
    Boolean(job.subscriptionGrantId) &&
    !job.publishedAt &&
    String(job.reviewDecision ?? "").trim() !== "approved" &&
    NEVER_LIVE_STATUSES.has(String(job.status ?? ""))
  );
}

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

/** Mongo aggregation expression: distinct city keys in consumedJobs. */
const DISTINCT_CITIES_EXPR = {
  $setUnion: [{ $ifNull: ["$consumedJobs.cityKey", []] }, []],
};

function attachmentFromGrant(grant: SubscriptionGrantLean): JobCreditAttachment {
  const planCode = grant.planCode as SubscriptionPlanCode;
  return {
    grantId: grant._id,
    planCode,
    packageLabel: SUBSCRIPTION_PLANS[planCode]?.packageLabel ?? "",
    listingValidityDays: grant.listingValidityDays,
  };
}

export const subscriptionEntitlementService = {
  isEnforcementEnabled(): boolean {
    return env.SUBSCRIPTION_ENFORCEMENT_ENABLED;
  },

  /**
   * Atomically consumes one job credit for `jobId` in `cityKey`.
   * Free first, then oldest paid grant. Returns null when none is available.
   */
  async consumeCredit(input: {
    employerId: string | Types.ObjectId;
    jobId: Types.ObjectId;
    cityKey: string;
  }): Promise<JobCreditAttachment | null> {
    await subscriptionService.ensureFreeGrant(input.employerId);
    const employerObjectId = toObjectId(input.employerId);

    const grant = (await SubscriptionGrantModel.findOneAndUpdate(
      {
        employerId: employerObjectId,
        status: "active",
        $expr: {
          $and: [
            { $lt: ["$jobCreditsUsed", "$jobCredits"] },
            {
              $or: [
                { $in: [input.cityKey, DISTINCT_CITIES_EXPR] },
                { $lt: [{ $size: DISTINCT_CITIES_EXPR }, "$maxCities"] },
              ],
            },
          ],
        },
      },
      {
        $inc: { jobCreditsUsed: 1 },
        $push: {
          consumedJobs: {
            jobId: input.jobId,
            cityKey: input.cityKey,
            consumedAt: new Date(),
          },
        },
      },
      { sort: { consumePriority: 1, activatedAt: 1 }, new: true },
    ).lean()) as SubscriptionGrantLean | null;

    if (!grant) {
      return null;
    }

    if (grant.jobCreditsUsed >= grant.jobCredits) {
      await SubscriptionGrantModel.updateOne(
        {
          _id: grant._id,
          status: "active",
          $expr: { $gte: ["$jobCreditsUsed", "$jobCredits"] },
        },
        { $set: { status: "exhausted" } },
      );
    }

    return attachmentFromGrant(grant);
  },

  /**
   * Consume a credit for a submission. When none is available:
   * enforcement on → throws 402; enforcement off → returns an empty attachment.
   * `onBlocked` runs before throwing (e.g. to save the form as a draft) and may
   * return extras for the error payload.
   */
  async consumeForSubmission(input: {
    employerId: string | Types.ObjectId;
    jobId: Types.ObjectId;
    cityKey: string;
    onBlocked?: () => Promise<CreditErrorExtras | void>;
  }): Promise<JobCreditAttachment> {
    const attachment = await this.consumeCredit(input);
    if (attachment) {
      return attachment;
    }
    if (!this.isEnforcementEnabled()) {
      console.warn("[subscriptions] no job credit available; enforcement disabled", {
        employerId: String(input.employerId),
        jobId: input.jobId.toString(),
      });
      return { grantId: null, planCode: null, packageLabel: "", listingValidityDays: null };
    }
    const extras = (await input.onBlocked?.()) ?? undefined;
    throw await this.buildNoCreditError(input.employerId, extras);
  },

  async refundCredit(input: {
    grantId: Types.ObjectId;
    jobId: Types.ObjectId;
  }): Promise<boolean> {
    const result = await SubscriptionGrantModel.updateOne(
      {
        _id: input.grantId,
        status: { $ne: "cancelled" },
        "consumedJobs.jobId": input.jobId,
        jobCreditsUsed: { $gt: 0 },
      },
      {
        $pull: { consumedJobs: { jobId: input.jobId } },
        $inc: { jobCreditsUsed: -1 },
        $set: { status: "active" },
      },
    );
    return result.modifiedCount > 0;
  },

  /** Refunds credits for deleted jobs whose listing never went public. */
  async refundCreditsForDeletedJobs(
    jobs: Array<{
      _id: Types.ObjectId;
      status?: string | null;
      publishedAt?: Date | null;
      reviewDecision?: string | null;
      subscriptionGrantId?: Types.ObjectId | null;
    }>,
  ): Promise<void> {
    for (const job of jobs) {
      if (!isCreditRefundable(job) || !job.subscriptionGrantId) {
        continue;
      }
      try {
        await this.refundCredit({ grantId: job.subscriptionGrantId, jobId: job._id });
      } catch (error) {
        console.error("[subscriptions] credit refund failed", {
          jobId: job._id.toString(),
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }
    }
  },

  /**
   * Moves an already-credited job to `cityKey`, enforcing the grant's city
   * limit atomically. Returns false if the limit would be exceeded.
   */
  async reassignJobCity(input: {
    grantId: Types.ObjectId;
    jobId: Types.ObjectId;
    cityKey: string;
  }): Promise<boolean> {
    const otherCities = {
      $setUnion: [
        {
          $map: {
            input: {
              $filter: {
                input: { $ifNull: ["$consumedJobs", []] },
                cond: { $ne: ["$$this.jobId", input.jobId] },
              },
            },
            in: "$$this.cityKey",
          },
        },
        [],
      ],
    };

    const result = await SubscriptionGrantModel.updateOne(
      {
        _id: input.grantId,
        "consumedJobs.jobId": input.jobId,
        $expr: {
          $or: [
            { $in: [input.cityKey, otherCities] },
            { $lt: [{ $size: otherCities }, "$maxCities"] },
          ],
        },
      },
      { $set: { "consumedJobs.$[entry].cityKey": input.cityKey } },
      { arrayFilters: [{ "entry.jobId": input.jobId }] },
    );

    if (result.matchedCount > 0) {
      return true;
    }
    // Legacy / unknown linkage: nothing to enforce.
    const linked = await SubscriptionGrantModel.exists({
      _id: input.grantId,
      "consumedJobs.jobId": input.jobId,
    });
    return !linked;
  },

  /** Non-mutating city check for a job already linked to a grant. */
  async canJobUseCity(input: {
    grantId: Types.ObjectId;
    jobId: Types.ObjectId;
    cityKey: string;
  }): Promise<boolean> {
    const grant = (await SubscriptionGrantModel.findById(input.grantId)
      .select("status jobCredits jobCreditsUsed maxCities consumedJobs")
      .lean()) as SubscriptionGrantLean | null;
    if (!grant) {
      return true;
    }
    return grantAcceptsCity(grant, input.cityKey, input.jobId.toString());
  },

  async getListingValidUntil(
    grantId: Types.ObjectId | null | undefined,
    from: Date,
  ): Promise<Date | null> {
    if (!grantId) {
      return null;
    }
    const grant = await SubscriptionGrantModel.findById(grantId)
      .select("listingValidityDays")
      .lean();
    if (!grant?.listingValidityDays) {
      return null;
    }
    return computeListingValidUntil(from, grant.listingValidityDays);
  },

  async buildNoCreditError(
    employerId: string | Types.ObjectId,
    extras?: CreditErrorExtras,
  ): Promise<AppError> {
    const hasUnusedCredits = await SubscriptionGrantModel.exists({
      employerId: toObjectId(employerId),
      status: "active",
      $expr: { $lt: ["$jobCreditsUsed", "$jobCredits"] },
    });

    const cityLimited = Boolean(hasUnusedCredits);
    return new AppError(
      cityLimited
        ? "Your current plan does not allow jobs in another city. Buy a new plan to post in this city."
        : "You have used all job posts in your plan. Buy a plan to post more jobs.",
      HTTP_STATUS.PAYMENT_REQUIRED,
      {
        code: cityLimited ? PLAN_CITY_LIMIT_CODE : NO_JOB_CREDITS_CODE,
        upgradeRequired: true,
        ...(extras?.draftSaved
          ? {
              draftSaved: true,
              jobId: extras.jobId,
              jobPublicId: extras.jobPublicId,
            }
          : {}),
      },
    );
  },

  buildCityLimitError(extras?: CreditErrorExtras): AppError {
    return new AppError(
      "Your plan for this job does not allow another city. Keep the current city or buy a new plan.",
      HTTP_STATUS.PAYMENT_REQUIRED,
      {
        code: PLAN_CITY_LIMIT_CODE,
        upgradeRequired: true,
        ...(extras?.draftSaved
          ? { draftSaved: true, jobId: extras.jobId, jobPublicId: extras.jobPublicId }
          : {}),
      },
    );
  },
};
