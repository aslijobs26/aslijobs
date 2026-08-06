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
          "inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </>
  );

  const className = cn(
    "group flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface p-3.5 text-left shadow-sm transition-[box-shadow,border-color,transform] duration-200",
    "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
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
