"use client";

import { EMPLOYER_DASHBOARD_SEARCH_PLACEHOLDER } from "@/constants/employer-dashboard";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

type EmployerSearchBarProps = {
  className?: string;
};

export function EmployerSearchBar({ className }: EmployerSearchBarProps) {
  const [shortcutLabel, setShortcutLabel] = useState("⌘ K");

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    const isApple =
      platform.includes("mac") ||
      platform.includes("iphone") ||
      platform.includes("ipad");
    setShortcutLabel(isApple ? "⌘ K" : "Ctrl K");
  }, []);

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
        className="h-10 w-full rounded-full border border-border bg-surface py-2 pl-10 pr-16 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <kbd className="pointer-events-none absolute right-3 hidden rounded-md border border-border bg-hero-bg px-1.5 py-0.5 text-[11px] font-medium text-muted sm:inline-flex">
        {shortcutLabel}
      </kbd>
    </label>
  );
}
