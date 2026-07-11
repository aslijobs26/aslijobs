import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import {
  getLocationIconContainerClass,
  LocationListIcon,
} from "@/components/home/jobs-discovery/location-icons";
import type { JobLocationIconType, JobLocationItem } from "@/types/jobs-discovery";
import { cn } from "@/utils/cn";
import Link from "next/link";
type LocationJobListProps = {
  title: string;
  titleId: string;
  actionLabel: string;
  actionHref: string;
  items: JobLocationItem[];
  iconType: JobLocationIconType;
};

export function LocationJobList({
  title,
  titleId,
  actionLabel,
  actionHref,
  items,
  iconType,
}: LocationJobListProps) {
  return (
    <section aria-labelledby={titleId}>
      <DiscoverySectionHeader
        title={title}
        titleId={titleId}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />

      <ul className="divide-y divide-border-subtle">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-surface p-4 shadow-none transition-all duration-[250ms] ease hover:-translate-y-0.5 hover:border-border hover:text-primary hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  getLocationIconContainerClass(item.id, iconType),
                )}
              >
                <LocationListIcon iconType={iconType} itemId={item.id} />
              </div>
              <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                {item.name}
              </span>
              <span className="shrink-0 text-sm text-muted">{item.jobCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
