import { cn } from "@/utils/cn";
import Link from "next/link";
import type { ReactNode } from "react";

type DiscoverySectionHeaderProps = {
  title: ReactNode;  titleId: string;
  actionLabel: string;
  actionHref: string;
  className?: string;
  titleClassName?: string;
};

export function DiscoverySectionHeader({
  title,
  titleId,
  actionLabel,
  actionHref,
  className,
  titleClassName,
}: DiscoverySectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between gap-4 sm:mb-5",
        className,
      )}
    >
      <h2
        id={titleId}
        className={cn(
          "text-lg font-bold text-foreground sm:text-xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      <Link
        href={actionHref}
        className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
