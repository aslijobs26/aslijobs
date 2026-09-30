import type { MessageKey, useTranslate } from "@/i18n/translate";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import type { JobSeekerProfileTab } from "@/utils/job-seeker-profile";
import { formatJobSearchJobType } from "@/utils/job-search-format";

type Translate = ReturnType<typeof useTranslate>;

const JOB_TYPE_VALUES = new Set(["full-time", "part-time", "contract"]);

export const PROFILE_TAB_LABEL_KEYS: Record<JobSeekerProfileTab, MessageKey> = {
  overview: "seeker.profileTabs.overview",
  experience: "seeker.profileTabs.experience",
  education: "seeker.profileTabs.education",
  skills: "seeker.profileTabs.skills",
  documents: "seeker.profileTabs.documents",
  preferences: "seeker.profileTabs.preferences",
  activity: "seeker.profileTabs.activity",
};

const CHECKLIST_LABEL_KEYS: Record<string, MessageKey> = {
  photo: "seeker.profileChecklist.photo",
  mobile: "seeker.profileChecklist.mobile",
  education: "seeker.profileChecklist.education",
  experience: "seeker.profileChecklist.experience",
  skills: "seeker.profileChecklist.skills",
  resume: "seeker.profileChecklist.resume",
  languages: "seeker.profileChecklist.languages",
  preferences: "seeker.profileChecklist.preferences",
};

/** Keyed by the English messages produced by `computeProfileStrength`. */
const STRENGTH_MESSAGE_KEYS: Record<string, MessageKey> = {
  "Let's get started": "seeker.profileStrength.start",
  "Excellent profile!": "seeker.profileStrength.excellent",
  "Great! Keep going": "seeker.profileStrength.great",
  "Looking good": "seeker.profileStrength.good",
  "Keep building": "seeker.profileStrength.building",
};

/** Keyed by the fixed English tags produced by `buildProfileTags`. */
const PROFILE_TAG_KEYS: Record<string, MessageKey> = {
  Fresher: "seeker.profileTags.fresher",
  "Open to Work": "seeker.profileTags.openToWork",
  "Immediate Joiner": "seeker.profileTags.immediateJoiner",
  "Actively Looking": "seeker.profileTags.activelyLooking",
};

/** Keyed by stored job seeker profile option values. */
const PROFILE_OPTION_LABEL_KEYS: Record<string, MessageKey> = {
  "on-site": "seeker.profileOptions.workModeOnSite",
  "work-from-home": "seeker.profileOptions.workModeFromHome",
  hybrid: "seeker.profileOptions.workModeHybrid",
  "field-work": "seeker.profileOptions.workModeFieldWork",
  any: "seeker.profileOptions.workModeAny",
  no_formal_education: "seeker.profileOptions.educationNone",
  below_10th: "seeker.profileOptions.educationBelow10th",
  "10th_pass": "seeker.profileOptions.education10th",
  intermediate: "seeker.profileOptions.educationIntermediate",
  iti: "seeker.profileOptions.educationIti",
  diploma: "seeker.profileOptions.educationDiploma",
  graduation: "seeker.profileOptions.educationGraduation",
  post_graduation: "seeker.profileOptions.educationPostGraduation",
  immediate: "seeker.profileOptions.availabilityImmediate",
  within_7: "seeker.profileOptions.availability7",
  within_15: "seeker.profileOptions.availability15",
  within_30: "seeker.profileOptions.availability30",
  currently_working: "seeker.profileOptions.availabilityWorking",
  male: "seeker.profileOptions.genderMale",
  female: "seeker.profileOptions.genderFemale",
  other: "seeker.profileOptions.genderOther",
  prefer_not_to_say: "seeker.profileOptions.genderPreferNot",
  "per-month": "seeker.profileOptions.perMonth",
  "per-year": "seeker.profileOptions.perYear",
};

export function translateChecklistLabel(
  item: { id: string; label: string },
  t: Translate,
): string {
  const key = CHECKLIST_LABEL_KEYS[item.id];
  return key ? t(key) : item.label;
}

export function translateStrengthMessage(message: string, t: Translate): string {
  const key = STRENGTH_MESSAGE_KEYS[message];
  return key ? t(key) : message;
}

export function translateProfileTag(tag: string, t: Translate): string {
  const key = PROFILE_TAG_KEYS[tag];
  return key ? t(key) : tag;
}

export function translateProfileOptionLabel(
  value: string,
  fallbackLabel: string,
  t: Translate,
): string {
  if (JOB_TYPE_VALUES.has(value)) {
    return formatJobSearchJobType(value);
  }
  const key = PROFILE_OPTION_LABEL_KEYS[value];
  return key ? t(key) : fallbackLabel;
}

export function localizeProfileOptions(
  options: readonly { value: string; label: string }[],
  t: Translate,
): EmployerRegisterSelectOption[] {
  return options.map((option) => ({
    value: option.value,
    label: translateProfileOptionLabel(option.value, option.label, t),
  }));
}
