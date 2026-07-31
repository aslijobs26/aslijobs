"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import { EmployerProfileMenu } from "@/components/employer-dashboard/EmployerProfileMenu";
import { JobSeekerProfileMenu } from "@/components/job-seeker/JobSeekerProfileMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BRAND_TAGLINE } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import {
  EMPLOYER_ACCESS_TOKEN_STORAGE_KEY,
  EMPLOYER_AUTH_CHANGE_EVENT,
  getEmployerAccessToken,
} from "@/utils/employer-auth-storage";
import {
  JOB_SEEKER_ACCESS_TOKEN_STORAGE_KEY,
  JOB_SEEKER_AUTH_CHANGE_EVENT,
  getJobSeekerAccessToken,
} from "@/utils/job-seeker-auth-storage";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "./Container";
import { NavbarLanguageButton } from "./NavbarLanguageButton";

export function Navbar() {
  const [isEmployerAuthenticated, setIsEmployerAuthenticated] = useState(false);
  const [isJobSeekerAuthenticated, setIsJobSeekerAuthenticated] =
    useState(false);

  const syncAuthState = () => {
    setIsEmployerAuthenticated(Boolean(getEmployerAccessToken()));
    setIsJobSeekerAuthenticated(Boolean(getJobSeekerAccessToken()));
  };

  useEffect(() => {
    syncAuthState();

    const handlePageShow = () => {
      syncAuthState();
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === EMPLOYER_ACCESS_TOKEN_STORAGE_KEY ||
        event.key === JOB_SEEKER_ACCESS_TOKEN_STORAGE_KEY
      ) {
        syncAuthState();
      }
    };

    const handleJobSeekerAuthChange = () => {
      syncAuthState();
    };

    const handleEmployerAuthChange = () => {
      syncAuthState();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      JOB_SEEKER_AUTH_CHANGE_EVENT,
      handleJobSeekerAuthChange,
    );
    window.addEventListener(
      EMPLOYER_AUTH_CHANGE_EVENT,
      handleEmployerAuthChange,
    );

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        JOB_SEEKER_AUTH_CHANGE_EVENT,
        handleJobSeekerAuthChange,
      );
      window.removeEventListener(
        EMPLOYER_AUTH_CHANGE_EVENT,
        handleEmployerAuthChange,
      );
    };
  }, []);

  const handleEmployerLogout = () => {
    setIsEmployerAuthenticated(false);
  };

  const handleJobSeekerLogout = () => {
    setIsJobSeekerAuthenticated(false);
  };

  return (
    <header className="sticky top-0 z-50 overflow-x-clip border-b border-border-subtle bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
      <Container className="relative z-50 bg-surface px-2 mobile:px-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-[72px] items-center gap-3 py-2 mobile:min-h-16 mobile:gap-2 mobile:py-1.5 sm:gap-4 lg:min-h-[80px] lg:gap-6 lg:py-2">
          <Link
            href={ROUTES.HOME}
            aria-label="AsliJobs home"
            className="flex min-w-0 shrink flex-col items-start gap-0.5 rounded-sm pl-1 mobile:pl-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mr-0 lg:pl-0"
          >
            <Image
              src={asliLogo}
              alt=""
              width={213}
              height={70}
              className="block h-[38px] w-auto mobile:h-[34px] sm:h-[38px] lg:h-[60px]"
              priority
              aria-hidden
            />
            <p className="max-w-[9.5rem] truncate whitespace-nowrap text-[7px] font-bold leading-tight text-muted mobile:max-w-[8.75rem] sm:max-w-none sm:text-[9px] lg:text-[10px]">
              {BRAND_TAGLINE}
            </p>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 mobile:gap-1.5 sm:gap-2 xl:gap-3">
            <NavbarLanguageButton />

            {isEmployerAuthenticated ? (
              <EmployerProfileMenu onLogout={handleEmployerLogout} />
            ) : isJobSeekerAuthenticated ? (
              <>
                <NotificationBell viewAllHref={ROUTES.JOB_SEEKER_NOTIFICATIONS} />
                <JobSeekerProfileMenu onLogout={handleJobSeekerLogout} />
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.JOB_SEEKER_REGISTER}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-primary-soft px-3 text-sm font-medium text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 mobile:h-8 mobile:min-h-8 mobile:px-2 mobile:text-xs sm:px-3.5 xl:h-10 xl:px-5 xl:text-[15px]"
                >
                  Job Seeker
                </Link>
                <Link
                  href={ROUTES.EMPLOYER_REGISTER}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-primary bg-transparent px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 mobile:h-8 mobile:min-h-8 mobile:px-2 mobile:text-xs sm:px-3.5 xl:h-10 xl:px-5 xl:text-[15px]"
                >
                  <span className="xl:hidden">Employers</span>
                  <span className="hidden xl:inline">Employers / Post Job</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
