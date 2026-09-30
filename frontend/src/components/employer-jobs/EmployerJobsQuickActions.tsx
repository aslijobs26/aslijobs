"use client";

import { ROUTES } from "@/constants/routes";
import { EmployerPostJobLink } from "@/components/post-job/EmployerPostJobLink";
import { Can } from "@/components/rbac/Can";
import { useTranslate } from "@/i18n/translate";
import {
  ChevronRight,
  FileStack,
  MessageCircle,
  PlusCircle,
  Rocket,
  Search,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function EmployerJobsQuickActions() {
  const t = useTranslate();

  return (
    <aside className="flex w-full min-w-0 flex-col gap-3 xl:w-[16rem] xl:shrink-0 2xl:w-[17rem]">
      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-bold text-foreground">
          {t("employer.jobs.quickActionsTitle")}
        </h2>
        <ul className="mt-2.5 space-y-0.5">
          <Can module="jobs" action="create">
            <li>
              <EmployerPostJobLink className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-semibold text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                <PlusCircle className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 break-words">
                  {t("employer.common.postNewJob")}
                </span>
                <ChevronRight
                  className="size-3.5 shrink-0 opacity-70"
                  aria-hidden="true"
                />
              </EmployerPostJobLink>
            </li>
          </Can>
          <li>
            <DisabledQuickAction
              icon={<FileStack className="size-4" />}
              comingSoonLabel={t("employer.dashboard.comingSoon")}
            >
              {t("employer.jobs.quickActionTemplates")}
            </DisabledQuickAction>
          </li>
          <li>
            <DisabledQuickAction
              icon={<MessageCircle className="size-4" />}
              comingSoonLabel={t("employer.dashboard.comingSoon")}
            >
              {t("employer.jobs.quickActionWhatsApp")}
            </DisabledQuickAction>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-border-subtle bg-gradient-to-br from-primary-light/80 to-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div
          className="mb-2.5 inline-flex size-9 items-center justify-center rounded-full bg-primary-soft/15 text-primary-soft"
          aria-hidden="true"
        >
          <Rocket className="size-4" strokeWidth={2} />
        </div>
        <h2 className="text-sm font-bold text-foreground">
          {t("employer.jobs.boostTitle")}
        </h2>
        <p className="mt-1 break-words text-xs leading-relaxed text-muted">
          {t("employer.jobs.boostDescription")}
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t("employer.dashboard.comingSoon")}
          className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-primary-soft px-4 text-sm font-bold text-white opacity-80"
        >
          {t("employer.jobs.boostCta")}
        </button>
      </section>

      <Can module="candidates" action="read">
        <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div
            className="mb-2.5 inline-flex size-9 items-center justify-center rounded-full bg-sky-50 text-sky-600"
            aria-hidden="true"
          >
            <Search className="size-4" strokeWidth={2} />
          </div>
          <h2 className="text-sm font-bold text-foreground">
            {t("employer.common.searchCandidates")}
          </h2>
          <p className="mt-1 break-words text-xs leading-relaxed text-muted">
            {t("employer.jobs.searchCandidatesDescription")}
          </p>
          <Link
            href={ROUTES.EMPLOYER_CANDIDATES}
            className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-primary-soft px-4 text-center text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {t("employer.common.searchCandidates")}
          </Link>
        </section>
      </Can>

      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-bold text-foreground">
          {t("employer.shell.helpTitle")}
        </h2>
        <p className="mt-1 break-words text-xs leading-relaxed text-muted">
          {t("employer.jobs.needHelpDescription")}
        </p>
        <Link
          href={ROUTES.EMPLOYER_HELP_CENTER}
          className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {t("employer.jobs.needHelpCta")}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </aside>
  );
}

function DisabledQuickAction({
  children,
  icon,
  comingSoonLabel,
}: {
  children: ReactNode;
  icon: ReactNode;
  comingSoonLabel: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={comingSoonLabel}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-foreground/80 opacity-55"
    >
      <span className="text-muted" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
      <ChevronRight
        className="size-3.5 shrink-0 text-muted"
        aria-hidden="true"
      />
    </button>
  );
}
