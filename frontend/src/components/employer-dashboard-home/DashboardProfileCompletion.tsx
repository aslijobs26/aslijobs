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
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <EmployerProfileCompletionCircle percentage={percentage} compact />
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xs font-bold text-foreground sm:text-sm">
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
          <p className="mt-0.5 break-words text-[0.6875rem] leading-snug text-muted sm:mt-1 sm:text-xs sm:leading-relaxed">
            {t(
              isComplete
                ? "employer.dashboard.profileReady"
                : "employer.dashboard.profileFinishHint",
            )}
          </p>
          <Link
            href={ROUTES.EMPLOYER_COMPANY_PROFILE}
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:mt-3 sm:text-sm",
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
