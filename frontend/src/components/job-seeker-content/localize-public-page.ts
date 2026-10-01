import {
  EMPLOYER_GUIDE_CONTENT,
  EMPLOYER_LOGIN_CONTENT,
  PRICING_PLANS_CONTENT,
} from "@/constants/employer-content";
import {
  BROWSE_BY_CITY_CONTENT,
  BROWSE_BY_STATE_CONTENT,
  FIND_JOBS_CONTENT,
  JOB_CATEGORIES_CONTENT,
  JOB_SEEKER_GUIDE_CONTENT,
} from "@/constants/job-seeker-content";
import { publicPagesBundle } from "@/i18n/bundles/public-pages";
import { numberedCopy, toCamelCaseId } from "@/i18n/localize-copy";
import type { SiteLanguageCode } from "@/constants/site-language";
import type {
  PublicContentCtaAction,
  PublicContentPageData,
  PublicContentSection,
} from "@/types/job-seeker-content";

export const PUBLIC_PAGE_KEYS = [
  "findJobs",
  "browseByCity",
  "browseByState",
  "jobCategories",
  "jobSeekerGuide",
  "employerLogin",
  "pricingPlans",
  "employerGuide",
] as const;

export type PublicPageKey = (typeof PUBLIC_PAGE_KEYS)[number];

const PAGE_SOURCES: Record<PublicPageKey, PublicContentPageData> = {
  findJobs: FIND_JOBS_CONTENT,
  browseByCity: BROWSE_BY_CITY_CONTENT,
  browseByState: BROWSE_BY_STATE_CONTENT,
  jobCategories: JOB_CATEGORIES_CONTENT,
  jobSeekerGuide: JOB_SEEKER_GUIDE_CONTENT,
  employerLogin: EMPLOYER_LOGIN_CONTENT,
  pricingPlans: PRICING_PLANS_CONTENT,
  employerGuide: EMPLOYER_GUIDE_CONTENT,
};

const ACTION_LABEL_KEYS = {
  "Start on WhatsApp": "startOnWhatsapp",
  "Browse Jobs": "browseJobs",
  "Post a Job": "postAJob",
  "Employer Login": "employerLogin",
  "Contact Support": "contactSupport",
} as const;

type ActionLabel = (typeof ACTION_LABEL_KEYS)[keyof typeof ACTION_LABEL_KEYS];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function localizeSection(
  section: PublicContentSection,
  copy: Record<string, unknown> | undefined,
): PublicContentSection {
  if (!copy) {
    return section;
  }

  const paragraphs = numberedCopy(copy, "p");
  const bullets = numberedCopy(copy, "b");
  const cardsCopy = isRecord(copy.cards) ? copy.cards : undefined;

  return {
    ...section,
    title: typeof copy.title === "string" ? copy.title : section.title,
    paragraphs: paragraphs.length > 0 ? paragraphs : section.paragraphs,
    bullets: bullets.length > 0 ? bullets : section.bullets,
    cards: section.cards?.map((card) => {
      const cardCopy = cardsCopy?.[toCamelCaseId(card.id)];
      if (!isRecord(cardCopy)) {
        return card;
      }
      return {
        ...card,
        title: typeof cardCopy.title === "string" ? cardCopy.title : card.title,
        description:
          typeof cardCopy.description === "string"
            ? cardCopy.description
            : card.description,
      };
    }),
  };
}

function localizeAction(
  action: PublicContentCtaAction,
  labels: Record<ActionLabel, string>,
): PublicContentCtaAction {
  const labelKey = ACTION_LABEL_KEYS[action.label as keyof typeof ACTION_LABEL_KEYS];
  if (!labelKey) {
    return action;
  }
  return { ...action, label: labels[labelKey] };
}

export function localizePublicPage(
  language: SiteLanguageCode,
  pageKey: PublicPageKey,
): PublicContentPageData {
  const source = PAGE_SOURCES[pageKey];
  const page = publicPagesBundle[language].publicPages[pageKey];
  const labels = publicPagesBundle[language].publicPages.actions;
  const sectionsCopy = page.sections as Record<string, unknown>;
  const ctaCopy = page.cta as Record<string, unknown>;
  const ctaParagraphs = numberedCopy(ctaCopy, "p");

  return {
    ...source,
    title: page.title,
    metaDescription: page.metaDescription,
    intro: numberedCopy(page.intro as Record<string, unknown>, "i"),
    sections: source.sections.map((section) => {
      const sectionCopy = sectionsCopy[toCamelCaseId(section.id)];
      return localizeSection(
        section,
        isRecord(sectionCopy) ? sectionCopy : undefined,
      );
    }),
    cta: {
      ...source.cta,
      title: page.cta.title,
      paragraphs: ctaParagraphs.length > 0 ? ctaParagraphs : source.cta.paragraphs,
      tagline: page.cta.tagline,
      badge:
        "badge" in page.cta && typeof page.cta.badge === "string"
          ? page.cta.badge
          : source.cta.badge,
      actions: source.cta.actions.map((action) => localizeAction(action, labels)),
    },
  };
}
