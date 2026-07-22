import { ROUTES } from "@/constants/routes";

export const EMPLOYER_LOGIN_RETURN_URL_QUERY = "returnUrl";

/**
 * Validates a post-login redirect path to prevent open redirects.
 * Only same-origin relative paths are allowed.
 */
export function getSafeReturnUrl(
  candidate: string | null | undefined,
): string | null {
  if (!candidate) {
    return null;
  }

  let decoded = candidate.trim();

  try {
    decoded = decodeURIComponent(decoded).trim();
  } catch {
    return null;
  }

  if (!decoded.startsWith("/")) {
    return null;
  }

  if (decoded.startsWith("//") || decoded.includes("://")) {
    return null;
  }

  if (/^\/[a-z]+:/i.test(decoded)) {
    return null;
  }

  return decoded;
}

export function buildEmployerLoginHref(returnUrl?: string): string {
  const safeReturnUrl = getSafeReturnUrl(returnUrl);

  if (!safeReturnUrl) {
    return ROUTES.EMPLOYER_LOGIN;
  }

  const params = new URLSearchParams({
    [EMPLOYER_LOGIN_RETURN_URL_QUERY]: safeReturnUrl,
  });

  return `${ROUTES.EMPLOYER_LOGIN}?${params.toString()}`;
}
