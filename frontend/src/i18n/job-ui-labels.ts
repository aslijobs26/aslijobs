import type { SiteLanguageCode } from "../constants/site-language";
import { translate, type MessageKey } from "./translate";

const JOB_TYPE_KEYS: Record<string, MessageKey> = {
  "full-time": "jobs.fullTime",
  "part-time": "jobs.partTime",
  contract: "jobs.contract",
};

const WORK_MODE_KEYS: Record<string, MessageKey> = {
  office: "jobs.office",
  field: "jobs.field",
  both: "jobs.officeField",
  home: "jobs.workFromHome",
};

export function staticJobLabel(
  group: "jobType" | "workMode",
  value: string,
  language: SiteLanguageCode,
): string | null {
  const key = (group === "jobType" ? JOB_TYPE_KEYS : WORK_MODE_KEYS)[value];
  return key ? translate(language, key) : null;
}
