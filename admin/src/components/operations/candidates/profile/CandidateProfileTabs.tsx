import { cn } from "../../../../utils/cn";

export type CandidateProfileTabId =
  | "overview"
  | "applications"
  | "preferences"
  | "profile_details"
  | "documents";

interface CandidateProfileTabsProps {
  activeTab: CandidateProfileTabId;
  applicationsCount: number;
  onChange: (tab: CandidateProfileTabId) => void;
}

const TABS: Array<{
  id: CandidateProfileTabId;
  label: string;
  shortLabel?: string;
  countKey?: "applications";
}> = [
  { id: "overview", label: "Overview" },
  { id: "applications", label: "Applications", countKey: "applications" },
  {
    id: "preferences",
    label: "Job Preferences",
    shortLabel: "Preferences",
  },
  {
    id: "profile_details",
    label: "Profile Details",
    shortLabel: "Details",
  },
  { id: "documents", label: "Documents" },
];

export function CandidateProfileTabs({
  activeTab,
  applicationsCount,
  onChange,
}: CandidateProfileTabsProps) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-center gap-0.5 overflow-x-auto border-b border-border-subtle px-0.5 scrollbar-hidden max-sm:gap-0 sm:gap-1"
      role="tablist"
      aria-label="Candidate profile sections"
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        const count =
          tab.countKey === "applications" ? applicationsCount : null;
        const desktopLabel =
          count == null
            ? tab.label
            : `${tab.label} (${count.toLocaleString("en-IN")})`;
        const mobileBase = tab.shortLabel ?? tab.label;
        const mobileLabel =
          count == null
            ? mobileBase
            : `${mobileBase} (${count.toLocaleString("en-IN")})`;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-2 py-2 text-[10px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:px-1.5 max-sm:py-1.5 max-sm:text-[9px] sm:px-3 sm:py-2.5 sm:text-xs",
              selected
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            <span className="sm:hidden">{mobileLabel}</span>
            <span className="hidden sm:inline">{desktopLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
