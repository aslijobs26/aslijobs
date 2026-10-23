/**
 * Shared desktop width for the employer candidate detail / resume side panel.
 * Keep Candidates and Shortlisted grids in sync with CandidatesDetailPanel.
 */
export const EMPLOYER_CANDIDATE_DETAIL_PANEL_WIDTH_REM = "32rem";

/** Aside width utility used by CandidatesDetailPanel (panel variant). */
export const EMPLOYER_CANDIDATE_DETAIL_PANEL_ASIDE_CLASS =
  "flex h-full min-h-0 w-full flex-col overflow-hidden lg:w-[32rem] xl:w-[34rem]";

/**
 * Sticky shell for the Shortlisted detail panel. Fixed height so the resume
 * body can scroll internally.
 * `top-20` (5rem) + bottom page padding ≈ 6.25rem from viewport edges.
 */
export const EMPLOYER_CANDIDATE_DETAIL_PANEL_STICKY_SHELL_CLASS =
  "sticky top-20 flex h-[calc(100dvh-6.25rem)] max-h-[calc(100dvh-6.25rem)] min-h-0 w-full flex-col";

/**
 * Sticky shell for the Shortlisted list. Fixed height so the pagination footer
 * stays at the bottom and the table body scrolls inside.
 */
export const EMPLOYER_SAVED_CANDIDATES_LIST_STICKY_SHELL_CLASS =
  "sticky top-20 flex h-[calc(100dvh-6.25rem)] max-h-[calc(100dvh-6.25rem)] min-h-0 w-full flex-col";

/** Candidates page 3-column layout (filters | list | detail). */
export const EMPLOYER_CANDIDATES_LAYOUT_GRID_CLASS =
  "mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_34rem]";

/** Shortlisted candidates page 2-column layout (list | detail). */
export const EMPLOYER_SAVED_CANDIDATES_LAYOUT_GRID_CLASS =
  "mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_32rem] xl:grid-cols-[minmax(0,1fr)_34rem]";

/** Tablet/desktop drawer width for candidate detail. */
export const EMPLOYER_CANDIDATE_DETAIL_DRAWER_WIDTH_CLASS =
  "sm:w-[min(32rem,100%)] xl:w-[min(34rem,100%)]";
