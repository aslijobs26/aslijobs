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
        "flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-2 py-2 shadow-sm md:gap-2 md:px-2.5 md:py-2",
        className,
      )}
    >
      <div
        className={cn(
          "size-10 shrink-0 md:size-11",
          iconContainerClassName ??
            "flex items-center justify-center rounded-full bg-primary-soft text-white",
        )}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-px">
        <p className="truncate text-[10px] font-bold leading-tight text-foreground mobile:text-[11px] md:whitespace-nowrap md:text-sm lg:text-sm xl:text-base">
          {title}
        </p>
        <p className="truncate text-[10px] leading-snug text-muted mobile:text-[11px] md:whitespace-nowrap md:text-xs lg:text-xs xl:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
