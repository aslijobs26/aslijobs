import { replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const JOB_SEEKER_MORE_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "seeker-notifications-v3",
    label: "Notifications",
    autoStart: true,
    routes: [{ path: "/job-seeker/notifications", match: "exact" }],
    steps: [
      {
        target: "seeker-notifications-read-filter",
        title: "Unread updates",
        description: "Show every notification, or only the ones you have not read yet.",
        side: "bottom",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "seeker-settings-v3",
    label: "Account Settings",
    autoStart: true,
    routes: [{ path: "/job-seeker/settings", match: "exact" }],
    steps: [
      {
        target: "seeker-settings-account-profile",
        title: "Edit your account",
        description: "Update your name, photo and contact details from here.",
        side: "bottom",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "seeker-help-support-v2",
    label: "Help & Support",
    autoStart: true,
    routes: [{ path: "/job-seeker/help-support", match: "exact" }],
    steps: [
      {
        target: "seeker-help-tickets",
        title: "Support tickets",
        description:
          "Open a ticket when you need help from the AsliJobs team. View All Tickets lists the ones you have sent.",
        side: "left",
        align: "start",
      },
      replayStep,
    ],
  },
];

export const JOB_SEARCH_PAGE_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "seeker-job-search-v3",
    label: "Job Search",
    autoStart: true,
    routes: [{ path: "/jobs", match: "exact" }],
    steps: [
      {
        target: "job-search-bar",
        title: "Search jobs",
        description: "Search by job title or keyword, then pick a state and city.",
        side: "bottom",
        align: "start",
      },
      {
        target: "job-search-first-card-apply",
        title: "Apply",
        description:
          "Apply Now sends your application. Finish your profile or choose a resume when the job asks for one.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
];
