import { cn } from "../../../../utils/cn";

export type CandidateProfileTabId =
  | "overview"
  | "applications"
  | "preferences"
  | "profile_details"
  | "documents"
  | "activity"
  | "notes";

interface CandidateProfileTabsProps {
  activeTab: CandidateProfileTabId;
  applicationsCount: number;
  notesCount: number;
  onChange: (tab: CandidateProfileTabId) => void;
}

const TABS: Array<{
  id: CandidateProfileTabId;
  label: string;
  countKey?: "applications" | "notes";
}> = [
  { id: "overview", label: "Overview" },
  { id: "applications", label: "Applications", countKey: "applications" },
  { id: "preferences", label: "Job Preferences" },
  { id: "profile_details", label: "Profile Details" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity Timeline" },
  { id: "notes", label: "Notes", countKey: "notes" },
];

export function CandidateProfileTabs({
  activeTab,
  applicationsCount,
  notesCount,
  onChange,
}: CandidateProfileTabsProps) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-center gap-1 overflow-x-auto border-b border-border-subtle px-0.5 scrollbar-hidden"
      role="tablist"
      aria-label="Candidate profile sections"
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        const count =
          tab.countKey === "applications"
            ? applicationsCount
            : tab.countKey === "notes"
              ? notesCount
              : null;
        const label =
          count == null ? tab.label : `${tab.label} (${count.toLocaleString("en-IN")})`;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selected
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
