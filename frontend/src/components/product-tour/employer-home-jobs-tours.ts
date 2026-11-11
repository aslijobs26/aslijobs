import { employerSidebarStep, replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_HOME_JOBS_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-overview-v3",
    label: "Dashboard",
    autoStart: true,
    routes: [{ path: "/employer/dashboard", match: "exact" }],
    steps: [
      {
        target: "employer-home-welcome-actions",
        title: "Post a job or search candidates",
        description:
          "Post New Job starts a listing. Search Candidates opens the people who applied. Each button shows only when your role allows it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-subscription",
        title: "Plan benefits",
        description:
          "Benefits included in your plan. Upgrade Plan opens the subscription page.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-home-profile-completion",
        title: "Finish your profile",
        description:
          "This appears only while your profile is incomplete. View Profile opens the missing details.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-home-notifications",
        title: "Notifications",
        description:
          "Your latest updates. Select one to open it, or View All for the full list.",
        side: "left",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "employer-jobs-v3",
    label: "Jobs",
    autoStart: true,
    routes: [{ path: "/employer/jobs", match: "exact" }],
    steps: [
      {
        target: "employer-jobs-boost",
        title: "Job Boost",
        description:
          "Increase the visibility of a job so more candidates see it.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-post-job",
        title: "Post a job",
        description:
          "Post Job starts a new listing from here. You can save a draft and submit it when it is ready.",
        side: "bottom",
        align: "end",
      },
      employerSidebarStep("jobs", "Jobs"),
      replayStep,
    ],
  },
  {
    id: "employer-job-under-review-v2",
    label: "Job status",
    autoStart: true,
    routes: [{ path: "/employer/jobs/:jobId/under-review", match: "pattern" }],
    steps: [
      {
        target: "employer-job-review-heading",
        title: "Where your job stands",
        description:
          "Follow this job after you submit it. The heading updates when it is approved or needs changes.",
        side: "bottom",
        align: "center",
      },
      {
        target: "employer-job-review-edit",
        title: "Edit and resubmit",
        description:
          "When a job is rejected, update it and send it for review again.",
        side: "top",
        align: "center",
      },
      {
        target: "employer-job-review-view-live",
        title: "View the live job",
        description: "Once approved, open the listing job seekers see.",
        side: "top",
        align: "center",
      },
      replayStep,
    ],
  },
];
