"use client";

import { cn } from "@/utils/cn";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

type SettingCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  iconClassName?: string;
};

export function SettingCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  iconClassName,
}: SettingCardProps) {
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary sm:size-10",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <Icon className="size-4 sm:size-5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-foreground sm:text-sm">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted sm:text-xs">
          {description}
        </span>
      </span>
      <ChevronRight
        className="size-3.5 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary sm:size-4"
        aria-hidden="true"
      />
    </>
  );

  const className = cn(
    "group flex w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-surface p-3 text-left shadow-sm transition-[box-shadow,border-color] duration-200 sm:gap-3 sm:p-3.5",
    "hover:border-primary/25 hover:shadow-md",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
