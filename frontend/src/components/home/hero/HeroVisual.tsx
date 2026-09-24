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

/** Glyph scales with card — largest only at 2xl. */
const iconClassName =
  "size-3 mobile:size-3.5 md:size-3.5 lg:size-4 xl:size-4 2xl:size-5";

/**
 * Floating card anchors.
 * Bottom cards: z-30 in front of the person (z-[1]).
 * xl/2xl use mild offsets so left cards stay in the illustration column
 * (not over the language chips).
 */
const FLOATING_POSITIONS: Record<HeroFeatureCardPosition, string> = {
  "top-left":
    "absolute z-10 -left-2 top-0 w-max max-w-[8.5rem] mobile:-left-3 mobile:top-0 mobile:max-w-[9.25rem] md:-left-4 md:top-0 md:max-w-[10rem] lg:z-20 lg:-left-10 lg:top-[14%] lg:max-w-[11rem] xl:-left-14 xl:top-[16%] xl:max-w-[13rem] 2xl:-left-16 2xl:top-[18%] 2xl:max-w-[14rem]",
  "top-right":
    "absolute z-10 -right-2 top-6 w-max max-w-[8.5rem] mobile:-right-3 mobile:top-0 mobile:max-w-[9.25rem] md:-right-4 md:top-0 md:max-w-[10rem] lg:z-20 lg:-right-10 lg:top-[12%] lg:max-w-[11rem] xl:-right-14 xl:top-[14%] xl:max-w-[13rem] 2xl:-right-16 2xl:top-[16%] 2xl:max-w-[14rem]",
  "bottom-left":
    "absolute z-30 -left-2 bottom-4 w-max max-w-[8.5rem] mobile:-left-3 mobile:bottom-[14%] mobile:max-w-[9.25rem] md:-left-4 md:bottom-1 md:max-w-[10rem] lg:-left-6 lg:bottom-[10%] lg:max-w-[11rem] xl:-left-4 xl:bottom-[12%] xl:max-w-[13rem] 2xl:-left-6 2xl:bottom-[14%] 2xl:max-w-[14rem]",
  "bottom-right":
    "absolute z-30 -right-2 bottom-1 w-max max-w-[8.5rem] mobile:-right-3 mobile:bottom-[8%] mobile:max-w-[9.25rem] md:-right-4 md:bottom-1 md:max-w-[10rem] lg:-right-6 lg:bottom-[18%] lg:max-w-[11rem] xl:-right-4 xl:bottom-[20%] xl:max-w-[13rem] 2xl:-right-6 2xl:bottom-[22%] 2xl:max-w-[14rem]",
};

const CARD_DESKTOP_POSITION_OVERRIDES: Partial<Record<HeroFeatureId, string>> = {
  "voice-search": "lg:top-[16%] xl:top-[17%] 2xl:top-[18%]",
  "whatsapp-first": "lg:top-[14%] xl:top-[15%] 2xl:top-[16%]",
  "verified-jobs": "lg:bottom-[12%] xl:bottom-[13%] 2xl:bottom-[14%]",
  "in-your-language": "lg:bottom-[20%] xl:bottom-[22%] 2xl:bottom-[24%]",
};

/**
 * Card chrome only — icon box + padding scale by breakpoint.
 * Mobile/tablet get comfortable padding; xl+ stays denser until 2xl.
 */
const CARD_SIZE_SCALE =
  "w-max max-w-full gap-1.5 px-2.5 py-2 mobile:gap-2 mobile:px-3 mobile:py-2.5 [&>div:first-child]:size-6 mobile:[&>div:first-child]:size-7 md:gap-2 md:px-3 md:py-2.5 md:[&>div:first-child]:size-7 lg:gap-1.5 lg:px-2 lg:py-1.5 lg:[&>div:first-child]:size-8 xl:gap-2 xl:px-2.5 xl:py-2 xl:[&>div:first-child]:size-10 2xl:gap-2.5 2xl:px-2.5 2xl:py-2 2xl:[&>div:first-child]:size-14";

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

  const topCards = HERO_FEATURE_CARDS.filter(
    (card) => card.position === "top-left" || card.position === "top-right",
  );
  const bottomCards = HERO_FEATURE_CARDS.filter(
    (card) =>
      card.position === "bottom-left" || card.position === "bottom-right",
  );

  const renderFeatureCard = (card: (typeof HERO_FEATURE_CARDS)[number]) => (
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
        className={cn(FLOAT_ANIMATIONS[card.id], CARD_SIZE_SCALE)}
      />
    </div>
  );

  return (
    <div className="relative mt-2 flex w-full min-w-0 flex-col items-center mobile:mt-1.5 md:mt-4 lg:mt-0 lg:items-center lg:justify-start">
      <div
        className={cn(
          "hero-illustration-group relative w-full max-w-[min(100%,318px)] mobile:max-w-[min(100%,340px)] md:max-w-[380px] lg:mx-auto lg:max-w-[100%] lg:min-w-0 xl:max-w-[620px] 2xl:max-w-[680px]",
        )}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[45%] size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-80 mobile:size-[240px] md:size-[300px] lg:hidden"
          aria-hidden="true"
        />

        <div className="relative isolate mx-auto min-h-[340px] w-full min-w-0 overflow-visible px-0 mobile:min-h-[380px] mobile:px-1 md:min-h-[420px] md:px-0 lg:min-h-0 lg:max-w-[460px] xl:max-w-[500px] 2xl:max-w-[540px] lg:px-0">
          <div
            className="pointer-events-none absolute left-1/2 top-[36%] z-0 hidden size-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-25 xl:size-[380px] 2xl:size-[420px] lg:block"
            aria-hidden="true"
          />

          {topCards.map(renderFeatureCard)}

          {/* Person stays behind bottom cards (z-[1] < z-30). */}
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-[50%] z-[1] w-[56%] max-w-[160px] -translate-x-1/2 -translate-y-1/2",
              "mobile:w-[54%] mobile:max-w-[180px] md:top-[48%] md:w-[64%] md:max-w-[230px]",
              "lg:relative lg:left-auto lg:top-auto lg:z-[1] lg:mx-auto lg:mt-[-0.5rem] lg:w-full lg:max-w-[270px] lg:translate-x-0 lg:translate-y-0",
              "xl:max-w-[310px] 2xl:max-w-[350px]",
            )}
          >
            <Image
              src={heroPersonImage}
              alt="Job seeker browsing jobs on WhatsApp"
              priority
              className="h-auto w-full object-contain"
            />
          </div>

          {/* Bottom cards after person in DOM + z-30 → clearly in front on xl. */}
          {bottomCards.map(renderFeatureCard)}

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
