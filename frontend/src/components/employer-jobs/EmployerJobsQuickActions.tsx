import {
  EMPLOYER_JOBS_BOOST_CTA,
  EMPLOYER_JOBS_BOOST_DESCRIPTION,
  EMPLOYER_JOBS_BOOST_TITLE,
  EMPLOYER_JOBS_NEED_HELP_CTA,
  EMPLOYER_JOBS_NEED_HELP_DESCRIPTION,
  EMPLOYER_JOBS_NEED_HELP_TITLE,
  EMPLOYER_JOBS_QUICK_ACTION_IMPORT,
  EMPLOYER_JOBS_QUICK_ACTION_POST,
  EMPLOYER_JOBS_QUICK_ACTION_TEMPLATES,
  EMPLOYER_JOBS_QUICK_ACTION_WHATSAPP,
  EMPLOYER_JOBS_QUICK_ACTIONS_TITLE,
  EMPLOYER_JOBS_SEARCH_CANDIDATES_CTA,
  EMPLOYER_JOBS_SEARCH_CANDIDATES_DESCRIPTION,
  EMPLOYER_JOBS_SEARCH_CANDIDATES_TITLE,
} from "@/constants/employer-jobs";
import { ROUTES } from "@/constants/routes";
import {
  ChevronRight,
  FileStack,
  MessageCircle,
  PlusCircle,
  Rocket,
  Search,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function EmployerJobsQuickActions() {
  return (
    <aside className="flex w-full flex-col gap-3 xl:w-[16rem] xl:shrink-0 2xl:w-[17rem]">
      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-bold text-foreground">
          {EMPLOYER_JOBS_QUICK_ACTIONS_TITLE}
        </h2>
        <ul className="mt-2.5 space-y-0.5">
          <li>
            <Link
              href={ROUTES.POST_JOB}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-semibold text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <PlusCircle className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{EMPLOYER_JOBS_QUICK_ACTION_POST}</span>
              <ChevronRight
                className="size-3.5 shrink-0 opacity-70"
                aria-hidden="true"
              />
            </Link>
          </li>
          <li>
            <DisabledQuickAction icon={<Upload className="size-4" />}>
              {EMPLOYER_JOBS_QUICK_ACTION_IMPORT}
            </DisabledQuickAction>
          </li>
          <li>
            <DisabledQuickAction icon={<FileStack className="size-4" />}>
              {EMPLOYER_JOBS_QUICK_ACTION_TEMPLATES}
            </DisabledQuickAction>
          </li>
          <li>
            <DisabledQuickAction icon={<MessageCircle className="size-4" />}>
              {EMPLOYER_JOBS_QUICK_ACTION_WHATSAPP}
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
          {EMPLOYER_JOBS_BOOST_TITLE}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {EMPLOYER_JOBS_BOOST_DESCRIPTION}
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Coming soon"
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary-soft px-4 text-sm font-bold text-white opacity-80"
        >
          {EMPLOYER_JOBS_BOOST_CTA}
        </button>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div
          className="mb-2.5 inline-flex size-9 items-center justify-center rounded-full bg-sky-50 text-sky-600"
          aria-hidden="true"
        >
          <Search className="size-4" strokeWidth={2} />
        </div>
        <h2 className="text-sm font-bold text-foreground">
          {EMPLOYER_JOBS_SEARCH_CANDIDATES_TITLE}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {EMPLOYER_JOBS_SEARCH_CANDIDATES_DESCRIPTION}
        </p>
        <Link
          href={ROUTES.EMPLOYER_CANDIDATES}
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary-soft px-4 text-sm font-bold text-white transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {EMPLOYER_JOBS_SEARCH_CANDIDATES_CTA}
        </Link>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-bold text-foreground">
          {EMPLOYER_JOBS_NEED_HELP_TITLE}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {EMPLOYER_JOBS_NEED_HELP_DESCRIPTION}
        </p>
        <Link
          href={ROUTES.EMPLOYER_HELP_CENTER}
          className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-primary-soft transition-colors hover:text-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {EMPLOYER_JOBS_NEED_HELP_CTA}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </aside>
  );
}

function DisabledQuickAction({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Coming soon"
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-foreground/80 opacity-55"
    >
      <span className="text-muted" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRight
        className="size-3.5 shrink-0 text-muted"
        aria-hidden="true"
      />
    </button>
  );
}
