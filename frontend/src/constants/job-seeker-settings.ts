import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Globe,
  Link2,
  Settings2,
  Shield,
  UserRound,
} from "lucide-react";

export type JobSeekerSettingsSectionId =
  | "account"
  | "preferences"
  | "security"
  | "notifications"
  | "language"
  | "integrations";

export type JobSeekerSettingsNavItem = {
  id: JobSeekerSettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const JOB_SEEKER_SETTINGS_NAV_ITEMS: JobSeekerSettingsNavItem[] = [
  {
    id: "account",
    label: "Account",
    description: "Manage your profile and account details",
    icon: UserRound,
  },
  {
    id: "preferences",
    label: "Preferences",
    description: "Job preferences and app settings",
    icon: Settings2,
  },
  {
    id: "security",
    label: "Privacy & Security",
    description: "Authentication, privacy and visibility",
    icon: Shield,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "In-app inbox and retention policy",
    icon: Bell,
  },
  {
    id: "language",
    label: "Language",
    description: "Choose your preferred language",
    icon: Globe,
  },
  {
    id: "integrations",
    label: "Connected Apps",
    description: "WhatsApp and platform services",
    icon: Link2,
  },
];

export const JOB_SEEKER_SETTINGS_DEFAULT_SECTION: JobSeekerSettingsSectionId =
  "account";

/** Platform-managed inbox retention (mirrors backend env defaults). */
export const JOB_SEEKER_NOTIFICATION_RETENTION_POLICY = {
  unreadDays: 90,
  readDays: 30,
} as const;
