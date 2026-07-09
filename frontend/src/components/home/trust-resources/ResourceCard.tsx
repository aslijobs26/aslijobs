import type { JobSeekerResource, ResourceSurfaceVariant } from "@/types/trust-resources";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { ResourceIcon } from "./resource-icons";

const surfaceVariantStyles: Record<ResourceSurfaceVariant, string> = {
  guide: "bg-resource-guide-surface",
  resume: "bg-resource-resume-surface",
  interview: "bg-resource-interview-surface",
  salary: "bg-resource-salary-surface",
  career: "bg-resource-career-surface",
};

const resourceIconContainerStyles: Record<ResourceSurfaceVariant, string> = {
  guide: "bg-resource-guide-icon-surface text-resource-guide-icon",
  resume: "bg-resource-resume-icon-surface text-resource-resume-icon",
  interview: "bg-resource-interview-icon-surface text-resource-interview-icon",
  salary: "bg-resource-salary-icon-surface text-resource-salary-icon",
  career: "bg-resource-career-icon-surface text-resource-career-icon",
};

type ResourceCardProps = {
  resource: JobSeekerResource;
};

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Link
      href={resource.href}
      className={cn(
        "group flex h-full min-w-0 flex-col rounded-xl border border-border-subtle p-4 transition-[box-shadow,transform] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.99] sm:p-5",
        surfaceVariantStyles[resource.surfaceVariant],
      )}
    >
      <div
        className={cn(
          "mb-3 flex size-10 items-center justify-center rounded-lg sm:mb-4",
          resourceIconContainerStyles[resource.surfaceVariant],
        )}
      >
        <ResourceIcon icon={resource.icon} />
      </div>

      <h3 className="text-sm font-bold text-foreground sm:text-base">
        {resource.title}
      </h3>

      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted sm:text-sm">
        {resource.description}
      </p>
    </Link>
  );
}
