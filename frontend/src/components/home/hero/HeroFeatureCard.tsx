import { cn } from "@/utils/cn";
import type { HeroFeatureCardProps } from "@/types/hero";

export function HeroFeatureCard({
  title,
  description,
  icon,
  className,
  iconContainerClassName,
}: HeroFeatureCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 shadow-sm sm:gap-3.5 sm:px-4 sm:py-3",
        className,
      )}
    >
      <div
        className={cn(
          "size-10 shrink-0 sm:size-11",
          iconContainerClassName ??
            "flex items-center justify-center rounded-full bg-primary-soft text-white",
        )}
      >
        {icon}
      </div>
      <div className="shrink-0">
        <p className="whitespace-nowrap text-sm font-bold leading-tight text-foreground sm:text-base">
          {title}
        </p>
        <p className="whitespace-nowrap text-xs leading-snug text-muted sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
