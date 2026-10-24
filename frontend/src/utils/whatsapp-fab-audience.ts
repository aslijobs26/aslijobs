import type { AuthRealm } from "@/utils/auth-realm";

export type WhatsAppFabAudienceStatus =
  | "loading"
  | "guest"
  | "jobseeker"
  | "employer"
  | "unknown";

export type WhatsAppFabProfileQueryState = {
  isPending: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  hasData: boolean;
};

/**
 * Resolves FAB audience from the active auth realm plus authoritative /me query state.
 * Token presence alone is never enough — role requires a successful profile fetch.
 */
export function resolveWhatsAppFabAudience(input: {
  realm: AuthRealm | null;
  employer: WhatsAppFabProfileQueryState;
  seeker: WhatsAppFabProfileQueryState;
}): WhatsAppFabAudienceStatus {
  const { realm, employer, seeker } = input;

  if (!realm) {
    return "guest";
  }

  if (realm === "employer") {
    if (employer.isSuccess && employer.hasData) {
      return "employer";
    }
    if (employer.isError && !employer.hasData) {
      return "unknown";
    }
    if (employer.isPending || (employer.isFetching && !employer.hasData)) {
      return "loading";
    }
    return "unknown";
  }

  if (seeker.isSuccess && seeker.hasData) {
    return "jobseeker";
  }
  if (seeker.isError && !seeker.hasData) {
    return "unknown";
  }
  if (seeker.isPending || (seeker.isFetching && !seeker.hasData)) {
    return "loading";
  }
  return "unknown";
}

export function whatsappFabActionAudience(
  status: WhatsAppFabAudienceStatus,
): "guest" | "jobseeker" | "employer" | null {
  if (status === "guest") return "guest";
  if (status === "jobseeker") return "jobseeker";
  if (status === "employer") return "employer";
  return null;
}
