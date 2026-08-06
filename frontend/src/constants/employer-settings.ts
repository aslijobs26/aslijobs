import type { TeamPermissionModule } from "@/types/employer-team";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Briefcase,
  Building2,
  CreditCard,
  FileSliders,
  Link2,
  Lock,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

export type EmployerSettingsSectionId =
  | "account"
  | "company"
  | "user-access"
  | "notifications"
  | "job-preferences"
  | "application"
  | "integrations"
  | "billing"
  | "security"
  | "data-privacy"
  | "activity-logs";

export type EmployerSettingsNavItem = {
  id: EmployerSettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  /**
   * RBAC module required to show this nav item.
   * Null = visible whenever the employer can open Settings.
   */
  permissionModule: TeamPermissionModule | null;
  /** Optional field-level gate within the settings module. */
  settingsFieldKey?: string;
};

export const EMPLOYER_SETTINGS_NAV_ITEMS: EmployerSettingsNavItem[] = [
  {
    id: "account",
    label: "Account Settings",
    description: "Manage your profile & account details",
    icon: UserRound,
    permissionModule: null,
  },
  {
    id: "company",
    label: "Company Settings",
    description: "Update your company information",
    icon: Building2,
    permissionModule: "company_profile",
  },
  {
    id: "user-access",
    label: "User & Access",
    description: "Manage users, roles & permissions",
    icon: Users,
    permissionModule: "team_management",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "In-app inbox and retention policy",
    icon: Bell,
    permissionModule: null,
  },
  {
    id: "job-preferences",
    label: "Job Preferences",
    description: "Job posting defaults and workspace",
    icon: Briefcase,
    permissionModule: "jobs",
  },
  {
    id: "application",
    label: "Application Settings",
    description: "Hiring pipeline and candidate workflow",
    icon: FileSliders,
    permissionModule: "candidates",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Platform-managed third-party services",
    icon: Link2,
    permissionModule: null,
    settingsFieldKey: "api_keys",
  },
  {
    id: "billing",
    label: "Billing & Invoices",
    description: "Plans, invoices & payment",
    icon: CreditCard,
    permissionModule: "subscription",
    settingsFieldKey: "billing",
  },
  {
    id: "security",
    label: "Security",
    description: "Authentication and session controls",
    icon: Shield,
    permissionModule: null,
    settingsFieldKey: "security",
  },
  {
    id: "data-privacy",
    label: "Data & Privacy",
    description: "Legal documents and privacy",
    icon: Lock,
    permissionModule: null,
  },
  {
    id: "activity-logs",
    label: "Activity Logs",
    description: "Recent team and account activity",
    icon: Activity,
    permissionModule: "team_management",
  },
];

/** Platform-managed inbox retention (mirrors backend env defaults). */
export const NOTIFICATION_RETENTION_POLICY = {
  unreadDays: 90,
  readDays: 30,
} as const;

export const EMPLOYER_SETTINGS_DEFAULT_SECTION: EmployerSettingsSectionId =
  "account";

export const EMPLOYER_SETTINGS_PLATFORM_INTEGRATIONS = [
  {
    id: "whatsapp-otp",
    title: "WhatsApp OTP",
    description:
      "Employer and job-seeker login verification via WhatsApp Business API when configured.",
  },
  {
    id: "resend-email",
    title: "Transactional Email (Resend)",
    description:
      "Team invitation emails and other transactional delivery when Resend is configured.",
  },
  {
    id: "storage",
    title: "Media Storage",
    description:
      "Company logos, profile photos, and media via local uploads or Cloudinary.",
  },
] as const;
