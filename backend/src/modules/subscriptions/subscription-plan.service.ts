import { SUBSCRIPTION_PLAN_CODES, SUBSCRIPTION_PLANS, type SubscriptionPlan, type SubscriptionPlanCode } from "./subscription.constants.js";
import { SubscriptionPlanOverrideModel } from "./subscription-plan-override.model.js";

export async function resolveSubscriptionPlans(): Promise<Record<SubscriptionPlanCode, SubscriptionPlan>> {
  const overrides = await SubscriptionPlanOverrideModel.find().lean();
  const plans = { ...SUBSCRIPTION_PLANS };
  for (const override of overrides) {
    const code = override.code as SubscriptionPlanCode;
    plans[code] = {
      ...SUBSCRIPTION_PLANS[code],
      name: override.name,
      priceInr: override.priceInr ?? SUBSCRIPTION_PLANS[code].priceInr,
      jobCredits: override.jobCredits ?? SUBSCRIPTION_PLANS[code].jobCredits,
      listingValidityDays: override.listingValidityDays ?? SUBSCRIPTION_PLANS[code].listingValidityDays,
      maxCities: override.maxCities ?? SUBSCRIPTION_PLANS[code].maxCities,
      purchasable: override.purchasable,
      contactSales: override.contactSales,
      packageLabel: override.packageLabel,
      description: override.description,
    };
  }
  return plans;
}

export async function saveSubscriptionPlan(
  code: SubscriptionPlanCode,
  input: Omit<SubscriptionPlan, "code">,
  operationsUserId: string,
): Promise<SubscriptionPlan> {
  const saved = await SubscriptionPlanOverrideModel.findOneAndUpdate(
    { code },
    {
      $set: {
        ...input,
        code,
        updatedByOperationsUserId: operationsUserId,
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  return {
    ...SUBSCRIPTION_PLANS[code],
    name: saved!.name,
    priceInr: saved!.priceInr ?? SUBSCRIPTION_PLANS[code].priceInr,
    jobCredits: saved!.jobCredits ?? SUBSCRIPTION_PLANS[code].jobCredits,
    listingValidityDays: saved!.listingValidityDays ?? SUBSCRIPTION_PLANS[code].listingValidityDays,
    maxCities: saved!.maxCities ?? SUBSCRIPTION_PLANS[code].maxCities,
    purchasable: saved!.purchasable,
    contactSales: saved!.contactSales,
    packageLabel: saved!.packageLabel,
    description: saved!.description,
  };
}

export const subscriptionPlanCodes = SUBSCRIPTION_PLAN_CODES;
