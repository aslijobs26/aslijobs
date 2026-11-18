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
        "flex items-center rounded-md border border-border-subtle bg-surface shadow-sm md:rounded-xl",
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0",
          iconContainerClassName ??
            "flex items-center justify-center rounded-full bg-primary-soft text-white",
        )}
      >
        {icon}
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 pr-0.5 mobile:gap-0">
        <p className="whitespace-nowrap text-[10px] font-bold leading-tight text-foreground mobile:text-[8px] md:text-[11px] lg:text-xs">
          {title}
        </p>
        <p className="whitespace-nowrap text-[9px] leading-snug text-muted mobile:text-[7px] md:text-[10px] lg:text-[11px]">
          {description}
        </p>
      </div>
    </div>
  );
}
