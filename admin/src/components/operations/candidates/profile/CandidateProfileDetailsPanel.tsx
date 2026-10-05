import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import {
  formatCandidateDateTimeFull,
  formatCandidateGender,
} from "../candidates-format";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted max-sm:text-[8px] sm:text-[10px]">
        {label}
      </p>
      <p className="mt-0.5 break-words text-[11px] font-medium text-foreground max-sm:text-[10px] sm:mt-1 sm:text-xs">
        {value || "—"}
      </p>
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
    <div className="grid gap-2.5 max-sm:gap-2 sm:gap-3 lg:grid-cols-2">
      <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm max-sm:p-2.5 sm:p-4">
        <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
          Personal Information
        </h3>
        <div className="mt-3 grid gap-2 max-sm:mt-2.5 max-sm:gap-1.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
          <OperationsCanKey permissionKey="candidates.profile.fields.name.view">
            <DetailField label="Full Name" value={detail.candidateName ?? ""} />
          </OperationsCanKey>
          <OperationsCanKey permissionKey="candidates.profile.fields.phone.view">
            <DetailField label="Phone" value={detail.candidatePhone ?? ""} />
          </OperationsCanKey>
          <OperationsCanKey permissionKey="candidates.profile.fields.email.view">
            <DetailField label="Email" value={detail.candidateEmail ?? ""} />
          </OperationsCanKey>
          <DetailField
            label="Gender"
            value={formatCandidateGender(detail.candidateGender)}
          />
          <OperationsCanKey permissionKey="candidates.profile.fields.dob.view">
            <DetailField
              label="Date of Birth"
              value={
                detail.dateOfBirth
                  ? formatCandidateDateTimeFull(detail.dateOfBirth).split(
                      ",",
                    )[0] ?? "—"
                  : ""
              }
            />
          </OperationsCanKey>
          <OperationsCanKey permissionKey="candidates.profile.fields.location.view">
            <DetailField label="Pincode" value={detail.candidatePincode ?? ""} />
            <DetailField label="City" value={detail.candidateCity ?? ""} />
            <DetailField label="State" value={detail.candidateState ?? ""} />
          </OperationsCanKey>
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

      <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm max-sm:p-2.5 sm:p-4">
        <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
          Education & Experience
        </h3>
        <div className="mt-3 space-y-3 max-sm:mt-2.5 max-sm:space-y-2.5 sm:mt-4 sm:space-y-4">
          {detail.education ? (
            <div>
              <p className="text-[11px] font-semibold text-foreground max-sm:text-[10px] sm:text-xs">
                {detail.education.levelLabel}
                {detail.education.stream || detail.education.degree
                  ? ` · ${detail.education.stream || detail.education.degree}`
                  : ""}
              </p>
              <p className="mt-0.5 text-[10px] text-muted max-sm:text-[9px] sm:mt-1 sm:text-[11px]">
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
            <p className="text-[11px] text-muted max-sm:text-[10px] sm:text-xs">
              No education details.
            </p>
          )}

          {detail.experiences.length > 0 ? (
            <ul className="space-y-2 max-sm:space-y-1.5 sm:space-y-3">
              {detail.experiences.map((experience, index) => (
                <li
                  key={`${experience.companyName}-${index}`}
                  className="rounded-lg border border-border-subtle px-2.5 py-2 max-sm:px-2 max-sm:py-1.5 sm:px-3 sm:py-2.5"
                >
                  <p className="text-[11px] font-semibold text-foreground max-sm:text-[10px] sm:text-xs">
                    {experience.jobRole || "Role"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted max-sm:text-[9px] sm:text-[11px]">
                    {[experience.companyName, experience.duration]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <OperationsCanKey permissionKey="candidates.profile.fields.current_salary.view">
                    {experience.salary ? (
                      <p className="mt-1 text-[10px] text-muted max-sm:text-[9px] sm:text-[11px]">
                        Salary: {experience.salary}
                      </p>
                    ) : null}
                  </OperationsCanKey>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-muted max-sm:text-[10px] sm:text-xs">
              No work experience entries.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm max-sm:p-2.5 sm:p-4 lg:col-span-2">
        <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
          About
        </h3>
        <p className="mt-2 text-[11px] leading-relaxed text-muted max-sm:mt-1.5 max-sm:text-[10px] sm:mt-3 sm:text-xs">
          {detail.professionalSummary || "No summary available."}
        </p>
      </section>
    </div>
  );
}
