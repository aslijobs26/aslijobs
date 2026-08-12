export type PublicContentCategoryCard = {
  id: string;
  title: string;
  description: string;
};

export type PublicContentSection = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  cards?: readonly PublicContentCategoryCard[];
  /** Visual emphasis for safety / help guidance. */
  variant?: "default" | "safety" | "steps";
};

export type PublicContentCtaAction = {
  label: string;
  href: string;
  external?: boolean;
  variant?: "primary" | "secondary";
};

export type PublicContentCta = {
  title: string;
  paragraphs: readonly string[];
  tagline: string;
  badge?: string;
  actions: readonly PublicContentCtaAction[];
};

export type PublicContentPageData = {
  slug: string;
  title: string;
  metaDescription: string;
  intro: readonly string[];
  sections: readonly PublicContentSection[];
  cta: PublicContentCta;
};

/** @deprecated Use PublicContent* types. Kept for existing job-seeker imports. */
export type JobSeekerContentCategoryCard = PublicContentCategoryCard;
export type JobSeekerContentSection = PublicContentSection;
export type JobSeekerContentCta = PublicContentCta;
export type JobSeekerContentPageData = PublicContentPageData;
