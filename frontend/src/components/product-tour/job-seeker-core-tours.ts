import { replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const JOB_SEEKER_CORE_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "seeker-workspace-v3",
    label: "Profile",
    autoStart: true,
    routes: [{ path: "/job-seeker/profile", match: "exact" }],
    steps: [
      {
        target: "seeker-profile-strength",
        title: "Profile strength",
        description:
          "Shows how complete your profile is. Improve profile opens the details employers see when you apply.",
        side: "bottom",
        align: "end",
      },
      {
        target: "seeker-profile-edit",
        title: "Edit profile",
        description: "Edit Profile opens your personal details so you can update them.",
        side: "left",
        align: "center",
      },
      {
        target: "seeker-profile-about",
        title: "About me",
        description: "Your summary for employers. Edit updates this text.",
        side: "bottom",
        align: "start",
      },
      {
        target: "seeker-browse-jobs",
        title: "Browse Jobs",
        description: "Opens job search, where you find roles, save them and apply.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
  {
    id: "seeker-applications-v3",
    label: "My Applications",
    autoStart: true,
    routes: [{ path: "/job-seeker/applied-jobs", match: "exact" }],
    steps: [
      {
        target: "seeker-applications-status",
        title: "Filter by status",
        description:
          "Show every application, or only Applied, Under Review, Shortlisted, Interview, Offer, Rejected or Withdrawn.",
        side: "bottom",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "seeker-application-detail-v2",
    label: "Application",
    autoStart: true,
    routes: [{ path: "/job-seeker/applied-jobs/:applicationId", match: "pattern" }],
    steps: [
      {
        target: "seeker-application-status",
        title: "Application status",
        description: "Where this application stands right now.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
  {
    id: "seeker-resume-v3",
    label: "My Resume",
    autoStart: true,
    routes: [{ path: "/job-seeker/my-resume", match: "exact" }],
    steps: [
      {
        target: "seeker-resume-uploaded",
        title: "My uploaded resume",
        description:
          "Upload a PDF, DOC or DOCX and use that file when you apply. You can replace or remove it later.",
        side: "left",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "seeker-saved-jobs-v3",
    label: "Saved Jobs",
    autoStart: true,
    routes: [{ path: "/job-seeker/saved-jobs", match: "exact" }],
    steps: [
      {
        target: "seeker-saved-sort",
        title: "Sort saved jobs",
        description:
          "Order this list by recently saved, newest, salary, company or match.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
];
