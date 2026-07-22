"use client";

import { NAV_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  isEmployerAuthenticated?: boolean;
};

export function MobileNav({
  isOpen,
  onClose,
  isEmployerAuthenticated = false,
}: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 top-[72px] bottom-0 z-40 bg-black/20 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      <nav
        ref={panelRef}
        id="mobile-navigation"
        tabIndex={-1}
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-x-0 top-[72px] z-50 max-h-[calc(100dvh-72px)] overflow-y-auto bg-surface transition-transform duration-200 ease-out lg:hidden",
          isOpen ? "translate-y-0" : "-translate-y-2 pointer-events-none opacity-0",
        )}
      >
        <div className="flex flex-col px-4 py-4">
          {NAV_ITEMS.map((item) =>
            item.hasChevron && item.label !== "Employers" ? (
              <button
                key={item.label}
                type="button"
                className="flex min-h-12 w-full items-center justify-between rounded-md px-3 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-haspopup="true"
                aria-expanded={false}
                onClick={onClose}
              >
                <span>{item.label}</span>
                <ChevronDown className="size-4 shrink-0 text-muted" strokeWidth={2} />
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="flex min-h-12 items-center justify-between rounded-md px-3 text-[15px] font-medium text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                onClick={onClose}
              >
                <span>{item.label}</span>
                {item.hasChevron ? (
                  <ChevronDown
                    className="size-4 shrink-0 text-muted"
                    strokeWidth={2}
                  />
                ) : null}
              </Link>
            ),
          )}

          {!isEmployerAuthenticated ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4">
              <Link
                href={ROUTES.JOB_SEEKER_REGISTER}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary-soft px-4 text-[15px] font-medium text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={onClose}
              >
                Job Seeker
              </Link>
              <Link
                href={ROUTES.EMPLOYER_REGISTER}
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-primary bg-transparent px-4 text-[15px] font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                onClick={onClose}
              >
                Employers / Post Job
              </Link>
            </div>
          ) : null}
        </div>
      </nav>
    </>
  );
}
