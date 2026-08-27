import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";
import { formatCandidateDateTimeFull } from "../candidates-format";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

interface CandidateProfileDetailsPanelProps {
  detail: OperationsCandidateDetail;
}

export function CandidateProfileDetailsPanel({
  detail,
}: CandidateProfileDetailsPanelProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">
          Personal Information
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailField label="Full Name" value={detail.candidateName} />
          <DetailField label="Phone" value={detail.candidatePhone} />
          <DetailField label="Email" value={detail.candidateEmail} />
          <DetailField
            label="Gender"
            value={
              detail.candidateGender
                ? detail.candidateGender.replaceAll("_", " ")
                : ""
            }
          />
          <DetailField
            label="Date of Birth"
            value={
              detail.dateOfBirth
                ? formatCandidateDateTimeFull(detail.dateOfBirth).split(",")[0] ??
                  "—"
                : ""
            }
          />
          <DetailField label="Pincode" value={detail.candidatePincode} />
          <DetailField label="City" value={detail.candidateCity} />
          <DetailField label="State" value={detail.candidateState} />
          <DetailField
            label="Languages"
            value={detail.languages.join(", ")}
          />
          <DetailField
            label="Experience"
            value={detail.candidateExperienceLabel}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">
          Education & Experience
        </h3>
        <div className="mt-4 space-y-4">
          {detail.education ? (
            <div>
              <p className="text-xs font-semibold text-foreground">
                {detail.education.levelLabel}
                {detail.education.stream || detail.education.degree
                  ? ` · ${detail.education.stream || detail.education.degree}`
                  : ""}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {[
                  detail.education.board ||
                    detail.education.schoolName ||
                    detail.education.collegeName ||
                    detail.education.instituteName,
                  detail.education.passingYear,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">No education details.</p>
          )}

          {detail.experiences.length > 0 ? (
            <ul className="space-y-3">
              {detail.experiences.map((experience, index) => (
                <li
                  key={`${experience.companyName}-${index}`}
                  className="rounded-lg border border-border-subtle px-3 py-2.5"
                >
                  <p className="text-xs font-semibold text-foreground">
                    {experience.jobRole || "Role"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {[experience.companyName, experience.duration]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">No work experience entries.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground">About</h3>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {detail.professionalSummary || "No summary available."}
        </p>
      </section>
    </div>
  );
}
