import { DiscoverySectionHeader } from "@/components/home/discovery/DiscoverySectionHeader";
import type { JobLocationIconType, JobLocationItem } from "@/types/jobs-discovery";
import { Building2, Map } from "lucide-react";
import Link from "next/link";

type LocationJobListProps = {
  title: string;
  titleId: string;
  actionLabel: string;
  actionHref: string;
  items: JobLocationItem[];
  iconType: JobLocationIconType;
};

function LocationIcon({ iconType }: { iconType: JobLocationIconType }) {
  const className = "size-4";

  if (iconType === "city") {
    return (
      <Building2 className={className} strokeWidth={2} aria-hidden="true" />
    );
  }

  return <Map className={className} strokeWidth={2} aria-hidden="true" />;
}

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
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-hero-glow text-muted">
                <LocationIcon iconType={iconType} />
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
