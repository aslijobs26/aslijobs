import { WhatsAppIcon } from "@/components/home/hero/HeroIcons";
import type { BenefitIconKey } from "@/types/trust-resources";
import {
  Brain,
  IndianRupee,
  Languages,
  Mic,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

const iconClassName = "size-5";

const iconMap: Record<BenefitIconKey, ReactNode> = {
  whatsapp: <WhatsAppIcon className="text-xl" />,
  languages: (
    <Languages className={iconClassName} strokeWidth={2} aria-hidden="true" />
  ),
  voice: <Mic className={iconClassName} strokeWidth={2} aria-hidden="true" />,
  verified: (
    <ShieldCheck className={iconClassName} strokeWidth={2} aria-hidden="true" />
  ),
  "ai-matching": (
    <Brain className={iconClassName} strokeWidth={2} aria-hidden="true" />
  ),
  free: (
    <IndianRupee
      className={iconClassName}
      strokeWidth={2}
      aria-hidden="true"
    />
  ),
};

export function BenefitIcon({ icon }: { icon: BenefitIconKey }) {
  return iconMap[icon];
}
