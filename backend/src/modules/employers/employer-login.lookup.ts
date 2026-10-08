import { normalizeRegisteredWhatsappNumber } from "../accounts/phone-account.policy.js";

/**
 * Login must find the same employer registration stored after OTP verify.
 * Registration persists the national 10-digit number; legacy rows may still
 * store +91 / 91 / 0 prefixes. Query every canonical variant — never regex.
 */
export function employerWhatsappLookupValues(whatsappNumber: string): string[] {
  const normalized = normalizeRegisteredWhatsappNumber(whatsappNumber);
  return [
    ...new Set([
      normalized,
      `+91${normalized}`,
      `91${normalized}`,
      `0${normalized}`,
    ]),
  ];
}

export function maskEmployerLoginPhone(whatsappNumber: string): string {
  const digits = whatsappNumber.replace(/\D/g, "");
  if (digits.length <= 4) {
    return "****";
  }
  return `****${digits.slice(-4)}`;
}
