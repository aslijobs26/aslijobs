import { HELP_CENTER_CATEGORIES } from "@/constants/help-center";
import { ROUTES } from "@/constants/routes";
import type { HelpCenterArticle } from "@/types/help-center";
import type {
  JobSeekerHelpFaqItem,
  JobSeekerHelpTopic,
  JobSeekerHelpTopicDefinition,
} from "@/types/job-seeker-help-support";

export const JOB_SEEKER_HELP_SUPPORT_TITLE = "Help & Support";

export const JOB_SEEKER_HELP_SUPPORT_SUBTITLE =
  "We're here to help you at every step of your journey.";

export const JOB_SEEKER_HELP_SEARCH_PLACEHOLDER =
  "Search for help articles, topics or keywords...";

export const JOB_SEEKER_HELP_TOPICS_HEADING = "Popular Topics";

export const JOB_SEEKER_HELP_VIEW_ALL_ARTICLES_LABEL = "View All Articles →";

export const JOB_SEEKER_HELP_VIEW_ALL_ARTICLES_HREF = ROUTES.HELP_CENTER;

export const JOB_SEEKER_HELP_FAQ_HEADING = "Frequently Asked Questions";

export const JOB_SEEKER_HELP_VIEW_ALL_FAQS_LABEL = "View All FAQs →";

export const JOB_SEEKER_HELP_VIEW_ALL_FAQS_HREF = ROUTES.FAQS;

export const JOB_SEEKER_HELP_STILL_NEED_TITLE = "Still need help?";

export const JOB_SEEKER_HELP_STILL_NEED_DESCRIPTION =
  "Our support team is ready to assist you.";

export const JOB_SEEKER_HELP_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@aslijobs.com";

export const JOB_SEEKER_HELP_SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || "+91 40 1234 5678";

export const JOB_SEEKER_HELP_SUPPORT_HOURS = "Mon - Sat, 9 AM - 6 PM";

export const JOB_SEEKER_HELP_AI_TITLE = "AI Help Assistant";

export const JOB_SEEKER_HELP_AI_BADGE = "Beta";

export const JOB_SEEKER_HELP_AI_BODY =
  "I'm Asli AI, your virtual support assistant. I can help you with account issues, job applications, interview queries and more.";

export const JOB_SEEKER_HELP_AI_CTA = "Chat with Asli AI";

export const JOB_SEEKER_HELP_AI_COMING_SOON = "Coming soon";

export const JOB_SEEKER_HELP_TICKETS_TITLE = "Support Ticket";

export const JOB_SEEKER_HELP_TICKETS_VIEW_ALL = "View All Tickets →";

export const JOB_SEEKER_HELP_TICKETS_SUBTITLE = "My Recent Tickets";

export const JOB_SEEKER_HELP_TICKETS_EMPTY =
  "No support tickets yet. When ticket support launches, your recent tickets will appear here.";

export const JOB_SEEKER_HELP_TICKETS_CREATE = "Create New Ticket →";

export const JOB_SEEKER_HELP_TICKETS_CREATE_HREF = ROUTES.CONTACT;

export const JOB_SEEKER_HELP_CONNECT_TITLE = "Connect with us";

export const JOB_SEEKER_HELP_CONNECT_DESCRIPTION =
  "Follow us on social media for updates and career tips.";

export const JOB_SEEKER_HELP_SEARCH_EMPTY_TITLE = "No matching help articles";

export const JOB_SEEKER_HELP_SEARCH_EMPTY_DESCRIPTION =
  "Try a different keyword, or browse Popular Topics below.";

/** Job-seeker-relevant help-center categories only (excludes employer-only content). */
export const JOB_SEEKER_HELP_CATEGORY_IDS = [
  "getting-started",
  "job-seeker-help",
  "whatsapp-help",
  "applications-interviews",
  "profile-video-profile",
  "language-support",
  "safety-reporting",
  "account-data-help",
  "contact-support",
] as const;

const JOB_SEEKER_HELP_TOPIC_DEFINITIONS: readonly JobSeekerHelpTopicDefinition[] =
  [
    {
      id: "account-profile",
      title: "Account & Profile",
      description:
        "Manage your account, profile information and privacy settings.",
      icon: "account",
      categoryIds: ["account-data-help", "profile-video-profile"],
    },
    {
      id: "jobs-applications",
      title: "Jobs & Applications",
      description: "Find jobs, apply, track applications and more.",
      icon: "jobs",
      categoryIds: ["job-seeker-help", "getting-started"],
    },
    {
      id: "interviews",
      title: "Interviews",
      description: "Interview process, schedules and related support.",
      icon: "interviews",
      categoryIds: ["applications-interviews"],
    },
    {
      id: "payments",
      title: "Payments & Earnings",
      description: "Free access, payments safety and related questions.",
      icon: "payments",
      articleIds: [
        "is-aslijobs-free-to-use",
        "pay-money-for-job",
        "free-and-paid-services",
        "payment-support",
      ],
    },
    {
      id: "safety",
      title: "Safety & Security",
      description: "Safety tips, report issues and account security.",
      icon: "safety",
      categoryIds: ["safety-reporting"],
    },
  ];

/** Featured FAQ article IDs from the existing help center (job-seeker focused). */
const JOB_SEEKER_HELP_FEATURED_FAQ_IDS = [
  "register-as-job-seeker",
  "apply-for-a-job",
  "check-application-status",
  "interview-updates",
  "update-my-profile",
] as const;

function getAllHelpArticlesFlat(): HelpCenterArticle[] {
  return HELP_CENTER_CATEGORIES.flatMap((category) => category.articles);
}

function getArticlesFromCategoryIds(
  categoryIds: readonly string[],
): HelpCenterArticle[] {
  const articles: HelpCenterArticle[] = [];
  const seen = new Set<string>();

  for (const categoryId of categoryIds) {
    const category = HELP_CENTER_CATEGORIES.find(
      (item) => item.id === categoryId,
    );
    if (!category) {
      continue;
    }

    for (const article of category.articles) {
      if (seen.has(article.id)) {
        continue;
      }
      seen.add(article.id);
      articles.push(article);
    }
  }

  return articles;
}

function getArticlesFromIds(articleIds: readonly string[]): HelpCenterArticle[] {
  const byId = new Map(
    getAllHelpArticlesFlat().map((article) => [article.id, article]),
  );

  return articleIds
    .map((id) => byId.get(id))
    .filter((article): article is HelpCenterArticle => Boolean(article));
}

function resolveTopicArticles(
  topic: JobSeekerHelpTopicDefinition,
): HelpCenterArticle[] {
  if (topic.articleIds?.length) {
    return getArticlesFromIds(topic.articleIds);
  }
  if (topic.categoryIds?.length) {
    return getArticlesFromCategoryIds(topic.categoryIds);
  }
  return [];
}

export function getJobSeekerHelpTopics(): JobSeekerHelpTopic[] {
  return JOB_SEEKER_HELP_TOPIC_DEFINITIONS.map((topic) => {
    const articles = resolveTopicArticles(topic);
    return {
      ...topic,
      articles,
      articleCount: articles.length,
    };
  });
}

export function getAllJobSeekerHelpArticles(): HelpCenterArticle[] {
  return getArticlesFromCategoryIds(JOB_SEEKER_HELP_CATEGORY_IDS);
}

export function getJobSeekerHelpFeaturedFaqs(): JobSeekerHelpFaqItem[] {
  const allArticles = getAllJobSeekerHelpArticles();
  const byId = new Map(allArticles.map((article) => [article.id, article]));

  return JOB_SEEKER_HELP_FEATURED_FAQ_IDS.map((id) => byId.get(id)).filter(
    (article): article is JobSeekerHelpFaqItem => Boolean(article),
  );
}

export function filterJobSeekerHelpArticles(
  articles: HelpCenterArticle[],
  query: string,
): HelpCenterArticle[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return articles;
  }

  return articles.filter((article) => {
    const haystack = `${article.question} ${article.answer}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

export function getFirstName(fullName: string | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return "there";
  }
  return trimmed.split(/\s+/)[0] ?? "there";
}
