"use client";

import { ROUTES } from "@/constants/routes";
import {
  employerProfileQueryKey,
  fetchAuthenticatedEmployer,
} from "@/services/employer-login.service";
import { isUnauthorizedAuthError } from "@/utils/auth-errors";
import {
  clearEmployerAuthSession,
  getEmployerAccessToken,
} from "@/utils/employer-auth-storage";
import { buildEmployerLoginHref } from "@/utils/safe-return-url";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type EmployerAuthGuardProps = {
  children: ReactNode;
};

type AuthStatus = "checking" | "authenticated" | "transient_error";

export function EmployerAuthGuard({ children }: EmployerAuthGuardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [retryToken, setRetryToken] = useState(0);

  const redirectUnauthenticated = useCallback(() => {
    clearEmployerAuthSession();
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    router.replace(buildEmployerLoginHref(returnUrl || ROUTES.POST_JOB));
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const verifyEmployerSession = async () => {
      const accessToken = getEmployerAccessToken();

      if (!accessToken) {
        redirectUnauthenticated();
        return;
      }

      try {
        await queryClient.fetchQuery({
          queryKey: employerProfileQueryKey,
          queryFn: async () => {
            const { employer } = await fetchAuthenticatedEmployer();
            return employer;
          },
          staleTime: 5 * 60_000,
        });
        if (!cancelled) {
          setStatus("authenticated");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        // Only a genuine auth rejection should destroy the session.
        // 429 / 5xx / network blips must keep the token and allow retry.
        if (isUnauthorizedAuthError(error)) {
          redirectUnauthenticated();
          return;
        }

        setStatus("transient_error");
      }
    };

    void verifyEmployerSession();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || !getEmployerAccessToken()) {
        void verifyEmployerSession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [queryClient, redirectUnauthenticated, retryToken]);

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
