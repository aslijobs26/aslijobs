import { HERO_CTA_CARDS } from "@/constants/cta";
import { Users } from "lucide-react";
import { HeroCtaCard } from "./HeroCtaCard";
import { WhatsAppIcon } from "./HeroIcons";

export function HeroCtaRow() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
      {HERO_CTA_CARDS.map((card) => (
        <HeroCtaCard
          key={card.id}
          title={card.title}
          description={card.description}
          actionLabel={card.actionLabel}
          href={card.href}
          variant={card.variant}
          icon={
            card.variant === "whatsapp" ? (
              <WhatsAppIcon fill />
            ) : (
              <Users
                className="size-6 fill-employer-icon sm:size-7"
                strokeWidth={2}
                aria-hidden="true"
              />
            )
          }
        />
      ))}
    </div>
  );
}
