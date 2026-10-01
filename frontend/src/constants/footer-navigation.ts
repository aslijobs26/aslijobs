import type { FooterNavGroup } from "@/types/footer";
import { WHATSAPP_CONTACT_URL } from "./cta";
import { ROUTES } from "./routes";

export const FOOTER_NAV_GROUPS: FooterNavGroup[] = [
  {
    id: "job-seekers",
    titleKey: "footer.jobSeekers",
    links: [
      { id: "find-jobs", labelKey: "footer.findJobs", href: ROUTES.JOB_SEEKER_FIND_JOBS },
      {
        id: "browse-by-city",
        labelKey: "footer.browseByCity",
        href: ROUTES.BROWSE_BY_CITY,
      },
      {
        id: "browse-by-state",
        labelKey: "footer.browseByState",
        href: ROUTES.BROWSE_BY_STATE,
      },
      {
        id: "job-categories",
        labelKey: "footer.jobCategories",
        href: ROUTES.JOB_CATEGORIES,
      },
      {
        id: "job-seeker-guide",
        labelKey: "footer.jobSeekerGuide",
        href: ROUTES.JOB_SEEKER_GUIDE,
      },
    ],
  },
  {
    id: "employers",
    titleKey: "footer.employers",
    links: [
      { id: "post-a-job", labelKey: "footer.postAJob", href: ROUTES.EMPLOYER_POST_A_JOB },
      {
        id: "employer-login",
        labelKey: "footer.employerLogin",
        href: ROUTES.EMPLOYER_LOGIN_INFO,
      },
      {
        id: "pricing-plans",
        labelKey: "footer.pricingPlans",
        href: ROUTES.PRICING_PLANS,
      },
      {
        id: "employer-guide",
        labelKey: "footer.employerGuide",
        href: ROUTES.EMPLOYER_GUIDE,
      },
    ],
  },
  {
    id: "resources",
    titleKey: "footer.resources",
    links: [
      { id: "faqs", labelKey: "footer.faqs", href: `${ROUTES.RESOURCES}?resource=faqs` },
      {
        id: "terms",
        labelKey: "footer.terms",
        href: ROUTES.TERMS_AND_CONDITIONS,
      },
      {
        id: "privacy",
        labelKey: "footer.privacy",
        href: ROUTES.PRIVACY_POLICY,
      },
      {
        id: "guidelines",
        labelKey: "footer.guidelines",
        href: ROUTES.GUIDELINES,
      },
      {
        id: "sitemap",
        labelKey: "footer.sitemap",
        href: `${ROUTES.RESOURCES}?page=sitemap`,
      },
    ],
  },
  {
    id: "support",
    titleKey: "footer.support",
    links: [
      {
        id: "help-center",
        labelKey: "footer.helpCenter",
        href: `${ROUTES.RESOURCES}?resource=help-center`,
      },
      { id: "contact-us", labelKey: "footer.contactUs", href: ROUTES.CONTACT },
      {
        id: "whatsapp-support",
        labelKey: "footer.whatsappSupport",
        href: WHATSAPP_CONTACT_URL,
      },
    ],
  },
];
