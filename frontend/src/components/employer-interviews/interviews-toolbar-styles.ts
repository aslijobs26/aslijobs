/** Shared toolbar control styles for Interviews job filter + search. */
export const interviewsToolbarControlClassName =
  "employer-interviews-toolbar__control h-8 w-full rounded-lg border border-border-subtle bg-surface px-2.5 text-[11px] text-foreground shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:px-3 sm:text-sm lg:h-8 lg:px-2.5 lg:text-[11px]";

/** Overrides searchable-select default height while matching the search input. */
export const interviewsToolbarSelectTriggerClassName =
  `employer-interviews-toolbar__select-trigger !h-8 !px-2.5 !text-[11px] sm:!h-9 sm:!px-3 sm:!text-sm lg:!h-8 lg:!min-h-8 lg:!px-2.5 lg:!text-[11px] font-semibold ${interviewsToolbarControlClassName}`;

export const interviewsToolbarSelectOptionClassName =
  "!px-2.5 !py-1.5 !text-[11px] sm:!px-3 sm:!py-2.5 sm:!text-sm lg:!py-1.5 lg:!text-[11px]";
