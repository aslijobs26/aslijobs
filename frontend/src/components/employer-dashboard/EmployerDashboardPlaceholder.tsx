import {
  EMPLOYER_DASHBOARD_PLACEHOLDER_BACK_LABEL,
  EMPLOYER_DASHBOARD_PLACEHOLDER_DESCRIPTION,
  EMPLOYER_DASHBOARD_PLACEHOLDER_HEADING,
  EMPLOYER_DASHBOARD_PLACEHOLDER_PHASES_NOTE,
  EMPLOYER_DASHBOARD_PLACEHOLDER_ROUTING_NOTE,
} from "@/constants/employer-dashboard";
import { ROUTES } from "@/constants/routes";
import { FileText } from "lucide-react";
import Link from "next/link";

type EmployerDashboardPlaceholderProps = {
  title: string;
};

export function EmployerDashboardPlaceholder({
  title,
}: EmployerDashboardPlaceholderProps) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <span
          className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-primary-light text-primary-soft"
          aria-hidden="true"
        >
          <FileText className="size-5" strokeWidth={2} />
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>

        <p className="mt-3 text-base font-semibold text-foreground">
          {EMPLOYER_DASHBOARD_PLACEHOLDER_HEADING}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-muted">
          {EMPLOYER_DASHBOARD_PLACEHOLDER_DESCRIPTION}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          {EMPLOYER_DASHBOARD_PLACEHOLDER_ROUTING_NOTE}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-muted">
          {EMPLOYER_DASHBOARD_PLACEHOLDER_PHASES_NOTE}
        </p>

        <Link
          href={ROUTES.EMPLOYER_DASHBOARD}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-primary-soft transition-colors hover:border-primary-soft/40 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          ← {EMPLOYER_DASHBOARD_PLACEHOLDER_BACK_LABEL}
        </Link>
      </div>
    </div>
  );
}
