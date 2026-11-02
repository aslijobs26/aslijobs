import { OperationsCard } from "../../ui/OperationsCard";
import type { OperationsAnalyticsOverview } from "../../../types/operations-analytics";

function count(value: number | null | undefined): string {
  if (value == null) return "Unavailable";
  return value.toLocaleString("en-IN");
}

function percent(value: number | null | undefined): string {
  if (value == null) return "Unavailable";
  return `${value}%`;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border-subtle p-2.5">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted" title={hint ?? label}>
        {label}
      </p>
      <p className="mt-1 text-[16px] font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="px-3 py-6 text-center text-[12px] text-muted">{text}</p>;
}

export function AnalyticsP1Panels({
  tab,
  data,
}: {
  tab: "employer-hiring" | "category-coverage" | "acquisition" | "registration-funnel" | "job-conversion";
  data: OperationsAnalyticsOverview;
}) {
  if (tab === "employer-hiring") {
    const hiring = data.employerHiring;
    const rows = hiring?.rows ?? [];
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <OperationsCard title="Employer hiring" subtitle={hiring?.note} bodyClassName="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
          <Metric label="Employers created" value={count(hiring?.totalEmployers)} hint="Accounts created in the selected period." />
          <Metric label="Verified (created)" value={count(hiring?.verifiedEmployers)} hint="Created in the period and currently verified." />
          <Metric label="Verified in period" value={count(hiring?.verifiedInPeriod)} hint="verifiedAt falls in the period." />
          <Metric label="Active hiring" value={count(hiring?.activeHiringEmployers)} hint="Created a job or had hiring activity in the period." />
          <Metric label="Posted a job" value={count(hiring?.employersWithJobs)} />
          <Metric label="Received applications" value={count(hiring?.employersWithApplications)} />
          <Metric label="Scheduled interviews" value={count(hiring?.employersInterviewing)} />
          <Metric label="Sent offers" value={count(hiring?.employersWithOffers)} />
          <Metric label="Selected candidates" value={count(hiring?.employersWhoSelected)} />
          <Metric label="Joined candidates" value={count(hiring?.employersWithPlacements)} />
          <Metric label="Repeat hiring" value={count(hiring?.repeatHiringEmployers)} hint="Activity on two or more distinct jobs." />
          <Metric label="Jobs per active employer" value={count(hiring?.averageJobsPerPostingEmployer)} />
          <Metric label="Applications per receiving employer" value={count(hiring?.averageApplicationsPerEmployer)} />
          <Metric label="Employer to application" value={percent(hiring?.employerToApplicationPercent)} />
          <Metric label="Employer to join" value={percent(hiring?.employerToJoinPercent)} />
        </OperationsCard>
        <OperationsCard title="Employer performance" subtitle={hiring?.truncated ? "First 25 employers by applications and joins." : undefined} bodyClassName="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <EmptyNote text="No employer hiring activity in this period." />
          ) : (
            <table className="min-w-full text-left text-[12px]">
              <thead className="text-[11px] text-muted">
                <tr>
                  {["Employer", "Jobs", "Applications", "Interviews", "Offers", "Selected", "Joined", "Distinct jobs"].map((heading) => (
                    <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.employerName} className="border-t border-border-subtle">
                    <td className="px-3 py-2">{row.employerName}</td>
                    <td className="px-3 py-2 tabular-nums">{row.jobs}</td>
                    <td className="px-3 py-2 tabular-nums">{row.applications}</td>
                    <td className="px-3 py-2 tabular-nums">{row.interviews}</td>
                    <td className="px-3 py-2 tabular-nums">{row.offers}</td>
                    <td className="px-3 py-2 tabular-nums">{row.selected}</td>
                    <td className="px-3 py-2 tabular-nums">{row.joined}</td>
                    <td className="px-3 py-2 tabular-nums">{row.distinctJobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OperationsCard>
      </div>
    );
  }

  if (tab === "category-coverage") {
    const coverage = data.categoryBreakdown;
    const rows = coverage?.rows ?? [];
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <OperationsCard title="Category gaps" subtitle={coverage?.note} bodyClassName="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
          <Metric label="Jobs, no applications" value={count(coverage?.jobsWithoutApplications)} />
          <Metric label="Applications, no interviews" value={count(coverage?.applicationsWithoutInterviews)} />
          <Metric label="Offers, no joins" value={count(coverage?.offersWithoutJoins)} />
        </OperationsCard>
        <OperationsCard title="Coverage by category" subtitle={coverage?.truncated ? "First 40 categories." : "Unknown values stay Unclassified."} bodyClassName="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <EmptyNote text="No categorized jobs or applications in this period." />
          ) : (
            <table className="min-w-full text-left text-[12px]">
              <thead className="text-[11px] text-muted">
                <tr>
                  {["Category", "Jobs", "Applications", "Interviews", "Offers", "Selected", "Joined", "Employers", "App to interview", "Offer to join"].map((heading) => (
                    <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category} className="border-t border-border-subtle">
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2 tabular-nums">{row.jobs}</td>
                    <td className="px-3 py-2 tabular-nums">{row.applications}</td>
                    <td className="px-3 py-2 tabular-nums">{row.interviews}</td>
                    <td className="px-3 py-2 tabular-nums">{row.offers}</td>
                    <td className="px-3 py-2 tabular-nums">{row.selected}</td>
                    <td className="px-3 py-2 tabular-nums">{row.joined}</td>
                    <td className="px-3 py-2 tabular-nums">{row.employers}</td>
                    <td className="px-3 py-2">{percent(row.applicationToInterviewPercent)}</td>
                    <td className="px-3 py-2">{percent(row.offerToJoinPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OperationsCard>
      </div>
    );
  }

  if (tab === "acquisition") {
    const rows = data.acquisition?.rows ?? [];
    return (
      <OperationsCard title="Acquisition" subtitle={data.acquisition?.note ?? "First-touch attribution. Missing source with no referrer is Direct."} bodyClassName="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <EmptyNote text="No tracked visits in this period. Older visits without UTM stay Direct or Unknown and are not backfilled." />
        ) : (
          <table className="min-w-full text-left text-[12px]">
            <thead className="text-[11px] text-muted">
              <tr>
                {["Source", "Medium", "Campaign", "Content", "Term", "Landing", "Visitors", "Sessions", "Registrations", "Applications", "Visitor to application"].map((heading) => (
                  <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.source}-${row.campaign}-${row.landingPath}`} className="border-t border-border-subtle">
                  <td className="px-3 py-2">{row.source}</td>
                  <td className="px-3 py-2">{row.medium}</td>
                  <td className="px-3 py-2">{row.campaign}</td>
                  <td className="px-3 py-2">{row.content}</td>
                  <td className="px-3 py-2">{row.term}</td>
                  <td className="px-3 py-2">{row.landingPath}</td>
                  <td className="px-3 py-2 tabular-nums">{row.visitors}</td>
                  <td className="px-3 py-2 tabular-nums">{row.sessions}</td>
                  <td className="px-3 py-2 tabular-nums">{row.registrations}</td>
                  <td className="px-3 py-2 tabular-nums">{row.applications}</td>
                  <td className="px-3 py-2">{percent(row.visitorToApplicationPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </OperationsCard>
    );
  }

  if (tab === "registration-funnel") {
    const renderStages = (title: string, stages: NonNullable<OperationsAnalyticsOverview["registrationFunnel"]>["jobSeekers"]) => (
      <OperationsCard title={title} subtitle={data.registrationFunnel?.note} bodyClassName="p-0">
        {stages.length === 0 ? (
          <EmptyNote text="No registration stages for this period." />
        ) : (
          <ol className="divide-y divide-border-subtle">
            {stages.map((stage) => (
              <li key={stage.key} className="px-3 py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[12px] font-medium">{stage.label}</p>
                  <p className="text-[13px] font-semibold tabular-nums">{count(stage.count)}</p>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">
                  {stage.unavailableReason
                    ? stage.unavailableReason
                    : `Conversion from previous stage ${percent(stage.conversionPercent)}. Drop-off ${count(stage.dropOff)}.`}
                </p>
                {stage.definition ? <p className="text-[11px] text-muted">{stage.definition}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </OperationsCard>
    );
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {renderStages("Job seekers", data.registrationFunnel?.jobSeekers ?? [])}
        {renderStages("Employers", data.registrationFunnel?.employers ?? [])}
      </div>
    );
  }

  const conversion = data.jobConversion;
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <OperationsCard title="Job view to application" subtitle={conversion?.note} bodyClassName="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
        <Metric label="Detail view events" value={count(conversion?.detailViewEvents)} hint="Unavailable until job_detail_viewed is tracked." />
        <Metric label="Detail view visitors" value={count(conversion?.detailViewVisitors)} />
        <Metric label="Visitor–job pairs" value={count(conversion?.visitorJobPairs)} hint="Latest view ledger. This is not a page-view count." />
        <Metric label="Applications" value={count(conversion?.applications)} />
        <Metric label="View to application" value={percent(conversion?.viewToApplicationPercent)} />
        <Metric label="Start to submit" value={percent(conversion?.startToSubmitPercent)} />
        <Metric label="Applications per job" value={count(conversion?.applicationsPerJob)} />
        <Metric label="Views, no applications" value={count(conversion?.jobsWithViewsNoApplications)} />
        <Metric label="Applications, no interviews" value={count(conversion?.jobsWithApplicationsNoInterviews)} />
        <Metric label="Interviews, no offers" value={count(conversion?.jobsWithInterviewsNoOffers)} />
        <Metric label="Offers, no joins" value={count(conversion?.jobsWithOffersNoJoins)} />
      </OperationsCard>
      <OperationsCard title="Jobs by applications" bodyClassName="overflow-x-auto p-0">
        {(conversion?.rows.length ?? 0) === 0 ? (
          <EmptyNote text="No applications in this period." />
        ) : (
          <table className="min-w-full text-left text-[12px]">
            <thead className="text-[11px] text-muted">
              <tr>
                {["Job", "Applications", "Interviews", "Offers", "Joined"].map((heading) => (
                  <th key={heading} className="px-3 py-2 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(conversion?.rows ?? []).map((row) => (
                <tr key={row.jobLabel} className="border-t border-border-subtle">
                  <td className="px-3 py-2">{row.jobLabel}</td>
                  <td className="px-3 py-2 tabular-nums">{row.applications}</td>
                  <td className="px-3 py-2 tabular-nums">{row.interviews}</td>
                  <td className="px-3 py-2 tabular-nums">{row.offers}</td>
                  <td className="px-3 py-2 tabular-nums">{row.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </OperationsCard>
    </div>
  );
}
