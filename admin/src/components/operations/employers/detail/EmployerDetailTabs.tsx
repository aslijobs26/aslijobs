import {
  Activity,
  Briefcase,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../../../utils/cn";

export type EmployerDetailTabId =
  | "overview"
  | "jobs"
  | "documents"
  | "activity";

interface EmployerDetailTabsProps {
  activeTab: EmployerDetailTabId;
  jobsCount?: number;
  documentsCount?: number;
  onTabChange: (tab: EmployerDetailTabId) => void;
}

const TABS: {
  id: EmployerDetailTabId;
  label: string;
  icon: LucideIcon;
  badgeKey?: "jobsCount" | "documentsCount";
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Jobs Posted", icon: Briefcase, badgeKey: "jobsCount" },
  {
    id: "documents",
    label: "Documents & Verification",
    icon: FileText,
    badgeKey: "documentsCount",
  },
  { id: "activity", label: "Activity & History", icon: Activity },
];

export function EmployerDetailTabs({
  activeTab,
  jobsCount = 0,
  documentsCount = 0,
  onTabChange,
}: EmployerDetailTabsProps) {
  return (
    <div className="flex border-b border-border-subtle bg-surface px-3 sm:px-4 shadow-xs">
      <nav
        className="-mb-px flex space-x-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:space-x-6"
        aria-label="Employer profile tabs"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount =
            tab.badgeKey === "jobsCount"
              ? jobsCount
              : tab.badgeKey === "documentsCount"
                ? documentsCount
                : null;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group inline-flex shrink-0 items-center gap-2 border-b-2 py-3 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:border-border hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  isActive ? "text-primary" : "text-muted group-hover:text-foreground",
                )}
                aria-hidden="true"
              />
              {tab.label}
              {badgeCount != null ? (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                    isActive
                      ? "bg-primary-light text-primary"
                      : "bg-hero-bg text-muted",
                  )}
                >
                  {badgeCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
