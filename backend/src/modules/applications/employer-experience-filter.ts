/**
 * Maps employer Candidates "experience" query values (post-job experience IDs)
 * to MongoDB match fragments against resume snapshot fields.
 */

import { JOB_EXPERIENCE_LEVELS } from "../../constants/job.constants.js";

export const EMPLOYER_EXPERIENCE_FILTERS = JOB_EXPERIENCE_LEVELS;

export type EmployerExperienceFilter =
  (typeof EMPLOYER_EXPERIENCE_FILTERS)[number];

const EXPERIENCE_LABEL_FIELD =
  "resumeSnapshot.resumeJson.sections.experienceLabel";
const EXPERIENCE_ENTRIES_FIELD =
  "resumeSnapshot.resumeJson.sections.experience";
const IS_FRESHER_FIELD = "resumeSnapshot.resumeJson.sections.isFresher";

function regexMatch(pattern: string) {
  return { $regex: pattern, $options: "i" as const };
}

function labelOrDurationMatchesAny(
  patterns: string[],
): Record<string, unknown> {
  return {
    $or: patterns.flatMap((pattern) => [
      { [EXPERIENCE_LABEL_FIELD]: regexMatch(pattern) },
      {
        [EXPERIENCE_ENTRIES_FIELD]: {
          $elemMatch: { duration: regexMatch(pattern) },
        },
      },
    ]),
  };
}

function notFresher(): Record<string, unknown> {
  return {
    $or: [
      { [IS_FRESHER_FIELD]: { $ne: true } },
      { [IS_FRESHER_FIELD]: { $exists: false } },
    ],
  };
}

export function parseEmployerExperienceFilter(
  value: string | undefined,
): EmployerExperienceFilter | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return null;
  }
  if ((EMPLOYER_EXPERIENCE_FILTERS as readonly string[]).includes(trimmed)) {
    return trimmed as EmployerExperienceFilter;
  }
  return null;
}

/**
 * Builds a match for a selected post-job experience bucket.
 * Unknown / free-text values return null (no filter applied).
 */
export function buildEmployerExperienceMatch(
  filter: EmployerExperienceFilter | null,
): Record<string, unknown> | null {
  if (!filter) {
    return null;
  }

  switch (filter) {
    case "fresher":
      return {
        $or: [
          { [IS_FRESHER_FIELD]: true },
          { [EXPERIENCE_LABEL_FIELD]: regexMatch("^\\s*fresher\\s*$") },
          {
            $and: [
              {
                $or: [
                  { [EXPERIENCE_ENTRIES_FIELD]: { $exists: false } },
                  { [EXPERIENCE_ENTRIES_FIELD]: { $size: 0 } },
                ],
              },
              {
                $or: [
                  { [EXPERIENCE_LABEL_FIELD]: { $in: ["", null] } },
                  { [EXPERIENCE_LABEL_FIELD]: { $exists: false } },
                  { [EXPERIENCE_LABEL_FIELD]: regexMatch("^\\s*fresher\\s*$") },
                ],
              },
            ],
          },
        ],
      };

    case "6_month":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "less\\s+than\\s*6\\s*months?",
            "under\\s*6\\s*months?",
            "<\\s*6\\s*months?",
            "\\b[1-5]\\s*months?\\b",
            "few\\s*months?",
            "0\\s*[-to]+\\s*6\\s*months?",
          ]),
        ],
      };

    case "1_year":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "6\\s*months?\\s*to\\s*1\\s*years?",
            "6\\s*[-to]+\\s*12\\s*months?",
            "\\b6\\s*months?\\b",
            "\\b7\\s*months?\\b",
            "\\b8\\s*months?\\b",
            "\\b9\\s*months?\\b",
            "\\b10\\s*months?\\b",
            "\\b11\\s*months?\\b",
            "\\b12\\s*months?\\b",
            "\\b1\\s*year\\b",
            "\\bone\\s*year\\b",
          ]),
        ],
      };

    case "2_year":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "1\\s*to\\s*2\\s*years?",
            "1\\s*[-–]\\s*2\\s*years?",
            "\\b1\\.5\\s*years?\\b",
            "\\b2\\s*years?\\b",
            "\\btwo\\s*years?\\b",
          ]),
        ],
      };

    case "3_year":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "2\\s*to\\s*3\\s*years?",
            "2\\s*[-–]\\s*3\\s*years?",
            "\\b2\\.5\\s*years?\\b",
            "\\b3\\s*years?\\b",
            "\\bthree\\s*years?\\b",
          ]),
        ],
      };

    case "4_year":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "3\\s*to\\s*5\\s*years?",
            "3\\s*[-–]\\s*5\\s*years?",
            "\\b3\\.5\\s*years?\\b",
            "\\b4\\s*years?\\b",
            "\\b4\\.5\\s*years?\\b",
            "\\bfive\\s*years?\\b",
            "\\b5\\s*years?\\b",
          ]),
        ],
      };

    case "5_year":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "5\\s*to\\s*10\\s*years?",
            "5\\s*[-–]\\s*10\\s*years?",
            "\\b[5-9]\\s*years?\\b",
            "\\b10\\s*years?\\b",
          ]),
        ],
      };

    case "6_year":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "^\\s*6\\s*years?\\s*$",
            "\\b6\\s*years?\\b",
            "\\bsix\\s*years?\\b",
          ]),
        ],
      };

    case "10_year":
      return {
        $and: [
          notFresher(),
          labelOrDurationMatchesAny([
            "10\\s*\\+\\s*years?",
            "10\\s*plus\\s*years?",
            "more\\s*than\\s*10\\s*years?",
            "over\\s*10\\s*years?",
            "\\b1[0-9]\\s*years?\\b",
            "\\b[2-9][0-9]\\s*years?\\b",
          ]),
        ],
      };

    default:
      return null;
  }
}
