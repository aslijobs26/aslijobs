import { employerSidebarStep, pagesStep, replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_ACCOUNT_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-company-profile-v2",
    label: "Profile",
    autoStart: true,
    routes: [{ path: "/employer/company-profile", match: "exact" }],
    steps: [
      {
        target: "employer-profile-header",
        title: "Your profile",
        description:
          "Manage the information, branding and contact details saved on your profile.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-profile-completion",
        title: "Profile completion",
        description:
          "Shows how much of your profile is filled in and how many details are still missing.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-profile-preview",
        title: "Preview your page",
        description:
          "Opens a preview of the information currently saved on your profile.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-profile-verification-rejected",
        title: "Verification rejected",
        description:
          "Shows the remarks from Operations. Complete Profile opens the details editor so you can fix what was asked.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-profile-verification-review",
        title: "Verification under review",
        description:
          "Operations is reviewing your account. You can keep updating your profile; submitting or publishing jobs opens up once you are verified.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-profile-company-info",
        title: "Main details",
        description:
          "Your logo or photo, name, verification badge, location, industry, website and summary. If you can edit the profile, Edit opens a form for these details.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-profile-documents",
        title: "Verification documents",
        description:
          "Documents uploaded during registration are kept here. If you can edit the profile, Upload adds a document for Operations to review.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-profile-documents-first-actions",
        title: "Document actions",
        description:
          "Preview or download a document. If you can edit the profile, Reupload replaces it and sends the new copy for review.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-profile-verification-submit",
        title: "Submit for verification",
        description:
          "Lists anything still missing. When the required details and document are ready, send your profile to Operations for review.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-profile-about",
        title: "About section",
        description:
          "Your introduction and the other details in this card. If you can edit the profile, Edit updates them.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-profile-about-tabs",
        title: "About tabs",
        description:
          "Switch between the parts of this section. The tabs shown depend on whether this is a company or individual account.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-profile-media",
        title: "Company media",
        description:
          "Workplace photos for your company page. Select a photo to view it larger. If you can edit the profile, Edit or Add More lets you upload, remove or reorder images.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-profile-snapshot",
        title: "Snapshot",
        description:
          "A quick count of your jobs and applications, plus when the account was created and last updated.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-profile-contact",
        title: "Contact information",
        description:
          "Contact name, role, email, phone numbers and address. If you can edit the profile, Edit updates them.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-profile-social",
        title: "Links",
        description:
          "Your social and website links, each opening in a new tab. If you can edit the profile, Edit updates them.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-profile-resubmit",
        title: "Send for review again",
        description:
          "After updating your details or documents, submit your verification again for Operations review.",
        side: "top",
        align: "start",
      },
      employerSidebarStep("company-profile", "Company Profile"),
      replayStep,
    ],
  },
  {
    id: "employer-settings-v2",
    label: "Settings",
    autoStart: true,
    routes: [{ path: "/employer/settings", match: "exact" }],
    steps: [
      {
        target: "employer-settings-header",
        title: "Settings",
        description:
          "Manage your account, preferences and workspace settings from one place.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-settings-nav",
        title: "Settings sections",
        description:
          "Pick a section to open it. You only see the sections your role has access to.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-settings-profile-summary",
        title: "Your account",
        description:
          "Your name, role, contact details, login email and last login. When Edit is shown, it opens your profile page.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-quick-links",
        title: "Shortcuts",
        description:
          "Jump to your company profile, team access, notifications or job preferences. Only shortcuts your role can open are shown.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-settings-authentication",
        title: "Sign-in details",
        description: "How you sign in to this workspace and your workspace role.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-settings-security",
        title: "Security",
        description:
          "Log out of this device here. Options marked Unavailable cannot be changed in Settings yet.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-settings-company",
        title: "Company settings",
        description:
          "A summary of your company details. The button opens Company Profile, where details are managed.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-user-access",
        title: "User & Access",
        description:
          "Team members, roles, departments and permissions are managed in Team Management. Open Team Management takes you there.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-user-access-stats",
        title: "Team at a glance",
        description:
          "Counts of your members, roles, departments and invitations not yet accepted.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-user-access-links",
        title: "Team shortcuts",
        description:
          "Open Team Management for members, roles or departments, and for invitations if you can invite people.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-settings-notifications",
        title: "In-app notifications",
        description:
          "Manage your notification inbox. Open inbox takes you to your notifications.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-notifications-inbox",
        title: "Inbox actions",
        description:
          "See how many notifications are unread. Mark all read clears the unread count, and Clear all empties the inbox after you confirm.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-retention",
        title: "Retention policy",
        description:
          "How long read and unread notifications stay in your inbox before they are removed automatically.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-settings-job-preferences",
        title: "Job preferences",
        description:
          "Counts of your active, draft and closed jobs. Job details are set on each job when you post or edit it, and Open Jobs takes you to your listings.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-job-links",
        title: "Job shortcuts",
        description:
          "Go to your jobs, or start a new job post if your role allows it.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-settings-application",
        title: "Application settings",
        description:
          "The hiring stages candidates move through and the final statuses. Candidates are moved between stages from Candidates, which Open Candidates takes you to.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-integrations",
        title: "Integrations",
        description:
          "Services AsliJobs manages for the platform. They cannot be connected or disconnected here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-billing",
        title: "Billing & invoices",
        description:
          "Billing is not enabled for this workspace yet. You can open the Subscription page from here.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-data-privacy",
        title: "Data & privacy",
        description: "Read the AsliJobs Privacy Policy and Terms & Conditions.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-settings-activity-logs",
        title: "Activity logs",
        description:
          "Recent team activity such as invitations, role changes and member updates. Team Management opens the team workspace.",
        side: "bottom",
        align: "start",
      },
      employerSidebarStep("settings", "Settings"),
      replayStep,
    ],
  },
  {
    id: "employer-team-v2",
    label: "Team Management",
    autoStart: true,
    routes: [{ path: "/employer/team-management", match: "exact" }],
    steps: [
      {
        target: "employer-team-header",
        title: "Team Management",
        description: "Manage your team, roles, departments and permissions.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-permission-matrix",
        title: "Permission Matrix",
        description:
          "Opens the Roles & Permissions tab, where you can see what each role is allowed to do.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-team-invite",
        title: "Invite a member",
        description:
          "Opens a form to invite a colleague by email and choose their department, role and access level.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-team-stats",
        title: "Team at a glance",
        description:
          "Counts of your members, roles, departments and invitations not yet accepted.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-tabs",
        title: "Team tabs",
        description:
          "Switch between Team Members, Roles & Permissions and Departments. Take the tour again on another tab to see its controls.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-members-toolbar",
        title: "Search members",
        description: "Search your team by name, email or role.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-members-filter",
        title: "Filter members",
        description:
          "Narrow the list by department, role or status. A badge shows how many filters are on.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-members-filters",
        title: "Member filters",
        description:
          "Pick a department, role or status, or use Clear filters to start over.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-members-thead",
        title: "Members list",
        description:
          "Each member's role, department, access level, status and last activity.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-members-empty",
        title: "No members yet",
        description: "Teammates appear here once they are invited.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-team-members-first-row",
        title: "A member",
        description:
          "Your own row is marked You. Invited members also show when their invitation email could not be delivered.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-members-first-actions",
        title: "Member actions",
        description:
          "The eye icon opens a member's details. Depending on your permissions, you can also edit, resend or cancel an invitation, deactivate, activate or remove a member.",
        side: "bottom",
        align: "end",
      },
      pagesStep("employer-team-members-pagination", "members"),
      {
        target: "employer-team-sidebar-invite",
        title: "Quick invite",
        description:
          "Enter an email, role and department, then Send Invitation opens the invite form with those details filled in.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-sidebar-roles",
        title: "Team by role",
        description:
          "How your members are spread across roles. View All Roles opens the Roles & Permissions tab.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-sidebar-activity",
        title: "Recent activity",
        description: "The latest invitations, role changes and member updates.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-sidebar-access",
        title: "Access control",
        description:
          "Manage Roles & Permissions opens the tab where role access is managed.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-roles-departments",
        title: "Departments",
        description:
          "Your active departments. Select one to open its details, or Add Department to open a form for a new one.",
        side: "right",
        align: "start",
      },
      {
        target: "employer-team-roles-all-departments",
        title: "All departments",
        description: "Opens the Departments tab with the full list.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-team-roles-header",
        title: "Roles",
        description:
          "The roles your members can be given. If you can create roles, Create Role opens a form for a new one.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-roles-search",
        title: "Search roles",
        description: "Find a role by name.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-roles-thead",
        title: "Roles list",
        description:
          "Each role's access level, member count, description and status.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-roles-first-row",
        title: "Select a role",
        description:
          "Select a row to load that role's permissions in the Permissions panel.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-roles-empty",
        title: "No roles found",
        description: "Roles matching your search appear here.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-team-roles-first-actions",
        title: "Role actions",
        description:
          "The menu lets you view a role. Depending on your permissions, you can also edit, duplicate, deactivate or activate it, and archive or delete custom roles.",
        side: "bottom",
        align: "end",
      },
      pagesStep("employer-team-roles-pagination", "roles"),
      {
        target: "employer-team-roles-permissions",
        title: "Permissions",
        description: "Choose a role here to see what it can access.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-roles-permission-tabs",
        title: "Permission views",
        description:
          "Module Access covers what the role can do in each area. Field Level Access covers which fields it can see or edit.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-roles-matrix-thead",
        title: "Module access",
        description:
          "Each column is an action, from Full Access to Export. A tick means the role is allowed.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-roles-field-controls",
        title: "Field access tools",
        description:
          "Search fields and expand or collapse modules. While editing, you can set fields in bulk, reset them, or copy settings from another role.",
        side: "left",
        align: "start",
      },
      {
        target: "employer-team-roles-permission-actions",
        title: "Edit permissions",
        description:
          "If you can update roles, Edit Permissions lets you change this role's access. Saved changes apply to everyone with the role.",
        side: "top",
        align: "end",
      },
      {
        target: "employer-team-departments-header",
        title: "Departments",
        description: "Organize your company into departments.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-departments-toolbar",
        title: "Search and filter",
        description:
          "Search by name, code, description or head. Filter narrows the list by status, created date or member count.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-departments-add",
        title: "Add a department",
        description: "Opens a form to create a new department.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-team-departments-filters",
        title: "Department filters",
        description:
          "Set a status, created date range or member count range, or clear all filters.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-departments-thead",
        title: "Departments list",
        description:
          "Each department's head, member count, description, status and created date.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-departments-empty",
        title: "No departments found",
        description:
          "Departments appear here once they are created or match your search and filters.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-team-departments-first-row",
        title: "A department",
        description:
          "Each row shows the department's head, or No Head Assigned when nobody is set.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-team-departments-first-actions",
        title: "Department actions",
        description:
          "The eye icon opens the department's details. Depending on your permissions, you can also edit, deactivate or delete it.",
        side: "bottom",
        align: "end",
      },
      pagesStep("employer-team-departments-pagination", "departments"),
      employerSidebarStep("team-management", "Team Management"),
      replayStep,
    ],
  },
  {
    id: "employer-team-member-detail",
    label: "Team member",
    autoStart: true,
    routes: [
      { path: "/employer/team-management/members/:memberId", match: "pattern" },
    ],
    steps: [
      {
        target: "employer-member-back",
        title: "Back to the team",
        description: "Returns you to Team Management.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-member-header",
        title: "Member",
        description: "The member's name, status, email and designation.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-member-summary",
        title: "Role and access",
        description:
          "Their department, role, access level and when they were last active.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-member-basic-info",
        title: "Basic information",
        description:
          "Phone number, and when they joined and accepted their invitation.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-member-invitations",
        title: "Invitation history",
        description:
          "Each invitation sent to this member, with when it was sent, when it expires and how many times it was resent.",
        side: "bottom",
        align: "start",
      },
      employerSidebarStep("team-management", "Team Management"),
      replayStep,
    ],
  },
  {
    id: "employer-team-role-detail",
    label: "Role",
    autoStart: true,
    routes: [
      { path: "/employer/team-management/roles/:roleId", match: "pattern" },
    ],
    steps: [
      {
        target: "employer-role-back",
        title: "Back to the team",
        description: "Returns you to Team Management.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-role-header",
        title: "Role",
        description:
          "The role's name, status, whether it is a system or custom role, and its description.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-role-summary",
        title: "Role summary",
        description:
          "Its access level, number of members, and when it was created and last updated.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-role-members",
        title: "Members",
        description:
          "Team members who have this role. Select a name to open their details.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-role-recent-changes",
        title: "Recent changes",
        description: "Activity related to this role.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-role-permissions",
        title: "Permission matrix",
        description:
          "What this role can do in each area. This view is read-only; permissions are changed from the Roles & Permissions tab if your role allows it.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-role-matrix-thead",
        title: "Reading the matrix",
        description:
          "Each column is an action. A tick means allowed, an empty box means not allowed, and a dash means the action does not apply.",
        side: "bottom",
        align: "start",
      },
      employerSidebarStep("team-management", "Team Management"),
      replayStep,
    ],
  },
  {
    id: "employer-team-department-detail",
    label: "Department",
    autoStart: true,
    routes: [
      {
        path: "/employer/team-management/departments/:departmentId",
        match: "pattern",
      },
    ],
    steps: [
      {
        target: "employer-department-back",
        title: "Back to the team",
        description: "Returns you to Team Management.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-department-header",
        title: "Department",
        description:
          "The department's name, status, code and description.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-department-stats",
        title: "Department at a glance",
        description:
          "Total and active members, pending invitations, and when the department was created.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-department-info",
        title: "Department information",
        description:
          "Contact email and phone, when it was last updated, and the department head.",
        side: "top",
        align: "start",
      },
      employerSidebarStep("team-management", "Team Management"),
      replayStep,
    ],
  },
  {
    id: "employer-my-profile",
    label: "My Profile",
    autoStart: true,
    routes: [{ path: "/employer/team-member/profile", match: "exact" }],
    steps: [
      {
        target: "employer-my-profile-back",
        title: "Back to the dashboard",
        description: "Returns you to the dashboard.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-my-profile-header",
        title: "My Profile",
        description:
          "Your name, status and the company you work for. This page is read-only.",
        side: "bottom",
        align: "start",
      },
      {
        target: "employer-my-profile-basic",
        title: "Basic information",
        description:
          "The name, email, phone and designation on your team account.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-my-profile-organization",
        title: "Organization",
        description:
          "Your department, role, access level, status and joined date. These are assigned in Team Management.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-my-profile-account",
        title: "Account",
        description:
          "Your last login, when you accepted your invitation, and who created your account.",
        side: "top",
        align: "start",
      },
      {
        target: "employer-profile-menu",
        title: "Find this page again",
        description:
          "Open your profile menu at the top of the page and choose My Profile to come back here.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
];
