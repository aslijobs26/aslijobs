import type { HelpCenterArticle } from "@/types/help-center";

export type JobSeekerHelpTopicIconKey =
  | "account"
  | "jobs"
  | "interviews"
  | "payments"
  | "safety";

export type JobSeekerHelpTopicDefinition = {
  id: string;
  title: string;
  description: string;
  icon: JobSeekerHelpTopicIconKey;
  /** Existing help-center category IDs that contribute articles to this topic. */
  categoryIds?: readonly string[];
  /** Explicit help-center article IDs (used when category mapping is too broad). */
  articleIds?: readonly string[];
};

export type JobSeekerHelpTopic = JobSeekerHelpTopicDefinition & {
  articles: HelpCenterArticle[];
  articleCount: number;
};

export type JobSeekerHelpFaqItem = HelpCenterArticle;
