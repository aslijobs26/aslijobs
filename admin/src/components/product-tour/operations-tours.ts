import type { ProductTourDefinition, ProductTourStep } from "./types";

const nav = (id: string) => `ops-nav-${id}`;

const replay: ProductTourStep = {
  target: "ops-take-tour",
  title: "Replay any time",
  description:
    "Select Tour to replay the walkthrough for the page you are on, whenever that page has one.",
  side: "bottom",
  align: "end",
};

const orgTabs: ProductTourStep = {
  target: "ops-org-tabs",
  title: "Organization sections",
  description:
    "Move between Structure, People, Teams, Roles & Permissions, Departments and Settings. You only see the sections your role can open.",
  side: "bottom",
};

const activityFilters: ProductTourStep = {
  target: "ops-activity-filters",
  title: "Filter activity",
  description:
    "Show one category of events at a time. Each chip shows how many events it holds.",
  side: "bottom",
};

const activityTimeline: ProductTourStep = {
  target: "ops-activity-timeline",
  title: "Activity timeline",
  description:
    "Each recorded event shows what happened, who did it and when. Links open the related job or candidate.",
  side: "bottom",
  align: "start",
};

const sidebar = (
  id: string,
  name: string,
  align?: ProductTourStep["align"],
): ProductTourStep => ({
  target: nav(id),
  title: `${name} in the sidebar`,
  description: `${name} in the sidebar always takes you back to the main ${name} page.`,
  side: "right",
  align,
});

const pages = (target: string, noun: string): ProductTourStep => ({
  target,
  title: "Pages",
  description: `Move between pages when there are more ${noun} than fit on one.`,
  side: "top",
});

export const OPERATIONS_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "ops-home-v2",
    label: "Command center",
    autoStart: true,
    routes: [{ path: "/operations/home", match: "exact" }],
    steps: [
      {
        target: "ops-home-greeting",
        title: "Welcome to Home",
        description:
          "Home brings today's numbers, the work waiting on your team and shortcuts into each module together on one page. Each section only appears when your role can open it.",
        side: "bottom",
      },
      {
        target: "ops-home-ask-asli",
        title: "Ask ASLI",
        description:
          "This card opens My Work, where your assigned tasks and their next actions are listed.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-home-pulse",
        title: "Platform pulse",
        description:
          "Headline totals for the platform, with today's change where that data is available. Select a card to open the matching list.",
        side: "bottom",
      },
      {
        target: "ops-home-attention",
        title: "What needs attention",
        description:
          "Open work items from the work queue. Each row shows its priority (P1 to P3), who it relates to and when it is due. Use the row's action to open it.",
        side: "right",
      },
      {
        target: "ops-home-attention-tabs",
        title: "Filter by urgency",
        description:
          "Switch between Urgent, SLA Risk, High Priority and Unassigned. The number on each tab is how many items it holds.",
        side: "bottom",
      },
      {
        target: "ops-home-attention-view-all",
        title: "Full work queue",
        description:
          "View all opens the complete work queue, with every item and filter.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-home-registrations",
        title: "New registrations",
        description:
          "Employer and job seeker sign-ups for today and this week, plus the latest accounts. Switch between Employers and Jobseekers, and select an account to open it. NEW marks accounts that have not been seen yet.",
        side: "right",
      },
      {
        target: "ops-home-activity",
        title: "Today's activity",
        description:
          "Today's counts across the platform. Select a tile to open the related list, or View all for the activity log.",
        side: "right",
      },
      {
        target: "ops-home-insights",
        title: "ASLI insights",
        description:
          "Highlights worth a closer look. Each card links to the page where you can follow it up.",
        side: "right",
      },
      {
        target: "ops-home-health",
        title: "Operations health",
        description:
          "A status for each operations area: Healthy, Needs attention or SLA risk. Select an area to open it, or View details for the activity log.",
        side: "left",
      },
      {
        target: "ops-home-team",
        title: "Team workload",
        description:
          "Active members of your operations team and their roles. View team opens team management.",
        side: "left",
      },
      {
        target: "ops-home-quick-actions",
        title: "Quick actions",
        description:
          "Shortcuts to common tasks your role is allowed to start, such as adding a job seeker or posting a job.",
        side: "left",
      },
      {
        target: "ops-global-search",
        title: "Search the platform",
        description:
          "Search candidates, employers, jobs, work items and conversations from anywhere in Operations.",
        side: "bottom",
      },
      {
        target: nav("home"),
        title: "Back to Home",
        description: "Home in the sidebar always brings you back to this command center.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-my-work-v2",
    label: "My Work",
    autoStart: true,
    routes: [{ path: "/operations/my-work", match: "exact" }],
    steps: [
      {
        target: "ops-my-work-header",
        title: "Welcome to My Work",
        description:
          "Your tasks, requests and assignments in one place. What you can do on each item depends on your role.",
        side: "bottom",
      },
      {
        target: "ops-my-work-actions",
        title: "Create, export and review",
        description:
          "Create work adds a new work item, Export downloads the list with your current filters as a spreadsheet, and My Performance opens your performance view. You only see the buttons your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-my-work-kpis",
        title: "Queue at a glance",
        description:
          "Do Now (P1 or overdue), Due Today, Upcoming, Waiting and Completed. Select a card to filter the list below to those items.",
        side: "bottom",
      },
      {
        target: "ops-my-work-tabs",
        title: "Work queues",
        description:
          "Switch between My Queue, Waiting, Completed and All. Each tab shows how many items it holds, and switching resets the type, priority and due filters.",
        side: "bottom",
      },
      {
        target: "ops-my-work-filters",
        title: "Filter, sort and search",
        description:
          "Narrow the list by type, priority and due date, change the sort order, or search by keyword.",
        side: "bottom",
      },
      {
        target: "ops-my-work-list",
        title: "Your work items",
        description:
          "Each item shows its priority, title, type, who it relates to, when it is due and its status. Select a title to open the full work item.",
        side: "bottom",
      },
      {
        target: "ops-my-work-row-actions",
        title: "Item actions",
        description:
          "Open this menu to view details or move the item forward: claim, assign, start, mark waiting, resume or complete. Only the actions that fit the item's status and your role appear.",
        side: "left",
      },
      {
        target: "ops-my-work-pagination",
        title: "Pages",
        description: "Move between pages and choose how many items to show per page.",
        side: "top",
      },
      {
        target: "ops-my-work-focus",
        title: "Today's focus",
        description:
          "Today's goals with their progress. View all filters the list to Do Now items.",
        side: "left",
      },
      {
        target: "ops-my-work-assistant",
        title: "ASLI AI Assistant",
        description:
          "Shows the assistant actions planned for My Work. They are not available yet and are marked Coming soon.",
        side: "left",
      },
      {
        target: "ops-my-work-tip",
        title: "Tip of the day",
        description: "A short working tip for clearing your queue.",
        side: "left",
        align: "end",
      },
      {
        target: nav("my-work"),
        title: "Back to My Work",
        description: "My Work in the sidebar always brings you back to this page.",
        side: "right",
      },
      {
        target: nav("inbox"),
        title: "Inbox",
        description:
          "WhatsApp conversations with job seekers and employers are in Inbox.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-dashboard-v2",
    label: "Operations",
    autoStart: true,
    routes: [{ path: "/operations", match: "exact" }],
    steps: [
      {
        target: "ops-dashboard-modules",
        title: "Welcome to Operations",
        description:
          "The operational summary for the modules your role can read. These tabs open Jobseeker, Employer, Job and Placement operations. Support Operations is not available yet.",
        side: "bottom",
      },
      {
        target: "ops-dashboard-filters",
        title: "Date range, location and team",
        description:
          "Choose the period, state and team. Every card on this page follows these filters.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-dashboard-kpis",
        title: "Operations at a glance",
        description:
          "Jobseekers, employers, jobs and placements for the period, with the change against the previous period. Select a card to open that module.",
        side: "bottom",
      },
      {
        target: "ops-dashboard-trend",
        title: "Operational activity trend",
        description:
          "New jobseekers, employers, jobs and placements over the selected period.",
        side: "right",
      },
      {
        target: "ops-dashboard-location",
        title: "Operations by location",
        description:
          "Activity by state on the map and in the table. Point at a state to see its share and trend.",
        side: "left",
      },
      {
        target: "ops-dashboard-task-status",
        title: "Task status",
        description:
          "How many operational tasks are completed, in progress, pending or overdue.",
        side: "right",
      },
      {
        target: "ops-dashboard-team-performance",
        title: "Team performance",
        description: "Teams ranked by the share of their tasks that are completed.",
        side: "left",
      },
      {
        target: "ops-dashboard-tasks",
        title: "Recent operational tasks",
        description:
          "The latest tasks with their module, assignee, priority, due date and status. View All opens My Work.",
        side: "top",
      },
      {
        target: "ops-dashboard-task-filters",
        title: "Filter tasks",
        description:
          "Switch between All, Pending, In Progress, Overdue and Completed, or search by task name, ID or assignee.",
        side: "bottom",
      },
      {
        target: "ops-dashboard-task-actions",
        title: "Open a task",
        description: "View opens the task.",
        side: "left",
      },
      {
        target: "ops-dashboard-quick-actions",
        title: "Quick actions",
        description:
          "Shortcuts to assign work, create a task, open Verifications and download the operations report. You only see the ones your role allows.",
        side: "left",
      },
      {
        target: "ops-dashboard-teams",
        title: "My teams",
        description:
          "Your teams with their member count and open tasks. View All opens People.",
        side: "left",
      },
      {
        target: "ops-dashboard-alerts",
        title: "Operational alerts",
        description:
          "Backlogs that need attention, such as pending verifications, jobs awaiting moderation, overdue tasks and placements awaiting joining. Select an alert to open the list behind it.",
        side: "left",
      },
      {
        target: "ops-dashboard-assistant",
        title: "Ask ASLI",
        description: "Ask ASLI is not available here yet and is marked Coming soon.",
        side: "left",
        align: "end",
      },
      {
        target: nav("operations-dashboard"),
        title: "Back to Operations",
        description: "Operations in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-employers-v2",
    label: "Employers",
    autoStart: true,
    routes: [{ path: "/operations/employers", match: "exact" }],
    steps: [
      {
        target: "ops-employers-header",
        title: "Welcome to Employers",
        description:
          "Registrations, verification and hiring activity across every employer account, with the full employer list below.",
        side: "bottom",
      },
      {
        target: "ops-employers-actions",
        title: "Date range, export and add",
        description:
          "The date range sets the period for the cards and charts. Export downloads the employer list and Add Employer creates a new account. You only see the buttons your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-employers-kpis",
        title: "Employers at a glance",
        description:
          "Total Employers, New Registrations, Verified Employers, Active Employers and Employers Hiring. Select a card to list those employers, and select it again to return to the charts.",
        side: "bottom",
      },
      {
        target: "ops-employers-trend",
        title: "Registration trend",
        description: "New employer registrations compared with verified employers over time.",
        side: "right",
      },
      {
        target: "ops-employers-funnel",
        title: "Onboarding funnel",
        description: "How many employers have reached each onboarding stage.",
        side: "right",
      },
      {
        target: "ops-employers-hiring-locations",
        title: "Top hiring locations",
        description: "The locations where employers are hiring most. View all opens Jobs.",
        side: "left",
      },
      {
        target: "ops-employers-location",
        title: "Employers by location",
        description: "How employer accounts are spread across locations.",
        side: "right",
      },
      {
        target: "ops-employers-type",
        title: "Employer type",
        description: "The mix of employers by company size and account type.",
        side: "right",
      },
      {
        target: "ops-employers-account-types",
        title: "Account types",
        description: "How many accounts are individuals, companies and consultancies.",
        side: "left",
      },
      {
        target: "ops-employers-tabs",
        title: "Employer lists",
        description:
          "Switch between All, New, Verification Pending, Active and Inactive. The number on each tab is how many employers it holds.",
        side: "bottom",
      },
      {
        target: "ops-employers-filters",
        title: "Search and filter",
        description:
          "Search employers, then narrow the list by registration date, verification, employer type, location and status.",
        side: "bottom",
      },
      {
        target: "ops-employers-list",
        title: "Employer list",
        description:
          "Each row shows the company, industry, location, registration date, verification, jobs posted and account status. Select a company to open it.",
        side: "bottom",
      },
      {
        target: "ops-employers-row-actions",
        title: "Employer actions",
        description:
          "View details or posted jobs, verify or reject verification, suspend or activate the account, or delete it. Only the actions your role allows appear.",
        side: "left",
      },
      {
        target: "ops-employers-pagination",
        title: "Pages",
        description: "Move between pages and choose how many employers to show per page.",
        side: "top",
      },
      {
        target: "ops-employers-quick-actions",
        title: "Quick actions",
        description:
          "Shortcuts to verifications, pending employers, posting a job, the WhatsApp inbox, team management and the employer export. You only see the ones your role allows.",
        side: "left",
      },
      {
        target: "ops-employers-assistant",
        title: "Ask ASLI",
        description: "Ask ASLI opens My Work, where your assigned tasks are listed.",
        side: "left",
        align: "end",
      },
      {
        target: nav("employers"),
        title: "Back to Employers",
        description: "Employers in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-employer-profile",
    label: "Employer profile",
    autoStart: true,
    routes: [{ path: "/operations/employers/:employerId", match: "pattern" }],
    steps: [
      {
        target: "ops-employer-back",
        title: "Back to Employers",
        description: "Returns to the full employer list.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-employer-identity",
        title: "Employer profile",
        description:
          "Company name, verification status, account status and employer ID.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-employer-meta",
        title: "Contact details",
        description: "Phone, email, organisation type and location.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-employer-actions",
        title: "Employer actions",
        description:
          "Post Job, Verify Employer, Reject Verification, and Suspend or Activate Account. Verifying, rejecting, suspending and activating ask you to confirm first. You only see the actions your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-employer-tabs",
        title: "Profile sections",
        description:
          "Overview, Jobs Posted, Documents & Verification and Activity & History. Open a tab and select Tour to walk through that tab.",
        side: "bottom",
      },
      {
        target: "ops-employer-kpis",
        title: "Hiring at a glance",
        description:
          "Total, active and pending jobs, applications, and shortlisted and hired candidates.",
        side: "bottom",
      },
      {
        target: "ops-employer-details",
        title: "Company and contact details",
        description:
          "Organisation details, contact details and verification status. The fields depend on the account type.",
        side: "top",
      },
      {
        target: "ops-employer-about",
        title: "About",
        description: "The company's own description.",
        side: "top",
      },
      {
        target: "ops-employer-jobs-toolbar",
        title: "Posted jobs",
        description:
          "Filter this employer's jobs by status, or select Post New Job to add one.",
        side: "bottom",
      },
      {
        target: "ops-employer-jobs-list",
        title: "Job list",
        description:
          "Each job's category, work mode, location, salary, applications and status. View Job opens it.",
        side: "top",
      },
      pages("ops-employer-jobs-pagination", "jobs"),
      {
        target: "ops-employer-documents",
        title: "Verification documents",
        description:
          "Documents the employer uploaded for verification, with the status of each.",
        side: "top",
      },
      {
        target: "ops-employer-document-actions",
        title: "Open a document",
        description:
          "Preview it here, open it in a new tab or download it. You only see the options your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-employer-journey",
        title: "Employer journey",
        description: "Each stage of the employer's progress so far.",
        side: "bottom",
      },
      {
        target: "ops-employer-activity-summary",
        title: "Activity summary",
        description:
          "Jobs, applications, interviews, hires, saved candidates, last login and last activity. Some tiles are hidden if your role can't view jobs or applications.",
        side: "bottom",
      },
      activityFilters,
      activityTimeline,
      pages("ops-employer-activity-pagination", "events"),
      sidebar("employers", "Employers"),
      replay,
    ],
  },
  {
    id: "ops-job-seekers-v2",
    label: "Jobseekers",
    autoStart: true,
    routes: [{ path: "/operations/candidates", match: "exact" }],
    steps: [
      {
        target: "ops-job-seekers-header",
        title: "Welcome to Jobseekers",
        description:
          "Registrations, profile completion, WhatsApp verification and engagement across all jobseekers, with the full list below.",
        side: "bottom",
      },
      {
        target: "ops-job-seekers-actions",
        title: "Date range and export",
        description:
          "The date range sets the period for the cards and charts. Export downloads the jobseeker list with the current tab and filters, when your role allows it.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-job-seekers-kpis",
        title: "Jobseekers at a glance",
        description:
          "Total Jobseekers, New Registrations, Registration Complete, WhatsApp Verified and Active Jobseekers. Select a card to list those jobseekers, and select it again to return to the charts.",
        side: "bottom",
      },
      {
        target: "ops-job-seekers-trend",
        title: "Registration trend",
        description: "New registrations compared with completed profiles over time.",
        side: "right",
      },
      {
        target: "ops-job-seekers-funnel",
        title: "Profile completion funnel",
        description: "How many jobseekers have reached each step of registration.",
        side: "right",
      },
      {
        target: "ops-job-seekers-language",
        title: "By language",
        description: "The languages jobseekers reported.",
        side: "left",
      },
      {
        target: "ops-job-seekers-location",
        title: "By location",
        description:
          "Jobseekers by state or city. Switch between States and Cities, and choose Top 5, Top 10 or All.",
        side: "right",
      },
      {
        target: "ops-job-seekers-experience",
        title: "By experience",
        description: "Jobseekers grouped by experience level.",
        side: "right",
      },
      {
        target: "ops-job-seekers-categories",
        title: "Top job categories",
        description: "The job categories jobseekers prefer most.",
        side: "left",
      },
      {
        target: "ops-job-seekers-tabs",
        title: "Jobseeker lists",
        description:
          "Switch between All, New, Profile Incomplete and WhatsApp Pending. The number on each tab is how many jobseekers it holds.",
        side: "bottom",
      },
      {
        target: "ops-job-seekers-filters",
        title: "Search and filter",
        description:
          "Search by name, ID or job, then narrow the list by registration date, experience, gender, preferred role, location, registration status and applications.",
        side: "bottom",
      },
      {
        target: "ops-job-seekers-list",
        title: "Jobseeker list",
        description:
          "Each row shows the jobseeker, contact, preferred roles, experience, location, registration date, applications and profile status. Select a name to open the profile.",
        side: "bottom",
      },
      {
        target: "ops-job-seekers-row-actions",
        title: "Jobseeker actions",
        description:
          "View the profile, copy the candidate ID, or delete the account when your role allows it.",
        side: "left",
      },
      {
        target: "ops-job-seekers-pagination",
        title: "Pages",
        description: "Move between pages and choose how many jobseekers to show per page.",
        side: "top",
      },
      {
        target: "ops-job-seekers-quick-actions",
        title: "Quick actions",
        description:
          "Export the jobseeker list, or jump to incomplete profiles or pending WhatsApp verifications.",
        side: "left",
      },
      {
        target: "ops-job-seekers-assistant",
        title: "Ask ASLI",
        description: "Ask ASLI opens My Work, where your assigned tasks are listed.",
        side: "left",
        align: "end",
      },
      {
        target: nav("jobseekers"),
        title: "Back to Jobseekers",
        description: "Jobseekers in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-job-seeker-profile",
    label: "Jobseeker profile",
    autoStart: true,
    routes: [{ path: "/operations/candidates/:jobSeekerId", match: "pattern" }],
    steps: [
      {
        target: "ops-candidate-back",
        title: "Back to Candidates",
        description: "Returns to the full jobseeker list.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-candidate-identity",
        title: "Jobseeker profile",
        description:
          "Name, registration status, WhatsApp verification and the jobseeker ID.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-candidate-contact",
        title: "Contact details",
        description: "Phone, email and location.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-candidate-stats",
        title: "Registration and activity",
        description:
          "When they registered, when they were last active, and how much of the profile is filled in. The fill score is separate from registration status.",
        side: "bottom",
      },
      {
        target: "ops-candidate-resume",
        title: "Resume",
        description:
          "Download Resume saves their resume when one is uploaded. You only see this if your role can view documents.",
        side: "left",
        align: "start",
      },
      {
        target: "ops-candidate-tabs",
        title: "Profile sections",
        description:
          "Overview, Applications, Job Preferences, Profile Details, Documents and Activity & History. Open a tab and select Tour to walk through that tab.",
        side: "bottom",
      },
      {
        target: "ops-candidate-kpis",
        title: "At a glance",
        description: "Experience, applications, shortlisted applications and registration.",
        side: "bottom",
      },
      {
        target: "ops-candidate-about",
        title: "About Candidate",
        description:
          "Summary, date of birth, current location, gender, availability, languages and preferred work mode.",
        side: "right",
      },
      {
        target: "ops-candidate-skills",
        title: "Skills",
        description: "The skills listed on their profile.",
        side: "left",
      },
      {
        target: "ops-candidate-education",
        title: "Education",
        description: "Their highest education.",
        side: "left",
      },
      {
        target: "ops-candidate-interests",
        title: "Job preferences",
        description:
          "Positions they are interested in, preferred locations, salary range and work type.",
        side: "right",
      },
      {
        target: "ops-candidate-expected",
        title: "Expected details",
        description: "Expected salary, registration status and profile fill score.",
        side: "left",
      },
      {
        target: "ops-candidate-applications",
        title: "Applications",
        description:
          "Jobs they applied to, with the employer, dates and status. On Overview, View all applications opens the Applications tab when there are more.",
        side: "top",
      },
      {
        target: "ops-candidate-application-actions",
        title: "Open a job",
        description: "View Details opens the job they applied to.",
        side: "left",
      },
      pages("ops-candidate-applications-pagination", "applications"),
      {
        target: "ops-candidate-pref-interests",
        title: "Job preferences",
        description:
          "Positions, locations, work type, work mode, preferred salary and availability.",
        side: "right",
      },
      {
        target: "ops-candidate-pref-skills",
        title: "Skills",
        description: "The skills listed on their profile.",
        side: "left",
      },
      {
        target: "ops-candidate-personal",
        title: "Personal information",
        description:
          "Name, phone, email, gender, date of birth, address, languages and experience.",
        side: "right",
      },
      {
        target: "ops-candidate-experience",
        title: "Education and experience",
        description: "Their education and work experience.",
        side: "left",
      },
      {
        target: "ops-candidate-about-details",
        title: "About",
        description: "Their own summary.",
        side: "top",
      },
      {
        target: "ops-candidate-documents",
        title: "Documents",
        description: "Their resume, when they have uploaded one.",
        side: "bottom",
      },
      {
        target: "ops-candidate-document-actions",
        title: "Preview or download",
        description:
          "Preview opens the resume here, and Download saves the file.",
        side: "left",
      },
      {
        target: "ops-candidate-journey",
        title: "Jobseeker journey",
        description: "Each stage of their progress so far.",
        side: "bottom",
      },
      {
        target: "ops-candidate-activity-summary",
        title: "Activity summary",
        description:
          "Applications, active applications, interviews, offers, hires, saved jobs and last activity.",
        side: "bottom",
      },
      activityFilters,
      activityTimeline,
      pages("ops-candidate-activity-pagination", "events"),
      sidebar("jobseekers", "Jobseekers"),
      replay,
    ],
  },
  {
    id: "ops-jobs-v2",
    label: "Jobs",
    autoStart: true,
    routes: [{ path: "/operations/jobs", match: "exact" }],
    steps: [
      {
        target: "ops-jobs-header",
        title: "Welcome to Jobs",
        description:
          "Job postings, approvals, performance and demand across all employers, with the job list below.",
        side: "bottom",
      },
      {
        target: "ops-jobs-actions",
        title: "Date range, post and export",
        description:
          "The date range sets the period for the cards and charts. Post a Job opens the job form and Export downloads these analytics as a CSV file. You only see the buttons your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-jobs-kpis",
        title: "Jobs at a glance",
        description:
          "Total Jobs, Pending Approval, At Risk of Expiry, Active Jobs and Filled / Closed. Select a card to list those jobs in place of the charts, and select it again to bring the charts back.",
        side: "bottom",
      },
      {
        target: "ops-jobs-trend",
        title: "Job postings trend",
        description: "Jobs posted compared with jobs approved over time.",
        side: "right",
      },
      {
        target: "ops-jobs-status",
        title: "Jobs by status",
        description: "How jobs are spread across their lifecycle, from pending to closed.",
        side: "right",
      },
      {
        target: "ops-jobs-industry",
        title: "Jobs by industry",
        description: "The industries with the most jobs.",
        side: "left",
      },
      {
        target: "ops-jobs-location",
        title: "Jobs by location",
        description: "Where active jobs are located. Use the tabs to change the breakdown.",
        side: "right",
      },
      {
        target: "ops-jobs-roles",
        title: "Top job roles",
        description: "The most common job titles.",
        side: "right",
      },
      {
        target: "ops-jobs-employment-type",
        title: "Employment type",
        description: "The split between full-time, part-time and contract jobs.",
        side: "left",
      },
      {
        target: "ops-jobs-tabs",
        title: "Job lists",
        description:
          "Switch between All, Pending Approval, At Risk and Recently Closed. A dot on Pending Approval means jobs are waiting for review.",
        side: "bottom",
      },
      {
        target: "ops-jobs-filters",
        title: "Search and filter",
        description: "Search jobs, then narrow the list by status, payment and state.",
        side: "bottom",
      },
      {
        target: "ops-jobs-list",
        title: "Job list",
        description:
          "Each row shows the job ID and title, employer, vacancies, location, posting date, applications, status and payment.",
        side: "bottom",
      },
      {
        target: "ops-jobs-row-actions",
        title: "Job actions",
        description:
          "Approve or reject jobs waiting for review, pause, close, activate or mark a job expired, copy its job ID or delete it. Only the actions that fit the job's status and your role appear.",
        side: "left",
      },
      {
        target: "ops-jobs-quick-actions",
        title: "Quick actions",
        description:
          "Jump to jobs waiting for approval or at risk, post a job, or download the jobs report. You only see the ones your role allows.",
        side: "left",
      },
      {
        target: "ops-jobs-assistant",
        title: "Ask ASLI",
        description: "Ask ASLI opens My Work, where your assigned tasks are listed.",
        side: "left",
        align: "end",
      },
      {
        target: nav("jobs"),
        title: "Back to Jobs",
        description: "Jobs in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-job-detail",
    label: "Job details",
    autoStart: true,
    routes: [{ path: "/operations/jobs/:jobId", match: "pattern" }],
    steps: [
      {
        target: "ops-job-back",
        title: "Back to Jobs",
        description: "Returns to the job list.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-job-status-banner",
        title: "Job status notice",
        description:
          "Explains why this job is not live, for example while it waits for approval or after it was rejected.",
        side: "bottom",
      },
      {
        target: "ops-job-identity",
        title: "The job",
        description:
          "Title, status, job ID, job type and when it was posted or submitted. Select the job ID to copy it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-job-employer",
        title: "Posted by",
        description:
          "The employer and their verification status. View Employer Profile opens the employer.",
        side: "bottom",
      },
      {
        target: "ops-job-location",
        title: "Location and category",
        description: "Where the job is and its job category.",
        side: "bottom",
      },
      {
        target: "ops-job-actions",
        title: "Job actions",
        description:
          "While a job waits for approval you can Approve & Publish or Reject it; approval needs a verified employer. Otherwise you can Edit Job or Close Job. You only see the actions your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-job-stats",
        title: "Applications and views",
        description: "Total applications and total views for this job.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-job-tabs",
        title: "Job sections",
        description:
          "Job Overview, Applications, Job Activity and Job Preview. Open a tab and select Tour to walk through that tab.",
        side: "bottom",
      },
      {
        target: "ops-job-change-review",
        title: "Proposed changes",
        description:
          "Changes submitted to a live job, shown against the current version so you can review them before approving.",
        side: "bottom",
      },
      {
        target: "ops-job-description",
        title: "Job description",
        description: "The description, key responsibilities and requirements.",
        side: "right",
      },
      {
        target: "ops-job-information",
        title: "Job information",
        description: "The details entered when the job was posted.",
        side: "left",
      },
      {
        target: "ops-job-highlights",
        title: "Key requirements",
        description: "Experience, salary, gender and education.",
        side: "top",
      },
      {
        target: "ops-job-status-card",
        title: "Status and visibility",
        description: "Status, visibility, auto expiry and days remaining.",
        side: "left",
      },
      {
        target: "ops-job-performance",
        title: "Job performance",
        description:
          "Total views, total applications, WhatsApp shares and today's applications.",
        side: "left",
      },
      {
        target: "ops-job-applications",
        title: "Applications",
        description:
          "Candidates who applied, with contact details, experience, application date, source and status.",
        side: "top",
      },
      {
        target: "ops-job-application-actions",
        title: "Open a candidate",
        description: "View Details opens the candidate's profile.",
        side: "left",
      },
      pages("ops-job-applications-pagination", "applications"),
      {
        target: "ops-job-activity",
        title: "Job activity",
        description: "Events recorded for this job, with when each one happened.",
        side: "top",
      },
      {
        target: "ops-job-preview-language",
        title: "Preview language",
        description:
          "Choose a language to see the listing translated. Original content is shown until a translation is ready.",
        side: "bottom",
      },
      {
        target: "ops-job-preview-card",
        title: "Job preview",
        description: "How this job listing looks to jobseekers.",
        side: "top",
      },
      sidebar("jobs", "Jobs"),
      replay,
    ],
  },
  {
    id: "ops-post-job",
    label: "Post a job",
    routes: [{ path: "/operations/jobs/post", match: "exact" }],
    steps: [
      {
        target: "ops-post-job-topbar",
        title: "Job status",
        description:
          "Shows how far this job has got: Draft, Employer Assigned, Ready to Publish or Live. The cross returns to Jobs.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-post-job-steps",
        title: "Three steps",
        description:
          "Job Information, Location & Salary, and Candidate & Interview. Select a step to jump to it; going forward checks the steps in between first.",
        side: "bottom",
      },
      {
        target: "ops-post-job-fields",
        title: "Job details",
        description:
          "Fill in this step's fields from here down. Required fields are marked with *, and any problem is shown under its field.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-post-job-employer",
        title: "Employer assignment",
        description:
          "Choose the employer this job belongs to. The job can only be ready to publish once an employer is assigned.",
        side: "top",
      },
      {
        target: "ops-post-job-buttons",
        title: "Save and continue",
        description:
          "Back returns to the previous step, Save Draft keeps your progress, and Continue checks this step and moves on. Publish Job appears on the last step. When editing a posted job, Save Changes replaces them.",
        side: "top",
        align: "end",
      },
      {
        target: "ops-post-job-preview",
        title: "WhatsApp preview",
        description: "How the job alert will look on WhatsApp, updated as you fill in the form.",
        side: "left",
        align: "start",
      },
      sidebar("jobs", "Jobs"),
      replay,
    ],
  },
  {
    id: "ops-verifications-v2",
    label: "Verifications",
    autoStart: true,
    routes: [{ path: "/operations/verifications", match: "exact" }],
    steps: [
      {
        target: "ops-verifications-header",
        title: "Welcome to Verifications",
        description:
          "Employer verification requests, their documents and how quickly they are decided.",
        side: "bottom",
      },
      {
        target: "ops-verifications-actions",
        title: "Date range, verify and export",
        description:
          "The date range sets the period for the cards and charts. Verify Employer opens the Pending tab and Export downloads the verification report. You only see the buttons your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-verifications-kpis",
        title: "Verifications at a glance",
        description:
          "Total Verifications, Pending Review, Verified Employers, Needs Attention and Rejected. Select a card to list those requests, and select it again to return to the overview.",
        side: "bottom",
      },
      {
        target: "ops-verifications-tabs",
        title: "Verification views",
        description:
          "Overview shows the charts. Pending, Under Review, Verified, Rejected and SLA Breaches filter the list to those requests.",
        side: "bottom",
      },
      {
        target: "ops-verifications-trend",
        title: "Verifications trend",
        description: "Verification activity over the selected period.",
        side: "right",
      },
      {
        target: "ops-verifications-status",
        title: "Verifications by status",
        description: "The current mix of verification statuses.",
        side: "right",
      },
      {
        target: "ops-verifications-documents",
        title: "Document breakdown",
        description: "How the submitted documents break down by verification result.",
        side: "left",
      },
      {
        target: "ops-verifications-industry",
        title: "Verifications by industry",
        description: "Verification requests grouped by the employer's industry.",
        side: "right",
      },
      {
        target: "ops-verifications-location",
        title: "Verifications by location",
        description: "Verification requests grouped by state.",
        side: "right",
      },
      {
        target: "ops-verifications-sla",
        title: "SLA performance",
        description:
          "Average days to a decision against the target, and the share of requests decided within and beyond the SLA.",
        side: "left",
      },
      {
        target: "ops-verifications-filters",
        title: "Search and filter",
        description:
          "Search employers, then narrow the list by status, industry, location and submission date.",
        side: "bottom",
      },
      {
        target: "ops-verifications-list",
        title: "Verification requests",
        description:
          "Each row shows the company, industry, location, submission date, documents, status, SLA and who it is assigned to.",
        side: "bottom",
      },
      {
        target: "ops-verifications-row-actions",
        title: "Review a request",
        description:
          "Review opens the request so you can check the documents and record a decision. It shows View instead when your role can only read it.",
        side: "left",
      },
      {
        target: "ops-verifications-pagination",
        title: "Pages",
        description: "Move between pages and choose how many requests to show per page.",
        side: "top",
      },
      {
        target: "ops-verifications-quick-actions",
        title: "Quick actions",
        description:
          "Shortcuts to pending, SLA-breached and rejected verifications, and the verification report. You only see the ones your role allows.",
        side: "left",
      },
      {
        target: "ops-verifications-assistant",
        title: "Ask ASLI",
        description: "Ask ASLI opens My Work, where your assigned tasks are listed.",
        side: "left",
        align: "end",
      },
      {
        target: nav("verifications"),
        title: "Back to Verifications",
        description: "Verifications in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-placements-v2",
    label: "Placements",
    autoStart: true,
    routes: [{ path: "/operations/placements", match: "exact" }],
    steps: [
      {
        target: "ops-placements-header",
        title: "Welcome to Placements",
        description: "Offers, joining outcomes and placement performance across ASLI Jobs.",
        side: "bottom",
      },
      {
        target: "ops-placements-actions",
        title: "Date range and export",
        description:
          "The date range sets the period for the cards and charts. Export downloads the placement list when your role allows it.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-placements-kpis",
        title: "Placements at a glance",
        description:
          "Total Placements, Joined, Joining Pending, Did Not Join and the average time to join. Select a card to list those placements, and select it again to return to the charts.",
        side: "bottom",
      },
      {
        target: "ops-placements-trend",
        title: "Placements trend",
        description: "Placements over the selected period.",
        side: "right",
      },
      {
        target: "ops-placements-funnel",
        title: "Placement funnel",
        description: "How many candidates reached each stage on the way to joining.",
        side: "right",
      },
      {
        target: "ops-placements-category",
        title: "Placements by category",
        description: "Placements grouped by job category.",
        side: "left",
      },
      {
        target: "ops-placements-location",
        title: "Placements by location",
        description: "Placements grouped by state.",
        side: "right",
      },
      {
        target: "ops-placements-joining",
        title: "Joining status",
        description: "The current mix of joined, pending and did-not-join placements.",
        side: "right",
      },
      {
        target: "ops-placements-time-to-join",
        title: "Time to join",
        description:
          "The average number of days from offer to joining. Its period selector changes the date range for the whole page.",
        side: "left",
      },
      {
        target: "ops-placements-tabs",
        title: "Placement lists",
        description:
          "Switch between All, Joined, Joining Pending and Did Not Join. The number on each tab is how many placements it holds.",
        side: "bottom",
      },
      {
        target: "ops-placements-search",
        title: "Search placements",
        description: "Search by candidate, company or job.",
        side: "top",
      },
      {
        target: "ops-placements-list",
        title: "Placement list",
        description:
          "Each row shows the candidate, job role, company, location, offer date, joining date and status.",
        side: "bottom",
      },
      {
        target: "ops-placements-row-actions",
        title: "Placement details",
        description: "View opens the full placement record.",
        side: "left",
      },
      {
        target: "ops-placements-pagination",
        title: "Pages",
        description: "Move between pages and choose how many placements to show per page.",
        side: "top",
      },
      {
        target: "ops-placements-insights",
        title: "Key insights",
        description: "Highlights for the selected period.",
        side: "left",
      },
      {
        target: "ops-placements-quick-actions",
        title: "Quick actions",
        description:
          "Shortcuts to offers, joining-pending and did-not-join placements, and the placements report. Success Stories is marked Coming soon.",
        side: "left",
      },
      {
        target: "ops-placements-assistant",
        title: "Ask ASLI",
        description:
          "Ask ASLI is not available for Placements yet and is marked Coming soon.",
        side: "left",
        align: "end",
      },
      {
        target: nav("placements"),
        title: "Back to Placements",
        description: "Placements in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-placements-list",
    label: "All placements",
    autoStart: true,
    routes: [{ path: "/operations/placements/list", match: "exact" }],
    steps: [
      {
        target: "ops-placements-list-header",
        title: "All placements",
        description:
          "The full placement list. The breadcrumb takes you back to Placements.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-placements-list-export",
        title: "Export",
        description:
          "Downloads the placements that match your filters. You only see this if your role can export.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-placements-list-filters",
        title: "Search and filter",
        description:
          "Search by candidate, company or job, and filter by category, state, city and date range. Reset clears the filters.",
        side: "bottom",
      },
      {
        target: "ops-placements-tabs",
        title: "Placement lists",
        description:
          "Switch between All, Joined, Joining Pending and Did Not Join.",
        side: "bottom",
      },
      {
        target: "ops-placements-list",
        title: "Placement list",
        description:
          "Each row shows the candidate, job role, company, location, offer date, joining date and status.",
        side: "bottom",
      },
      {
        target: "ops-placements-row-actions",
        title: "Placement details",
        description: "View opens the full placement record.",
        side: "left",
      },
      pages("ops-placements-list-pagination", "placements"),
      sidebar("placements", "Placements"),
      replay,
    ],
  },
  {
    id: "ops-placement-detail",
    label: "Placement",
    autoStart: true,
    routes: [{ path: "/operations/placements/:placementId", match: "pattern" }],
    steps: [
      {
        target: "ops-placement-back",
        title: "Back to list",
        description: "Returns to All Placements.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-placement-header",
        title: "The placement",
        description:
          "The candidate, joining status, placement ID, job role, company and location.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-placement-joining",
        title: "Update joining",
        description:
          "Add optional remarks, then select Joined or Did Not Join. You only see this while joining can still be updated and your role allows it.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-placement-candidate",
        title: "Candidate",
        description:
          "Name, phone, email and location. Select the name to open their profile.",
        side: "right",
      },
      {
        target: "ops-placement-job",
        title: "Job",
        description:
          "Title, public job ID, category and location. Select the title to open the job.",
        side: "right",
      },
      {
        target: "ops-placement-employer",
        title: "Employer",
        description:
          "Phone, email and whether the employer is verified. Select the name to open the employer.",
        side: "left",
      },
      {
        target: "ops-placement-offer",
        title: "Offer",
        description: "Offer date, joining date, package, notes and days to join.",
        side: "left",
      },
      {
        target: "ops-placement-timeline",
        title: "Timeline",
        description: "Each status change on this placement is listed here, starting with this entry.",
        side: "bottom",
        align: "start",
      },
      sidebar("placements", "Placements"),
      replay,
    ],
  },
  {
    id: "ops-inbox-v2",
    label: "Inbox",
    autoStart: true,
    routes: [
      { path: "/operations/inbox", match: "exact" },
      { path: "/operations/whatsapp-inbox", match: "exact" },
    ],
    steps: [
      {
        target: "ops-inbox-list",
        title: "Welcome to Inbox",
        description:
          "WhatsApp conversations with job seekers and employers. History appears only for messages AsliJobs has stored.",
        side: "right",
      },
      {
        target: "ops-inbox-mode",
        title: "Chats and contacts",
        description:
          "Chats lists saved conversations. Contacts lists registered job seekers and employers, so you can open a conversation with someone new.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-inbox-search",
        title: "Search",
        description: "Search chats by name or phone, or search registered contacts.",
        side: "bottom",
      },
      {
        target: "ops-inbox-filters",
        title: "Who you are talking to",
        description: "Show everyone, only job seekers or only employers.",
        side: "bottom",
      },
      {
        target: "ops-inbox-conversations",
        title: "Conversations",
        description: "Select a conversation or contact to open its WhatsApp history.",
        side: "right",
      },
      {
        target: "ops-inbox-thread",
        title: "The conversation",
        description:
          "The selected conversation's messages appear here, with the newest at the bottom.",
        side: "left",
      },
      {
        target: "ops-inbox-status",
        title: "Handling status",
        description:
          "Bot active means the assistant is replying. Human handling means a person has taken over.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-inbox-translate",
        title: "Translation",
        description:
          "Choose a language to read a translation of the conversation. The original messages stay available.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-inbox-bot",
        title: "Pause or resume the bot",
        description:
          "Pause bot stops the assistant replying so you can handle the conversation. Resume bot hands it back.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-inbox-composer",
        title: "Reply",
        description:
          "Write a reply, attach a file, add an emoji or translate your draft before sending. When WhatsApp does not allow a free-form reply, the reason is shown here and the box is disabled.",
        side: "top",
      },
      {
        target: "ops-inbox-contact",
        title: "Contact details",
        description:
          "Who you are talking to, links to their profile, and their recent applications or jobs.",
        side: "left",
      },
      {
        target: nav("inbox"),
        title: "Back to Inbox",
        description: "Inbox in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-analytics-v2",
    label: "Analytics",
    autoStart: true,
    routes: [{ path: "/operations/analytics", match: "exact" }],
    steps: [
      {
        target: "ops-analytics-header",
        title: "Welcome to Analytics",
        description:
          "Platform, website and hiring analytics built from AsliJobs data.",
        side: "bottom",
      },
      {
        target: "ops-analytics-filters",
        title: "Filters",
        description:
          "Below, choose the date range, forecast horizon, location, category, employer, job type and application status, then select Apply. Reset undoes unapplied changes and Clear all returns to the last 6 months.",
        side: "top",
      },
      {
        target: "ops-analytics-tabs",
        title: "Analytics sections",
        description:
          "Insights shows everything together. The other tabs focus on website traffic, trends, the hiring funnel, supply and demand, market and placement intelligence, forecasts and the downloadable report.",
        side: "bottom",
      },
      {
        target: "ops-analytics-interviews",
        title: "Interview outcomes",
        description:
          "Interviews scheduled, completed, rescheduled and cancelled in the period.",
        side: "bottom",
      },
      {
        target: "ops-analytics-kpis",
        title: "Platform overview",
        description:
          "The cards below show headline numbers for the period, with the change against the previous period. Where a card shows View records, select it to see the records behind the number.",
        side: "top",
      },
      {
        target: "ops-analytics-traffic",
        title: "Website traffic",
        description:
          "Page views, visitors and sessions on the public site and portals, with a daily chart below.",
        side: "top",
      },
      {
        target: "ops-analytics-trends",
        title: "Platform trends",
        description:
          "Placements, joins, registrations and jobs created over the selected period.",
        side: "top",
      },
      {
        target: "ops-analytics-insights",
        title: "Key insights",
        description:
          "The highlights below are drawn from platform data. Each one links to the page where you can act on it.",
        side: "top",
      },
      {
        target: "ops-analytics-funnel",
        title: "Hiring funnel",
        description:
          "How many applications reach each hiring stage, and the conversion at each step.",
        side: "right",
      },
      {
        target: "ops-analytics-supply-demand",
        title: "Supply and demand",
        description:
          "Registered jobseekers compared with active jobs in each category, marked as a shortage, surplus or balanced.",
        side: "right",
      },
      {
        target: "ops-analytics-locations",
        title: "Top locations",
        description:
          "Locations ranked by opportunity, based on the gap between demand and supply and on growth.",
        side: "left",
      },
      {
        target: "ops-analytics-placement",
        title: "Placement intelligence",
        description:
          "Average time to placement, interview to offer rate, employer repeat hiring rate and the top performing category.",
        side: "right",
      },
      {
        target: "ops-analytics-market",
        title: "Market intelligence",
        description: "Talent supply, job demand and placement rate for each state.",
        side: "right",
      },
      {
        target: "ops-analytics-forecasts",
        title: "Forecasts",
        description:
          "Estimates projected from historical daily counts. They are not guaranteed outcomes.",
        side: "left",
      },
      {
        target: "ops-analytics-report",
        title: "Report summary",
        description:
          "The table below lists every metric for the period. If you have export access, Download CSV saves it as a file.",
        side: "top",
      },
      {
        target: nav("analytics"),
        title: "Back to Analytics",
        description: "Analytics in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-organization",
    label: "Organization",
    autoStart: true,
    routes: [{ path: "/operations/organization", match: "exact" }],
    steps: [
      {
        target: "ops-org-header",
        title: "Welcome to Organization",
        description:
          "ASLI's structure of regions, states, cities and offices, with the teams, people and roles in each.",
        side: "bottom",
      },
      {
        target: "ops-org-actions",
        title: "Scope, search and add",
        description:
          "Scope limits the hierarchy to one region or country and search finds units by name. Add creates an organization unit, or a sub-unit inside the selected one, if your role allows it.",
        side: "bottom",
        align: "end",
      },
      orgTabs,
      {
        target: "ops-org-hierarchy",
        title: "Organization hierarchy",
        description:
          "Expand a unit with its arrow and select it to open its details. Search in hierarchy filters this tree.",
        side: "right",
      },
      {
        target: "ops-org-unit",
        title: "Selected unit",
        description: "The unit you selected and where it sits in the organization.",
        side: "bottom",
      },
      {
        target: "ops-org-unit-actions",
        title: "Unit actions",
        description:
          "Edit changes this unit, Add Sub-unit creates a unit inside it and the … button archives it. You only see the actions your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-org-unit-tabs",
        title: "Unit sections",
        description:
          "Overview, plus the teams, people, departments, roles and settings that belong to this unit.",
        side: "bottom",
      },
      {
        target: "ops-org-kpis",
        title: "Unit at a glance",
        description: "People, teams, departments and cities in this unit.",
        side: "bottom",
      },
      {
        target: "ops-org-map",
        title: "Location map",
        description:
          "Where this unit is. Select a state or district on the map to open its unit, where one exists.",
        side: "right",
      },
      {
        target: "ops-org-key-info",
        title: "Key information",
        description:
          "Region, country, state, head, established date, people, teams, primary office and coordinates.",
        side: "left",
      },
      {
        target: "ops-org-quick-actions",
        title: "Quick actions",
        description:
          "Shortcuts for this unit, such as adding a team or department, assigning people and managing roles. You only see the ones your role allows.",
        side: "left",
      },
      {
        target: "ops-org-teams",
        title: "Teams in this unit",
        description:
          "Each team's department, people, lead and status. View All opens Teams.",
        side: "right",
      },
      {
        target: "ops-org-people",
        title: "People by department",
        description:
          "How the unit's people are spread across departments. View All opens People.",
        side: "left",
      },
      {
        target: nav("organization"),
        title: "Back to Organization",
        description: "Organization in the sidebar always returns you to this page.",
        side: "right",
      },
      replay,
    ],
  },
  {
    id: "ops-people",
    label: "People",
    autoStart: true,
    routes: [{ path: "/operations/team", match: "exact" }],
    steps: [
      {
        target: "ops-people-header",
        title: "Welcome to People",
        description:
          "Everyone in the organization, with their role, department and access. Organization at the top takes you back to the structure.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-people-actions",
        title: "Add member",
        description:
          "Add member opens a form to add a person with their role, department, location and team. You only see it if your role can add people.",
        side: "bottom",
        align: "end",
      },
      orgTabs,
      {
        target: "ops-people-kpis",
        title: "People at a glance",
        description:
          "Team members, active and inactive people, custom roles, departments and pending invites.",
        side: "bottom",
      },
      {
        target: "ops-people-filters",
        title: "Search and filter",
        description:
          "Search by name or email, and filter by status, department, location and team.",
        side: "bottom",
      },
      {
        target: "ops-people-list",
        title: "Member list",
        description:
          "Each person's role, department, team, location, status, and when they were created and last active. Contact columns appear if your role can see them.",
        side: "top",
      },
      {
        target: "ops-people-row-actions",
        title: "Member actions",
        description:
          "Resend invitation for someone who hasn't joined yet, or Edit. The ⋮ menu can also activate, deactivate or delete a member. You only see the actions your role allows.",
        side: "top",
        align: "end",
      },
      pages("ops-people-pagination", "people"),
      sidebar("organization", "Organization"),
      replay,
    ],
  },
  {
    id: "ops-teams",
    label: "Teams",
    autoStart: true,
    routes: [{ path: "/operations/teams", match: "exact" }],
    steps: [
      {
        target: "ops-teams-header",
        title: "Welcome to Teams",
        description:
          "Operational teams with their location, lead and members. Organization at the top takes you back to the structure.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-teams-actions",
        title: "Create team",
        description:
          "Create team adds a team with its department, location and an optional lead. You only see it if your role can create teams.",
        side: "bottom",
        align: "end",
      },
      orgTabs,
      {
        target: "ops-teams-kpis",
        title: "Teams at a glance",
        description:
          "Total, active and inactive teams, locations, departments and open work.",
        side: "bottom",
      },
      {
        target: "ops-teams-filters",
        title: "Search and filter",
        description:
          "Search teams and filter by department, location and status. Only active teams are shown by default.",
        side: "bottom",
      },
      {
        target: "ops-teams-list",
        title: "Team list",
        description:
          "Each team's department, location, lead, members, open work, status and creation date.",
        side: "top",
      },
      {
        target: "ops-teams-row-actions",
        title: "Team actions",
        description:
          "The ⋮ menu opens the team, or archives an active team if your role allows it.",
        side: "top",
        align: "end",
      },
      pages("ops-teams-pagination", "teams"),
      sidebar("organization", "Organization"),
      replay,
    ],
  },
  {
    id: "ops-team-detail",
    label: "Team",
    autoStart: true,
    routes: [{ path: "/operations/teams/:teamId", match: "pattern" }],
    steps: [
      {
        target: "ops-team-header",
        title: "Team",
        description: "This team's members, lead and work. Teams at the top returns to the list.",
        side: "bottom",
        align: "start",
      },
      orgTabs,
      {
        target: "ops-team-summary",
        title: "Team summary",
        description: "Status, team code, department, location and description.",
        side: "bottom",
      },
      {
        target: "ops-team-stats",
        title: "Lead, members and work",
        description: "The team lead, active members, open work and when the team was last updated.",
        side: "bottom",
      },
      {
        target: "ops-team-tabs",
        title: "Team sections",
        description:
          "Overview, Members, Work and Settings. Open a tab and select Tour to walk through that tab.",
        side: "bottom",
      },
      {
        target: "ops-team-locations",
        title: "Where the team works",
        description: "Region, state, city and department.",
        side: "bottom",
      },
      {
        target: "ops-team-capabilities",
        title: "Team capabilities",
        description:
          "The work types this team can handle, based on its active members' roles. A tick means the team can handle it.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-team-members-toolbar",
        title: "Add members and change lead",
        description:
          "Pick a person and select Add member, or pick a member and select Change lead. You only see the controls your role allows.",
        side: "bottom",
      },
      {
        target: "ops-team-members",
        title: "Members",
        description: "Each member's role, status and last activity.",
        side: "top",
      },
      {
        target: "ops-team-member-actions",
        title: "Remove a member",
        description: "Remove takes the person off this team.",
        side: "left",
      },
      {
        target: "ops-team-work",
        title: "Team work",
        description: "Open, in progress, waiting, completed and overdue work for this team.",
        side: "bottom",
      },
      {
        target: "ops-team-settings",
        title: "Team settings",
        description:
          "Change the team name, code and description. Department and location are shown for reference. Save settings appears if your role can update teams.",
        side: "right",
        align: "start",
      },
      sidebar("organization", "Organization"),
      replay,
    ],
  },
  {
    id: "ops-roles",
    label: "Roles & Permissions",
    autoStart: true,
    routes: [{ path: "/operations/roles", match: "exact" }],
    steps: [
      {
        target: "ops-roles-header",
        title: "Welcome to Roles & Permissions",
        description:
          "The roles in your organization and what each one can do. Organization at the top takes you back to the structure.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-roles-create",
        title: "Create Role",
        description:
          "Opens the role editor to define a new role and its permissions. You only see it if your role can create roles.",
        side: "bottom",
        align: "end",
      },
      orgTabs,
      {
        target: "ops-roles-view-toggle",
        title: "Roles or hierarchy",
        description:
          "Roles shows the role list. Hierarchy shows which roles sit under which.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-roles-filters",
        title: "Search and filter",
        description: "Search roles and filter by status. Only active roles are shown by default.",
        side: "bottom",
      },
      {
        target: "ops-roles-list",
        title: "Role list",
        description:
          "Each role's department, parent role, members, who created it and when, and whether it can create roles.",
        side: "bottom",
      },
      {
        target: "ops-roles-row-actions",
        title: "Role actions",
        description:
          "Edit, Preview or Archive a role, or Restore an archived one. You only see the actions your role allows.",
        side: "top",
        align: "end",
      },
      {
        target: "ops-roles-pagination",
        title: "Pages",
        description: "How many roles are shown, and buttons to move between pages.",
        side: "top",
      },
      {
        target: "ops-roles-hierarchy-search",
        title: "Search the hierarchy",
        description: "Find a role in the tree. Matching branches open automatically.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-roles-hierarchy",
        title: "Role hierarchy",
        description:
          "Roles sit under their parent role, starting from this top-level role. Use the arrows to expand or collapse a branch, and a role's … button for its actions.",
        side: "bottom",
        align: "start",
      },
      sidebar("organization", "Organization"),
      replay,
    ],
  },
  {
    id: "ops-role-editor",
    label: "Role editor",
    routes: [
      { path: "/operations/roles/new", match: "exact" },
      { path: "/operations/roles/:roleId/edit", match: "pattern" },
    ],
    steps: [
      {
        target: "ops-role-header",
        title: "Create or edit a role",
        description:
          "Set the role's details on the left and its permissions on the right. When editing, unsaved changes are counted here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-role-header-actions",
        title: "Preview and breadcrumb",
        description:
          "When editing, Preview Role opens Home as this role would see it, including unsaved permissions. The breadcrumb returns to Organization or Roles & Permissions.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-role-details",
        title: "Role details",
        description: "Role name, description, department and parent role.",
        side: "right",
        align: "start",
      },
      {
        target: "ops-role-capabilities",
        title: "Role capabilities",
        description:
          "Whether people with this role can create roles, manage users and assign roles. You can only grant capabilities you have yourself.",
        side: "top",
        align: "start",
      },
      {
        target: "ops-role-save",
        title: "Save",
        description:
          "Cancel returns to Roles & Permissions without saving. Create role or Save Role stores the role and its permissions.",
        side: "right",
      },
      {
        target: "ops-role-template",
        title: "Permission template",
        description:
          "Choose Admin (Full Access) or another role to copy its permissions. This replaces the current selection; Custom leaves it as it is.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-role-views",
        title: "Module or field access",
        description:
          "Module Access sets what the role can do in each module. Field Level Access controls individual fields.",
        side: "bottom",
        align: "start",
      },
      {
        target: "ops-role-matrix-toolbar",
        title: "Find modules",
        description:
          "Search or filter modules. Reset returns to the template's permissions and Select All grants everything you are allowed to give.",
        side: "bottom",
      },
      {
        target: "ops-role-matrix",
        title: "Permission matrix",
        description:
          "Tick an action to allow it for a module. Greyed-out boxes are permissions you can't give. Nothing is saved until you save the role.",
        side: "left",
        align: "start",
      },
      {
        target: "ops-role-legend",
        title: "Legend",
        description: "What each mark means, and how many modules are listed.",
        side: "top",
      },
      sidebar("organization", "Organization"),
      replay,
    ],
  },
  {
    id: "ops-departments",
    label: "Departments",
    autoStart: true,
    routes: [{ path: "/operations/departments", match: "exact" }],
    steps: [
      {
        target: "ops-departments-breadcrumb",
        title: "Welcome to Departments",
        description:
          "Departments group teams and scope roles. Organization in the breadcrumb takes you back to the structure.",
        side: "bottom",
        align: "start",
      },
      orgTabs,
      {
        target: "ops-departments-add",
        title: "Add Department",
        description:
          "Shows the create form and moves you to its Name field. You only see it if your role can create departments.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-departments-kpis",
        title: "Departments at a glance",
        description:
          "Total and active departments, departments with teams, and total members.",
        side: "bottom",
      },
      {
        target: "ops-departments-create",
        title: "Create a department",
        description:
          "Enter a name and a code is suggested for you; Generate unique makes a new one. New departments start as Active.",
        side: "right",
        align: "start",
      },
      {
        target: "ops-departments-toolbar",
        title: "Search and filter",
        description: "Search by name, code or description, and filter by status.",
        side: "bottom",
      },
      {
        target: "ops-departments-list",
        title: "Department list",
        description: "Each department's code, teams, members, status and creation date.",
        side: "bottom",
      },
      {
        target: "ops-departments-row-actions",
        title: "Department actions",
        description:
          "The ⋮ menu has View, Edit, Manage Members, Manage Roles, and Activate, Deactivate or Delete. You only see the actions your role allows.",
        side: "bottom",
        align: "end",
      },
      pages("ops-departments-pagination", "departments"),
      sidebar("organization", "Organization"),
      replay,
    ],
  },
  {
    id: "ops-settings",
    label: "Settings",
    autoStart: true,
    routes: [{ path: "/operations/settings", match: "exact" }],
    steps: [
      orgTabs,
      {
        target: "ops-settings-form",
        title: "Organization settings",
        description:
          "Defaults for the whole organization. If your role can't change settings, the values are read-only.",
        side: "right",
        align: "start",
      },
      {
        target: "ops-settings-name",
        title: "Display name",
        description: "The organization's display name.",
        side: "right",
      },
      {
        target: "ops-settings-country",
        title: "Default country",
        description: "The country used by default.",
        side: "right",
      },
      {
        target: "ops-settings-timezone",
        title: "Default timezone",
        description: "The timezone used by default.",
        side: "right",
      },
      {
        target: "ops-settings-save",
        title: "Save settings",
        description: "Saves your changes. You only see it if your role can update settings.",
        side: "right",
      },
      sidebar("settings", "Settings", "end"),
      replay,
    ],
  },
];
