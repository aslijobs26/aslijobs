import { AUTH_VALIDATION_MESSAGES } from "../constants/auth-validation-messages";
import type { AuthFieldErrors } from "./auth-field-errors";

/** Dropdown value that opens a typed industry field during company registration. */
export const EMPLOYER_REGISTER_OTHER_INDUSTRY_VALUE = "other";

export function isEmployerOtherIndustry(industry: string): boolean {
  return industry === EMPLOYER_REGISTER_OTHER_INDUSTRY_VALUE;
}

export function employerOtherIndustryFieldErrors(input: {
  industry: string;
  customIndustry: string;
  businessCategory: string;
}): AuthFieldErrors {
  if (!isEmployerOtherIndustry(input.industry)) {
    return {};
  }

  const errors: AuthFieldErrors = {};

  if (!input.customIndustry.trim()) {
    errors.customIndustry = AUTH_VALIDATION_MESSAGES.INDUSTRY_REQUIRED;
  }

  if (!input.businessCategory.trim()) {
    errors.businessCategory = AUTH_VALIDATION_MESSAGES.BUSINESS_CATEGORY_REQUIRED;
  }

  return errors;
}

/** Persists the typed industry name instead of the Other dropdown sentinel. */
export function resolveEmployerRegistrationIndustry(input: {
  industry: string;
  customIndustry: string;
}): string {
  if (!isEmployerOtherIndustry(input.industry)) {
    return input.industry.trim();
  }

  return input.customIndustry.trim();
}
