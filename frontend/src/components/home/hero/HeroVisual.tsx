"use client";

import heroDeliveryImage from "@/assets/image/hero-delivery.png";
import heroElectricianImage from "@/assets/image/hero-electrician.png";
import heroHiringTeamImage from "@/assets/image/hero-hiring-team.png";
import heroSecurityImage from "@/assets/image/hero-security.png";
import {
  HERO_FEATURE_KEYS,
  HERO_HIRING_TEAM_FEATURE_KEYS,
} from "@/components/home/home-i18n";
import { HERO_FEATURE_CARDS } from "@/constants/hero";
import { useTranslate } from "@/i18n/translate";
import type { HeroFeatureCardPosition, HeroFeatureId } from "@/types/hero";
import { cn } from "@/utils/cn";
import { Bot, Languages, Mic, ShieldCheck, Users } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { HeroFeatureCard } from "./HeroFeatureCard";
import { WhatsAppIcon } from "./HeroIcons";

/** Order matches the hero reference: electrician, security, delivery, hiring team. */
const HERO_PERSONS: readonly StaticImageData[] = [
  heroElectricianImage,
  heroSecurityImage,
  heroDeliveryImage,
  heroHiringTeamImage,
];

const PERSON_ROTATE_MS = 4800;
const HIRING_TEAM_INDEX = HERO_PERSONS.length - 1;

/** Glyph scales with card — largest only at 2xl. */
const iconClassName =
  "size-3 mobile:size-2.5 md:size-3.5 lg:size-4 xl:size-4 2xl:size-5";

/**
 * Cards are anchored to the illustration stage, not the viewport.
 * Top-left / top-right sit beside the head. Lower cards sit beside the torso.
 * They stay put while the person crossfades.
 */
const FLOATING_POSITIONS: Record<HeroFeatureCardPosition, string> = {
  "top-left":
    "absolute z-20 left-0 top-[22%] w-max mobile:top-[30%] md:top-[28%] lg:left-0 lg:top-[30%] xl:top-[28%]",
  "top-right":
    "absolute z-20 right-0 top-0 w-max mobile:top-[6%] md:top-[2%] lg:right-0 lg:top-[2%] xl:top-0",
  "bottom-left":
    "absolute z-20 left-0 top-[68%] w-max mobile:top-[62%] md:top-[64%] lg:left-0 lg:top-[72%] xl:top-[74%]",
  "bottom-right":
    "absolute z-20 right-0 top-[72%] w-max mobile:top-[66%] md:top-[68%] lg:right-0 lg:top-[74%] xl:top-[76%]",
};

/**
 * Card chrome only — icon box + padding scale by breakpoint.
 * Mobile/tablet get comfortable padding; xl+ stays denser until 2xl.
 */
const CARD_SIZE_SCALE =
  "w-max gap-2 px-2.5 py-2 [&>div:first-child]:size-8 mobile:gap-1.5 mobile:px-2 mobile:py-1.5 mobile:[&>div:first-child]:size-6 md:gap-2.5 md:px-3 md:py-2 md:[&>div:first-child]:size-9 lg:gap-2.5 lg:px-3 lg:py-2 lg:[&>div:first-child]:size-9 xl:gap-2.5 xl:px-3.5 xl:py-2.5 xl:[&>div:first-child]:size-10";

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

function getHiringTeamIcon(id: HeroFeatureId) {
  switch (id) {
    case "voice-search":
      return <Users className={iconClassName} strokeWidth={2} aria-hidden="true" />;
    case "whatsapp-first":
      return <Bot className={iconClassName} strokeWidth={2} aria-hidden="true" />;
    case "verified-jobs":
      return (
        <ShieldCheck className={iconClassName} strokeWidth={2} aria-hidden="true" />
      );
    case "in-your-language":
      return (
        <Languages className={iconClassName} strokeWidth={2} aria-hidden="true" />
      );
    default:
      return <Users className={iconClassName} strokeWidth={2} aria-hidden="true" />;
  }
}

function getIconContainerClassName(id: string) {
  if (id === "whatsapp-first") {
    return "relative overflow-hidden rounded-full";
  }

  return undefined;
}

export function HeroVisual() {
  const t = useTranslate();
  const [personIndex, setPersonIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      setPersonIndex((current) => (current + 1) % HERO_PERSONS.length);
    }, PERSON_ROTATE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const hiringTeam = personIndex === HIRING_TEAM_INDEX;

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
      className={FLOATING_POSITIONS[card.position]}
    >
      <HeroFeatureCard
        title={t(
          (hiringTeam ? HERO_HIRING_TEAM_FEATURE_KEYS : HERO_FEATURE_KEYS)[card.id]
            .title,
        )}
        description={t(
          (hiringTeam ? HERO_HIRING_TEAM_FEATURE_KEYS : HERO_FEATURE_KEYS)[card.id]
            .description,
        )}
        icon={hiringTeam ? getHiringTeamIcon(card.id) : getFeatureIcon(card.id)}
        iconContainerClassName={
          hiringTeam ? undefined : getIconContainerClassName(card.id)
        }
        className={cn(FLOAT_ANIMATIONS[card.id], CARD_SIZE_SCALE)}
      />
    </div>
  );

  return (
    <div className="relative mt-2 flex w-full min-w-0 flex-col items-center mobile:mt-1.5 md:mt-4 lg:mt-0 lg:h-full lg:items-center lg:justify-end">
      <div
        className={cn(
          "hero-illustration-group relative mx-auto w-full max-w-full min-w-0 md:max-w-[640px] lg:max-w-[100%] xl:max-w-[620px] 2xl:max-w-[680px]",
        )}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-[45%] size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-80 mobile:top-1/2 mobile:size-[280px] md:top-1/2 md:size-[420px] lg:hidden"
          aria-hidden="true"
        />

        <div className="relative isolate mx-auto w-full min-w-0 overflow-visible px-0 lg:px-0">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden size-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-glow opacity-25 xl:size-[340px] lg:block"
            aria-hidden="true"
          />

          {topCards.map(renderFeatureCard)}

          <div
            className={cn(
              "pointer-events-none relative z-[1] mx-auto aspect-[5/4] w-[58%] max-w-[240px]",
              "mobile:w-[86%] mobile:max-w-[320px] md:w-4/5 md:max-w-md",
              "lg:w-[92%] lg:max-w-none xl:w-[94%] 2xl:max-w-[560px]",
            )}
          >
            {HERO_PERSONS.map((person, index) => {
              const active = index === personIndex;
              return (
                <Image
                  key={person.src}
                  src={person}
                  alt={active ? t("home.hero.imageAlt") : ""}
                  aria-hidden={active ? undefined : true}
                  priority={index === 0}
                  fill
                  sizes="(min-width: 1280px) 560px, (min-width: 1024px) 500px, 70vw"
                  className={cn(
                    "object-contain object-center transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
              );
            })}
          </div>

          {bottomCards.map(renderFeatureCard)}
        </div>
      </div>
    </div>
  );
}
