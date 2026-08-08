import { HeroEmployerPostJobLink } from "@/components/home/hero/HeroEmployerPostJobLink";
import type { HeroCtaCardProps } from "@/types/cta";
import { cn } from "@/utils/cn";
import Link from "next/link";

const cardVariants = {
  whatsapp: "bg-whatsapp-cta-surface",
  employer: "bg-employer-cta-surface",
  assist: "bg-assist-cta-surface",
} as const;

const buttonVariants = {
  whatsapp:
    "bg-whatsapp-dark text-surface hover:bg-whatsapp-darker hover:text-surface focus-visible:ring-whatsapp-dark/40",
  employer:
    "bg-employer-button text-surface hover:bg-employer-button-hover focus-visible:ring-employer-button/40",
  assist:
    "bg-assist-button text-surface hover:bg-assist-button-hover focus-visible:ring-assist-button/40",
} as const;

const iconSurfaceVariants = {
  whatsapp: "relative overflow-hidden rounded-full bg-whatsapp-icon-surface",
  employer: "bg-employer-icon-surface text-employer-icon [&_svg]:fill-employer-icon",
  assist: "bg-assist-icon-surface text-assist-icon",
} as const;

const actionClassName = (variant: HeroCtaCardProps["variant"]) =>
  cn(
    "inline-flex h-11 min-h-11 w-full shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 mobile:min-h-11 sm:w-auto",
    buttonVariants[variant],
  );

export function HeroCtaCard({
  title,
  description,
  actionLabel,
  href,
  icon,
  variant,
}: HeroCtaCardProps) {
  const isExternal = href.startsWith("http");
  const className = actionClassName(variant);

  const action =
    variant === "employer" ? (
      <HeroEmployerPostJobLink className={className}>
        {actionLabel}
      </HeroEmployerPostJobLink>
    ) : (
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={className}
      >
        {actionLabel}
      </Link>
    );

  return (
    <article
      className={cn(
        "flex h-full gap-3.5 rounded-2xl border border-border-subtle p-4 mobile:gap-3.5 mobile:p-4 sm:gap-4 sm:p-5",
        cardVariants[variant],
      )}
    >
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14 xl:size-16",
          iconSurfaceVariants[variant],
        )}
      >
        {icon}
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-0.5">
        <h3 className="text-base font-bold leading-snug text-foreground mobile:text-[0.9375rem] sm:text-lg">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-snug text-muted sm:text-[15px]">
          {description}
        </p>
        <div className="mt-auto pt-3 sm:pt-4">{action}</div>
      </div>
    </article>
  );
}
