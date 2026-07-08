import type { CategoryIconVariant } from "@/types/discovery";
import type { JobSeekerResource } from "@/types/trust-resources";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { ResourceIcon } from "./resource-icons";

const surfaceVariantStyles = {
  guide: "bg-resource-guide-surface",
  resume: "bg-resource-resume-surface",
  interview: "bg-resource-interview-surface",
  salary: "bg-resource-salary-surface",
  career: "bg-resource-career-surface",
} as const;

const iconVariantStyles: Record<CategoryIconVariant, string> = {
  primary: "bg-primary-light text-primary",
  glow: "bg-hero-glow text-primary",
  surface: "border border-border-subtle bg-surface text-muted",
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
          iconVariantStyles[resource.iconVariant],
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
