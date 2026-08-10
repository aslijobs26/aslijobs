import { getResumeTemplateByIdLabel } from "@/components/job-seeker-resume/resume-template-labels";
import type { PublicResume } from "@/types/job-seeker-resume";

type ResumeMetadataPanelProps = {
  resume: PublicResume;
};

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ResumeMetadataPanel({ resume }: ResumeMetadataPanelProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Resume Version", value: `v${resume.versionNumber}` },
    { label: "Generated", value: formatDate(resume.lastGeneratedAt) },
    { label: "Last Updated", value: formatDate(resume.updatedAt) },
    {
      label: "Profile Completion",
      value: `${resume.profileCompletionPercent}%`,
    },
    {
      label: "Generation Source",
      value: resume.generationSource,
    },
    {
      label: "Template",
      value: getResumeTemplateByIdLabel(resume.templateId),
    },
    {
      label: "Template Version",
      value: resume.templateVersion || "—",
    },
  ];

  return (
    <div className="resume-no-print rounded-xl border border-border-subtle bg-surface p-4">
      <h3 className="text-xs font-semibold text-foreground sm:text-sm">
        Resume Metadata
      </h3>
      <dl className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-3 text-xs sm:text-sm"
          >
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-right font-medium capitalize text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
