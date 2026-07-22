"use client";

import { EMPLOYER_DASHBOARD_SEARCH_PLACEHOLDER } from "@/constants/employer-dashboard";
import { Search } from "lucide-react";

type EmployerSearchBarProps = {
  className?: string;
};

export function EmployerSearchBar({ className }: EmployerSearchBarProps) {
  return (
    <label
      className={`relative flex w-full max-w-xl items-center ${className ?? ""}`}
    >
      <span className="sr-only">Search</span>
      <Search
        className="pointer-events-none absolute left-3.5 size-4 text-muted"
        strokeWidth={2}
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder={EMPLOYER_DASHBOARD_SEARCH_PLACEHOLDER}
        className="h-10 w-full rounded-full border border-border bg-surface py-2 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
