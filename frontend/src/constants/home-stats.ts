import type { HomeStat } from "@/types/home-stats";

export const HOME_STATS: readonly HomeStat[] = [
  {
    id: "hired-today",
    value: "128",
    label: "People Got Hired Today",
    icon: "user",
  },
  {
    id: "jobs-today",
    value: "342",
    label: "Jobs Posted Today",
    icon: "clipboard",
  },
  {
    id: "applications-today",
    value: "18,250",
    label: "Applications Today",
    icon: "handshake",
  },
  {
    id: "employer-satisfaction",
    value: "92%",
    label: "Employer Satisfaction",
    icon: "shield",
  },
  {
    id: "platform-rating",
    value: "4.8/5",
    label: "Platform Rating",
    icon: "star",
  },
] as const;
