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
              className="flex items-center gap-3 py-3 transition-colors hover:text-primary focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:py-3.5"
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
