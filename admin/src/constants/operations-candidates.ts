export const OPERATIONS_CANDIDATE_GENDERS = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
] as const;

export type OperationsCandidateGender =
  (typeof OPERATIONS_CANDIDATE_GENDERS)[number];

export const OPERATIONS_CANDIDATE_GENDER_LABELS: Record<
  OperationsCandidateGender,
  string
> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

export const OPERATIONS_CANDIDATE_GENDER_FILTER_OPTIONS = [
  { value: "", label: "All Genders" },
  ...OPERATIONS_CANDIDATE_GENDERS.map((value) => ({
    value,
    label: OPERATIONS_CANDIDATE_GENDER_LABELS[value],
  })),
] as const;
