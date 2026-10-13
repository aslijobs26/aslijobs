"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import { EmployerProfileMenu } from "@/components/employer-dashboard/EmployerProfileMenu";
import { JobSeekerProfileMenu } from "@/components/job-seeker/JobSeekerProfileMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTranslate } from "@/i18n/translate";
import { ROUTES } from "@/constants/routes";
import {
  computeAnchoredDropdownPosition,
  readSafeAreaInsets,
  readVisibleViewportSize,
  type AnchoredDropdownPosition,
} from "@/utils/anchored-dropdown-position";
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
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const jobSeekerLabel = t("navbar.jobSeeker");
  const employersLabel = t("navbar.employers");
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<AnchoredDropdownPosition | null>(
    null,
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) {
      return;
    }

    const viewport = readVisibleViewportSize();
    setPosition(
      computeAnchoredDropdownPosition({
        anchorRect: trigger.getBoundingClientRect(),
        contentWidth: menu.scrollWidth,
        contentHeight: menu.scrollHeight,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        insets: readSafeAreaInsets(),
        gap: 4,
      }),
    );
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    updatePosition();
  }, [isOpen, updatePosition, jobSeekerLabel, employersLabel]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => updatePosition();
    const handleScroll = (event: Event) => {
      if (event.target !== menuRef.current) {
        updatePosition();
      }
    };
    const visualViewport = window.visualViewport;

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleScroll, true);
    visualViewport?.addEventListener("resize", handleViewportChange);
    visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleScroll, true);
      visualViewport?.removeEventListener("resize", handleViewportChange);
      visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [isOpen, updatePosition]);

  const itemClassName =
    "flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30";

  return (
    <div ref={rootRef} className="relative hidden mobile:block">
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-md border border-border-subtle text-nav transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={t("navbar.registerMenuAria")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <UserRound className="size-4" strokeWidth={2} aria-hidden="true" />
      </button>

      {/* Portaled so the sticky header and page overflow clip cannot cut the menu off on iOS or Android. */}
      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={t("navbar.registerMenuAria")}
              style={
                position
                  ? {
                      top: position.top,
                      left: position.left,
                      maxHeight: position.maxHeight,
                      maxWidth: position.maxWidth,
                    }
                  : { top: 0, left: 0, visibility: "hidden" }
              }
              className="fixed z-[55] min-w-[9.25rem] overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border border-border-subtle bg-surface py-0.5 shadow-md"
            >
              <Link
                href={ROUTES.JOB_SEEKER_REGISTER}
                role="menuitem"
                className={itemClassName}
                onClick={() => setIsOpen(false)}
              >
                <UserRound className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 break-words">{jobSeekerLabel}</span>
              </Link>
              <Link
                href={ROUTES.EMPLOYER_REGISTER}
                role="menuitem"
                className={itemClassName}
                onClick={() => setIsOpen(false)}
              >
                <BriefcaseBusiness
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{employersLabel}</span>
              </Link>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
