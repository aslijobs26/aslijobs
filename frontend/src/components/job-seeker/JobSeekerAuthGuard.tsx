"use client";

import { ROUTES } from "@/constants/routes";
import { ensureJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import { isUnauthorizedAuthError } from "@/utils/auth-errors";
import {
  clearJobSeekerAuthSession,
  getJobSeekerAccessToken,
} from "@/utils/job-seeker-auth-storage";
import { buildJobSeekerLoginHref } from "@/utils/safe-return-url";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type JobSeekerAuthGuardProps = {
  children: ReactNode;
};

type AuthStatus = "checking" | "authenticated" | "transient_error";

export function JobSeekerAuthGuard({ children }: JobSeekerAuthGuardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [retryToken, setRetryToken] = useState(0);

  const redirectUnauthenticated = useCallback(() => {
    clearJobSeekerAuthSession();
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    router.replace(
      buildJobSeekerLoginHref(returnUrl || ROUTES.JOB_SEEKER_MY_RESUME),
    );
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const accessToken = getJobSeekerAccessToken();

      if (!accessToken) {
        redirectUnauthenticated();
        return;
      }

      try {
        await ensureJobSeekerProfile(queryClientRef.current);
        if (!cancelled) {
          setStatus("authenticated");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedAuthError(error)) {
          redirectUnauthenticated();
          return;
        }

        setStatus("transient_error");
      }
    };

    void verifySession();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || !getJobSeekerAccessToken()) {
        void verifySession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [redirectUnauthenticated, retryToken]);

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
