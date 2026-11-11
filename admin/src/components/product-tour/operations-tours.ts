import type { ProductTourDefinition, ProductTourStep } from "./types";

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

/**
 * Tours stop only on controls the operations team uses to change or open work.
 * Charts, titles, totals and lists are left out. A step whose target is not on
 * screen (another tab, or a button the role cannot see) is skipped.
 */
export const OPERATIONS_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "ops-home-v3",
    label: "Command center",
    autoStart: true,
    routes: [{ path: "/operations/home", match: "exact" }],
    steps: [
      {
        target: "ops-home-ask-asli",
        title: "Ask ASLI",
        description:
          "Opens My Work, where your assigned tasks and their next actions are listed.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-home-attention",
        title: "What needs attention",
        description:
          "Open work from the queue. Each row shows its priority, who it relates to and when it is due. Use the row's action to open it.",
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
        target: "ops-home-quick-actions",
        title: "Quick actions",
        description:
          "Shortcuts to tasks your role can start, such as adding a job seeker or posting a job.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-my-work-v3",
    label: "My Work",
    autoStart: true,
    routes: [{ path: "/operations/my-work", match: "exact" }],
    steps: [
      {
        target: "ops-my-work-actions",
        title: "Create, export and review",
        description:
          "Create work adds an item, Export downloads the filtered list, and My Performance opens your performance view. You only see the buttons your role allows.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-my-work-tabs",
        title: "Work queues",
        description:
          "Switch between My Queue, Waiting, Completed and All. Switching resets the type, priority and due filters.",
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
        target: "ops-my-work-row-actions",
        title: "Move an item forward",
        description:
          "Open this menu to view details, or claim, assign, start, mark waiting, resume or complete. Only actions that fit the item and your role appear.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-dashboard-v3",
    label: "Operations",
    autoStart: true,
    routes: [{ path: "/operations", match: "exact" }],
    steps: [
      {
        target: "ops-dashboard-modules",
        title: "Switch module",
        description:
          "These tabs open Jobseeker, Employer, Job and Placement operations. Support Operations is not available yet.",
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
          "Assign work, create a task, open Verifications or download the operations report. You only see the ones your role allows.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-employers-v3",
    label: "Employers",
    autoStart: true,
    routes: [{ path: "/operations/employers", match: "exact" }],
    steps: [
      {
        target: "ops-employers-actions",
        title: "Date range, export and add",
        description:
          "The date range sets the period for this page. Export downloads the employer list and Add Employer creates an account. You only see the buttons your role allows.",
        side: "bottom",
        align: "end",
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
        target: "ops-employers-row-actions",
        title: "Employer actions",
        description:
          "View details or posted jobs, verify or reject verification, suspend or activate the account, or delete it. Only the actions your role allows appear.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-employer-profile-v2",
    label: "Employer profile",
    autoStart: true,
    routes: [{ path: "/operations/employers/:employerId", match: "pattern" }],
    steps: [
      {
        target: "ops-employer-actions",
        title: "Employer actions",
        description:
          "Post Job, Verify Employer, Reject Verification, and Suspend or Activate Account. Verifying, rejecting, suspending and activating ask you to confirm first.",
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
        target: "ops-employer-jobs-toolbar",
        title: "Filter or post a job",
        description:
          "Filter this employer's jobs by status, or select Post New Job to add one.",
        side: "bottom",
      },
      {
        target: "ops-employer-document-actions",
        title: "Open a document",
        description:
          "Preview it here, open it in a new tab or download it. You only see the options your role allows.",
        side: "bottom",
        align: "end",
      },
      activityFilters,
      replay,
    ],
  },
  {
    id: "ops-job-seekers-v3",
    label: "Jobseekers",
    autoStart: true,
    routes: [{ path: "/operations/candidates", match: "exact" }],
    steps: [
      {
        target: "ops-job-seekers-actions",
        title: "Date range and export",
        description:
          "The date range sets the period for this page. Export downloads the jobseeker list with the current tab and filters, when your role allows it.",
        side: "bottom",
        align: "end",
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
        target: "ops-job-seekers-row-actions",
        title: "Jobseeker actions",
        description:
          "View the profile, copy the candidate ID, or delete the account when your role allows it.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-job-seeker-profile-v2",
    label: "Jobseeker profile",
    autoStart: true,
    routes: [{ path: "/operations/candidates/:jobSeekerId", match: "pattern" }],
    steps: [
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
        target: "ops-candidate-application-actions",
        title: "Open a job",
        description: "View Details opens the job they applied to.",
        side: "left",
      },
      {
        target: "ops-candidate-document-actions",
        title: "Preview or download",
        description: "Preview opens the resume here, and Download saves the file.",
        side: "left",
      },
      activityFilters,
      replay,
    ],
  },
  {
    id: "ops-jobs-v3",
    label: "Jobs",
    autoStart: true,
    routes: [{ path: "/operations/jobs", match: "exact" }],
    steps: [
      {
        target: "ops-jobs-actions",
        title: "Date range, post and export",
        description:
          "The date range sets the period for this page. Post a Job opens the job form and Export downloads these analytics. You only see the buttons your role allows.",
        side: "bottom",
        align: "end",
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
        target: "ops-jobs-row-actions",
        title: "Job actions",
        description:
          "Approve or reject jobs waiting for review, pause, close, activate or mark a job expired, copy its job ID or delete it. Only actions that fit the job and your role appear.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-job-detail-v2",
    label: "Job details",
    autoStart: true,
    routes: [{ path: "/operations/jobs/:jobId", match: "pattern" }],
    steps: [
      {
        target: "ops-job-actions",
        title: "Job actions",
        description:
          "While a job waits for approval you can Approve & Publish or Reject it. Otherwise you can Edit Job or Close Job. You only see the actions your role allows.",
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
        target: "ops-job-application-actions",
        title: "Open a candidate",
        description: "View Details opens the candidate's profile.",
        side: "left",
      },
      {
        target: "ops-job-preview-language",
        title: "Preview language",
        description:
          "Choose a language to see the listing translated. Original content is shown until a translation is ready.",
        side: "bottom",
      },
      replay,
    ],
  },
  {
    id: "ops-post-job-v2",
    label: "Post a job",
    routes: [{ path: "/operations/jobs/post", match: "exact" }],
    steps: [
      {
        target: "ops-post-job-steps",
        title: "Three steps",
        description:
          "Job Information, Location & Salary, and Candidate & Interview. Select a step to jump to it; going forward checks the steps in between first.",
        side: "bottom",
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
          "Back returns to the previous step, Save Draft keeps your progress, and Continue checks this step. Publish Job appears on the last step.",
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
      replay,
    ],
  },
  {
    id: "ops-verifications-v3",
    label: "Verifications",
    autoStart: true,
    routes: [{ path: "/operations/verifications", match: "exact" }],
    steps: [
      {
        target: "ops-verifications-actions",
        title: "Date range, verify and export",
        description:
          "The date range sets the period for this page. Verify Employer opens the Pending tab and Export downloads the verification report.",
        side: "bottom",
        align: "end",
      },
      {
        target: "ops-verifications-tabs",
        title: "Verification views",
        description:
          "Overview shows the charts. Pending, Under Review, Verified, Rejected and SLA Breaches filter the list to those requests.",
        side: "bottom",
      },
      {
        target: "ops-verifications-filters",
        title: "Search and filter",
        description:
          "Search employers, then narrow the list by status, industry, location and submission date.",
        side: "bottom",
      },
      {
        target: "ops-verifications-row-actions",
        title: "Review a request",
        description:
          "Review opens the request so you can check the documents and record a decision. It shows View instead when your role can only read it.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-placements-v3",
    label: "Placements",
    autoStart: true,
    routes: [{ path: "/operations/placements", match: "exact" }],
    steps: [
      {
        target: "ops-placements-actions",
        title: "Date range and export",
        description:
          "The date range sets the period for this page. Export downloads the placement list when your role allows it.",
        side: "bottom",
        align: "end",
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
        target: "ops-placements-row-actions",
        title: "Placement details",
        description: "View opens the full placement record.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-placements-list-v2",
    label: "All placements",
    autoStart: true,
    routes: [{ path: "/operations/placements/list", match: "exact" }],
    steps: [
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
        description: "Switch between All, Joined, Joining Pending and Did Not Join.",
        side: "bottom",
      },
      {
        target: "ops-placements-row-actions",
        title: "Placement details",
        description: "View opens the full placement record.",
        side: "left",
      },
      replay,
    ],
  },
  {
    id: "ops-placement-detail-v2",
    label: "Placement",
    autoStart: true,
    routes: [{ path: "/operations/placements/:placementId", match: "pattern" }],
    steps: [
      {
        target: "ops-placement-joining",
        title: "Update joining",
        description:
          "Add optional remarks, then select Joined or Did Not Join. You only see this while joining can still be updated and your role allows it.",
        side: "bottom",
        align: "end",
      },
      replay,
    ],
  },
  {
    id: "ops-inbox-v3",
    label: "Inbox",
    autoStart: true,
    routes: [
      { path: "/operations/inbox", match: "exact" },
      { path: "/operations/whatsapp-inbox", match: "exact" },
    ],
    steps: [
      {
        target: "ops-inbox-mode",
        title: "Chats and contacts",
        description:
          "Chats lists saved conversations. Contacts lists registered job seekers and employers, so you can start a conversation with someone new.",
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
          "Write a reply, attach a file, add an emoji or translate your draft before sending. When WhatsApp does not allow a free-form reply, the box is disabled and the reason is shown here.",
        side: "top",
      },
      replay,
    ],
  },
  {
    id: "ops-analytics-v3",
    label: "Analytics",
    autoStart: true,
    routes: [{ path: "/operations/analytics", match: "exact" }],
    steps: [
      {
        target: "ops-analytics-filters",
        title: "Filters",
        description:
          "Choose the date range, forecast horizon, location, category, employer, job type and application status, then select Apply. Reset undoes unapplied changes and Clear all returns to the last 6 months.",
        side: "top",
      },
      {
        target: "ops-analytics-tabs",
        title: "Analytics sections",
        description:
          "Insights shows everything together. The other tabs focus on website traffic, trends, the hiring funnel, supply and demand, market and placement intelligence, forecasts and the report.",
        side: "bottom",
      },
      {
        target: "ops-analytics-report",
        title: "Download the report",
        description:
          "The table lists every metric for the period. If you have export access, Download CSV saves it as a file.",
        side: "top",
      },
      replay,
    ],
  },
  {
    id: "ops-organization-v2",
    label: "Organization",
    autoStart: true,
    routes: [{ path: "/operations/organization", match: "exact" }],
    steps: [
      {
        target: "ops-org-actions",
        title: "Scope, search and add",
        description:
          "Scope limits the hierarchy to one region or country and search finds units by name. Add creates a unit, or a sub-unit inside the selected one, if your role allows it.",
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
      replay,
    ],
  },
  {
    id: "ops-people-v2",
    label: "People",
    autoStart: true,
    routes: [{ path: "/operations/team", match: "exact" }],
    steps: [
      {
        target: "ops-people-actions",
        title: "Add member",
        description:
          "Add member opens a form for a person's role, department, location and team. You only see it if your role can add people.",
        side: "bottom",
        align: "end",
      },
      orgTabs,
      {
        target: "ops-people-filters",
        title: "Search and filter",
        description:
          "Search by name or email, and filter by status, department, location and team.",
        side: "bottom",
      },
      {
        target: "ops-people-row-actions",
        title: "Member actions",
        description:
          "Resend invitation, or Edit. The ⋮ menu can also activate, deactivate or delete a member. You only see the actions your role allows.",
        side: "top",
        align: "end",
      },
      replay,
    ],
  },
  {
    id: "ops-teams-v2",
    label: "Teams",
    autoStart: true,
    routes: [{ path: "/operations/teams", match: "exact" }],
    steps: [
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
        target: "ops-teams-filters",
        title: "Search and filter",
        description:
          "Search teams and filter by department, location and status. Only active teams are shown by default.",
        side: "bottom",
      },
      {
        target: "ops-teams-row-actions",
        title: "Team actions",
        description:
          "The ⋮ menu opens the team, or archives an active team if your role allows it.",
        side: "top",
        align: "end",
      },
      replay,
    ],
  },
  {
    id: "ops-team-detail-v2",
    label: "Team",
    autoStart: true,
    routes: [{ path: "/operations/teams/:teamId", match: "pattern" }],
    steps: [
      orgTabs,
      {
        target: "ops-team-tabs",
        title: "Team sections",
        description:
          "Overview, Members, Work and Settings. Open a tab and select Tour to walk through that tab.",
        side: "bottom",
      },
      {
        target: "ops-team-members-toolbar",
        title: "Add members and change lead",
        description:
          "Pick a person and select Add member, or pick a member and select Change lead. You only see the controls your role allows.",
        side: "bottom",
      },
      {
        target: "ops-team-member-actions",
        title: "Remove a member",
        description: "Remove takes the person off this team.",
        side: "left",
      },
      {
        target: "ops-team-settings",
        title: "Team settings",
        description:
          "Change the team name, code and description, then Save settings if your role can update teams.",
        side: "right",
        align: "start",
      },
      replay,
    ],
  },
  {
    id: "ops-roles-v2",
    label: "Roles & Permissions",
    autoStart: true,
    routes: [{ path: "/operations/roles", match: "exact" }],
    steps: [
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
        description: "Roles shows the role list. Hierarchy shows which roles sit under which.",
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
        target: "ops-roles-row-actions",
        title: "Role actions",
        description:
          "Edit, Preview or Archive a role, or Restore an archived one. You only see the actions your role allows.",
        side: "top",
        align: "end",
      },
      {
        target: "ops-roles-hierarchy-search",
        title: "Search the hierarchy",
        description: "Find a role in the tree. Matching branches open automatically.",
        side: "bottom",
        align: "end",
      },
      replay,
    ],
  },
  {
    id: "ops-role-editor-v2",
    label: "Role editor",
    routes: [
      { path: "/operations/roles/new", match: "exact" },
      { path: "/operations/roles/:roleId/edit", match: "pattern" },
    ],
    steps: [
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
          "Cancel returns without saving. Create role or Save Role stores the role and its permissions.",
        side: "right",
      },
      {
        target: "ops-role-template",
        title: "Permission template",
        description:
          "Choose Admin (Full Access) or another role to copy its permissions. This replaces the current selection.",
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
      replay,
    ],
  },
  {
    id: "ops-departments-v2",
    label: "Departments",
    autoStart: true,
    routes: [{ path: "/operations/departments", match: "exact" }],
    steps: [
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
        target: "ops-departments-toolbar",
        title: "Search and filter",
        description: "Search by name, code or description, and filter by status.",
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
      replay,
    ],
  },
  {
    id: "ops-settings-v2",
    label: "Settings",
    autoStart: true,
    routes: [{ path: "/operations/settings", match: "exact" }],
    steps: [
      orgTabs,
      {
        target: "ops-settings-save",
        title: "Save settings",
        description: "Saves the organization defaults. You only see it if your role can update settings.",
        side: "right",
      },
      replay,
    ],
  },
];
