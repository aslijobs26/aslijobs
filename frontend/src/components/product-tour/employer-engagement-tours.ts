import { replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_ENGAGEMENT_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-interviews-v3",
    label: "Interviews",
    autoStart: true,
    routes: [{ path: "/employer/interviews", match: "exact" }],
    steps: [
      {
        target: "employer-interviews-view-toggle",
        title: "Calendar view",
        description:
          "Switch between Calendar View and List View for the same interviews.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-interviews-schedule",
        title: "Schedule an interview",
        description:
          "Pick a candidate and book their interview. This shows when you can create interviews.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
  {
    id: "employer-messages-v3",
    label: "Messages",
    autoStart: true,
    routes: [{ path: "/employer/messages", match: "exact" }],
    steps: [
      {
        target: "employer-messages-first-conversation",
        title: "Open a conversation",
        description:
          "Each conversation is the hiring history for one application. Opening it marks it as read.",
        side: "right",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "employer-notifications-v2",
    label: "Notifications",
    autoStart: true,
    routes: [{ path: "/employer/notifications", match: "exact" }],
    steps: [
      {
        target: "employer-notifications-mark-all-read",
        title: "Mark all as read",
        description:
          "Clears the unread count. It shows when you have unread notifications.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-notifications-first-row",
        title: "A notification",
        description:
          "Open a notification to see what changed. Unread ones are highlighted.",
        side: "bottom",
        align: "start",
      },
      replayStep,
    ],
  },
];
