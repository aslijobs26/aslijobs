import type { AsliJobsBenefit, BenefitIconKey } from "@/types/trust-resources";
import { cn } from "@/utils/cn";
import { BenefitIcon } from "./benefit-icons";

const benefitCardHoverBorder: Record<BenefitIconKey, string> = {
  whatsapp: "hover:border-benefit-whatsapp-icon",
  languages: "hover:border-benefit-languages-icon",
  voice: "hover:border-benefit-voice-icon",
  verified: "hover:border-benefit-verified-icon",
  "ai-matching": "hover:border-benefit-ai-matching-icon",
  free: "hover:border-benefit-free-icon",
};

const benefitIconContainerStyles: Record<BenefitIconKey, string> = {
  whatsapp:
    "bg-benefit-whatsapp-surface [&_i]:text-whatsapp group-hover:bg-benefit-whatsapp-icon group-hover:[&_i]:text-whatsapp-icon-surface",
  languages:
    "bg-benefit-languages-surface text-benefit-languages-icon group-hover:bg-benefit-languages-icon group-hover:text-surface",
  voice:
    "bg-benefit-voice-surface text-benefit-voice-icon group-hover:bg-benefit-voice-icon group-hover:text-surface",
  verified:
    "bg-benefit-verified-surface text-benefit-verified-icon group-hover:bg-benefit-verified-icon group-hover:text-surface",
  "ai-matching":
    "bg-benefit-ai-matching-surface text-benefit-ai-matching-icon group-hover:bg-benefit-ai-matching-icon group-hover:text-surface",
  free: "bg-benefit-free-surface text-benefit-free-icon group-hover:bg-benefit-free-icon group-hover:text-surface",
};

type BenefitCardProps = {
  benefit: AsliJobsBenefit;
};

export function BenefitCard({ benefit }: BenefitCardProps) {
  return (
    <article
      className={cn(
        "group box-border flex h-full min-w-0 flex-col items-center rounded-xl border border-border-subtle bg-surface p-4 shadow-sm transition-[box-shadow,border-color] duration-300 ease-out hover:shadow-md motion-reduce:transition-none sm:p-5",
        benefitCardHoverBorder[benefit.icon],
      )}
    >
      <div
        className={cn(
          "mb-3 flex size-11 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-300 ease-out [&_i]:transition-colors [&_svg]:transition-colors group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:mb-4 sm:size-12",
          benefitIconContainerStyles[benefit.icon],
        )}
      >
        <BenefitIcon icon={benefit.icon} />
      </div>

      <h3 className="whitespace-pre-line text-center text-sm font-bold leading-tight text-foreground sm:text-base">
        {benefit.title}
      </h3>

      <p className="mt-2 whitespace-pre-line text-center text-xs leading-relaxed text-muted sm:text-sm">
        {benefit.description}
      </p>
    </article>
  );
}
