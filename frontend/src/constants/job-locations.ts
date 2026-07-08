import type { JobLocationItem } from "@/types/jobs-discovery";
import { ROUTES } from "./routes";

function stateHref(slug: string) {
  return `${ROUTES.FIND_JOBS}?state=${slug}`;
}

function cityHref(slug: string) {
  return `${ROUTES.FIND_JOBS}?city=${slug}`;
}

export const JOB_STATES_VIEW_ALL_HREF = `${ROUTES.FIND_JOBS}`;

export const JOB_CITIES_VIEW_ALL_HREF = `${ROUTES.FIND_JOBS}`;

export const JOB_STATES: JobLocationItem[] = [
  {
    id: "telangana",
    name: "Telangana",
    jobCount: "25,468 Jobs",
    href: stateHref("telangana"),
  },
  {
    id: "andhra-pradesh",
    name: "Andhra Pradesh",
    jobCount: "22,113 Jobs",
    href: stateHref("andhra-pradesh"),
  },
  {
    id: "karnataka",
    name: "Karnataka",
    jobCount: "18,742 Jobs",
    href: stateHref("karnataka"),
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    jobCount: "15,632 Jobs",
    href: stateHref("tamil-nadu"),
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    jobCount: "28,451 Jobs",
    href: stateHref("maharashtra"),
  },
  {
    id: "kerala",
    name: "Kerala",
    jobCount: "9,876 Jobs",
    href: stateHref("kerala"),
  },
];

export const JOB_CITIES: JobLocationItem[] = [
  {
    id: "hyderabad",
    name: "Hyderabad",
    jobCount: "12,458 Jobs",
    href: cityHref("hyderabad"),
  },
  {
    id: "bangalore",
    name: "Bangalore",
    jobCount: "11,245 Jobs",
    href: cityHref("bangalore"),
  },
  {
    id: "chennai",
    name: "Chennai",
    jobCount: "8,745 Jobs",
    href: cityHref("chennai"),
  },
  {
    id: "vizag",
    name: "Vizag",
    jobCount: "6,542 Jobs",
    href: cityHref("vizag"),
  },
  {
    id: "vijayawada",
    name: "Vijayawada",
    jobCount: "5,248 Jobs",
    href: cityHref("vijayawada"),
  },
  {
    id: "coimbatore",
    name: "Coimbatore",
    jobCount: "4,215 Jobs",
    href: cityHref("coimbatore"),
  },
];
