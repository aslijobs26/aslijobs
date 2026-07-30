"use client";

import { EmployerProfileCompletionCircle } from "@/components/employer-profile/EmployerProfileCompletionCircle";
import { ROUTES } from "@/constants/routes";
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
  return (
    <section className="overflow-hidden rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        <EmployerProfileCompletionCircle percentage={percentage} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-foreground">
            {isComplete
              ? "Profile complete"
              : percentage >= 80
                ? "Almost there! Complete your profile"
                : isIndividual
                  ? "Complete your individual profile"
                  : "Complete your company profile"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {isComplete
              ? "Your profile is ready to attract candidates."
              : "Finish your profile to build trust and attract better candidates."}
          </p>
          <Link
            href={ROUTES.EMPLOYER_COMPANY_PROFILE}
            className={cn(
              "mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            )}
          >
            View Profile
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
