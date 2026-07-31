"use client";

import { ROUTES } from "@/constants/routes";
import {
  employerProfileQueryOptions,
  fetchEmployerProfileQuery,
} from "@/hooks/useEmployerProfile";
import { isUnauthorizedAuthError } from "@/utils/auth-errors";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import { clearEmployerClientSession } from "@/utils/employer-session";
import { buildEmployerLoginHref } from "@/utils/safe-return-url";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type EmployerAuthGuardProps = {
  children: ReactNode;
};

type AuthStatus = "checking" | "authenticated" | "transient_error";

/**
 * Workspace gate: verifies a token exists and that the shared employer profile
 * query can resolve. Uses React Query cache (staleTime) so remounts / effect
 * re-entry do not spam GET /employers/me.
 */
export function EmployerAuthGuard({ children }: EmployerAuthGuardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [retryToken, setRetryToken] = useState(0);

  const routerRef = useRef(router);
  const queryClientRef = useRef(queryClient);
  routerRef.current = router;
  queryClientRef.current = queryClient;

  useEffect(() => {
    let cancelled = false;

    const redirectUnauthenticated = async () => {
      await clearEmployerClientSession(queryClientRef.current);
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      routerRef.current.replace(
        buildEmployerLoginHref(returnUrl || ROUTES.POST_JOB),
      );
    };

    const verifyEmployerSession = async () => {
      const accessToken = getEmployerAccessToken();

      if (!accessToken) {
        await redirectUnauthenticated();
        return;
      }

      try {
        // Prefer cache within staleTime. Login / employer switch already clears
        // the query cache, so a new session still hits the network once.
        await queryClientRef.current.ensureQueryData({
          queryKey: employerProfileQueryOptions.queryKey,
          queryFn: fetchEmployerProfileQuery,
          staleTime: employerProfileQueryOptions.staleTime,
        });
        if (!cancelled) {
          setStatus("authenticated");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedAuthError(error)) {
          await redirectUnauthenticated();
          return;
        }

        setStatus("transient_error");
      }
    };

    setStatus("checking");
    void verifyEmployerSession();

    const handlePageShow = (event: PageTransitionEvent) => {
      // Only re-check after bfcache restore; avoid duplicate /me on normal shows.
      if (!event.persisted) {
        return;
      }
      if (!cancelled) {
        setStatus("checking");
      }
      void verifyEmployerSession();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [retryToken]);

  if (status === "transient_error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-hero-bg px-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Unable to verify your session right now.
        </p>
        <p className="max-w-sm text-sm text-muted">
          This is usually temporary (network or rate limiting). Your login was
          not cleared.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("checking");
            setRetryToken((current) => current + 1);
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-6">
        <p className="text-sm text-muted">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
