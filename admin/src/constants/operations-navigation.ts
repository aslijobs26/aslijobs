import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageCircle,
  Receipt,
  RefreshCw,
  Route,
  Scale,
  Shield,
  ShieldCheck,
  Ticket,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { OPERATIONS_ROUTES } from "./operations-routes";

export interface OperationsNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export interface OperationsNavSection {
  id: string;
  label: string;
  items: OperationsNavItem[];
}

export const OPERATIONS_NAV_SECTIONS: OperationsNavSection[] = [
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: OPERATIONS_ROUTES.DASHBOARD,
        icon: LayoutDashboard,
      },
      {
        id: "my-work",
        label: "My Work",
        href: OPERATIONS_ROUTES.MY_WORK,
        icon: FolderKanban,
        badge: 24,
      },
      {
        id: "work-queue",
        label: "Work Queue",
        href: OPERATIONS_ROUTES.WORK_QUEUE,
        icon: Activity,
        badge: 128,
      },
      {
        id: "whatsapp-inbox",
        label: "WhatsApp Inbox",
        href: OPERATIONS_ROUTES.WHATSAPP_INBOX,
        icon: MessageCircle,
        badge: 28,
      },
      {
        id: "journey-alerts",
        label: "Journey Alerts",
        href: OPERATIONS_ROUTES.JOURNEY_ALERTS,
        icon: Route,
        badge: 37,
      },
      {
        id: "support-tickets",
        label: "Support Tickets",
        href: OPERATIONS_ROUTES.SUPPORT_TICKETS,
        icon: Ticket,
        badge: 63,
      },
      {
        id: "employers",
        label: "Employers",
        href: OPERATIONS_ROUTES.EMPLOYERS,
        icon: Building2,
      },
      {
        id: "candidates",
        label: "Candidates",
        href: OPERATIONS_ROUTES.CANDIDATES,
        icon: Users,
      },
      {
        id: "jobs",
        label: "Jobs",
        href: OPERATIONS_ROUTES.JOBS,
        icon: Briefcase,
      },
      {
        id: "verifications",
        label: "Verifications",
        href: OPERATIONS_ROUTES.VERIFICATIONS,
        icon: ShieldCheck,
        badge: 42,
      },
      {
        id: "escalations",
        label: "Escalations",
        href: OPERATIONS_ROUTES.ESCALATIONS,
        icon: AlertTriangle,
        badge: 9,
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        id: "team",
        label: "Team Management",
        href: OPERATIONS_ROUTES.TEAM_MANAGEMENT,
        icon: UsersRound,
      },
      {
        id: "departments",
        label: "Departments",
        href: OPERATIONS_ROUTES.DEPARTMENTS,
        icon: Building2,
      },
      {
        id: "roles",
        label: "Roles & Permissions",
        href: OPERATIONS_ROUTES.ROLES,
        icon: Shield,
      },
      {
        id: "activity-log",
        label: "Activity Log",
        href: OPERATIONS_ROUTES.ACTIVITY_LOG,
        icon: Activity,
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      {
        id: "subscriptions",
        label: "Subscriptions & Boosters",
        href: OPERATIONS_ROUTES.SUBSCRIPTIONS,
        icon: CreditCard,
      },
      {
        id: "payments",
        label: "Payments & Invoices",
        href: OPERATIONS_ROUTES.PAYMENTS,
        icon: Receipt,
      },
      {
        id: "transactions",
        label: "Transactions",
        href: OPERATIONS_ROUTES.TRANSACTIONS,
        icon: Wallet,
      },
      {
        id: "refunds",
        label: "Refunds",
        href: OPERATIONS_ROUTES.REFUNDS,
        icon: RefreshCw,
      },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    items: [
      {
        id: "trust",
        label: "Trust & Compliance",
        href: OPERATIONS_ROUTES.TRUST_COMPLIANCE,
        icon: Scale,
      },
      {
        id: "audit",
        label: "Audit Logs",
        href: OPERATIONS_ROUTES.AUDIT_LOGS,
        icon: FileText,
      },
      {
        id: "policies",
        label: "Policies & Documents",
        href: OPERATIONS_ROUTES.POLICIES,
        icon: FileText,
      },
    ],
  },
];

export const OPERATIONS_BRAND = {
  name: "aslijobs",
  tagline: "India's Trusted WhatsApp Job Network",
} as const;

export const MOCK_OPERATIONS_USER = {
  name: "Ravi Kumar",
  role: "Operations Manager",
  status: "Online" as const,
  initials: "RK",
} as const;
