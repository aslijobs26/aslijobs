/**
 * AsliJobs frontend design system — typography.
 * Inter is the only approved font family for the entire product.
 */

export const DESIGN_SYSTEM_FONT_FAMILY = "Inter" as const;

export const DESIGN_SYSTEM_FONT_CSS_VARIABLE = "--font-inter" as const;

export const DESIGN_SYSTEM_FONT_WEIGHTS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900,
] as const;

export const DESIGN_SYSTEM_TYPOGRAPHY = {
  fontFamily: DESIGN_SYSTEM_FONT_FAMILY,
  cssVariable: DESIGN_SYSTEM_FONT_CSS_VARIABLE,
  weights: DESIGN_SYSTEM_FONT_WEIGHTS,
  subsets: ["latin"] as const,
  display: "swap" as const,
} as const;
