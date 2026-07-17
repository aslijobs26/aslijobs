import type { FooterNavGroup } from "@/types/footer";
import { WHATSAPP_JOIN_URL } from "./cta";
import { ROUTES } from "./routes";

export const FOOTER_NAV_GROUPS: FooterNavGroup[] = [
  {
    id: "job-seekers",
    title: "For Job Seekers",
    links: [
      { id: "find-jobs", label: "Find Jobs", href: ROUTES.FIND_JOBS },
      {
        id: "browse-by-city",
        label: "Browse by City",
        href: `${ROUTES.FIND_JOBS}?view=cities`,
      },
      {
        id: "browse-by-state",
        label: "Browse by State",
        href: `${ROUTES.FIND_JOBS}?view=states`,
      },
      {
        id: "job-categories",
        label: "Job Categories",
        href: ROUTES.JOB_CATEGORIES,
      },
      {
        id: "job-seeker-guide",
        label: "Job Seeker Guide",
        href: `${ROUTES.RESOURCES}?resource=job-seeker-guide`,
      },
    ],
  },
  {
    id: "employers",
    title: "For Employers",
    links: [
      { id: "post-a-job", label: "Post a Job", href: ROUTES.POST_JOB },
      { id: "employer-login", label: "Employer Login", href: ROUTES.LOGIN },
      {
        id: "pricing-plans",
        label: "Pricing Plans",
        href: ROUTES.EMPLOYERS,
      },
      {
        id: "employer-guide",
        label: "Employer Guide",
        href: `${ROUTES.RESOURCES}?resource=employer-guide`,
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
