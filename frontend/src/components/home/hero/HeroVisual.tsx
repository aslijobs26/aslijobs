"use client";

import heroPersonImage from "@/assets/hero-img.png";
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
    "absolute z-20 left-0 top-2 w-max sm:top-0 lg:-left-36 lg:top-[1%] lg:w-auto lg:max-w-[200px] xl:-left-40 xl:max-w-[220px]",
  "top-right":
    "absolute z-20 right-0 top-2 w-max sm:top-0 lg:-right-36 lg:top-[1%] lg:w-auto lg:max-w-[200px] xl:-right-40 xl:max-w-[220px]",
  "bottom-left":
    "absolute z-40 bottom-2 left-0 w-max sm:bottom-1 lg:bottom-[12%] lg:-left-40 lg:z-20 lg:w-auto lg:max-w-[200px] xl:-left-44 xl:max-w-[220px]",
  "bottom-right":
    "absolute z-40 bottom-2 right-0 w-max sm:bottom-1 lg:bottom-[12%] lg:-right-40 lg:z-20 lg:w-auto lg:max-w-[200px] xl:-right-44 xl:max-w-[220px]",
};

const CARD_DESKTOP_POSITION_OVERRIDES: Partial<Record<HeroFeatureId, string>> = {
  "voice-search": "lg:top-[18%] xl:top-[20%]",
  "whatsapp-first": "lg:top-[16%] xl:top-[17%]",
  "verified-jobs": "lg:bottom-[22%] xl:bottom-[24%]",
  "in-your-language": "lg:bottom-[22%] xl:bottom-[24%]",
};

const MOBILE_CARD_COMPACT =
  "w-fit max-w-[calc(100vw-2rem)] gap-1.5 px-2 py-1.5 [&>div:first-child]:size-8 sm:gap-2 sm:px-2 sm:py-2 sm:[&>div:first-child]:size-9 lg:w-full lg:max-w-none lg:gap-2 lg:px-2.5 lg:py-2";

const DESKTOP_CARD_ICON_SIZES = "lg:[&>div:first-child]:size-14";

const WHATSAPP_MOBILE_ICON_SIZES =
  "[&>div:first-child]:size-11 sm:[&>div:first-child]:size-12";

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
    <div className="relative mt-4 flex flex-col items-center lg:mt-0 lg:items-end lg:justify-start">
      <div
        className="pointer-events-none absolute left-1/2 top-[45%] size-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-80 sm:size-[300px] lg:hidden"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[580px] lg:pl-8">
        <div className="relative mx-auto min-h-[430px] w-full px-1 sm:min-h-[460px] sm:px-0 lg:min-h-0 lg:ml-auto lg:mr-0 lg:max-w-[440px] lg:px-0">
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
                  card.id === "whatsapp-first" && WHATSAPP_MOBILE_ICON_SIZES,
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
