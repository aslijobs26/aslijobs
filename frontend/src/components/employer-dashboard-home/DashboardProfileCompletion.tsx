"use client";

import { EmployerProfileCompletionCircle } from "@/components/employer-profile/EmployerProfileCompletionCircle";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { cn } from "@/utils/cn";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type DashboardProfileCompletionProps = {
  percentage: number;
  isComplete: boolean;
  isIndividual: boolean;
};

export function DashboardProfileCompletion({
  percentage,
  isComplete,
  isIndividual,
}: DashboardProfileCompletionProps) {
  const t = useTranslate();

  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        <EmployerProfileCompletionCircle percentage={percentage} />
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-sm font-bold text-foreground">
            {t(
              isComplete
                ? "employer.dashboard.profileComplete"
                : percentage >= 80
                  ? "employer.dashboard.profileAlmostThere"
                  : isIndividual
                    ? "employer.dashboard.profileCompleteIndividual"
                    : "employer.dashboard.profileCompleteCompany",
            )}
          </h2>
          <p className="mt-1 break-words text-xs leading-relaxed text-muted">
            {t(
              isComplete
                ? "employer.dashboard.profileReady"
                : "employer.dashboard.profileFinishHint",
            )}
          </p>
          <Link
            href={ROUTES.EMPLOYER_COMPANY_PROFILE}
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            )}
          >
            {t("employer.dashboard.viewProfile")}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
