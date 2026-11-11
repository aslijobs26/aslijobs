import { employerSidebarStep, replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_CANDIDATES_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-candidates-v2",
    label: "Candidates",
    autoStart: true,
    routes: [{ path: "/employer/candidates", match: "exact" }],
    steps: [
      {
        target: "employer-candidates-header",
        title: "Your applicants",
        description:
          "Everyone who applied to your jobs is listed here. Review resumes, schedule interviews and move candidates through your hiring stages.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidates-job-filter-active",
        title: "Job filter",
        description:
          "You are looking at applicants for one job. Select Clear job filter to see applicants for all jobs again.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidates-export",
        title: "Export candidates",
        description:
          "Download the candidates that match your current filters. You choose the file format before the download starts.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-candidates-kpis",
        title: "Pipeline at a glance",
        description:
          "Totals for all candidates, new applications, shortlisted, interview scheduled and hired. When you filter by a job, the totals are for that job.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidates-mobile-filters",
        title: "Filters",
        description:
          "Open Filters to search candidates, pick a hiring stage, or narrow the list by experience, skills, availability and applied date.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidates-search",
        title: "Search candidates",
        description:
          "Search by name, skills, job, location or phone. The list updates as you type.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-candidates-quick-filters",
        title: "Quick filters by stage",
        description:
          "Show only candidates in one hiring stage, such as New Applications, Shortlisted or Rejected. Each stage shows how many candidates it has.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-candidates-advanced-filters",
        title: "Advanced filters",
        description:
          "Narrow the list by experience, skills, availability and applied date, and by location when your role can see it. Clear resets these filters.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-candidates-job-filter",
        title: "Filter by job",
        description:
          "Choose one of your jobs to see only its applicants, or All jobs to see everyone.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidates-sort",
        title: "Sort the list",
        description:
          "Show the newest or oldest applications first, or the ones updated most recently.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-candidates-first-row",
        title: "A candidate",
        description:
          "Each row shows the candidate, their current stage, the job they applied for and when they applied. Select a candidate to see their details.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidates-first-row-shortlist",
        title: "Shortlist",
        description:
          "Select the bookmark to shortlist this candidate. A filled bookmark means they are already shortlisted, and selecting it lets you remove them or edit their shortlist details.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-candidates-first-row-actions",
        title: "Quick actions",
        description:
          "Call or WhatsApp the candidate when your role can see their phone number, or open their full profile in a new tab.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-candidates-empty",
        title: "No candidates found",
        description:
          "Nothing matches your search or filters. Clear the search or change your filters to see more candidates.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidates-pagination",
        title: "Pages",
        description:
          "Use Prev and Next to move between pages when there are more candidates than fit on one.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-candidates-detail-empty",
        title: "Candidate details",
        description:
          "Select a candidate in the list to preview their profile, resume and hiring actions here.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidates-detail-header",
        title: "Selected candidate",
        description:
          "The candidate you selected, with their current stage and the job they applied for.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidates-detail-actions",
        title: "Contact and schedule",
        description:
          "Depending on your permissions, call or WhatsApp the candidate, jump to their resume, or schedule an interview.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidates-detail-status",
        title: "Hiring stage",
        description:
          "If you can update candidates, use Update status to move this candidate to their next stage. Some stages first ask for shortlist, interview or offer details.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidates-detail-tabs",
        title: "Candidate sections",
        description:
          "Switch between the candidate's profile, experience, skills, resume, timeline, and the interview and offer sections your role can see.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidates-detail-resume-actions",
        title: "Resume",
        description:
          "Download the candidate's application as a PDF or print it. The resume preview is shown below when one is available.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidates-detail-interview-save",
        title: "Interview",
        description:
          "Fill in the interview date, time, mode and interviewer, then save to schedule or update the interview.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidates-detail-offer-save",
        title: "Offer details",
        description:
          "Save the offer date, joining date, package and notes, along with any rejection reason.",
        side: "left",
        align: "start",
      },
      employerSidebarStep("candidates", "Candidates"),
      replayStep,
    ],
  },
  {
    id: "employer-candidate-detail",
    label: "Candidate",
    autoStart: true,
    routes: [
      { path: "/employer/candidates/:applicationId", match: "pattern" },
    ],
    steps: [
      {
        target: "employer-candidate-back",
        title: "Back to applicants",
        description:
          "Return to the candidates list, filtered to the job this candidate applied for.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidate-header",
        title: "Candidate summary",
        description:
          "The candidate's name, current stage, the job they applied for, and key details such as experience and when they applied. Some details only show for roles that can see them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidate-timeline",
        title: "Timeline",
        description:
          "Every update on this application, with when it happened and whether it came from you, the candidate or the system.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidate-uploaded-resume",
        title: "Uploaded resume",
        description:
          "This candidate applied with an uploaded resume file. Select Open resume file to view it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-candidate-resume-actions",
        title: "Resume actions",
        description:
          "Preview the resume on this page, download the application as a PDF, or print it, depending on your permissions.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-status",
        title: "Hiring actions",
        description:
          "If you can update candidates, choose the next stage here. Some stages first ask for shortlist, interview or offer details.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-interview",
        title: "Interview details",
        description:
          "Set the interview date, time, mode and interviewer. Scheduling moves the candidate to Interview Scheduled when they are still in an earlier stage.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-interview-save",
        title: "Schedule or update",
        description:
          "Save the interview once the required fields are filled in. It is disabled when nothing has changed or the interview can no longer be edited.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-offer",
        title: "Offer details",
        description:
          "Record the offer date, joining date, package and notes. If the candidate has responded to the offer, their answer is shown here.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-reject-reason",
        title: "Rejection reason",
        description:
          "Write an optional reason for rejecting this candidate. It is saved together with the offer details.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-notes",
        title: "Notes",
        description:
          "Recruiter notes on this candidate. They are private by default, and read-only if your role cannot edit notes.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-notes-share",
        title: "Share notes",
        description:
          "Tick this and save to share the notes with the candidate. Leave it unticked to keep them private.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-notes-actions",
        title: "Save or delete notes",
        description: "Save your changes to the notes, or delete them.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-candidate-save-hiring",
        title: "Save offer and rejection",
        description:
          "Saves the offer details and rejection reason you entered above.",
        side: "top",
        align: "start",
      },
      {
        ...employerSidebarStep("candidates", "Candidates"),
        description:
          "Candidates in the sidebar takes you back to the full list of applicants.",
      },
      replayStep,
    ],
  },
  {
    id: "employer-shortlist-v2",
    label: "Shortlisted Candidates",
    autoStart: true,
    routes: [{ path: "/employer/saved-candidates", match: "exact" }],
    steps: [
      {
        target: "employer-shortlist-header",
        title: "Shortlisted candidates",
        description:
          "Candidates your team has shortlisted from your applicants. Only applications that are currently in the Shortlisted stage are listed here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-job-filter-active",
        title: "Job filter",
        description:
          "You are looking at shortlisted candidates for one job. Select Clear job filter to see all of them again.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-stats",
        title: "Shortlist at a glance",
        description:
          "Totals for your shortlist, including new this week, contacted, interviewed and hired, with the change since last week where available.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-search",
        title: "Search the shortlist",
        description:
          "Search your shortlisted candidates. The list updates as you type.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-add",
        title: "Add a candidate",
        description:
          "Search the applicants on your jobs and save one to this list.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-shortlist-export",
        title: "Export",
        description:
          "Download the shortlisted candidates that match your current filters. You choose the format before the download starts.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-shortlist-filters",
        title: "Filters",
        description:
          "Narrow the list by job title, location, experience and availability.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-more-filters",
        title: "More filters",
        description:
          "Show extra filters for priority and tag. The badge counts how many of them are in use.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-sort",
        title: "Sort",
        description: "Change the order of your shortlisted candidates.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-shortlist-view-toggle",
        title: "Table or grid",
        description:
          "Switch between a compact table and a grid of candidate cards.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-shortlist-empty",
        title: "Nothing shortlisted yet",
        description:
          "Shortlist applicants from the Candidates page, or add one here if your role allows it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-no-results",
        title: "No matches",
        description:
          "No shortlisted candidates match your search or filters. Clear them to see more.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-table-head",
        title: "Shortlist table",
        description:
          "Each row shows the candidate, the job, when they were saved and their tags.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-first-row",
        title: "A shortlisted candidate",
        description:
          "Select a candidate to preview their details and resume. Their priority and tags are shown when set.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-shortlist-first-row-actions",
        title: "Quick actions",
        description:
          "Depending on your permissions, WhatsApp or call the candidate, or schedule or update their interview.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-shortlist-first-row-more",
        title: "More actions",
        description:
          "Edit the candidate's priority, tags and notes, or remove them from the list, depending on your permissions.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-shortlist-pagination",
        title: "Pages",
        description:
          "Move between pages when there are more shortlisted candidates than fit on one.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-shortlist-detail-empty",
        title: "Candidate preview",
        description:
          "Select a candidate in the list to preview their resume and hiring actions here.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-shortlist-detail-header",
        title: "Selected candidate",
        description:
          "The candidate you selected, with their current stage and the job they applied for.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-shortlist-detail-actions",
        title: "Contact and schedule",
        description:
          "Depending on your permissions, call or WhatsApp the candidate, jump to their resume, or schedule an interview.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-shortlist-detail-status",
        title: "Hiring stage",
        description:
          "If you can update candidates, use Update status to move this candidate to their next stage.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-shortlist-detail-resume-actions",
        title: "Resume",
        description:
          "Download the candidate's application as a PDF or print it. The resume preview is shown below when one is available.",
        side: "left",
        align: "start",
      },
      employerSidebarStep("saved-candidates", "Shortlisted Candidates"),
      replayStep,
    ],
  },
];
