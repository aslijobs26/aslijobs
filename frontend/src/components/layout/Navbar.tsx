"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import { EmployerProfileMenu } from "@/components/employer-dashboard/EmployerProfileMenu";
import { JobSeekerProfileMenu } from "@/components/job-seeker/JobSeekerProfileMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTranslate } from "@/i18n/translate";
import { ROUTES } from "@/constants/routes";
import {
  EMPLOYER_ACCESS_TOKEN_STORAGE_KEY,
  EMPLOYER_AUTH_CHANGE_EVENT,
} from "@/utils/employer-auth-storage";
import {
  isEmployerAuthActive,
  isJobSeekerAuthActive,
} from "@/utils/auth-realm";
import {
  JOB_SEEKER_ACCESS_TOKEN_STORAGE_KEY,
  JOB_SEEKER_AUTH_CHANGE_EVENT,
} from "@/utils/job-seeker-auth-storage";
import { BriefcaseBusiness, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Container } from "./Container";
import { NavbarLanguageButton } from "./NavbarLanguageButton";

export function Navbar() {
  const [isEmployerAuthenticated, setIsEmployerAuthenticated] = useState(false);
  const [isJobSeekerAuthenticated, setIsJobSeekerAuthenticated] =
    useState(false);

  const syncAuthState = () => {
    setIsEmployerAuthenticated(isEmployerAuthActive());
    setIsJobSeekerAuthenticated(isJobSeekerAuthActive());
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
  const t = useTranslate();

  return (
    <header className="sticky top-0 z-50 overflow-x-clip border-b border-border-subtle bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
      <Container className="relative z-50 bg-surface px-2 mobile:px-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-[72px] items-center gap-3 py-2 mobile:min-h-16 mobile:gap-2 mobile:py-1.5 sm:gap-4 lg:min-h-[80px] lg:gap-6 lg:py-2">
          <Link
            href={ROUTES.HOME}
            aria-label={t("navbar.homeAria")}
            className="flex min-w-0 shrink flex-col items-start gap-0.5 rounded-sm pl-1 mobile:pl-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mr-0 lg:pl-0"
          >
            <Image
              src={asliLogo}
              alt=""
              width={213}
              height={70}
              className="block h-[32px] w-auto mobile:h-[30px] sm:h-[34px] lg:h-[52px]"
              priority
              aria-hidden
            />
            <p className="max-w-[9.5rem] truncate whitespace-nowrap text-[7px] font-bold leading-tight text-muted mobile:max-w-[8.75rem] sm:max-w-none sm:text-[8px] lg:text-[9px]">
              {t("navbar.tagline")}
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
                <NavbarMobileRegisterMenu />
                <Link
                  href={ROUTES.JOB_SEEKER_REGISTER}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-primary-soft px-3 text-sm font-medium text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 mobile:hidden sm:px-3.5 xl:h-10 xl:px-5 xl:text-[15px]"
                >
                  {t("navbar.jobSeeker")}
                </Link>
                <Link
                  href={ROUTES.EMPLOYER_REGISTER}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-primary bg-transparent px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 mobile:hidden sm:px-3.5 xl:h-10 xl:px-5 xl:text-[15px]"
                >
                  <span className="xl:hidden">{t("navbar.employers")}</span>
                  <span className="hidden xl:inline">{t("navbar.employersPostJob")}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}

function NavbarMobileRegisterMenu() {
  const t = useTranslate();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const itemClassName =
    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30";

  return (
    <div ref={rootRef} className="relative hidden mobile:block">
      <button
        type="button"
        className="inline-flex size-8 min-h-8 items-center justify-center rounded-md border border-border-subtle text-nav transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={t("navbar.registerMenuAria")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <UserRound className="size-4" strokeWidth={2} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("navbar.registerMenuAria")}
          className="absolute top-full right-0 z-50 mt-1 min-w-[9.25rem] origin-top-right overflow-hidden rounded-md border border-border-subtle bg-surface py-0.5 shadow-md"
        >
          <Link
            href={ROUTES.JOB_SEEKER_REGISTER}
            role="menuitem"
            className={itemClassName}
            onClick={() => setIsOpen(false)}
          >
            <UserRound className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {t("navbar.jobSeeker")}
          </Link>
          <Link
            href={ROUTES.EMPLOYER_REGISTER}
            role="menuitem"
            className={itemClassName}
            onClick={() => setIsOpen(false)}
          >
            <BriefcaseBusiness className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {t("navbar.employers")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
