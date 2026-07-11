import type { JobCategory } from "@/types/discovery";
import { cn } from "@/utils/cn";
import Link from "next/link";
import { CategoryIcon } from "./category-icons";

const iconVariantStyles = {
  primary: "bg-primary-light text-primary",
  glow: "bg-hero-glow text-primary",
  surface: "border border-border-subtle bg-surface text-muted",
} as const;

function getCategoryIconContainerStyles(category: JobCategory) {
  if (category.icon === "construction") {
    return "border border-border-subtle bg-category-construction-surface text-benefit-voice-icon";
  }

  if (category.icon === "manufacturing") {
    return "border border-border-subtle bg-benefit-verified-surface text-benefit-verified-icon";
  }

  if (category.icon === "view-all") {
    return "bg-employer-cta text-employer-icon";
  }

  return iconVariantStyles[category.iconVariant];
}

type CategoryCardProps = {
  category: JobCategory;
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={category.href}
      className="group flex min-w-0 flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm transition-[border-color,box-shadow,transform] hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] sm:gap-2.5 sm:p-4"
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg sm:size-11",
          getCategoryIconContainerStyles(category),
        )}
      >
        <CategoryIcon icon={category.icon} />
      </div>

      <span className="text-center text-sm font-bold leading-tight text-foreground">
        {category.name}
      </span>

      {category.jobCount ? (
        <span className="text-center text-xs text-muted sm:text-sm">
          {category.jobCount}
        </span>
      ) : null}

      {category.subtitle ? (
        <span className="text-center text-xs text-muted sm:text-sm">
          {category.subtitle}
        </span>
      ) : null}
    </Link>
  );
}
