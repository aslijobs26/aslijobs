import type { JobCategory } from "@/types/discovery";
import { ROUTES } from "./routes";

function categoryHref(slug: string) {
  return `${ROUTES.FIND_JOBS}?category=${slug}`;
}

export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: "drivers",
    name: "Drivers",
    jobCount: "15,200+ Jobs",
    icon: "drivers",
    href: categoryHref("drivers"),
    iconVariant: "primary",
  },
  {
    id: "delivery",
    name: "Delivery",
    jobCount: "22,500+ Jobs",
    icon: "delivery",
    href: categoryHref("delivery"),
    iconVariant: "primary",
  },
  {
    id: "warehouse",
    name: "Warehouse",
    jobCount: "18,200+ Jobs",
    icon: "warehouse",
    href: categoryHref("warehouse"),
    iconVariant: "glow",
  },
  {
    id: "security",
    name: "Security",
    jobCount: "12,100+ Jobs",
    icon: "security",
    href: categoryHref("security"),
    iconVariant: "glow",
  },
  {
    id: "construction",
    name: "Construction",
    jobCount: "16,800+ Jobs",
    icon: "construction",
    href: categoryHref("construction"),
    iconVariant: "surface",
  },
  {
    id: "hospitality",
    name: "Hospitality",
    jobCount: "9,600+ Jobs",
    icon: "hospitality",
    href: categoryHref("hospitality"),
    iconVariant: "glow",
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    jobCount: "8,600+ Jobs",
    icon: "manufacturing",
    href: categoryHref("manufacturing"),
    iconVariant: "surface",
  },
  {
    id: "view-all",
    name: "View All",
    subtitle: "Categories",
    icon: "view-all",
    href: ROUTES.JOB_CATEGORIES,
    iconVariant: "primary",
  },
];
