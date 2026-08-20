/**
 * AsliJobs operations app — typography (aligned with frontend design system).
 */
export const DESIGN_SYSTEM_FONT_FAMILY = "Inter" as const;

export const DESIGN_SYSTEM_FONT_CSS_VARIABLE = "--font-inter" as const;

export const DESIGN_SYSTEM_TYPOGRAPHY = {
  fontFamily: DESIGN_SYSTEM_FONT_FAMILY,
  cssVariable: DESIGN_SYSTEM_FONT_CSS_VARIABLE,
  subsets: ["latin"] as const,
  display: "swap" as const,
} as const;
