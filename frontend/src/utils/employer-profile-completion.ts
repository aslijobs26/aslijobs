import {
  EMPLOYER_PROFILE_COMPLETION_CRITERIA,
  EMPLOYER_PROFILE_SOCIAL_PLATFORMS,
  type EmployerProfileCompletionCriterion,
  type EmployerProfileCompletionCriterionId,
  type EmployerProfileCompletionSection,
} from "@/constants/employer-profile-completion";
import type { EmployerLoginPublic } from "@/services/employer-login.service";
import { isBusinessEmployerAccountType } from "@/constants/employer-register";

export type EmployerProfileCompletionItem = {
  id: EmployerProfileCompletionCriterionId;
  label: string;
  targetSection: EmployerProfileCompletionSection;
  weight: number;
  /** 0–1 progress for this criterion (1 = fully complete). */
  progress: number;
  isComplete: boolean;
};

export type EmployerProfileCompletionResult = {
  percentage: number;
  items: EmployerProfileCompletionItem[];
  completedCount: number;
  missingCount: number;
  isComplete: boolean;
};

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasImage(
  asset: EmployerLoginPublic["companyLogo"] | EmployerLoginPublic["profilePhoto"],
): boolean {
  return Boolean(asset?.url?.trim() || asset?.publicId?.trim());
}

function criterionApplies(
  criterion: EmployerProfileCompletionCriterion,
  isBusiness: boolean,
): boolean {
  if (criterion.appliesTo === "all") {
    return true;
  }
  if (criterion.appliesTo === "business") {
    return isBusiness;
  }
  return !isBusiness;
}

function evaluateProgress(
  criterion: EmployerProfileCompletionCriterion,
  profile: EmployerLoginPublic,
  isBusiness: boolean,
): number {
  switch (criterion.id) {
    case "branding":
      return hasImage(
        isBusiness ? profile.companyLogo : profile.profilePhoto,
      )
        ? 1
        : 0;
    case "displayName":
      if (isBusiness) {
        return hasText(profile.companyName) || hasText(profile.establishmentName)
          ? 1
          : 0;
      }
      return hasText(profile.firstName) && hasText(profile.lastName) ? 1 : 0;
    case "location":
      return hasText(profile.companyAddress) &&
        hasText(profile.city) &&
        hasText(profile.state)
        ? 1
        : 0;
    case "industry":
      return hasText(profile.industry) ? 1 : 0;
    case "companySize":
      return typeof profile.minimumEmployees === "number" &&
        typeof profile.maximumEmployees === "number"
        ? 1
        : 0;
    case "companyDescription":
      return hasText(profile.companyDescription) ? 1 : 0;
    case "website":
      return hasText(profile.website) ? 1 : 0;
    case "foundedYear":
      return typeof profile.foundedYear === "number" ? 1 : 0;
    case "companyType":
      return hasText(profile.companyType) ? 1 : 0;
    case "gstNumber":
      return hasText(profile.gstNumber) ? 1 : 0;
    case "panNumber":
      return hasText(profile.panNumber) ? 1 : 0;
    case "registrationNumber":
      return hasText(profile.registrationNumber) ? 1 : 0;
    case "contact":
      return hasText(profile.emailAddress) &&
        hasText(profile.firstName) &&
        hasText(profile.lastName)
        ? 1
        : 0;
    case "aboutUs":
      return hasText(profile.aboutUs) ? 1 : 0;
    case "vision":
      return hasText(profile.vision) ? 1 : 0;
    case "mission":
      return hasText(profile.mission) ? 1 : 0;
    case "values":
      return hasText(profile.values) ? 1 : 0;
    case "companyMedia":
      return (profile.companyMedia?.length ?? 0) > 0 ? 1 : 0;
    case "socialLinks": {
      const filled = EMPLOYER_PROFILE_SOCIAL_PLATFORMS.filter((platform) =>
        hasText(profile.socialLinks?.[platform]),
      ).length;
      return filled / EMPLOYER_PROFILE_SOCIAL_PLATFORMS.length;
    }
    default: {
      const _exhaustive: never = criterion.id;
      return _exhaustive;
    }
  }
}

export function calculateEmployerProfileCompletion(
  profile: EmployerLoginPublic,
): EmployerProfileCompletionResult {
  const isBusiness = isBusinessEmployerAccountType(profile.accountType);
  const applicable = EMPLOYER_PROFILE_COMPLETION_CRITERIA.filter((criterion) =>
    criterionApplies(criterion, isBusiness),
  );

  const applicableWeight = applicable.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );

  const items: EmployerProfileCompletionItem[] = applicable.map((criterion) => {
    const progress = evaluateProgress(criterion, profile, isBusiness);
    return {
      id: criterion.id,
      label: criterion.label,
      targetSection: criterion.targetSection,
      weight: criterion.weight,
      progress,
      isComplete: progress >= 1,
    };
  });

  const earnedWeight = items.reduce(
    (sum, item) => sum + item.weight * item.progress,
    0,
  );

  const percentage =
    applicableWeight > 0
      ? Math.min(100, Math.round((100 * earnedWeight) / applicableWeight))
      : 0;

  const completedCount = items.filter((item) => item.isComplete).length;
  const missingCount = items.length - completedCount;

  return {
    percentage,
    items,
    completedCount,
    missingCount,
    isComplete: percentage >= 100,
  };
}
