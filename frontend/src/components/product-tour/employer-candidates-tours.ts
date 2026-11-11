import { replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_CANDIDATES_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-candidates-v3",
    label: "Candidates",
    autoStart: true,
    routes: [{ path: "/employer/candidates", match: "exact" }],
    steps: [
      {
        target: "employer-candidates-export",
        title: "Export candidates",
        description:
          "Download the candidates that match your current filters. You choose the file format before the download starts.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
  {
    id: "employer-candidate-detail-v2",
    label: "Candidate",
    autoStart: true,
    routes: [
      { path: "/employer/candidates/:applicationId", match: "pattern" },
    ],
    steps: [
      {
        target: "employer-candidate-status",
        title: "Hiring stage",
        description:
          "Move this candidate to the next stage when your role can update applications.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-interview",
        title: "Schedule an interview",
        description:
          "Set the interview date, time, mode and interviewer for this candidate.",
        side: "left",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "employer-shortlist-v3",
    label: "Shortlisted Candidates",
    autoStart: true,
    routes: [{ path: "/employer/saved-candidates", match: "exact" }],
    steps: [
      {
        target: "employer-shortlist-add",
        title: "Add a candidate",
        description:
          "Search applicants on your jobs and save one to this shortlist.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-shortlist-export",
        title: "Export",
        description:
          "Download the shortlisted candidates that match your current filters.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-shortlist-more-filters",
        title: "More filters",
        description:
          "Open extra filters such as priority and tag. The badge shows how many are in use.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-view-toggle",
        title: "Table or grid",
        description: "Switch between a table and a grid of candidate cards.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
];
