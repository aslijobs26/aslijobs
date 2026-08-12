import type { FooterNavGroup } from "@/types/footer";
import { WHATSAPP_JOIN_URL } from "./cta";
import { ROUTES } from "./routes";

export const FOOTER_NAV_GROUPS: FooterNavGroup[] = [
  {
    id: "job-seekers",
    title: "For Job Seekers",
    links: [
      { id: "find-jobs", label: "Find Jobs", href: ROUTES.JOB_SEEKER_FIND_JOBS },
      {
        id: "browse-by-city",
        label: "Browse by City",
        href: ROUTES.BROWSE_BY_CITY,
      },
      {
        id: "browse-by-state",
        label: "Browse by State",
        href: ROUTES.BROWSE_BY_STATE,
      },
      {
        id: "job-categories",
        label: "Job Categories",
        href: ROUTES.JOB_CATEGORIES,
      },
      {
        id: "job-seeker-guide",
        label: "Job Seeker Guide",
        href: ROUTES.JOB_SEEKER_GUIDE,
      },
    ],
  },
  {
    id: "employers",
    title: "For Employers",
    links: [
      { id: "post-a-job", label: "Post a Job", href: ROUTES.EMPLOYER_POST_A_JOB },
      {
        id: "employer-login",
        label: "Employer Login",
        href: ROUTES.EMPLOYER_LOGIN_INFO,
      },
      {
        id: "pricing-plans",
        label: "Pricing Plans",
        href: ROUTES.PRICING_PLANS,
      },
      {
        id: "employer-guide",
        label: "Employer Guide",
        href: ROUTES.EMPLOYER_GUIDE,
      },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    links: [
      { id: "faqs", label: "FAQs", href: `${ROUTES.RESOURCES}?resource=faqs` },
      {
        id: "terms",
        label: "Terms & Conditions",
        href: ROUTES.TERMS_AND_CONDITIONS,
      },
      {
        id: "privacy",
        label: "Privacy Policy",
        href: ROUTES.PRIVACY_POLICY,
      },
      {
        id: "guidelines",
        label: "Guidelines",
        href: ROUTES.GUIDELINES,
      },
      {
        id: "sitemap",
        label: "Sitemap",
        href: `${ROUTES.RESOURCES}?page=sitemap`,
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    links: [
      {
        id: "help-center",
        label: "Help Center",
        href: `${ROUTES.RESOURCES}?resource=help-center`,
      },
      { id: "contact-us", label: "Contact Us", href: ROUTES.CONTACT },
      {
        id: "whatsapp-support",
        label: "WhatsApp Support",
        href: WHATSAPP_JOIN_URL,
      },
    ],
  },
];
