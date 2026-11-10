/** Cursor-paged view state shared by Operations activity timelines. */
export interface ActivityView<Category extends string> {
  limit: number;
  category: "all" | Category;
  /** Cursor used to load each visited page; the first entry is the newest page. */
  cursors: string[];
}

export interface ActivityParams<Category extends string> {
  limit: number;
  category: "all" | Category;
  /** Empty for the newest page. */
  cursor: string;
}

export function initialActivityView<Category extends string>(
  limit = 20,
): ActivityView<Category> {
  return { limit, category: "all", cursors: [""] };
}

export function activityParams<Category extends string>(
  view: ActivityView<Category>,
): ActivityParams<Category> {
  return {
    limit: view.limit,
    category: view.category,
    cursor: view.cursors[view.cursors.length - 1] ?? "",
  };
}

export function olderActivityPage<Category extends string>(
  view: ActivityView<Category>,
  nextCursor: string | null,
): ActivityView<Category> {
  if (!nextCursor || view.cursors.includes(nextCursor)) return view;
  return { ...view, cursors: [...view.cursors, nextCursor] };
}

export function newerActivityPage<Category extends string>(
  view: ActivityView<Category>,
): ActivityView<Category> {
  if (view.cursors.length <= 1) return view;
  return { ...view, cursors: view.cursors.slice(0, -1) };
}

/** Cursors are only valid for the filter and page size that produced them. */
export function filterActivity<Category extends string>(
  view: ActivityView<Category>,
  category: ActivityView<Category>["category"],
): ActivityView<Category> {
  return { ...view, category, cursors: [""] };
}

export function resizeActivity<Category extends string>(
  view: ActivityView<Category>,
  limit: number,
): ActivityView<Category> {
  return { ...view, limit, cursors: [""] };
}

export function activityPageRange<Category extends string>(
  view: ActivityView<Category>,
  eventCount: number,
): { from: number; to: number } {
  const start = (view.cursors.length - 1) * view.limit;
  return eventCount > 0
    ? { from: start + 1, to: start + eventCount }
    : { from: 0, to: 0 };
}
