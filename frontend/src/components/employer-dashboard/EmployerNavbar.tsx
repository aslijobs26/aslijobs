"use client";

import { EmployerProfileMenu } from "@/components/employer-dashboard/EmployerProfileMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EmployerPostJobLink } from "@/components/post-job/EmployerPostJobLink";
import { TakeTourButton } from "@/components/product-tour/ProductTourHost";
import { Can } from "@/components/rbac/Can";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import { cn } from "@/utils/cn";
import { Menu } from "lucide-react";

type EmployerNavbarProps = {
  onSidebarToggle: () => void;
  className?: string;
};

export function EmployerNavbar({
  onSidebarToggle,
  className,
}: EmployerNavbarProps) {
  const t = useTranslate();

  return (
    <header
      className={cn(
        "employer-shell-header sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-3 sm:px-4 lg:h-[var(--employer-header-height)] lg:gap-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={onSidebarToggle}
        className="employer-shell-menu-btn inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:size-8"
        aria-label={t("employer.shell.toggleSidebar")}
      >
        <Menu className="size-5 lg:size-4" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="employer-shell-actions ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-2">
        <TakeTourButton className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:px-3 lg:h-8" />
        <Can module="jobs" action="create">
          <EmployerPostJobLink data-tour="employer-post-job" className="employer-shell-post-job inline-flex h-9 shrink-0 items-center rounded-lg bg-primary-soft px-2.5 text-xs font-semibold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-10 sm:px-4 sm:text-sm lg:h-8 lg:px-3 lg:text-xs">
            <span className="whitespace-nowrap">{t("employer.shell.postJob")}</span>
          </EmployerPostJobLink>
        </Can>

        <NotificationBell
          className="employer-shell-bell"
          dataTour="employer-bell"
          viewAllHref={ROUTES.EMPLOYER_NOTIFICATIONS}
        />

        <EmployerProfileMenu className="employer-shell-profile" dataTour="employer-profile-menu" />
      </div>
    </header>
  );
}
