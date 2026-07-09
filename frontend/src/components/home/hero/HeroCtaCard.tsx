import type { HeroCtaCardProps } from "@/types/cta";
import { cn } from "@/utils/cn";
import Link from "next/link";

const cardVariants = {
  whatsapp: "bg-whatsapp-cta-surface",
  employer: "bg-employer-cta-surface",
} as const;

const buttonVariants = {
  whatsapp:
    "bg-whatsapp-dark text-surface hover:bg-whatsapp-darker hover:text-surface focus-visible:ring-whatsapp-dark/40",
  employer:
    "bg-employer-button text-surface hover:bg-employer-button-hover focus-visible:ring-employer-button/40",
} as const;

export function HeroCtaCard({
  title,
  description,
  actionLabel,
  href,
  icon,
  variant,
}: HeroCtaCardProps) {
  const isExternal = href.startsWith("http");

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border-subtle p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-5",
        cardVariants[variant],
      )}
    >
      <div className="flex items-center gap-4 lg:min-w-0 lg:flex-1">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14",
            variant === "whatsapp"
              ? "relative overflow-hidden rounded-full bg-whatsapp-icon-surface"
              : "bg-employer-icon-surface text-employer-icon [&_svg]:fill-employer-icon",
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground sm:text-lg">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted sm:text-[15px]">{description}</p>
        </div>
      </div>

      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={cn(
          "inline-flex h-11 w-full shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 sm:w-auto lg:ml-auto",
          buttonVariants[variant],
        )}
      >
        {actionLabel}
      </Link>
    </article>
  );
}
