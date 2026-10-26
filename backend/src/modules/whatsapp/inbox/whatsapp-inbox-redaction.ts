/** Safe Inbox text for an OTP send. Never include the code. */
export const WHATSAPP_VERIFICATION_CODE_SENT = "WhatsApp verification code sent";

export function inboxTextContainsSecret(
  text: string,
  secrets: readonly string[],
): boolean {
  return secrets.some((secret) => {
    const value = secret.trim();
    return value.length >= 4 && text.includes(value);
  });
}
