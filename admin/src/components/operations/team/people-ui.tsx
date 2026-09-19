import type { LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";

const AVATAR_PALETTES = [
  "bg-[#DBEAFE] text-[#1D4ED8]",
  "bg-[#E6F5F4] text-primary",
  "bg-[#F3E8FF] text-[#7C3AED]",
  "bg-[#FFF1E6] text-[#C2410C]",
  "bg-[#E8F7EE] text-[#15803D]",
  "bg-[#FCE7F3] text-[#DB2777]",
] as const;

const ROLE_BADGE_PALETTES = [
  "bg-[#E8F0FE] text-[#2563EB]",
  "bg-[#F3E8FF] text-[#7C3AED]",
  "bg-[#E6F5F4] text-primary",
  "bg-[#FFF1E6] text-[#C2410C]",
  "bg-[#EEF2FF] text-[#4F46E5]",
  "bg-[#F1F5F9] text-[#475569]",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function getMemberInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function getAvatarPalette(seed: string): string {
  return AVATAR_PALETTES[hashString(seed) % AVATAR_PALETTES.length]!;
}

export function getRoleBadgePalette(roleLabel: string): string {
  if (roleLabel.toLowerCase().includes("super admin")) {
    return "bg-[#F1F5F9] text-[#475569]";
  }
  return ROLE_BADGE_PALETTES[hashString(roleLabel) % ROLE_BADGE_PALETTES.length]!;
}

export function formatPeopleTimestamp(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(
    date,
  );
  const year = new Intl.DateTimeFormat("en-GB", { year: "numeric" }).format(
    date,
  );
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toLowerCase();
  return `${day} ${month} ${year},\n${time}`;
}

export type PeopleKpiVisualKey =
  | "totalMembers"
  | "activeMembers"
  | "inactiveMembers"
  | "totalRoles"
  | "totalDepartments"
  | "pendingInvitations";

export function PeopleKpiCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  cardClassName,
  accentClassName,
  loading,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconClassName: string;
  cardClassName: string;
  accentClassName?: string;
  loading?: boolean;
}) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString("en-IN") : value;

  return (
    <article
      className={cn(
        "ops-brand-border-glow flex min-h-[96px] flex-col justify-between rounded-xl border p-2.5 shadow-sm sm:min-h-[104px] sm:p-3",
        cardClassName,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
            {label}
          </p>
          <p
            className={cn(
              "mt-1.5 text-[22px] font-bold leading-none tracking-tight tabular-nums sm:text-[24px]",
              accentClassName ?? "text-foreground",
            )}
          >
            {loading ? "—" : displayValue}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
