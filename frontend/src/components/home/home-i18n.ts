import type { HERO_POPULAR_SEARCHES } from "@/constants/hero";
import type { MessageKey, useTranslate } from "@/i18n/translate";
import type { HeroCtaCardVariant } from "@/types/cta";
import type { CategoryIconKey } from "@/types/discovery";
import type { HeroFeatureId } from "@/types/hero";
import type { HiringSolutionVariant } from "@/types/hiring-solutions";
import type { HomeStatIconKey } from "@/types/home-stats";
import type {
  BenefitIconKey,
  ResourceIconKey,
  WorkflowIconKey,
} from "@/types/trust-resources";

type Translate = ReturnType<typeof useTranslate>;

type TitleDescriptionKeys = {
  title: MessageKey;
  description: MessageKey;
};

export const HERO_FEATURE_KEYS: Record<HeroFeatureId, TitleDescriptionKeys> = {
  "voice-search": {
    title: "home.hero.features.voiceSearch.title",
    description: "home.hero.features.voiceSearch.description",
  },
  "whatsapp-first": {
    title: "home.hero.features.whatsappFirst.title",
    description: "home.hero.features.whatsappFirst.description",
  },
  "verified-jobs": {
    title: "home.hero.features.verifiedJobs.title",
    description: "home.hero.features.verifiedJobs.description",
  },
  "in-your-language": {
    title: "home.hero.features.inYourLanguage.title",
    description: "home.hero.features.inYourLanguage.description",
  },
};

/** "in-your-language" intentionally keeps its regional-language demo message. */
export const HERO_FEATURE_MESSAGE_KEYS: Partial<Record<HeroFeatureId, MessageKey>> = {
  "voice-search": "home.hero.messages.voiceSearch",
  "whatsapp-first": "home.hero.messages.whatsappFirst",
  "verified-jobs": "home.hero.messages.verifiedJobs",
};

export const HERO_POPULAR_SEARCH_KEYS: Record<
  (typeof HERO_POPULAR_SEARCHES)[number],
  MessageKey
> = {
  "Delivery Executive": "home.search.popular.deliveryExecutive",
  Driver: "home.search.popular.driver",
  Helper: "home.search.popular.helper",
  Cook: "home.search.popular.cook",
  "Sales Executive": "home.search.popular.salesExecutive",
  Warehouse: "home.search.popular.warehouse",
  "Security Guard": "home.search.popular.securityGuard",
};

export const HERO_CTA_KEYS: Record<
  HeroCtaCardVariant,
  TitleDescriptionKeys & { action: MessageKey }
> = {
  whatsapp: {
    title: "home.cta.whatsapp.title",
    description: "home.cta.whatsapp.description",
    action: "home.cta.whatsapp.action",
  },
  employer: {
    title: "home.cta.employer.title",
    description: "home.cta.employer.description",
    action: "home.cta.employer.action",
  },
  assist: {
    title: "home.cta.assist.title",
    description: "home.cta.assist.description",
    action: "home.cta.assist.action",
  },
};

export const CATEGORY_NAME_KEYS: Record<CategoryIconKey, MessageKey> = {
  drivers: "home.discovery.categories.drivers",
  delivery: "home.discovery.categories.delivery",
  warehouse: "home.discovery.categories.warehouse",
  security: "home.discovery.categories.security",
  construction: "home.discovery.categories.construction",
  hospitality: "home.discovery.categories.hospitality",
  manufacturing: "home.discovery.categories.manufacturing",
  "view-all": "home.discovery.categories.viewAll",
};

type HiringSolutionKeys = {
  title: MessageKey;
  subtitle: MessageKey;
  features: readonly MessageKey[];
  action: MessageKey;
};

export const HIRING_SOLUTION_KEYS: Record<HiringSolutionVariant, HiringSolutionKeys> = {
  "free-job-post": {
    title: "home.hiring.freeJobPost.title",
    subtitle: "home.hiring.freeJobPost.subtitle",
    features: [
      "home.hiring.freeJobPost.feature1",
      "home.hiring.freeJobPost.feature2",
      "home.hiring.freeJobPost.feature3",
    ],
    action: "home.hiring.freeJobPost.action",
  },
  "job-boosters": {
    title: "home.hiring.jobBoosters.title",
    subtitle: "home.hiring.jobBoosters.subtitle",
    features: [
      "home.hiring.jobBoosters.feature1",
      "home.hiring.jobBoosters.feature2",
      "home.hiring.jobBoosters.feature3",
    ],
    action: "home.hiring.jobBoosters.action",
  },
  "hire-assist": {
    title: "home.hiring.hireAssist.title",
    subtitle: "home.hiring.hireAssist.subtitle",
    features: [
      "home.hiring.hireAssist.feature1",
      "home.hiring.hireAssist.feature2",
      "home.hiring.hireAssist.feature3",
    ],
    action: "home.hiring.hireAssist.action",
  },
  "business-hiring": {
    title: "home.hiring.businessHiring.title",
    subtitle: "home.hiring.businessHiring.subtitle",
    features: [
      "home.hiring.businessHiring.feature1",
      "home.hiring.businessHiring.feature2",
      "home.hiring.businessHiring.feature3",
    ],
    action: "home.hiring.businessHiring.action",
  },
};

export const BENEFIT_KEYS: Record<BenefitIconKey, TitleDescriptionKeys> = {
  whatsapp: {
    title: "home.trust.benefits.whatsapp.title",
    description: "home.trust.benefits.whatsapp.description",
  },
  languages: {
    title: "home.trust.benefits.languages.title",
    description: "home.trust.benefits.languages.description",
  },
  voice: {
    title: "home.trust.benefits.voice.title",
    description: "home.trust.benefits.voice.description",
  },
  verified: {
    title: "home.trust.benefits.verified.title",
    description: "home.trust.benefits.verified.description",
  },
  "ai-matching": {
    title: "home.trust.benefits.aiMatching.title",
    description: "home.trust.benefits.aiMatching.description",
  },
  free: {
    title: "home.trust.benefits.free.title",
    description: "home.trust.benefits.free.description",
  },
};

export const WORKFLOW_STEP_KEYS: Record<WorkflowIconKey, TitleDescriptionKeys> = {
  whatsapp: {
    title: "home.trust.steps.whatsapp.title",
    description: "home.trust.steps.whatsapp.description",
  },
  language: {
    title: "home.trust.steps.language.title",
    description: "home.trust.steps.language.description",
  },
  search: {
    title: "home.trust.steps.search.title",
    description: "home.trust.steps.search.description",
  },
  apply: {
    title: "home.trust.steps.apply.title",
    description: "home.trust.steps.apply.description",
  },
};

export const RESOURCE_KEYS: Record<ResourceIconKey, TitleDescriptionKeys> = {
  guide: {
    title: "home.trust.resources.guide.title",
    description: "home.trust.resources.guide.description",
  },
  resume: {
    title: "home.trust.resources.resume.title",
    description: "home.trust.resources.resume.description",
  },
  interview: {
    title: "home.trust.resources.interview.title",
    description: "home.trust.resources.interview.description",
  },
  salary: {
    title: "home.trust.resources.salary.title",
    description: "home.trust.resources.salary.description",
  },
  career: {
    title: "home.trust.resources.career.title",
    description: "home.trust.resources.career.description",
  },
};

export const HOME_STAT_LABEL_KEYS: Record<HomeStatIconKey, MessageKey> = {
  user: "home.trust.stats.hiredToday",
  clipboard: "home.trust.stats.jobsToday",
  handshake: "home.trust.stats.applicationsToday",
  shield: "home.trust.stats.employerSatisfaction",
  star: "home.trust.stats.platformRating",
};

const JOB_TAG_KEYS: Partial<Record<string, MessageKey>> = {
  "Full Time": "jobs.fullTime",
  Fresher: "jobs.fresher",
  "Male Only": "jobs.maleOnly",
  "Experience Only": "home.jobsDiscovery.experienceOnly",
};

const SALARY_PERIOD_KEYS: Partial<Record<string, MessageKey>> = {
  month: "home.jobsDiscovery.perMonth",
};

const JOB_COUNT_PATTERN = /^([\d,]+\+?)\s+Jobs$/;
const POSTED_DAYS_AGO_PATTERN = /^(\d+)\s+days?\s+ago$/;
const CITY_EXAMPLE_PATTERN = /^e\.g\.\s+(.+)$/;
const CITY_SEARCH_PLACEHOLDER = "Search city";

/** Static marketing counts are authored as "<n> Jobs"; only the word is localized. */
export function translateJobCount(raw: string, t: Translate): string {
  const match = JOB_COUNT_PATTERN.exec(raw);
  return match ? t("home.common.jobCount", { count: match[1] }) : raw;
}

export function translateJobTag(raw: string, t: Translate): string {
  const key = JOB_TAG_KEYS[raw];
  return key ? t(key) : raw;
}

export function translateSalaryPeriod(raw: string, t: Translate): string {
  const key = SALARY_PERIOD_KEYS[raw];
  return key ? t(key) : `/${raw}`;
}

export function translatePostedAt(raw: string, t: Translate): string {
  const match = POSTED_DAYS_AGO_PATTERN.exec(raw);
  if (!match) return raw;
  const count = Number(match[1]);
  return t(
    count === 1
      ? "home.jobsDiscovery.postedDayAgo"
      : "home.jobsDiscovery.postedDaysAgo",
    { count },
  );
}

/** Localizes the "e.g. <City>" / "Search city" strings produced by the location service. */
export function translateCityPlaceholder(raw: string, t: Translate): string {
  if (raw === CITY_SEARCH_PLACEHOLDER) return t("home.search.cityPlaceholderSearch");
  const match = CITY_EXAMPLE_PATTERN.exec(raw);
  return match ? t("home.search.cityPlaceholderExample", { city: match[1] }) : raw;
}
