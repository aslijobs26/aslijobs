export type ProductTourSide = "top" | "right" | "bottom" | "left";
export type ProductTourAlign = "start" | "center" | "end";

export type ProductTourStep = {
  /** Value of the stable `data-tour` attribute. Not a CSS selector. */
  target: string;
  title: string;
  description: string;
  side?: ProductTourSide;
  align?: ProductTourAlign;
};

export type ProductTourDefinition = {
  id: string;
  /** Short name shown above every step title. */
  label?: string;
  /**
   * `exact` matches only that pathname.
   * `prefix` matches only deeper paths, so a detail tour does not run on the list.
   * `pattern` matches segment by segment, where a `:name` segment matches any one segment.
   */
  routes: Array<{ path: string; match: "exact" | "prefix" | "pattern" }>;
  /** First visit to the matching route, and only when the user is not in a task. */
  autoStart?: boolean;
  steps: ProductTourStep[];
};

export type ProductTourStatus = "completed" | "skipped";
