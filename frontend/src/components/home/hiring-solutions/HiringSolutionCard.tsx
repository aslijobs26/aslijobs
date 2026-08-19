import { HeroEmployerPostJobLink } from "@/components/home/hero/HeroEmployerPostJobLink";
import type { HiringSolution, HiringSolutionVariant } from "@/types/hiring-solutions";
import { cn } from "@/utils/cn";
import {
  Building2,
  Check,
  Network,
  UserRound,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const themeStyles: Record<
  HiringSolutionVariant,
  {
    cardHover: string;
    iconSurface: string;
    checkColor: string;
    button: string;
  }
> = {
  "free-job-post": {
    cardHover: "hover:border-resource-guide-icon",
    iconSurface:
      "bg-resource-guide-icon-surface text-resource-guide-icon group-hover:bg-resource-guide-icon group-hover:text-surface",
    checkColor: "text-resource-guide-icon",
    button:
      "border-resource-guide-icon text-resource-guide-icon hover:bg-resource-guide-surface group-hover:bg-resource-guide-surface focus-visible:ring-resource-guide-icon/40",
  },
  "job-boosters": {
    cardHover: "hover:border-benefit-free-icon",
    iconSurface:
      "bg-benefit-free-surface text-benefit-free-icon group-hover:bg-benefit-free-icon group-hover:text-surface",
    checkColor: "text-resource-guide-icon",
    button:
      "border-primary-soft text-primary-soft hover:bg-primary-light group-hover:bg-primary-light focus-visible:ring-primary-soft/40",
  },
  "hire-assist": {
    cardHover: "hover:border-resource-resume-icon",
    iconSurface:
      "bg-resource-resume-icon-surface text-resource-resume-icon group-hover:bg-resource-resume-icon group-hover:text-surface",
    checkColor: "text-benefit-verified-icon",
    button:
      "border-resource-resume-icon text-resource-resume-icon hover:bg-resource-resume-surface group-hover:bg-resource-resume-surface focus-visible:ring-resource-resume-icon/40",
  },
  "business-hiring": {
    cardHover: "hover:border-benefit-voice-icon",
    iconSurface:
      "bg-benefit-voice-surface text-benefit-voice-icon group-hover:bg-benefit-voice-icon group-hover:text-surface",
    checkColor: "text-benefit-voice-icon",
    button:
      "border-benefit-voice-icon text-benefit-voice-icon hover:bg-benefit-voice-surface group-hover:bg-benefit-voice-surface focus-visible:ring-benefit-voice-icon/40",
  },
};

function SolutionIcon({
  variant,
}: {
  variant: HiringSolutionVariant;
}): ReactNode {
  const className = "size-5";

  switch (variant) {
    case "free-job-post":
      return <Network className={className} strokeWidth={2} aria-hidden="true" />;
    case "job-boosters":
      return <Zap className={className} strokeWidth={2} aria-hidden="true" />;
    case "hire-assist":
      return <UserRound className={className} strokeWidth={2} aria-hidden="true" />;
    case "business-hiring":
      return <Building2 className={className} strokeWidth={2} aria-hidden="true" />;
  }
}

type HiringSolutionCardProps = {
  solution: HiringSolution;
};

export function HiringSolutionCard({ solution }: HiringSolutionCardProps) {
  const theme = themeStyles[solution.id];
  const actionClassName = cn(
    "inline-flex h-11 min-h-11 w-full items-center justify-center rounded-xl border-2 bg-surface px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
    theme.button,
  );

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-[box-shadow,border-color] duration-300 ease-out hover:shadow-md motion-reduce:transition-none sm:p-6",
        theme.cardHover,
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-11 items-center justify-center rounded-xl transition-[transform,background-color,color] duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          theme.iconSurface,
        )}
      >
        <SolutionIcon variant={solution.id} />
      </div>

      <h3 className="text-base font-bold tracking-wide text-foreground">
        {solution.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{solution.subtitle}</p>

      <ul className="mt-5 mb-6 flex flex-1 flex-col gap-2.5">
        {solution.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
            <Check
              className={cn("mt-0.5 size-4 shrink-0", theme.checkColor)}
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {solution.id === "free-job-post" ? (
        <HeroEmployerPostJobLink className={actionClassName}>
          {solution.actionLabel}
        </HeroEmployerPostJobLink>
      ) : (
        <Link href={solution.href} className={actionClassName}>
          {solution.actionLabel}
        </Link>
      )}
    </article>
  );
}
