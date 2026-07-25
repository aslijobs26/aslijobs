import type { ReactNode } from "react";
import { isResumeJson, type ResumeJson } from "@/types/job-seeker-resume";
import type { PublicResume } from "@/types/job-seeker-resume";

type ResumePreviewProps = {
  resume?: PublicResume;
  resumeJson?: ResumeJson | Record<string, never>;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5">
      <h3 className="border-b border-foreground/20 pb-1 text-xs font-bold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

function formatEducationTitle(entry: ResumeJson["sections"]["education"][number]) {
  const level = entry.level.replaceAll("_", " ");
  const institute =
    entry.collegeName || entry.instituteName || entry.schoolName || "";
  return [level, institute].filter(Boolean).join(" — ");
}

function formatEducationMeta(entry: ResumeJson["sections"]["education"][number]) {
  return [
    entry.degree,
    entry.specialization,
    entry.stream,
    entry.trade,
    entry.branch,
    entry.board,
    entry.passingYear,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ResumePreview({ resume, resumeJson }: ResumePreviewProps) {
  const sourceJson = resumeJson ?? resume?.resumeJson;

  if (!sourceJson || !isResumeJson(sourceJson)) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface p-6 text-sm text-muted">
        Resume content is not available yet.
      </div>
    );
  }

  const json = sourceJson;
  const prefs = json.sections.careerPreferences;
  const contact = json.sections.contact;

  return (
    <article
      id="resume-preview"
      className="resume-print-root rounded-xl border border-border-subtle bg-surface p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-8"
    >
      <header className="border-b border-border-subtle pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {json.header.fullName || "Job Seeker"}
        </h2>
        <p className="mt-1 text-sm font-medium text-primary">
          {json.sections.professionalHeadline || json.header.headline}
        </p>
        <p className="mt-2 text-xs text-muted">
          {[
            json.header.phone || contact.phone,
            [json.header.city, json.header.state].filter(Boolean).join(", ") ||
              json.header.location,
          ]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </header>

      {json.sections.professionalSummary ? (
        <Section title="Professional Summary">
          <p>{json.sections.professionalSummary}</p>
        </Section>
      ) : null}

      {json.sections.careerObjective ? (
        <Section title="Career Objective">
          <p>{json.sections.careerObjective}</p>
        </Section>
      ) : null}

      {json.sections.skills.length > 0 ? (
        <Section title="Skills">
          <p>{json.sections.skills.join(", ")}</p>
        </Section>
      ) : null}

      {json.sections.education.length > 0 ? (
        <Section title="Education">
          <ul className="space-y-3">
            {json.sections.education.map((entry, index) => (
              <li key={`${entry.level}-${index}`}>
                <p className="font-semibold">{formatEducationTitle(entry)}</p>
                <p className="text-xs text-muted">{formatEducationMeta(entry)}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Experience">
        {json.sections.isFresher || json.sections.experience.length === 0 ? (
          <p>{json.sections.experienceLabel || "Fresher"}</p>
        ) : (
          <ul className="space-y-4">
            {json.sections.experience.map((entry, index) => (
              <li key={`${entry.companyName}-${index}`}>
                <p className="font-semibold">
                  {[entry.jobRole, entry.companyName].filter(Boolean).join(" — ")}
                </p>
                <p className="text-xs text-muted">
                  {[
                    entry.industry,
                    [
                      entry.startDate,
                      entry.currentlyWorking ? "Present" : entry.endDate,
                    ]
                      .filter(Boolean)
                      .join(" – "),
                    entry.duration,
                    entry.location,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {entry.responsibilities ? (
                  <p className="mt-1">{entry.responsibilities}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {json.sections.languages.length > 0 ? (
        <Section title="Languages">
          <p>
            {json.sections.languages
              .map(
                (language) =>
                  language.charAt(0).toUpperCase() + language.slice(1),
              )
              .join(", ")}
          </p>
        </Section>
      ) : null}

      <Section title="Career Preferences">
        <ul className="space-y-1 text-sm">
          {prefs.preferredJobRole ? (
            <li>Preferred role: {prefs.preferredJobRole}</li>
          ) : null}
          {prefs.preferredJobLocation ? (
            <li>Preferred location: {prefs.preferredJobLocation}</li>
          ) : null}
          {prefs.jobType ? <li>Job type: {prefs.jobType}</li> : null}
          {prefs.workMode ? <li>Work mode: {prefs.workMode}</li> : null}
          {prefs.expectedSalary != null ? (
            <li>
              Expected salary: {prefs.expectedSalary}
              {prefs.expectedSalaryPeriod
                ? ` ${prefs.expectedSalaryPeriod.replace("-", " ")}`
                : ""}
            </li>
          ) : null}
          {json.sections.availability ? (
            <li>Availability: {json.sections.availability}</li>
          ) : null}
        </ul>
      </Section>

      <Section title="Contact Information">
        <ul className="space-y-1 text-sm">
          {contact.fullName ? <li>Name: {contact.fullName}</li> : null}
          {contact.phone ? <li>Mobile: {contact.phone}</li> : null}
          {contact.city ? <li>City: {contact.city}</li> : null}
          {contact.state ? <li>State: {contact.state}</li> : null}
        </ul>
      </Section>
    </article>
  );
}
