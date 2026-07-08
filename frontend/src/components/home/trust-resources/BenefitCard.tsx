import type { AsliJobsBenefit, BenefitIconKey } from "@/types/trust-resources";
import { cn } from "@/utils/cn";
import { BenefitIcon } from "./benefit-icons";

const benefitIconContainerStyles: Record<BenefitIconKey, string> = {
  whatsapp: "bg-benefit-whatsapp-surface",
  languages: "bg-benefit-languages-surface text-benefit-languages-icon",
  voice: "bg-benefit-voice-surface text-benefit-voice-icon",
  verified: "bg-benefit-verified-surface text-benefit-verified-icon",
  "ai-matching":
    "bg-benefit-ai-matching-surface text-benefit-ai-matching-icon",
  free: "bg-benefit-free-surface text-benefit-free-icon",
};

type BenefitCardProps = {
  benefit: AsliJobsBenefit;
};

export function BenefitCard({ benefit }: BenefitCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col items-center rounded-xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
      <div
        className={cn(
          "mb-3 flex size-11 shrink-0 items-center justify-center rounded-full sm:mb-4 sm:size-12",
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
