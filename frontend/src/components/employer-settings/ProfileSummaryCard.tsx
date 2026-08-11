"use client";

import { cn } from "@/utils/cn";
import { Camera, Mail, Pencil, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ProfileSummaryDetail = {
  label: string;
  value: string;
};

type ProfileSummaryCardProps = {
  displayName: string;
  roleLabel: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  avatarInitials: string;
  details: ProfileSummaryDetail[];
  editHref: string;
  canEdit: boolean;
};

export function ProfileSummaryCard({
  displayName,
  roleLabel,
  email,
  phone,
  avatarUrl,
  avatarInitials,
  details,
  editHref,
  canEdit,
}: ProfileSummaryCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(avatarUrl) && !hasImageError;

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
            Account Settings
          </h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">
            Update your account information and email preferences.
          </p>
        </div>
        {canEdit ? (
          <Link
            href={editHref}
            className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-9 sm:px-3 sm:text-sm"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        ) : null}
      </header>

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
          <div className="relative shrink-0">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- backend upload URL
              <img
                src={avatarUrl ?? ""}
                alt=""
                width={72}
                height={72}
                onError={() => setHasImageError(true)}
                className="size-14 rounded-full object-cover ring-2 ring-primary-light sm:size-[4.5rem]"
              />
            ) : (
              <span
                className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-base font-bold text-surface sm:size-[4.5rem] sm:text-lg"
                aria-hidden="true"
              >
                {avatarInitials}
              </span>
            )}
            {canEdit ? (
              <Link
                href={editHref}
                className="absolute -right-0.5 -bottom-0.5 inline-flex size-7 items-center justify-center rounded-full border border-border-subtle bg-surface text-primary shadow-sm transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Update profile photo"
              >
                <Camera className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-foreground sm:text-lg">
                {displayName}
              </h3>
              <span className="inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[0.625rem] font-semibold text-primary sm:text-[0.6875rem]">
                {roleLabel}
              </span>
            </div>
            <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted sm:mt-2 sm:text-sm">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{email || "—"}</span>
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted sm:text-sm">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{phone || "—"}</span>
            </p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-xl bg-hero-bg/80 p-3 sm:grid-cols-2 sm:p-3.5 lg:grid-cols-1 xl:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="min-w-0">
              <dt className="text-[11px] font-medium text-muted sm:text-xs">
                {detail.label}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 truncate text-xs font-semibold text-foreground sm:text-sm",
                )}
              >
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
