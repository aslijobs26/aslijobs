import { ROUTES } from "@/constants/routes";

export type JobDetailsRailJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  meta?: string;
  href: string;
};

export const JOB_DETAILS_RECENTLY_VIEWED: JobDetailsRailJob[] = [
  {
    id: "recent-1",
    title: "Helper",
    company: "City Logistics",
    location: "Gachibowli",
    salary: "₹12K–15K/mo",
    meta: "6h ago",
    href: `${ROUTES.FIND_JOBS}?search=helper`,
  },
  {
    id: "recent-2",
    title: "Electrician",
    company: "PowerFix Services",
    location: "Hitech City",
    salary: "₹18K–24K/mo",
    meta: "1d ago",
    href: `${ROUTES.FIND_JOBS}?search=electrician`,
  },
  {
    id: "recent-3",
    title: "Warehouse Associate",
    company: "QuickStore",
    location: "Miyapur",
    salary: "₹14K–18K/mo",
    meta: "2d ago",
    href: `${ROUTES.FIND_JOBS}?search=warehouse`,
  },
];

export const JOB_DETAILS_NEAR_YOU: JobDetailsRailJob[] = [
  {
    id: "near-1",
    title: "Delivery Executive",
    company: "QuickDrop",
    location: "Madhapur",
    salary: "₹15K–22K/mo",
    meta: "1.2 km away",
    href: `${ROUTES.FIND_JOBS}?search=delivery`,
  },
  {
    id: "near-2",
    title: "Security Guard",
    company: "SafeWatch",
    location: "Jubilee Hills",
    salary: "₹14K–18K/mo",
    meta: "2.4 km away",
    href: `${ROUTES.FIND_JOBS}?search=security`,
  },
  {
    id: "near-3",
    title: "Office Boy",
    company: "AdminCare",
    location: "Kondapur",
    salary: "₹12K–16K/mo",
    meta: "3.1 km away",
    href: `${ROUTES.FIND_JOBS}?search=office+boy`,
  },
];

export const JOB_DETAILS_POPULAR_SEARCHES = [
  "Painter",
  "Helper",
  "Electrician",
  "Plumber",
  "Welder",
  "Driver",
  "Mason",
  "Carpenter",
] as const;

export const JOB_DETAILS_SAFETY_TIPS = [
  "Never pay money for a job",
  "Verify company details before joining",
  "Meet only at official workplace addresses",
  "Report suspicious recruiters on AsliJobs",
] as const;

export const JOB_DETAILS_WHY_POINTS = [
  { id: "no-app", title: "No App Download" },
  { id: "whatsapp", title: "WhatsApp Based" },
  { id: "trusted", title: "Trusted Employers" },
  { id: "local", title: "Local Jobs Near You" },
] as const;
