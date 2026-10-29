"use client";

import { ROUTES } from "@/constants/routes";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import { FileText } from "lucide-react";
import Link from "next/link";

type EmployerDashboardPlaceholderProps = {
  titleKey: MessageKey;
};

export function EmployerDashboardPlaceholder({
  titleKey,
}: EmployerDashboardPlaceholderProps) {
  const t = useTranslate();

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16 lg:py-12">
      <div className="w-full min-w-0 max-w-lg text-center">
        <span
          className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary-light text-primary-soft lg:size-10"
          aria-hidden="true"
        >
          <FileText className="size-5 lg:size-4" strokeWidth={2} />
        </span>

        <h1 className="mt-4 break-words text-2xl font-bold tracking-tight text-foreground lg:mt-3 lg:text-xl">
          {t(titleKey)}
        </h1>

        <p className="mt-3 text-base font-semibold text-foreground lg:mt-2 lg:text-sm">
          {t("employer.placeholder.heading")}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-muted lg:text-xs lg:leading-snug">
          {t("employer.placeholder.description")}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted lg:mt-2 lg:text-xs lg:leading-snug">
          {t("employer.placeholder.routingNote")}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-muted lg:text-xs lg:leading-snug">
          {t("employer.placeholder.phasesNote")}
        </p>

        <Link
          href={ROUTES.EMPLOYER_DASHBOARD}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-primary-soft transition-colors hover:border-primary-soft/40 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mt-4 lg:min-h-9 lg:px-3.5 lg:py-2 lg:text-xs"
        >
          ← {t("employer.placeholder.backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
