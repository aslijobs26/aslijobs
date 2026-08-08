"use client";

import { DeactivateAccountModal } from "@/components/job-seeker-settings/DeactivateAccountModal";
import { SettingsAccountSidebar } from "@/components/job-seeker-settings/SettingsAccountSidebar";
import { ROUTES } from "@/constants/routes";
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  Pencil,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type AccountInfoRow = {
  label: string;
  value: string;
  verified?: boolean;
  href?: string;
};

type AccountSettingsPanelProps = {
  jobSeekerId: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  avatarInitials: string;
  isPhoneVerified: boolean;
  lastLoginLabel: string;
  profileCompletionPercent: number;
  onOpenSecurity: () => void;
  infoRows: AccountInfoRow[];
};

function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-resource-guide-icon-surface px-1.5 py-0.5 text-[10px] font-semibold text-resource-guide-icon">
      <BadgeCheck
        className={compact ? "size-3" : "size-3.5"}
        aria-hidden="true"
      />
      Verified
    </span>
  );
}

export function AccountSettingsPanel({
  jobSeekerId,
  fullName,
  phone,
  avatarUrl,
  avatarInitials,
  isPhoneVerified,
  lastLoginLabel,
  profileCompletionPercent,
  onOpenSecurity,
  infoRows,
}: AccountSettingsPanelProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const showImage = Boolean(avatarUrl) && !hasImageError;

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(16.5rem,1fr)] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5">
              <div className="flex min-w-0 items-start gap-4">
                <div className="relative size-[4.5rem] shrink-0">
                  {showImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- backend upload URL
                    <img
                      src={avatarUrl ?? ""}
                      alt=""
                      width={72}
                      height={72}
                      onError={() => setHasImageError(true)}
                      className="size-[4.5rem] rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="inline-flex size-[4.5rem] items-center justify-center rounded-full bg-primary text-lg font-bold text-surface"
                      aria-hidden="true"
                    >
                      {avatarInitials}
                    </span>
                  )}
                  <Link
                    href={ROUTES.JOB_SEEKER_PROFILE}
                    aria-label="Edit profile photo"
                    className="absolute bottom-0 right-0 inline-flex size-7 items-center justify-center rounded-full border-2 border-surface bg-primary text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Camera className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-bold text-foreground">
                      {fullName || "Job Seeker"}
                    </h2>
                    {isPhoneVerified ? <VerifiedBadge /> : null}
                  </div>
                  <p className="mt-1.5 truncate text-sm text-muted">
                    {phone || "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Signed in with WhatsApp OTP
                  </p>
                </div>
              </div>

              <Link
                href={ROUTES.JOB_SEEKER_PROFILE}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit Profile
              </Link>
            </div>

            <dl className="border-t border-border-subtle">
              {infoRows.map((row, index) => {
                const rowClass =
                  "grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-center gap-3 px-5 py-3.5";
                const content = (
                  <>
                    <dt className="text-sm font-medium text-muted">
                      {row.label}
                    </dt>
                    <dd className="flex min-w-0 items-center justify-end gap-2 text-right">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {row.value}
                      </span>
                      {row.verified ? <VerifiedBadge compact /> : null}
                      {row.href ? (
                        <ChevronRight
                          className="size-4 shrink-0 text-muted"
                          aria-hidden="true"
                        />
                      ) : null}
                    </dd>
                  </>
                );

                if (row.href) {
                  return (
                    <div
                      key={row.label}
                      className={
                        index > 0 ? "border-t border-border-subtle" : undefined
                      }
                    >
                      <Link
                        href={row.href}
                        className={`${rowClass} transition-colors hover:bg-hero-bg/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30`}
                      >
                        {content}
                      </Link>
                    </div>
                  );
                }

                return (
                  <div
                    key={row.label}
                    className={
                      index > 0
                        ? `border-t border-border-subtle ${rowClass}`
                        : rowClass
                    }
                  >
                    {content}
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-benefit-ai-matching-surface text-pin-state">
                  <UserX className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-foreground">
                    Account Deactivation
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    Temporarily or permanently deactivate your account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-pin-state/50 bg-surface px-3.5 text-sm font-semibold text-pin-state transition-colors hover:bg-benefit-ai-matching-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pin-state/30"
              >
                Deactivate Account
              </button>
            </div>
          </section>
        </div>

        <SettingsAccountSidebar
          jobSeekerId={jobSeekerId}
          lastLoginLabel={lastLoginLabel}
          profileCompletionPercent={profileCompletionPercent}
          onOpenSecurity={onOpenSecurity}
        />
      </div>

      {showDeactivateModal ? (
        <DeactivateAccountModal
          onClose={() => setShowDeactivateModal(false)}
        />
      ) : null}
    </>
  );
}
