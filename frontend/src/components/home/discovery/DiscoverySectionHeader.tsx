import { cn } from "@/utils/cn";
import Link from "next/link";
import type { ReactNode } from "react";

type DiscoverySectionHeaderProps = {
  title: ReactNode;
  titleId: string;
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
        "discovery-section-header mb-4 flex flex-col items-start gap-1.5 md:mb-5 md:flex-row md:items-baseline md:justify-between md:gap-4",
        className,
      )}
    >
      <h2
        id={titleId}
        className={cn(
          "discovery-section-title min-w-0 w-full text-pretty break-words text-lg font-bold leading-snug text-foreground md:text-xl",
          titleClassName,
        )}
      >
        {title}
      </h2>
      <Link
        href={actionHref}
        className="discovery-section-action max-w-full text-sm font-semibold leading-snug text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:shrink-0"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
