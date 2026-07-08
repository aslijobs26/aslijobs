import type { ReactNode } from "react";

export type HeroCtaCardVariant = "whatsapp" | "employer";

export type HeroCtaCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: ReactNode;
  variant: HeroCtaCardVariant;
};
