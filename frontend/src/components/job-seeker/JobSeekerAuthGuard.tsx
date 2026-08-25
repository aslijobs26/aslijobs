"use client";

import { JobSeekerWorkspaceShellSkeleton } from "@/components/job-seeker-dashboard/skeletons/JobSeekerPageSkeletons";
import { ROUTES } from "@/constants/routes";
import { ensureJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import { isUnauthorizedAuthError } from "@/utils/auth-errors";
import { getEmployerAccessToken } from "@/utils/employer-auth-storage";
import {
  clearJobSeekerAuthSession,
  getJobSeekerAccessToken,
} from "@/utils/job-seeker-auth-storage";
import { buildJobSeekerLoginHref } from "@/utils/safe-return-url";
import { clearJobSeekerClientSession } from "@/utils/job-seeker-session";
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

  const redirectUnauthenticated = useCallback(async () => {
    await clearJobSeekerClientSession(queryClient);
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    router.replace(
      buildJobSeekerLoginHref(returnUrl || ROUTES.JOB_SEEKER_MY_RESUME),
    );
  }, [queryClient, router]);

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      if (getEmployerAccessToken()) {
        clearJobSeekerAuthSession();
        router.replace(ROUTES.EMPLOYER_DASHBOARD);
        return;
      }

      const accessToken = getJobSeekerAccessToken();

      if (!accessToken) {
        await redirectUnauthenticated();
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
          await redirectUnauthenticated();
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
    return <JobSeekerWorkspaceShellSkeleton />;
  }

  return <>{children}</>;
}
