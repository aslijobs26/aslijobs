"use client";

import { ROUTES } from "@/constants/routes";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleName = searchParams.get("module") ?? "this area";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <ShieldAlert className="size-7" aria-hidden="true" />
      </span>
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Access restricted
        </h1>
        <p className="text-sm text-muted">
          You do not have permission to open{" "}
          <span className="font-semibold text-foreground">{moduleName}</span>.
          Contact your organization admin if you need access.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Go Back
        </button>
        <Link
          href={ROUTES.EMPLOYER_DASHBOARD}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Go to Dashboard
        </Link>
        <Link
          href={ROUTES.EMPLOYER_HELP_CENTER}
          className="inline-flex h-10 items-center rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Contact Admin
        </Link>
      </div>
    </div>
  );
}

export default function EmployerUnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted">
          Loading...
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
