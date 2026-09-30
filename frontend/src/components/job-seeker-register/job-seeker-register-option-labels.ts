import type { MessageKey } from "@/i18n/translate";
import type {
  JobSeekerAvailabilityStatus,
  JobSeekerEducationLevel,
  JobSeekerGender,
  JobSeekerJobType,
  JobSeekerSalaryPeriod,
  JobSeekerWorkMode,
} from "@/types/job-seeker";

type LabelKeys<V extends string> = Readonly<Record<V, MessageKey>>;

export const GENDER_LABEL_KEYS: LabelKeys<JobSeekerGender> = {
  male: "auth.jobSeekerOptions.genderMale",
  female: "auth.jobSeekerOptions.genderFemale",
  other: "auth.jobSeekerOptions.genderOther",
  prefer_not_to_say: "auth.jobSeekerOptions.genderPreferNotToSay",
};

export const JOB_TYPE_LABEL_KEYS: LabelKeys<JobSeekerJobType> = {
  "full-time": "auth.jobSeekerOptions.jobTypeFullTime",
  "part-time": "auth.jobSeekerOptions.jobTypePartTime",
  contract: "auth.jobSeekerOptions.jobTypeContract",
};

export const WORK_MODE_LABEL_KEYS: LabelKeys<JobSeekerWorkMode> = {
  "on-site": "auth.jobSeekerOptions.workModeOnSite",
  "work-from-home": "auth.jobSeekerOptions.workModeWorkFromHome",
  hybrid: "auth.jobSeekerOptions.workModeHybrid",
  "field-work": "auth.jobSeekerOptions.workModeFieldWork",
  any: "auth.jobSeekerOptions.workModeAny",
};

export const SALARY_PERIOD_LABEL_KEYS: LabelKeys<JobSeekerSalaryPeriod> = {
  "per-month": "auth.jobSeekerOptions.salaryPerMonth",
  "per-year": "auth.jobSeekerOptions.salaryPerYear",
};

export const EDUCATION_LEVEL_LABEL_KEYS: LabelKeys<JobSeekerEducationLevel> = {
  no_formal_education: "auth.jobSeekerOptions.educationNoFormal",
  below_10th: "auth.jobSeekerOptions.educationBelow10th",
  "10th_pass": "auth.jobSeekerOptions.education10thPass",
  intermediate: "auth.jobSeekerOptions.educationIntermediate",
  iti: "auth.jobSeekerOptions.educationIti",
  diploma: "auth.jobSeekerOptions.educationDiploma",
  graduation: "auth.jobSeekerOptions.educationGraduation",
  post_graduation: "auth.jobSeekerOptions.educationPostGraduation",
};

export const AVAILABILITY_LABEL_KEYS: LabelKeys<JobSeekerAvailabilityStatus> = {
  immediate: "auth.jobSeekerOptions.availabilityImmediate",
  within_7: "auth.jobSeekerOptions.availabilityWithin7",
  within_15: "auth.jobSeekerOptions.availabilityWithin15",
  within_30: "auth.jobSeekerOptions.availabilityWithin30",
  currently_working: "auth.jobSeekerOptions.availabilityCurrentlyWorking",
};

/** Replaces static option labels with localized copy; option values stay unchanged. */
export function localizeOptions<V extends string>(
  options: ReadonlyArray<{ readonly value: V; readonly label: string }>,
  labelKeys: LabelKeys<V>,
  translateKey: (key: MessageKey) => string,
): { value: V; label: string }[] {
  return options.map((option) => ({
    value: option.value,
    label: translateKey(labelKeys[option.value]),
  }));
}
