export type EmployerProfileCompletionSection =
  | "company"
  | "about"
  | "contact"
  | "social"
  | "media";

export type EmployerProfileCompletionAppliesTo =
  | "all"
  | "business"
  | "individual";

export type EmployerProfileCompletionCriterionId =
  | "branding"
  | "displayName"
  | "location"
  | "industry"
  | "companySize"
  | "companyDescription"
  | "website"
  | "foundedYear"
  | "companyType"
  | "gstNumber"
  | "panNumber"
  | "registrationNumber"
  | "contact"
  | "aboutUs"
  | "vision"
  | "mission"
  | "values"
  | "companyMedia"
  | "socialLinks";

export type EmployerProfileCompletionCriterion = {
  id: EmployerProfileCompletionCriterionId;
  label: string;
  weight: number;
  appliesTo: EmployerProfileCompletionAppliesTo;
  targetSection: EmployerProfileCompletionSection;
  /** When true, criterion can be partially complete (0–1). */
  proportional?: boolean;
};

/**
 * Relative weights — normalized at runtime so applicable criteria always
 * total 100% for the current account type.
 */
export const EMPLOYER_PROFILE_COMPLETION_CRITERIA: readonly EmployerProfileCompletionCriterion[] =
  [
    {
      id: "branding",
      label: "Company Logo",
      weight: 10,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "branding",
      label: "Profile Photo",
      weight: 10,
      appliesTo: "individual",
      targetSection: "company",
    },
    {
      id: "displayName",
      label: "Company Name",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "displayName",
      label: "Full Name",
      weight: 5,
      appliesTo: "individual",
      targetSection: "company",
    },
    {
      id: "location",
      label: "Address",
      weight: 5,
      appliesTo: "all",
      targetSection: "company",
    },
    {
      id: "industry",
      label: "Industry",
      weight: 5,
      appliesTo: "all",
      targetSection: "company",
    },
    {
      id: "companySize",
      label: "Company Size",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "companyDescription",
      label: "Company Description",
      weight: 10,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "companyDescription",
      label: "Professional Summary",
      weight: 10,
      appliesTo: "individual",
      targetSection: "company",
    },
    {
      id: "website",
      label: "Website",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "website",
      label: "Personal Website / Portfolio",
      weight: 5,
      appliesTo: "individual",
      targetSection: "company",
    },
    {
      id: "foundedYear",
      label: "Founded Year",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "companyType",
      label: "Company Type",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "gstNumber",
      label: "GST Number",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "panNumber",
      label: "PAN Number",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "registrationNumber",
      label: "Registration Number",
      weight: 5,
      appliesTo: "business",
      targetSection: "company",
    },
    {
      id: "contact",
      label: "Contact Information",
      weight: 10,
      appliesTo: "all",
      targetSection: "contact",
    },
    {
      id: "aboutUs",
      label: "About Company",
      weight: 10,
      appliesTo: "business",
      targetSection: "about",
    },
    {
      id: "aboutUs",
      label: "About Me",
      weight: 10,
      appliesTo: "individual",
      targetSection: "about",
    },
    {
      id: "vision",
      label: "Vision",
      weight: 3,
      appliesTo: "business",
      targetSection: "about",
    },
    {
      id: "vision",
      label: "Career Vision",
      weight: 3,
      appliesTo: "individual",
      targetSection: "about",
    },
    {
      id: "mission",
      label: "Mission",
      weight: 3,
      appliesTo: "business",
      targetSection: "about",
    },
    {
      id: "mission",
      label: "Professional Goals",
      weight: 3,
      appliesTo: "individual",
      targetSection: "about",
    },
    {
      id: "values",
      label: "Values",
      weight: 3,
      appliesTo: "business",
      targetSection: "about",
    },
    {
      id: "values",
      label: "Achievements",
      weight: 3,
      appliesTo: "individual",
      targetSection: "about",
    },
    {
      id: "companyMedia",
      label: "Company Media",
      weight: 8,
      appliesTo: "business",
      targetSection: "media",
    },
    {
      id: "socialLinks",
      label: "Social Links",
      weight: 8,
      appliesTo: "business",
      targetSection: "social",
      proportional: true,
    },
    {
      id: "socialLinks",
      label: "Professional Links",
      weight: 8,
      appliesTo: "individual",
      targetSection: "social",
      proportional: true,
    },
  ] as const;

export const EMPLOYER_PROFILE_SOCIAL_PLATFORMS = [
  "linkedin",
  "facebook",
  "instagram",
  "twitter",
  "youtube",
] as const;

export type EmployerProfileCompletionProgressTier =
  | "low"
  | "medium"
  | "high"
  | "complete";

export function getEmployerProfileCompletionProgressTier(
  percentage: number,
): EmployerProfileCompletionProgressTier {
  if (percentage >= 100) {
    return "complete";
  }
  if (percentage >= 71) {
    return "high";
  }
  if (percentage >= 31) {
    return "medium";
  }
  return "low";
}

export const EMPLOYER_PROFILE_COMPLETION_PROGRESS_BAR_CLASS: Record<
  EmployerProfileCompletionProgressTier,
  string
> = {
  low: "bg-pin-state",
  medium: "bg-resource-interview-icon",
  high: "bg-employer-button",
  complete: "bg-benefit-whatsapp-icon",
};
