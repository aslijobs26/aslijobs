"use client";

import { EmployerProfileMenu } from "@/components/employer-dashboard/EmployerProfileMenu";
import { NavbarLanguageButton } from "@/components/layout/NavbarLanguageButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { EmployerPostJobLink } from "@/components/post-job/EmployerPostJobLink";
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
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-3 sm:px-4 lg:px-5",
        className,
      )}
    >
      <button
        type="button"
        onClick={onSidebarToggle}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-nav transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={t("employer.shell.toggleSidebar")}
      >
        <Menu className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
        <Can module="jobs" action="create">
          <EmployerPostJobLink className="inline-flex h-9 shrink-0 items-center rounded-lg bg-primary-soft px-2.5 text-xs font-semibold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-10 sm:px-4 sm:text-sm">
            <span className="whitespace-nowrap">{t("employer.shell.postJob")}</span>
          </EmployerPostJobLink>
        </Can>

        <NotificationBell viewAllHref={ROUTES.EMPLOYER_NOTIFICATIONS} />

        <NavbarLanguageButton className="hidden sm:block" />

        <EmployerProfileMenu />
      </div>
    </header>
  );
}
