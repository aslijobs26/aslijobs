"use client";

import heroPersonImage from "@/assets/image/hero-img.png";
import { HERO_FEATURE_CARDS, HERO_FEATURE_MESSAGES } from "@/constants/hero";
import type { HeroFeatureCardPosition, HeroFeatureId } from "@/types/hero";
import { cn } from "@/utils/cn";
import { Languages, Mic, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HeroFeatureCard } from "./HeroFeatureCard";
import { HeroPhoneMessageBubble } from "./HeroPhoneMessageBubble";
import { WhatsAppIcon } from "./HeroIcons";

const PHONE_MESSAGE_ID = "hero-phone-message";

const iconClassName = "size-5";

const FLOATING_POSITIONS: Record<HeroFeatureCardPosition, string> = {
  "top-left":
    "absolute z-40 left-0 top-2 w-max mobile:left-0 mobile:top-1 mobile:z-40 mobile:max-w-[10.75rem] md:top-0 md:z-20 md:max-w-[48%] lg:z-20 lg:-left-36 lg:top-[1%] lg:w-auto lg:max-w-[200px] xl:-left-40 xl:max-w-[220px]",
  "top-right":
    "absolute z-40 right-0 top-10 w-max mobile:right-0 mobile:top-1 mobile:z-40 mobile:max-w-[10.75rem] md:top-0 md:z-20 md:max-w-[48%] lg:z-20 lg:-right-36 lg:top-[1%] lg:w-auto lg:max-w-[200px] xl:-right-40 xl:max-w-[220px]",
  "bottom-left":
    "absolute z-40 bottom-8 left-0 w-max mobile:bottom-[18%] mobile:left-0 mobile:z-40 mobile:max-w-[10.75rem] md:bottom-1 md:max-w-[48%] lg:bottom-[12%] lg:-left-40 lg:z-20 lg:w-auto lg:max-w-[200px] xl:-left-44 xl:max-w-[220px]",
  "bottom-right":
    "absolute z-40 bottom-2 right-0 w-max mobile:bottom-[12%] mobile:right-0 mobile:z-40 mobile:max-w-[10.75rem] md:bottom-1 md:max-w-[48%] lg:bottom-[12%] lg:-right-40 lg:z-20 lg:w-auto lg:max-w-[200px] xl:-right-44 xl:max-w-[220px]",
};

const CARD_DESKTOP_POSITION_OVERRIDES: Partial<Record<HeroFeatureId, string>> = {
  "voice-search": "lg:top-[18%] xl:top-[20%]",
  "whatsapp-first": "lg:top-[16%] xl:top-[17%]",
  "verified-jobs": "lg:bottom-[14%] xl:bottom-[16%] lg:-left-32 xl:-left-36",
  "in-your-language": "lg:bottom-[22%] xl:bottom-[24%]",
};

const MOBILE_CARD_COMPACT =
  "w-fit max-w-[min(100%,11.5rem)] gap-2 px-2.5 py-2 mobile:w-full mobile:max-w-full mobile:gap-2 mobile:px-3 mobile:py-2.5 mobile:[&>div:first-child]:size-8 [&>div:first-child]:size-8 md:max-w-[calc(100vw-2rem)] md:gap-2 md:px-2 md:py-2 md:[&>div:first-child]:size-9 lg:w-full lg:max-w-none lg:gap-2 lg:px-2.5 lg:py-2";

const DESKTOP_CARD_ICON_SIZES = "lg:[&>div:first-child]:size-14";

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
  const [activeFeature, setActiveFeature] = useState<HeroFeatureId | null>(null);
  // Keep the last feature so its text stays put while the bubble fades out.
  const [displayedFeature, setDisplayedFeature] =
    useState<HeroFeatureId | null>(null);

  useEffect(() => {
    if (activeFeature) {
      setDisplayedFeature(activeFeature);
    }
  }, [activeFeature]);

  const clearFeature = (id: HeroFeatureId) =>
    setActiveFeature((current) => (current === id ? null : current));

  return (
    <div className="relative mt-2 flex w-full min-w-0 flex-col items-center mobile:mt-1.5 md:mt-4 lg:mt-0 lg:items-center lg:justify-start">
      <div
        className={cn(
          "hero-illustration-group relative w-full max-w-[min(100%,318px)] mobile:max-w-[min(100%,340px)] md:max-w-[380px] lg:mx-auto lg:max-w-[580px]",
          "lg:-translate-x-10 xl:-translate-x-8 2xl:-translate-x-6",
        )}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[45%] size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-80 mobile:size-[240px] md:size-[300px] lg:hidden"
          aria-hidden="true"
        />

        <div className="relative mx-auto min-h-[400px] w-full px-0 mobile:min-h-[440px] mobile:px-1 md:min-h-[460px] md:px-0 lg:min-h-0 lg:max-w-[440px] lg:px-0">
          <div
            className="pointer-events-none absolute left-[calc(50%+1rem)] top-[36%] z-0 hidden size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-25 lg:block"
            aria-hidden="true"
          />

          {HERO_FEATURE_CARDS.map((card) => (
            <div
              key={card.id}
              className={cn(
                FLOATING_POSITIONS[card.position],
                CARD_DESKTOP_POSITION_OVERRIDES[card.id],
                "rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
              tabIndex={0}
              aria-describedby={PHONE_MESSAGE_ID}
              onMouseEnter={() => setActiveFeature(card.id)}
              onMouseLeave={() => clearFeature(card.id)}
              onFocus={() => setActiveFeature(card.id)}
              onBlur={() => clearFeature(card.id)}
            >
              <HeroFeatureCard
                title={card.title}
                description={card.description}
                icon={getFeatureIcon(card.id)}
                iconContainerClassName={getIconContainerClassName(card.id)}
                className={cn(
                  FLOAT_ANIMATIONS[card.id],
                  MOBILE_CARD_COMPACT,
                  DESKTOP_CARD_ICON_SIZES,
                  card.id === "whatsapp-first" &&
                    "lg:[&>div:first-child]:size-14",
                )}
              />
            </div>
          ))}

          <Image
            src={heroPersonImage}
            alt="Job seeker browsing jobs on WhatsApp"
            priority
            className="absolute left-1/2 top-[50%] z-30 h-auto w-[68%] max-w-[220px] -translate-x-1/2 -translate-y-1/2 object-contain mobile:top-[50%] mobile:w-[62%] mobile:max-w-[220px] md:top-[48%] md:w-[80%] md:max-w-[300px] lg:relative lg:left-auto lg:top-auto lg:z-10 lg:mx-auto lg:ml-8 lg:w-full lg:max-w-[397px] lg:translate-x-0 lg:translate-y-0 lg:-mt-2"
          />

          <HeroPhoneMessageBubble
            id={PHONE_MESSAGE_ID}
            visible={activeFeature !== null}
            message={
              displayedFeature
                ? HERO_FEATURE_MESSAGES[displayedFeature]
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
