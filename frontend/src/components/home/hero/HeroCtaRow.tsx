"use client";

import { HERO_CTA_KEYS } from "@/components/home/home-i18n";
import { HERO_CTA_CARDS } from "@/constants/cta";
import { buildWhatsAppWelcomeUrl } from "@/constants/whatsapp-welcome-messages";
import { useSiteLanguage } from "@/i18n/site-language";
import { useTranslate } from "@/i18n/translate";
import { Headset, Users } from "lucide-react";
import { HeroCtaCard } from "./HeroCtaCard";
import { WhatsAppIcon } from "./HeroIcons";

function heroCtaIcon(variant: (typeof HERO_CTA_CARDS)[number]["variant"]) {
  if (variant === "whatsapp") {
    return <WhatsAppIcon fill />;
  }

  if (variant === "assist") {
    return (
      <Headset
        className="size-6 text-assist-icon sm:size-7 xl:size-8"
        strokeWidth={2}
        aria-hidden="true"
      />
    );
  }

  return (
    <Users
      className="size-6 fill-employer-icon sm:size-7 xl:size-8"
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

export function HeroCtaRow() {
  const t = useTranslate();
  const siteLanguage = useSiteLanguage();

  return (
    <div className="grid grid-cols-1 items-stretch gap-2.5 mobile:gap-2.5 sm:gap-4 lg:grid-cols-3">
      {HERO_CTA_CARDS.map((card) => {
        const keys = HERO_CTA_KEYS[card.variant];
        const href =
          card.variant === "whatsapp"
            ? buildWhatsAppWelcomeUrl("seeker", siteLanguage.code)
            : card.href;
        return (
          <HeroCtaCard
            key={card.id}
            title={t(keys.title)}
            description={t(keys.description)}
            actionLabel={t(keys.action)}
            href={href}
            variant={card.variant}
            icon={heroCtaIcon(card.variant)}
          />
        );
      })}
    </div>
  );
}
