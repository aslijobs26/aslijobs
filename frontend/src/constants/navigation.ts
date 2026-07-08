import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  hasChevron: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Find Jobs", href: ROUTES.FIND_JOBS, hasChevron: true },
  { label: "Employers", href: ROUTES.EMPLOYERS, hasChevron: true },
  { label: "Job Categories", href: ROUTES.JOB_CATEGORIES, hasChevron: true },
  { label: "Resources", href: ROUTES.RESOURCES, hasChevron: true },
  { label: "Contact Us", href: ROUTES.CONTACT, hasChevron: false },
];
