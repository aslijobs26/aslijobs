import heroPersonImage from "@/assets/hero-img.png";
import { HERO_FEATURE_CARDS } from "@/constants/hero";
import type { HeroFeatureCardPosition } from "@/types/hero";
import { cn } from "@/utils/cn";
import { Languages, Mic, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { HeroFeatureCard } from "./HeroFeatureCard";
import { WhatsAppIcon } from "./HeroIcons";

const iconClassName = "size-5";

const FLOATING_POSITIONS: Record<HeroFeatureCardPosition, string> = {
  "top-left":
    "absolute z-20 left-0 top-2 w-max sm:top-0 lg:-left-28 lg:top-[10%] lg:w-auto lg:max-w-[200px] xl:-left-36 xl:max-w-[220px]",
  "top-right":
    "absolute z-20 right-0 top-2 w-max sm:top-0 lg:-right-10 lg:top-[8%] lg:w-auto lg:max-w-[200px] xl:-right-14 xl:max-w-[220px]",
  "bottom-left":
    "absolute z-40 bottom-3 left-0 w-max sm:bottom-2 lg:bottom-[20%] lg:-left-24 lg:z-20 lg:w-auto lg:max-w-[200px] xl:-left-32 xl:max-w-[220px]",
  "bottom-right":
    "absolute z-40 bottom-3 right-0 w-max sm:bottom-2 lg:bottom-[16%] lg:-right-24 lg:z-20 lg:w-auto lg:max-w-[200px] xl:-right-32 xl:max-w-[220px]",
};

const MOBILE_CARD_COMPACT =
  "w-fit max-w-[calc(100vw-2rem)] gap-2 px-2 py-2 [&>div:first-child]:size-8 [&_p:first-child]:text-[11px] [&_p:last-child]:text-[11px] sm:gap-2.5 sm:px-2.5 sm:py-2.5 sm:[&>div:first-child]:size-9 sm:[&_p:first-child]:text-sm sm:[&_p:last-child]:text-xs lg:w-full lg:max-w-none lg:gap-3 lg:px-4 lg:py-3 lg:[&>div:first-child]:size-10 lg:[&_p:first-child]:text-base lg:[&_p:last-child]:text-sm";

const WHATSAPP_ICON_SIZES =
  "[&>div:first-child]:size-11 sm:[&>div:first-child]:size-12 lg:[&>div:first-child]:size-14";

const FLOAT_ANIMATIONS: Record<string, string> = {
  "voice-search": "animate-hero-float-voice",
  "whatsapp-first": "animate-hero-float-whatsapp",
  "verified-jobs": "animate-hero-float-verified",
  "in-your-language": "animate-hero-float-language",
};

function getFeatureIcon(id: string) {
  switch (id) {
    case "voice-search":
      return <Mic className={iconClassName} strokeWidth={2} aria-hidden="true" />;
    case "whatsapp-first":
      return <WhatsAppIcon fill />;
    case "verified-jobs":
      return (
        <ShieldCheck className={iconClassName} strokeWidth={2} aria-hidden="true" />
      );
    case "in-your-language":
      return (
        <Languages className={iconClassName} strokeWidth={2} aria-hidden="true" />
      );
    default:
      return <Mic className={iconClassName} strokeWidth={2} aria-hidden="true" />;
  }
}

function getIconContainerClassName(id: string) {
  if (id === "whatsapp-first") {
    return "relative overflow-hidden rounded-full";
  }

  return undefined;
}

export function HeroVisual() {
  return (
    <div className="relative mt-4 flex flex-col items-center lg:mt-0 lg:items-end lg:justify-start">
      <div
        className="pointer-events-none absolute left-1/2 top-[45%] size-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-80 sm:size-[300px] lg:left-[calc(50%+3rem)] lg:top-[38%] lg:size-[400px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[580px] lg:pl-8">
        <div className="relative mx-auto min-h-[430px] w-full px-1 sm:min-h-[460px] sm:px-0 lg:min-h-0 lg:ml-auto lg:mr-0 lg:max-w-[440px] lg:px-0">
          {HERO_FEATURE_CARDS.map((card) => (
            <div key={card.id} className={FLOATING_POSITIONS[card.position]}>
              <HeroFeatureCard
                title={card.title}
                description={card.description}
                icon={getFeatureIcon(card.id)}
                iconContainerClassName={getIconContainerClassName(card.id)}
                className={cn(
                  FLOAT_ANIMATIONS[card.id],
                  MOBILE_CARD_COMPACT,
                  card.id === "whatsapp-first" && WHATSAPP_ICON_SIZES,
                )}
              />
            </div>
          ))}

          <Image
            src={heroPersonImage}
            alt="Job seeker browsing jobs on WhatsApp"
            priority
            className="absolute left-1/2 top-[46%] z-30 h-auto w-[74%] max-w-[260px] -translate-x-1/2 -translate-y-1/2 object-contain sm:top-[48%] sm:w-[80%] sm:max-w-[300px] lg:relative lg:left-auto lg:top-auto lg:z-10 lg:mx-auto lg:ml-8 lg:w-full lg:max-w-[397px] lg:translate-x-0 lg:translate-y-0 lg:-mt-2"
          />
        </div>
      </div>
    </div>
  );
}
