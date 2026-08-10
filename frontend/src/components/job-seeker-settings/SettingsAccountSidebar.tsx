"use client";

import { ROUTES } from "@/constants/routes";
import { clearJobSeekerSafeCache } from "@/utils/job-seeker-settings-preferences";
import { showAppToast } from "@/utils/share-job";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Download,
  MapPin,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type QuickSettingItem = {
  id: string;
  label: string;
  icon: typeof Pencil;
  href?: string;
  onClick?: () => void;
};

type SettingsAccountSidebarProps = {
  jobSeekerId: string;
  lastLoginLabel: string;
  profileCompletionPercent: number;
  onOpenSecurity: () => void;
};

export function SettingsAccountSidebar({
  jobSeekerId,
  lastLoginLabel,
  profileCompletionPercent,
  onOpenSecurity,
}: SettingsAccountSidebarProps) {
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  const quickItems: QuickSettingItem[] = [
    {
      id: "edit-profile",
      label: "Edit Profile",
      icon: Pencil,
      href: ROUTES.JOB_SEEKER_PROFILE,
    },
    {
      id: "manage-addresses",
      label: "Manage Addresses",
      icon: MapPin,
      href: `${ROUTES.JOB_SEEKER_PROFILE}?tab=overview`,
    },
    {
      id: "download-data",
      label: "Download My Data",
      icon: Download,
      onClick: () =>
        showAppToast(
          "Data export is not available in the API yet. Contact support for assistance.",
          "error",
        ),
    },
  ];

  const handleClearCache = () => {
    setIsClearing(true);
    try {
      clearJobSeekerSafeCache(jobSeekerId);
      void queryClient.invalidateQueries({ queryKey: ["job-seeker"] });
      showAppToast("Cache cleared successfully", "success");
    } catch {
      showAppToast("Unable to clear cache", "error");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <section className="rounded-2xl border border-border-subtle bg-surface p-5">
        <h2 className="text-sm font-bold text-foreground sm:text-base">
          Profile Strength
        </h2>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Complete your profile to improve job matching.
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-foreground sm:text-sm">
            Profile {profileCompletionPercent}%
          </span>
          <span className="text-[11px] font-medium text-primary sm:text-xs">
            {profileCompletionPercent >= 100 ? "Complete" : "In progress"}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-primary-light"
          role="progressbar"
          aria-valuenow={profileCompletionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile completion"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, profileCompletionPercent))}%`,
            }}
          />
        </div>
        <Link
          href={ROUTES.JOB_SEEKER_PROFILE}
          className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
        >
          Complete profile
        </Link>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface p-5">
        <h2 className="text-sm font-bold text-foreground sm:text-base">
          Quick Settings
        </h2>
        <ul className="mt-1">
          {quickItems.map((item) => {
            const Icon = item.icon;
            const className =
              "group flex w-full items-center gap-3 border-b border-border-subtle py-3.5 text-left last:border-b-0 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
            const content = (
              <>
                <Icon
                  className="size-4 shrink-0 text-muted group-hover:text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 text-xs font-medium text-foreground group-hover:text-primary sm:text-sm">
                  {item.label}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </>
            );

            if (item.href) {
              return (
                <li key={item.id}>
                  <Link href={item.href} className={className}>
                    {content}
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={item.onClick}
                  className={className}
                >
                  {content}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-resource-guide-icon-surface text-resource-guide-icon">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground sm:text-base">
              Account Security
            </h2>
            <p className="mt-1 text-xs font-medium text-resource-guide-icon sm:text-sm">
              Your account is secure
            </p>
            <p className="mt-1 text-[11px] text-muted sm:text-xs">
              Last login: {lastLoginLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSecurity}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl border border-primary bg-surface px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-10 sm:text-sm"
        >
          Manage Security Settings
        </button>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground sm:text-base">
              Clear Cache
            </h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              This will clear temporary data and free up storage space.
            </p>
          </div>
          <Trash2 className="size-5 shrink-0 text-muted" aria-hidden="true" />
        </div>
        <button
          type="button"
          onClick={handleClearCache}
          disabled={isClearing}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl border border-primary bg-surface px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 sm:h-10 sm:text-sm"
        >
          {isClearing ? "Clearing…" : "Clear Cache"}
        </button>
      </section>
    </aside>
  );
}
