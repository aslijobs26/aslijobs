"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import { BRAND_TAGLINE } from "@/constants/brand";
import { NAV_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Container } from "./Container";
import { MobileNav } from "./MobileNav";

function NavTrigger({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap text-[15px] font-medium text-nav transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm",
        className,
      )}
      aria-haspopup="true"
      aria-expanded={false}
    >
      {label}
      <ChevronDown className="size-3.5 shrink-0 text-nav/80" strokeWidth={2.5} />
    </button>
  );
}

export function Navbar() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const closeMobileNav = () => setIsMobileNavOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white">
      <Container className="px-2 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-[72px] items-center gap-4 py-2 lg:min-h-[80px] lg:gap-6">
          <Link
            href={ROUTES.HOME}
            aria-label="AsliJobs home"
            className="flex shrink-0 flex-col items-start gap-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mr-0"
            onClick={closeMobileNav}
          >
            <Image
              src={asliLogo}
              alt=""
              width={213}
              height={70}
              className="block h-[52px] w-auto lg:h-[60px]"
              priority
              aria-hidden
            />
            <p className="whitespace-nowrap text-[8px] font-bold leading-tight text-gray-500 sm:text-[9px] lg:text-[10px]">
              {BRAND_TAGLINE}
            </p>
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-5 xl:gap-8 lg:flex"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) =>
              item.hasChevron ? (
                <NavTrigger key={item.label} label={item.label} />
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="whitespace-nowrap text-[15px] font-medium text-nav transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex h-10 items-center justify-center rounded-md border border-primary px-5 text-[15px] font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Login
            </Link>
            <Link
              href={ROUTES.POST_JOB}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary-soft px-5 text-[15px] font-medium text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Post a Job
            </Link>
          </div>

          <button
            type="button"
            className="ml-auto inline-flex size-10 items-center justify-center rounded-md text-nav transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
            aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? (
              <X className="size-6" strokeWidth={2} />
            ) : (
              <Menu className="size-6" strokeWidth={2} />
            )}
          </button>
        </div>
      </Container>

      <MobileNav isOpen={isMobileNavOpen} onClose={closeMobileNav} />
    </header>
  );
}
