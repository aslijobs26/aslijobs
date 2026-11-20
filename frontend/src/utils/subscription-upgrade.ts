import { isAxiosError } from "axios";

export const NO_JOB_CREDITS_CODE = "NO_JOB_CREDITS";
export const PLAN_CITY_LIMIT_CODE = "PLAN_CITY_LIMIT_REACHED";

/** True when the backend refused a job post because the plan ran out (HTTP 402). */
export function isSubscriptionUpgradeRequired(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 402) {
    return false;
  }
  const details: unknown = error.response.data?.details;
  if (!details || typeof details !== "object") {
    return true;
  }
  const record = details as Record<string, unknown>;
  return (
    record.upgradeRequired === true ||
    record.code === NO_JOB_CREDITS_CODE ||
    record.code === PLAN_CITY_LIMIT_CODE
  );
}

/** Whole rupees print without decimals (₹299); GST totals keep paise (₹352.82). */
export function formatInr(amount: number): string {
  const digits = Number.isInteger(Math.round(amount * 100) / 100) ? 0 : 2;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}
