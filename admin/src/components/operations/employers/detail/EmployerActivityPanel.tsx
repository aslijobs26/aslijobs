import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  Ban,
  Bookmark,
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  FileUp,
  Gift,
  ImageIcon,
  LogIn,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  operationsCandidateDetailPath,
  operationsJobDetailPath,
} from "../../../../constants/operations-routes";
import { useOperationsEmployerActivity } from "../../../../hooks/use-operations-employers";
import type {
  OperationsEmployerActivityCategory,
  OperationsEmployerActivityEvent,
} from "../../../../types/operations-employers";
import { OPERATIONS_EMPLOYER_ACTIVITY_CATEGORIES } from "../../../../types/operations-employers";
import { cn } from "../../../../utils/cn";
import {
  activityPageRange,
  activityParams,
  filterActivity,
  initialActivityView,
  newerActivityPage,
  olderActivityPage,
  resizeActivity,
  type ActivityView,
} from "../../activity/activity-pagination";
import {
  ActivityActorBadge,
  ActivityEventRow,
  ActivityFilterChips,
  ActivityJourneyStep,
  ActivityLoadError,
  ActivityPaginationBar,
  ActivityPanelSkeleton,
  ActivitySummaryTile,
} from "../../activity/ActivityTimelineParts";
import { formatEmployerDateTimeFull } from "../employers-format";

interface EmployerActivityPanelProps {
  employerId: string;
}

type EmployerActivityView = ActivityView<OperationsEmployerActivityCategory>;

const CATEGORY_LABELS: Record<"all" | OperationsEmployerActivityCategory, string> = {
  all: "All",
  account: "Account",
  profile: "Profile",
  verification: "Verification",
  job: "Jobs",
  application: "Applications",
  interview: "Interviews",
  offer: "Offers",
  candidate: "Saved Candidates",
  team: "Team",
  operations: "Operations",
};

const CATEGORY_STYLES: Record<
  OperationsEmployerActivityCategory,
  { icon: LucideIcon; className: string }
> = {
  account: { icon: UserCheck, className: "bg-primary-light text-primary" },
  profile: { icon: Building2, className: "bg-primary-light text-primary" },
  verification: { icon: ShieldCheck, className: "bg-success/10 text-success" },
  job: { icon: Briefcase, className: "bg-primary-light text-primary" },
  application: { icon: FileText, className: "bg-chart-accent/10 text-chart-accent" },
  interview: {
    icon: CalendarCheck,
    className: "bg-chart-accent/10 text-chart-accent",
  },
  offer: { icon: Gift, className: "bg-success/10 text-success" },
  candidate: { icon: Bookmark, className: "bg-warning/10 text-warning" },
  team: { icon: Users, className: "bg-hero-bg text-muted" },
  operations: { icon: UserCog, className: "bg-hero-bg text-muted" },
};

const EVENT_TYPE_ICONS: Partial<Record<string, LucideIcon>> = {
  account_login: LogIn,
  account_last_login: LogIn,
  account_whatsapp_verified: BadgeCheck,
  verification_document_uploaded: FileUp,
  profile_logo_updated: ImageIcon,
  profile_photo_updated: ImageIcon,
  "employer.account_suspended": Ban,
};

const NEGATIVE_EVENT_TYPES = new Set([
  "employer.verification_rejected",
  "employer.account_suspended",
  "employer.account_deleted",
  "job.rejected",
  "job.live_revision_rejected",
  "job.expired",
  "job_review_rejected",
  "application_rejected",
  "application_withdrawn",
  "application_did_not_join",
  "interview_cancelled",
  "offer_declined",
]);

function withActorName(role: string, actorName: string): string {
  return actorName && actorName.toLowerCase() !== role.toLowerCase()
    ? `${role} · ${actorName}`
    : role;
}

function actorLabel(event: OperationsEmployerActivityEvent): string {
  switch (event.actor) {
    case "employer":
      return withActorName("Employer", event.actorName);
    case "candidate":
      return "Candidate";
    case "operations":
      return withActorName("Operations", event.actorName);
    default:
      return "System";
  }
}

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

const linkClass =
  "text-[10px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function EmployerActivityPanel({ employerId }: EmployerActivityPanelProps) {
  const [view, setView] = useState<EmployerActivityView>(() => initialActivityView());
  const activityQuery = useOperationsEmployerActivity(employerId, activityParams(view));
  const data = activityQuery.data;

  if (activityQuery.isPending) {
    return <ActivityPanelSkeleton />;
  }

  if (activityQuery.isError || !data) {
    return (
      <ActivityLoadError
        error={activityQuery.error}
        fallback="Failed to load employer activity."
        onRetry={() => void activityQuery.refetch()}
      />
    );
  }

  const { summary, pageInfo } = data;
  const categories = OPERATIONS_EMPLOYER_ACTIVITY_CATEGORIES.filter(
    (category) => data.categoryCounts[category] > 0 || view.category === category,
  );
  const pageRange = activityPageRange(view, data.events.length);
  const pageBusy = activityQuery.isPlaceholderData;
  const hiddenSections = [
    data.jobsRestricted ? "job" : "",
    data.applicationsRestricted ? "application, interview, offer and saved candidate" : "",
    data.documentsRestricted ? "verification document" : "",
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      <section className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <BadgeCheck className="size-3.5 text-primary sm:size-4" aria-hidden="true" />
          <h3 className="text-[12px] font-bold text-foreground sm:text-sm">
            Employer Journey
          </h3>
        </div>
        <ol className="mt-3 flex overflow-x-auto pb-1 scrollbar-hidden">
          {data.journey.map((stage, index) => (
            <ActivityJourneyStep
              key={stage.id}
              stage={stage}
              isLast={index === data.journey.length - 1}
              formatDateTime={formatEmployerDateTimeFull}
            />
          ))}
        </ol>
        {hiddenSections.length > 0 ? (
          <p className="mt-2 rounded-lg bg-hero-bg px-2.5 py-1.5 text-[11px] text-muted">
            Some {hiddenSections.join("; ")} activity is hidden because you do not
            have permission to view it for this employer.
          </p>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5">
        {data.jobsRestricted ? null : (
          <>
            <ActivitySummaryTile
              label="Jobs (drafts)"
              value={`${formatCount(summary.jobs)} (${formatCount(summary.draftJobs)})`}
            />
            <ActivitySummaryTile label="Live jobs" value={formatCount(summary.liveJobs)} />
            <ActivitySummaryTile
              label="Pending approval"
              value={formatCount(summary.pendingJobs)}
            />
            <ActivitySummaryTile
              label="Closed jobs"
              value={formatCount(summary.closedJobs)}
            />
          </>
        )}
        {data.applicationsRestricted ? null : (
          <>
            <ActivitySummaryTile
              label="Applications (shortlisted)"
              value={`${formatCount(summary.applications)} (${formatCount(summary.shortlisted)})`}
            />
            <ActivitySummaryTile
              label="Interviews"
              value={formatCount(summary.interviews)}
            />
            <ActivitySummaryTile label="Hired" value={formatCount(summary.hired)} />
            <ActivitySummaryTile
              label="Saved candidates"
              value={formatCount(summary.savedCandidates)}
            />
          </>
        )}
        <ActivitySummaryTile
          label="Last login"
          compact
          value={summary.lastLoginAt ? formatEmployerDateTimeFull(summary.lastLoginAt) : "—"}
        />
        <ActivitySummaryTile
          label="Last activity"
          compact
          value={
            summary.lastActivityAt ? formatEmployerDateTimeFull(summary.lastActivityAt) : "—"
          }
        />
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-4">
        <div className="flex items-center gap-1.5 border-b border-border-subtle pb-2 sm:gap-2 sm:pb-3">
          <Activity className="size-3.5 text-primary sm:size-4" aria-hidden="true" />
          <h3 className="text-[12px] font-bold text-foreground sm:text-sm">
            Account Activity & History
          </h3>
        </div>

        <ActivityFilterChips
          categories={["all", ...categories]}
          selected={view.category}
          counts={data.categoryCounts}
          labels={CATEGORY_LABELS}
          onSelect={(category) => setView((current) => filterActivity(current, category))}
        />

        {data.events.length === 0 ? (
          <p className="py-8 text-center text-[11px] text-muted sm:text-xs">
            No recorded activity for this filter.
          </p>
        ) : (
          <ol
            className={cn(
              "mt-2.5 space-y-3 sm:mt-3 sm:space-y-3.5",
              activityQuery.isFetching && "opacity-70",
            )}
          >
            {data.events.map((event) => {
              const style = CATEGORY_STYLES[event.category];
              return (
                <ActivityEventRow
                  key={event.id}
                  icon={EVENT_TYPE_ICONS[event.type] ?? style.icon}
                  iconClassName={
                    NEGATIVE_EVENT_TYPES.has(event.type)
                      ? "bg-danger/10 text-danger"
                      : style.className
                  }
                  title={event.title}
                  at={event.at}
                  description={event.description}
                  formatDateTime={formatEmployerDateTimeFull}
                >
                  <ActivityActorBadge label={actorLabel(event)} />
                  {event.publicJobId ? (
                    <Link to={operationsJobDetailPath(event.publicJobId)} className={linkClass}>
                      View job {event.publicJobId}
                    </Link>
                  ) : null}
                  {event.candidateId ? (
                    <Link
                      to={operationsCandidateDetailPath(event.candidateId)}
                      className={linkClass}
                    >
                      View candidate {event.candidateDisplayId}
                    </Link>
                  ) : null}
                </ActivityEventRow>
              );
            })}
          </ol>
        )}
      </section>

      {pageInfo.total > 0 ? (
        <ActivityPaginationBar
          ariaLabel="Employer activity pagination"
          from={pageRange.from}
          to={pageRange.to}
          total={pageInfo.total}
          limit={view.limit}
          loading={pageBusy}
          canGoBack={view.cursors.length > 1 && !pageBusy}
          canGoForward={Boolean(pageInfo.hasMore && pageInfo.nextCursor) && !pageBusy}
          onPrevious={() => setView(newerActivityPage)}
          onNext={() =>
            setView((current) => olderActivityPage(current, pageInfo.nextCursor))
          }
          onLimitChange={(limit) => setView((current) => resizeActivity(current, limit))}
        />
      ) : null}
    </div>
  );
}
