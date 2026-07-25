"use client";

import { ROUTES } from "@/constants/routes";
import { fetchAuthenticatedJobSeeker } from "@/services/job-seeker-login.service";
import {
  clearJobSeekerAuthSession,
  getJobSeekerAccessToken,
} from "@/utils/job-seeker-auth-storage";
import { buildJobSeekerLoginHref } from "@/utils/safe-return-url";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type JobSeekerAuthGuardProps = {
  children: ReactNode;
};

type AuthStatus = "checking" | "authenticated";

export function JobSeekerAuthGuard({ children }: JobSeekerAuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const redirectUnauthenticated = () => {
      clearJobSeekerAuthSession();
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      router.replace(
        buildJobSeekerLoginHref(returnUrl || ROUTES.JOB_SEEKER_MY_RESUME),
      );
    };

    const verifySession = async () => {
      const accessToken = getJobSeekerAccessToken();

      if (!accessToken) {
        redirectUnauthenticated();
        return;
      }

      try {
        await fetchAuthenticatedJobSeeker();
        if (!cancelled) {
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          redirectUnauthenticated();
        }
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
  }, [router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-6">
        <p className="text-sm text-muted">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
