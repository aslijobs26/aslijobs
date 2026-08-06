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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Account Settings
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Update your account information and email preferences.
          </p>
        </div>
        {canEdit ? (
          <Link
            href={editHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        ) : null}
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="relative shrink-0">
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- backend upload URL
              <img
                src={avatarUrl ?? ""}
                alt=""
                width={72}
                height={72}
                onError={() => setHasImageError(true)}
                className="size-[4.5rem] rounded-full object-cover ring-2 ring-primary-light"
              />
            ) : (
              <span
                className="inline-flex size-[4.5rem] items-center justify-center rounded-full bg-primary text-lg font-bold text-surface"
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
              <h3 className="truncate text-lg font-bold text-foreground">
                {displayName}
              </h3>
              <span className="inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[0.6875rem] font-semibold text-primary">
                {roleLabel}
              </span>
            </div>
            <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-muted">
              <Mail className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{email || "—"}</span>
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted">
              <Phone className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{phone || "—"}</span>
            </p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-xl bg-hero-bg/80 p-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="min-w-0">
              <dt className="text-xs font-medium text-muted">{detail.label}</dt>
              <dd
                className={cn(
                  "mt-0.5 truncate text-sm font-semibold text-foreground",
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
