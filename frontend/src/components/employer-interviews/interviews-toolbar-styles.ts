/** Shared toolbar control styles for Interviews job filter + search. */
export const interviewsToolbarControlClassName =
  "h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-xs text-foreground shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm";

/** Overrides searchable-select default height while matching the search input. */
export const interviewsToolbarSelectTriggerClassName =
  `!h-9 lg:!h-9 font-semibold ${interviewsToolbarControlClassName}`;
