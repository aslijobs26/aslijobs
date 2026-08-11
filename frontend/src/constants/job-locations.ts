import type { JobLocationItem } from "@/types/jobs-discovery";
import { buildJobSearchHref } from "@/utils/job-search-url";

export const JOB_STATES_VIEW_ALL_HREF = buildJobSearchHref({});

export const JOB_CITIES_VIEW_ALL_HREF = buildJobSearchHref({});

export const JOB_STATES: JobLocationItem[] = [
  {
    id: "telangana",
    name: "Telangana",
    jobCount: "25,468 Jobs",
    href: buildJobSearchHref({ state: "telangana" }),
  },
  {
    id: "andhra-pradesh",
    name: "Andhra Pradesh",
    jobCount: "22,113 Jobs",
    href: buildJobSearchHref({ state: "andhra-pradesh" }),
  },
  {
    id: "karnataka",
    name: "Karnataka",
    jobCount: "18,742 Jobs",
    href: buildJobSearchHref({ state: "karnataka" }),
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    jobCount: "15,632 Jobs",
    href: buildJobSearchHref({ state: "tamil-nadu" }),
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    jobCount: "28,451 Jobs",
    href: buildJobSearchHref({ state: "maharashtra" }),
  },
  {
    id: "kerala",
    name: "Kerala",
    jobCount: "9,876 Jobs",
    href: buildJobSearchHref({ state: "kerala" }),
  },
];

export const JOB_CITIES: JobLocationItem[] = [
  {
    id: "hyderabad",
    name: "Hyderabad",
    jobCount: "12,458 Jobs",
    href: buildJobSearchHref({
      state: "telangana",
      cities: ["hyderabad"],
    }),
  },
  {
    id: "bangalore",
    name: "Bangalore",
    jobCount: "11,245 Jobs",
    href: buildJobSearchHref({
      state: "karnataka",
      cities: ["bangalore"],
    }),
  },
  {
    id: "chennai",
    name: "Chennai",
    jobCount: "8,745 Jobs",
    href: buildJobSearchHref({
      state: "tamil-nadu",
      cities: ["chennai"],
    }),
  },
  {
    id: "vizag",
    name: "Vizag",
    jobCount: "6,542 Jobs",
    href: buildJobSearchHref({
      state: "andhra-pradesh",
      cities: ["vizag"],
    }),
  },
  {
    id: "vijayawada",
    name: "Vijayawada",
    jobCount: "5,248 Jobs",
    href: buildJobSearchHref({
      state: "andhra-pradesh",
      cities: ["vijayawada"],
    }),
  },
  {
    id: "coimbatore",
    name: "Coimbatore",
    jobCount: "4,215 Jobs",
    href: buildJobSearchHref({
      state: "tamil-nadu",
      cities: ["coimbatore"],
    }),
  },
];
