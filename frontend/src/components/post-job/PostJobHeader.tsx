"use client";

import { ROUTES } from "@/constants/routes";
import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";

const iconButtonClassName =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export function PostJobHeader() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(ROUTES.HOME);
  };

  const handleClose = () => {
    router.push(ROUTES.HOME);
  };

  return (
    <header className="border-b border-border-subtle bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className={iconButtonClassName}
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" strokeWidth={2} aria-hidden="true" />
          </button>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">
            Post Job
          </h1>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className={iconButtonClassName}
          aria-label="Close post job page"
        >
          <X className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
