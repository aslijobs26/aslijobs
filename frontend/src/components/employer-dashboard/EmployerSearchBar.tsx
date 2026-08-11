"use client";

import { EMPLOYER_DASHBOARD_SEARCH_PLACEHOLDER } from "@/constants/employer-dashboard";
import { useCan } from "@/providers/employer-permission-provider";
import { Search } from "lucide-react";
import { useMemo } from "react";

type EmployerSearchBarProps = {
  className?: string;
};

export function EmployerSearchBar({ className }: EmployerSearchBarProps) {
  const { can, isLoading } = useCan();

  const placeholder = useMemo(() => {
    if (isLoading) {
      return EMPLOYER_DASHBOARD_SEARCH_PLACEHOLDER;
    }

    const scopes: string[] = [];
    if (can("candidates", "read")) scopes.push("candidates");
    if (can("jobs", "read")) scopes.push("jobs");
    if (can("messages", "read")) scopes.push("messages");

    if (scopes.length === 0) {
      return "Search unavailable for your role";
    }

    return `Search ${scopes.join(", ")}...`;
  }, [can, isLoading]);

  const disabled =
    !isLoading &&
    !can("candidates", "read") &&
    !can("jobs", "read") &&
    !can("messages", "read");

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
        disabled={disabled}
        placeholder={placeholder}
        className="h-9 w-full rounded-full border border-border bg-surface py-2 pl-10 pr-4 text-xs text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-hero-bg disabled:text-muted sm:h-10 sm:text-sm"
      />
    </label>
  );
}
