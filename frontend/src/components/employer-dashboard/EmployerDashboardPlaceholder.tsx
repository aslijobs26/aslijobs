import {
  EMPLOYER_DASHBOARD_PLACEHOLDER_DESCRIPTION,
  EMPLOYER_DASHBOARD_PLACEHOLDER_HEADING,
  EMPLOYER_DASHBOARD_PLACEHOLDER_TITLE,
} from "@/constants/employer-dashboard";

export function EmployerDashboardPlaceholder() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-muted" aria-hidden="true">
          🚧
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {EMPLOYER_DASHBOARD_PLACEHOLDER_TITLE}
        </h1>
        <p className="mt-3 text-base font-semibold text-foreground">
          {EMPLOYER_DASHBOARD_PLACEHOLDER_HEADING}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {EMPLOYER_DASHBOARD_PLACEHOLDER_DESCRIPTION}
        </p>
      </div>
    </div>
  );
}
