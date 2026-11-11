import { employerSidebarStep, replayStep } from "./tour-steps";
import type { ProductTourDefinition, ProductTourStep } from "./types";

function navStep(id: string, title: string, description: string): ProductTourStep {
  return { target: `employer-nav-${id}`, title, description, side: "right" };
}

export const EMPLOYER_HOME_JOBS_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-overview-v2",
    label: "Dashboard",
    autoStart: true,
    routes: [{ path: "/employer/dashboard", match: "exact" }],
    steps: [
      {
        target: "employer-home-welcome",
        title: "Your hiring home",
        description:
          "This dashboard brings your jobs, applications and account updates together in one place.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-welcome-actions",
        title: "Quick start",
        description:
          "Post New Job starts a new listing and Search Candidates opens Candidates. You see each one when your role allows it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-stats",
        title: "Hiring at a glance",
        description:
          "Totals for active jobs, applications, shortlisted candidates, interviews and hires. For the candidate totals, the line underneath compares this week with last week.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-jobs-overview",
        title: "Jobs overview",
        description:
          "Your most recent jobs with their status, applications, shortlisted, hired and views. View All opens the Jobs page.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-jobs-first-row",
        title: "Open your jobs",
        description:
          "Select a row to go to the Jobs page, where you can manage the listing.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-jobs-first-row-actions",
        title: "Job shortcuts",
        description:
          "View the public listing or share its link. If your role allows editing, the pencil opens the job for changes.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-home-jobs-empty",
        title: "No jobs yet",
        description:
          "Until you post a job, this space stays empty. If you can post jobs, Post New Job gets you started.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-home-funnel",
        title: "Recruitment funnel",
        description:
          "See how many applications reached each stage, from Applications and Screening through Shortlisted, Interviews and Offer Sent to Hired.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-funnel-period",
        title: "Choose a period",
        description: "Switch the funnel between This Month, Last Month and All Time.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-home-funnel-conversion",
        title: "Conversion rate",
        description:
          "The share of applications in the selected period that reached Hired.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-home-recruiter-performance",
        title: "Recruiter performance",
        description:
          "This card previews interviews per recruiter. For your actual interview records, select View All to open Interviews.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-recent-applications",
        title: "Recent applications",
        description:
          "The newest applications to your jobs, with each candidate's current status. View All opens Candidates.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-recent-applications-first-row",
        title: "Open an application",
        description:
          "Select an application to see the candidate's details and the job they applied for.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-home-sources",
        title: "Sources performance",
        description:
          "Shows where your applications came from. Applications are currently tracked through the AsliJobs application channel.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-home-subscription",
        title: "Subscription overview",
        description:
          "This card previews plan, usage and billing details. Subscription management is coming soon.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-home-profile-completion",
        title: "Profile completion",
        description:
          "Shows how complete your profile is. View Profile opens it so you can fill in what's missing.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-home-notifications",
        title: "Notifications",
        description:
          "Your latest notifications, with unread ones highlighted. Select one to open it, or View All to see them all.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-home-academy",
        title: "AsliJobs Academy",
        description: "Learning material on hiring best practices is coming soon.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-home-support",
        title: "Need help?",
        description:
          "Quick links to the Help Center, WhatsApp support and our support contacts.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-post-job",
        title: "Post a job",
        description:
          "Post Job starts a new listing from any page. If your account is still being verified, you'll see its verification status instead.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-bell",
        title: "Notification bell",
        description:
          "The bell shows your unread count and latest notifications. You can mark them all as read or open the full list.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-profile-menu",
        title: "Profile menu",
        description:
          "Open it for links to your jobs, profile and settings, and to log out.",
        side: "bottom",
        align: "end",
      },
      employerSidebarStep("dashboard", "Dashboard"),
      navStep(
        "jobs",
        "Jobs",
        "Jobs lists every listing you've posted, with its status, performance and actions.",
      ),
      navStep(
        "candidates",
        "Candidates",
        "Candidates is where you review applications and resumes, schedule interviews and move people through hiring stages.",
      ),
      navStep(
        "saved-candidates",
        "Shortlisted Candidates",
        "Shortlisted Candidates keeps the candidates you've shortlisted and saved for future openings.",
      ),
      navStep(
        "interviews",
        "Interviews",
        "Interviews is where you schedule, manage and track your interviews.",
      ),
      navStep(
        "messages",
        "Messages",
        "Messages collects the hiring notifications for each candidate application in one place.",
      ),
      navStep(
        "company-profile",
        "Your profile",
        "Company Profile (Individual Profile for individual accounts) is where you manage your profile information and preferences.",
      ),
      navStep(
        "team-management",
        "Team Management",
        "Team Management is where you manage your team members, roles, departments and permissions.",
      ),
      navStep(
        "settings",
        "Settings",
        "Settings is where you manage your account and preferences.",
      ),
      replayStep,
    ],
  },
  {
    id: "employer-jobs-v2",
    label: "Jobs",
    autoStart: true,
    routes: [{ path: "/employer/jobs", match: "exact" }],
    steps: [
      {
        target: "employer-jobs-header",
        title: "Your jobs",
        description:
          "Manage your job posts, track how they perform and find the right candidates from here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-jobs-how-it-works",
        title: "How it works?",
        description: "Opens the Help Center whenever you need guidance.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-post-job",
        title: "Post a new job",
        description:
          "Post Job starts a new listing. You can save it as a draft and submit it for review when it's ready.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-jobs-status-tabs",
        title: "Filter by status",
        description:
          "Switch between All Jobs, Under Review, Live, Paused, Draft, Closed, Expired and Rejected. Each tab shows how many jobs it holds.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-jobs-filters",
        title: "More filters",
        description:
          "Narrow the list by employment type, work mode, experience, salary, location, posted job, date posted, applications or openings.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-jobs-search",
        title: "Search jobs",
        description: "Search by job title, role or location. The list updates as you type.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-jobs-stats",
        title: "Job performance",
        description:
          "Totals across all your jobs for active jobs, applications, shortlisted, interviews, hires and views.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-jobs-filter-chips",
        title: "Active filters",
        description: "Each applied filter appears here. Select one to remove it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-jobs-bulk-toolbar",
        title: "Bulk actions",
        description:
          "With jobs selected, you can select every filtered job, clear the selection or delete the selected jobs.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-jobs-table",
        title: "Job list",
        description:
          "Each row shows a job's ID, location, applications, shortlisted, hired, views, status and posting date.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-jobs-first-row",
        title: "A job listing",
        description:
          "Under each title you'll see the job type and number of openings.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-jobs-first-row-applications",
        title: "Applications",
        description:
          "If you can view candidates, select the count to open Candidates for this job.",
        side: "bottom",
        align: "center",
      },
      {
        target: "employer-jobs-first-row-status",
        title: "Status",
        description:
          "Shows where the job stands. Rejected jobs and rejected edits show the reason when one is given.",
        side: "bottom",
        align: "center",
      },
      {
        target: "employer-jobs-first-row-actions",
        title: "Row actions",
        description:
          "Preview, edit, and pause, resume, publish or resubmit a job, depending on its status and your role. Live jobs can be shared, and the more-actions menu can close, reactivate or delete a draft.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-jobs-empty",
        title: "No jobs found",
        description:
          "When nothing matches your tab, search or filters, try changing them or post a new job.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-jobs-pagination",
        title: "Pages",
        description: "Move between pages and choose how many jobs to show per page.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-jobs-quick-actions",
        title: "Quick actions",
        description:
          "If you can post jobs, Post New Job starts a new listing. Job templates and posting from WhatsApp are coming soon.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-jobs-boost",
        title: "Job Boost",
        description: "Boosting a job for more visibility is coming soon.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-jobs-search-candidates",
        title: "Search candidates",
        description:
          "Search Candidates opens Candidates, where you review the people who applied.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-jobs-help",
        title: "Need help?",
        description: "Visit Help Center for help articles and ways to contact support.",
        side: "left",
        align: "start",
      },
      employerSidebarStep("jobs", "Jobs"),
      replayStep,
    ],
  },
  {
    id: "employer-job-under-review",
    label: "Job status",
    autoStart: true,
    routes: [{ path: "/employer/jobs/:jobId/under-review", match: "pattern" }],
    steps: [
      {
        target: "employer-job-review-heading",
        title: "Where your job stands",
        description:
          "This page follows a job after you submit it or edit a live job. The heading changes once the job is approved or needs changes.",
        side: "bottom",
        align: "center",
      },
      {
        target: "employer-job-review-rejection",
        title: "Review feedback",
        description:
          "When the job or your changes are not approved, the reason is shown here.",
        side: "bottom",
        align: "center",
      },
      {
        target: "employer-job-review-summary",
        title: "Job summary",
        description:
          "The job title, status, company, location, employment type and when it was submitted.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-job-review-refresh",
        title: "Refresh status",
        description: "Check for the latest review decision without leaving the page.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-job-review-timeline",
        title: "What happens next?",
        description:
          "Follow the job from submission through AsliJobs verification to going Live.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-job-review-go-to-jobs",
        title: "Go to My Jobs",
        description:
          "Opens your Jobs list on the tab that matches this job's status.",
        side: "top",
        align: "center",
      },
      {
        target: "employer-job-review-edit",
        title: "Edit & Resubmit",
        description:
          "When a job is rejected, update its details and submit it for review again.",
        side: "top",
        align: "center",
      },
      {
        target: "employer-job-review-view-live",
        title: "View Live Job",
        description: "Once approved, open the public listing that job seekers see.",
        side: "top",
        align: "center",
      },
      {
        target: "employer-job-review-post-another",
        title: "Post Another Job",
        description: "Start a new listing straight from here.",
        side: "top",
        align: "center",
      },
      navStep("jobs", "Jobs in the sidebar", "Jobs in the sidebar takes you to your full job list."),
      replayStep,
    ],
  },
];
