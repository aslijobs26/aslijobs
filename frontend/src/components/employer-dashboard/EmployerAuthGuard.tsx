"use client";

import { ROUTES } from "@/constants/routes";
import { fetchAuthenticatedEmployer } from "@/services/employer-login.service";
import {
  clearEmployerAuthSession,
  getEmployerAccessToken,
} from "@/utils/employer-auth-storage";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type EmployerAuthGuardProps = {
  children: ReactNode;
};

type AuthStatus = "checking" | "authenticated";

export function EmployerAuthGuard({ children }: EmployerAuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const redirectUnauthenticated = () => {
      clearEmployerAuthSession();
      router.replace(ROUTES.EMPLOYER_LOGIN);
    };

    const verifyEmployerSession = async () => {
      const accessToken = getEmployerAccessToken();

      if (!accessToken) {
        redirectUnauthenticated();
        return;
      }

      try {
        await fetchAuthenticatedEmployer();

        if (!cancelled) {
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          redirectUnauthenticated();
        }
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
