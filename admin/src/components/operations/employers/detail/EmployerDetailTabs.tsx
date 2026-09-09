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
  shortLabel: string;
  icon: LucideIcon;
  badgeKey?: "jobsCount" | "documentsCount";
}[] = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "jobs",
    label: "Jobs Posted",
    shortLabel: "Jobs",
    icon: Briefcase,
    badgeKey: "jobsCount",
  },
  {
    id: "documents",
    label: "Documents & Verification",
    shortLabel: "Docs",
    icon: FileText,
    badgeKey: "documentsCount",
  },
  {
    id: "activity",
    label: "Activity & History",
    shortLabel: "Activity",
    icon: Activity,
  },
];

export function EmployerDetailTabs({
  activeTab,
  jobsCount = 0,
  documentsCount = 0,
  onTabChange,
}: EmployerDetailTabsProps) {
  return (
    <div className="flex border-b border-border-subtle bg-surface px-2 shadow-xs max-sm:px-1.5 sm:px-3 lg:px-4">
      <nav
        className="-mb-px flex space-x-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-sm:space-x-2.5 sm:space-x-4 lg:space-x-6"
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
                "group inline-flex shrink-0 items-center gap-1.5 border-b-2 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none sm:gap-2 sm:py-2.5 sm:text-xs lg:py-3",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:border-border hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 transition-colors sm:size-4",
                  isActive
                    ? "text-primary"
                    : "text-muted group-hover:text-foreground",
                )}
                aria-hidden="true"
              />
              <span className="lg:hidden">{tab.shortLabel}</span>
              <span className="hidden lg:inline">{tab.label}</span>
              {badgeCount != null ? (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-1.5 py-0 text-[9px] font-bold tabular-nums sm:px-2 sm:py-0.5 sm:text-[10px]",
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
