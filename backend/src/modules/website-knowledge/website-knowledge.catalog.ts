import type { KnowledgePersona, KnowledgeSourceType } from "./website-knowledge.types.js";

/**
 * Public documentation paths mirrored from frontend ROUTES + footer navigation.
 * Authenticated dashboards, job listings, and login sessions are excluded.
 */
export type OfficialKnowledgePage = {
  path: string;
  sourceType: KnowledgeSourceType;
  persona: KnowledgePersona;
  i18nFiles: string[];
  i18nKeys: string[];
};

export const OFFICIAL_KNOWLEDGE_PAGES: readonly OfficialKnowledgePage[] = [
  { path: "/", sourceType: "feature", persona: "general", i18nFiles: ["home.ts"], i18nKeys: ["home"] },
  {
    path: "/find-jobs",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.findJobs"],
  },
  {
    path: "/browse-by-city",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.browseByCity"],
  },
  {
    path: "/browse-by-state",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.browseByState"],
  },
  {
    path: "/job-categories",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.jobCategories"],
  },
  {
    path: "/job-seeker-guide",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.jobSeekerGuide"],
  },
  {
    path: "/interview-tips",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.interviewTips"],
  },
  {
    path: "/salary-guide",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.salaryGuide"],
  },
  {
    path: "/career-advice",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.careerAdvice"],
  },
  {
    path: "/post-a-job",
    sourceType: "guide",
    persona: "employer",
    i18nFiles: ["public-content.ts"],
    i18nKeys: ["publicContent.postAJob"],
  },
  {
    path: "/employer-login-info",
    sourceType: "guide",
    persona: "employer",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.employerLoginInfo"],
  },
  {
    path: "/pricing-plans",
    sourceType: "pricing",
    persona: "employer",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.pricingPlans"],
  },
  {
    path: "/employer-guide",
    sourceType: "guide",
    persona: "employer",
    i18nFiles: ["public-pages.ts"],
    i18nKeys: ["publicPages.employerGuide"],
  },
  {
    path: "/faqs",
    sourceType: "faq",
    persona: "general",
    i18nFiles: ["faqs.ts"],
    i18nKeys: ["faqs"],
  },
  {
    path: "/resources?resource=faqs",
    sourceType: "faq",
    persona: "general",
    i18nFiles: ["faqs.ts"],
    i18nKeys: ["faqs"],
  },
  {
    path: "/help-center",
    sourceType: "help",
    persona: "general",
    i18nFiles: ["help-center.ts"],
    i18nKeys: ["helpCenter"],
  },
  {
    path: "/resources?resource=help-center",
    sourceType: "help",
    persona: "general",
    i18nFiles: ["help-center.ts"],
    i18nKeys: ["helpCenter"],
  },
  {
    path: "/terms-and-conditions",
    sourceType: "policy",
    persona: "general",
    i18nFiles: ["terms.ts"],
    i18nKeys: ["terms"],
  },
  {
    path: "/privacy-policy",
    sourceType: "policy",
    persona: "general",
    i18nFiles: ["privacy.ts"],
    i18nKeys: ["privacy"],
  },
  {
    path: "/guidelines",
    sourceType: "policy",
    persona: "general",
    i18nFiles: ["guidelines.ts"],
    i18nKeys: ["guidelines"],
  },
  {
    path: "/resources?page=sitemap",
    sourceType: "other",
    persona: "general",
    i18nFiles: ["site-pages.ts"],
    i18nKeys: ["sitePages.sitemapDescription"],
  },
  {
    path: "/contact",
    sourceType: "contact",
    persona: "general",
    i18nFiles: ["site-pages.ts"],
    i18nKeys: ["sitePages"],
  },
  {
    path: "/job-seeker/register",
    sourceType: "guide",
    persona: "seeker",
    i18nFiles: ["auth.ts"],
    i18nKeys: ["auth"],
  },
  {
    path: "/employer/register",
    sourceType: "guide",
    persona: "employer",
    i18nFiles: ["auth.ts", "employer.ts"],
    i18nKeys: ["auth"],
  },
];

/** Contact details published on Contact Us (frontend ContactPageContent). */
export const OFFICIAL_PUBLIC_CONTACT = {
  email: "contact@aslijobs.com",
  phone: "9248719057",
} as const;

export const CRAWL_SKIP_PATH_PREFIXES = [
  "/employer/dashboard",
  "/employer/jobs",
  "/employer/candidates",
  "/employer/interviews",
  "/employer/messages",
  "/employer/saved-candidates",
  "/employer/campaigns",
  "/employer/subscription",
  "/employer/company-profile",
  "/employer/team",
  "/employer/settings",
  "/employer/notifications",
  "/employer/help-center",
  "/job-seeker/dashboard",
  "/job-seeker/profile",
  "/job-seeker/my-resume",
  "/job-seeker/applied-jobs",
  "/job-seeker/notifications",
  "/job-seeker/saved-jobs",
  "/job-seeker/help-support",
  "/job-seeker/settings",
  "/jobs/",
  "/post-job",
  "/api/",
  "/uploads/",
] as const;

export function isPublicKnowledgePath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  if (CRAWL_SKIP_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) {
    return false;
  }
  return OFFICIAL_KNOWLEDGE_PAGES.some((page) => {
    const official = page.path.split("?")[0] || "/";
    return official === path;
  });
}
