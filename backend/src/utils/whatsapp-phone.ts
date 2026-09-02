import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "../middleware/error.middleware.js";

const INDIA_COUNTRY_CODE = "91";

/**
 * Converts a stored 10-digit Indian WhatsApp number into the Meta Cloud API
 * recipient format (country code + national number, no plus sign).
 */
export function toWhatsAppCloudRecipient(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length === 10) {
    return `${INDIA_COUNTRY_CODE}${digits}`;
  }

  if (digits.length === 12 && digits.startsWith(INDIA_COUNTRY_CODE)) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `${INDIA_COUNTRY_CODE}${digits.slice(1)}`;
  }

  throw new AppError(
    "Enter a valid WhatsApp number",
    HTTP_STATUS.BAD_REQUEST,
  );
}
