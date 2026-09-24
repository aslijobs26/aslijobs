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
        "flex items-center rounded-xl border border-border-subtle bg-surface shadow-sm",
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
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <p className="whitespace-nowrap text-[10px] font-bold leading-tight text-foreground mobile:text-[11px] md:text-xs lg:text-xs xl:text-sm 2xl:text-base">
          {title}
        </p>
        <p className="whitespace-nowrap text-[9px] leading-snug text-muted mobile:text-[10px] md:text-[11px] lg:text-[11px] xl:text-xs 2xl:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
