export type HiringSolutionVariant =
  | "free-job-post"
  | "job-boosters"
  | "hire-assist"
  | "business-hiring";

export type HiringSolution = {
  id: HiringSolutionVariant;
  title: string;
  subtitle: string;
  features: readonly string[];
  actionLabel: string;
  href: string;
};
