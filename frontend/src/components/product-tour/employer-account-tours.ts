import { replayStep } from "./tour-steps";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_ACCOUNT_TOURS: readonly ProductTourDefinition[] = [
  {
    id: "employer-company-profile-v3",
    label: "Profile",
    autoStart: true,
    routes: [{ path: "/employer/company-profile", match: "exact" }],
    steps: [
      {
        target: "employer-profile-completion",
        title: "Profile completion",
        description:
          "Shows what is still missing. Fill those details so candidates can trust the profile.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-profile-verification-submit",
        title: "Submit for verification",
        description:
          "When the required details are ready, send the profile for review. This shows only while verification is still open.",
        side: "top",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "employer-settings-v3",
    label: "Settings",
    autoStart: true,
    routes: [{ path: "/employer/settings", match: "exact" }],
    steps: [
      {
        target: "employer-settings-logout",
        title: "Log out",
        description: "Ends this device session and returns you to the home page.",
        side: "left",
        align: "end",
      },
      replayStep,
    ],
  },
  {
    id: "employer-team-v3",
    label: "Team Management",
    autoStart: true,
    routes: [{ path: "/employer/team-management", match: "exact" }],
    steps: [
      {
        target: "employer-team-permission-matrix",
        title: "Permission Matrix",
        description:
          "Opens Roles & Permissions so you can see what each role is allowed to do.",
        side: "bottom",
        align: "end",
      },
      {
        target: "employer-team-invite",
        title: "Invite a member",
        description:
          "Invite a colleague by email and choose their department, role and access.",
        side: "bottom",
        align: "end",
      },
      replayStep,
    ],
  },
  {
    id: "employer-team-member-detail-v2",
    label: "Team member",
    autoStart: true,
    routes: [
      { path: "/employer/team-management/members/:memberId", match: "pattern" },
    ],
    steps: [
      {
        target: "employer-member-header",
        title: "Team member",
        description: "This member's name, status, email and designation.",
        side: "bottom",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "employer-team-role-detail-v2",
    label: "Role",
    autoStart: true,
    routes: [
      { path: "/employer/team-management/roles/:roleId", match: "pattern" },
    ],
    steps: [
      {
        target: "employer-role-permissions",
        title: "Role permissions",
        description: "What this role can do. Changes apply to everyone with the role.",
        side: "top",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "employer-team-department-detail-v2",
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
        target: "employer-department-header",
        title: "Department",
        description: "This department's name, status and description.",
        side: "bottom",
        align: "start",
      },
      replayStep,
    ],
  },
  {
    id: "employer-my-profile-v2",
    label: "My Profile",
    autoStart: true,
    routes: [{ path: "/employer/team-member/profile", match: "exact" }],
    steps: [
      {
        target: "employer-my-profile-header",
        title: "My Profile",
        description: "Your name, status and company. This page is read-only.",
        side: "bottom",
        align: "start",
      },
      replayStep,
    ],
  },
];
