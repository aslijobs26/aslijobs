import type { OperationsCandidateDetail } from "../../../../types/operations-candidates";

function ChipList({ values }: { values: string[] }) {
  if (!values.length) {
    return <p className="text-xs text-muted">—</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex rounded-md bg-primary-light/70 px-2 py-0.5 text-[11px] font-medium text-primary"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

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

function formatSalary(amount: number | null, period: string): string {
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
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">
          Job Preferences / Interests
        </h3>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Positions interested in
            </p>
            <ChipList values={detail.preferredRoles} />
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Preferred Locations
            </p>
            <ChipList values={detail.preferredLocations} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Preferred Work Type" value={detail.jobType} />
            <DetailField label="Preferred Work Mode" value={detail.workMode} />
            <DetailField
              label="Preferred Salary"
              value={formatSalary(
                detail.expectedSalary,
                detail.expectedSalaryPeriod,
              )}
            />
            <DetailField
              label="Availability"
              value={detail.availabilityLabel || detail.availabilityStatus}
            />
            <DetailField
              label="Willing to Travel"
              value={detail.willingToTravel ?? ""}
            />
            <DetailField
              label="Willing to Relocate"
              value={detail.willingToRelocate ?? ""}
            />
            <DetailField
              label="Work Shift Preference"
              value={detail.workShiftPreference ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Skills</h3>
        <div className="mt-4">
          <ChipList values={detail.skills} />
        </div>
      </section>
    </div>
  );
}
