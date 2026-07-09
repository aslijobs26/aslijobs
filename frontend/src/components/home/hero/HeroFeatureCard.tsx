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
        "flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-2 py-2 shadow-sm sm:gap-2 sm:px-2.5 sm:py-2",
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
      <div className="flex min-w-0 flex-col gap-px">
        <p className="whitespace-nowrap text-[11px] font-bold leading-tight text-foreground sm:text-sm lg:text-sm xl:text-base">
          {title}
        </p>
        <p className="whitespace-nowrap text-[11px] leading-snug text-muted sm:text-xs lg:text-xs xl:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
