import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";
import { OperationsCanKey } from "../../auth/OperationsCanKey";

function ChipList({ values }: { values: string[] }) {
  if (!values.length) {
    return (
      <p className="text-[11px] text-muted max-sm:text-[10px] sm:text-xs">—</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1 max-sm:gap-1 sm:gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex max-w-full truncate rounded-md bg-primary-light/70 px-1.5 py-0.5 text-[10px] font-medium text-primary max-sm:text-[9px] sm:px-2 sm:text-[11px]"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

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

function formatSalary(amount: number | null | undefined, period?: string): string {
  if (amount == null) {
    return "—";
  }
  const formatted = amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  return `${formatted} ${period === "per-year" ? "per year" : "per month"}`;
}

interface CandidatePreferencesPanelProps {
  detail: OperationsCandidateDetail;
}

export function CandidatePreferencesPanel({
  detail,
}: CandidatePreferencesPanelProps) {
  return (
    <div className="grid gap-2.5 max-sm:gap-2 sm:gap-3 lg:grid-cols-2">
      <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm max-sm:p-2.5 sm:p-4">
        <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
          Job Preferences / Interests
        </h3>
        <div className="mt-3 space-y-3 max-sm:mt-2.5 max-sm:space-y-2.5 sm:mt-4 sm:space-y-4">
          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted max-sm:text-[8px] sm:mb-1.5 sm:text-[10px]">
              Positions interested in
            </p>
            <ChipList values={detail.preferredRoles} />
          </div>
          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted max-sm:text-[8px] sm:mb-1.5 sm:text-[10px]">
              Preferred Locations
            </p>
            <ChipList values={detail.preferredLocations} />
          </div>
          <div className="grid gap-2 max-sm:gap-1.5 sm:grid-cols-2 sm:gap-3">
            <DetailField label="Preferred Work Type" value={detail.jobType} />
            <DetailField label="Preferred Work Mode" value={detail.workMode} />
            <OperationsCanKey permissionKey="candidates.profile.fields.expected_salary.view">
              <DetailField
                label="Preferred Salary"
                value={formatSalary(
                  detail.expectedSalary,
                  detail.expectedSalaryPeriod,
                )}
              />
            </OperationsCanKey>
            <DetailField
              label="Availability"
              value={detail.availabilityLabel || detail.availabilityStatus}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm max-sm:p-2.5 sm:p-4">
        <h3 className="text-[13px] font-semibold text-foreground max-sm:text-[12px] sm:text-sm">
          Skills
        </h3>
        <div className="mt-3 max-sm:mt-2.5 sm:mt-4">
          <ChipList values={detail.skills} />
        </div>
      </section>
    </div>
  );
}
