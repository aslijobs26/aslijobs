"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import { EmployerProfileMenu } from "@/components/employer-dashboard/EmployerProfileMenu";
import { BRAND_TAGLINE } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import {
  EMPLOYER_ACCESS_TOKEN_STORAGE_KEY,
  getEmployerAccessToken,
} from "@/utils/employer-auth-storage";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "./Container";
import { NavbarLanguageButton } from "./NavbarLanguageButton";

export function Navbar() {
  const [isEmployerAuthenticated, setIsEmployerAuthenticated] = useState(false);

  const syncEmployerAuthState = () => {
    setIsEmployerAuthenticated(Boolean(getEmployerAccessToken()));
  };

  useEffect(() => {
    syncEmployerAuthState();

    const handlePageShow = () => {
      syncEmployerAuthState();
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === EMPLOYER_ACCESS_TOKEN_STORAGE_KEY
      ) {
        syncEmployerAuthState();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleEmployerLogout = () => {
    setIsEmployerAuthenticated(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
      <Container className="relative z-50 bg-surface px-2 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-[72px] items-center gap-3 py-2 sm:gap-4 lg:min-h-[80px] lg:gap-6">
          <Link
            href={ROUTES.HOME}
            aria-label="AsliJobs home"
            className="flex shrink-0 flex-col items-start gap-0.5 rounded-sm pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mr-0 lg:pl-0"
          >
            <Image
              src={asliLogo}
              alt=""
              width={213}
              height={70}
              className="block h-[38px] w-auto lg:h-[60px]"
              priority
              aria-hidden
            />
            <p className="whitespace-nowrap text-[7px] font-bold leading-tight text-muted sm:text-[9px] lg:text-[10px]">
              {BRAND_TAGLINE}
            </p>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-3">
            <NavbarLanguageButton />

            {isEmployerAuthenticated ? (
              <EmployerProfileMenu onLogout={handleEmployerLogout} />
            ) : (
              <>
                <Link
                  href={ROUTES.JOB_SEEKER_REGISTER}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-primary-soft px-3 text-sm font-medium text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-3.5 xl:h-10 xl:px-5 xl:text-[15px]"
                >
                  Job Seeker
                </Link>
                <Link
                  href={ROUTES.EMPLOYER_REGISTER}
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-primary bg-transparent px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-3.5 xl:h-10 xl:px-5 xl:text-[15px]"
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
