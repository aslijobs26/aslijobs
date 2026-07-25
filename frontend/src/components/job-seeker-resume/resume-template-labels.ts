import type { ResumeTemplateId } from "@/types/job-seeker-resume";

const TEMPLATE_LABELS: Record<ResumeTemplateId, string> = {
  ats_professional: "ATS Professional",
  modern: "Modern",
  blue_collar: "Blue Collar",
  grey_collar: "Grey Collar",
  simple: "Simple",
};

export function getResumeTemplateByIdLabel(
  templateId: string,
): string {
  if (templateId in TEMPLATE_LABELS) {
    return TEMPLATE_LABELS[templateId as ResumeTemplateId];
  }
  return templateId;
}
