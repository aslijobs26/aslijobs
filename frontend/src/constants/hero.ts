import type { HeroFeatureId, HeroFeatureMessage } from "@/types/hero";

export const HERO_LANGUAGES = [
  "English",
  "తెలుగు",
  "हिंदी",
  "தமிழ்",
  "ಕನ್ನಡ",
  "മലയാളം",
] as const;

export const HERO_HEADING = {
  line1: "Find Real Jobs.",
  line2: "On WhatsApp.",
} as const;

export const HERO_SUPPORTING = {
  line1: "Search, apply and get hired – all in your language.",
  line2: "Simple. Fast. Trusted.",
} as const;

export const HERO_FEATURE_CARDS = [
  {
    id: "voice-search",
    title: "Voice Search",
    description: "Speak & find jobs",
    position: "top-left",
  },
  {
    id: "whatsapp-first",
    title: "WhatsApp First",
    description: "No App Needed",
    position: "top-right",
  },
  {
    id: "verified-jobs",
    title: "Verified Jobs",
    description: "Trusted Employers",
    position: "bottom-left",
  },
  {
    id: "in-your-language",
    title: "In Your Language",
    description: "Apply with ease",
    position: "bottom-right",
  },
] as const;

export const HERO_FEATURE_MESSAGES: Record<
  HeroFeatureId,
  HeroFeatureMessage
> = {
  "voice-search": { emoji: "🎙️", text: "Delivery jobs near me" },
  "whatsapp-first": { emoji: "💬", text: "Hi AsliJobs, find jobs for me" },
  "verified-jobs": { emoji: "🛡️", text: "Show me verified jobs" },
  "in-your-language": { emoji: "🌐", text: "తెలుగులో ఉద్యోగాలు చూపించు" },
};

export const HERO_SEARCH_DEFAULTS = {
  query: "",
  state: "",
  city: "",
  category: "",
} as const;

export const HERO_STATE_OPTIONS = [{ value: "", label: "All States" }] as const;

export const HERO_CITY_OPTIONS = [{ value: "", label: "All Cities" }] as const;

export const HERO_CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
] as const;
