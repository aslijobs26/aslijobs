"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { interviewsToolbarSelectTriggerClassName } from "@/components/employer-interviews/interviews-toolbar-styles";
import type { EmployerInterviewJobTab } from "@/types/employer-interviews";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { useMemo } from "react";

const JOB_SEARCH_THRESHOLD = 8;

type InterviewsJobSelectProps = {
  jobTabs: EmployerInterviewJobTab[];
  selectedPublicJobId: string | null;
  isLoading: boolean;
  onSelect: (publicJobId: string | null) => void;
};

export function InterviewsJobSelect({
  jobTabs,
  selectedPublicJobId,
  isLoading,
  onSelect,
}: InterviewsJobSelectProps) {
  const options = useMemo<EmployerRegisterSelectOption[]>(() => {
    const totalCount = jobTabs.reduce((sum, tab) => sum + tab.count, 0);

    return [
      { value: "", label: "All Jobs", count: totalCount },
      ...jobTabs.map((tab) => ({
        value: tab.publicJobId,
        label: tab.jobTitle,
        count: tab.count,
      })),
    ];
  }, [jobTabs]);

  return (
    <div className="min-w-0 flex-1 sm:max-w-xs">
      <EmployerRegisterSearchableSelect
        id="interviews-job-filter"
        label="Filter by job"
        hideLabel
        value={selectedPublicJobId ?? ""}
        placeholder="All Jobs"
        options={options}
        onChange={(value) => {
          const trimmed = value.trim();
          onSelect(trimmed ? trimmed : null);
        }}
        disabled={isLoading}
        hideSearch={jobTabs.length < JOB_SEARCH_THRESHOLD}
        searchPlaceholder="Search Job..."
        triggerClassName={interviewsToolbarSelectTriggerClassName}
      />
    </div>
  );
}
