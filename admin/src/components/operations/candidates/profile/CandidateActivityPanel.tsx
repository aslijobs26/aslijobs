import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bookmark,
  Briefcase,
  CalendarCheck,
  FileText,
  Gift,
  LogIn,
  ShieldCheck,
  UserCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { operationsJobDetailPath } from "../../../../constants/operations-routes";
import { useOperationsCandidateActivity } from "../../../../hooks/use-operations-candidates";
import type {
  OperationsCandidateActivityCategory,
  OperationsCandidateActivityEvent,
} from "../../../../types/operations-candidates";
import { OPERATIONS_CANDIDATE_ACTIVITY_CATEGORIES } from "../../../../types/operations-candidates";
import { cn } from "../../../../utils/cn";
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
import { formatCandidateDateTimeFull } from "../candidates-format";
import {
  candidateActivityPageRange,
  candidateActivityParams,
  filterCandidateActivity,
  initialCandidateActivityView,
  newerCandidateActivityPage,
  olderCandidateActivityPage,
  resizeCandidateActivity,
} from "./candidate-activity-pagination";

interface CandidateActivityPanelProps {
  jobSeekerId: string;
}

const CATEGORY_LABELS: Record<
  "all" | OperationsCandidateActivityCategory,
  string
> = {
  all: "All",
  account: "Account",
  profile: "Profile",
  resume: "Resume",
  saved_job: "Saved Jobs",
  application: "Applications",
  interview: "Interviews",
  offer: "Offers",
  operations: "Operations",
};

const CATEGORY_STYLES: Record<
  OperationsCandidateActivityCategory,
  { icon: LucideIcon; className: string }
> = {
  account: { icon: UserCheck, className: "bg-primary-light text-primary" },
  profile: { icon: UserCog, className: "bg-primary-light text-primary" },
  resume: { icon: FileText, className: "bg-chart-accent/10 text-chart-accent" },
  saved_job: { icon: Bookmark, className: "bg-warning/10 text-warning" },
  application: { icon: Briefcase, className: "bg-primary-light text-primary" },
  interview: {
    icon: CalendarCheck,
    className: "bg-chart-accent/10 text-chart-accent",
  },
  offer: { icon: Gift, className: "bg-success/10 text-success" },
  operations: { icon: ShieldCheck, className: "bg-hero-bg text-muted" },
};

const EVENT_TYPE_ICONS: Partial<Record<string, LucideIcon>> = {
  account_login: LogIn,
  account_last_login: LogIn,
  account_whatsapp_verified: BadgeCheck,
};

const NEGATIVE_EVENT_TYPES = new Set([
  "application_rejected",
  "application_withdrawn",
  "application_did_not_join",
  "interview_cancelled",
  "offer_declined",
  "resume_generation_failed",
]);

function actorLabel(event: OperationsCandidateActivityEvent): string {
  switch (event.actor) {
    case "candidate":
      return "Candidate";
    case "employer":
      return event.employerName ? `Employer · ${event.employerName}` : "Employer";
    case "operations":
      return event.actorName ? `Operations · ${event.actorName}` : "Operations";
    default:
      return "System";
  }
}

export function CandidateActivityPanel({ jobSeekerId }: CandidateActivityPanelProps) {
  const [view, setView] = useState(() => initialCandidateActivityView());
  const activityQuery = useOperationsCandidateActivity(
    jobSeekerId,
    candidateActivityParams(view),
  );
  const data = activityQuery.data;

  if (activityQuery.isPending) {
    return <ActivityPanelSkeleton />;
  }

  if (activityQuery.isError || !data) {
    return (
      <ActivityLoadError
        message="Failed to load candidate activity."
        onRetry={() => void activityQuery.refetch()}
      />
    );
  }

  const { summary, pageInfo } = data;
  const categories = OPERATIONS_CANDIDATE_ACTIVITY_CATEGORIES.filter(
    (category) =>
      data.categoryCounts[category] > 0 || view.category === category,
  );
  const pageRange = candidateActivityPageRange(view, data.events.length);
  const pageBusy = activityQuery.isPlaceholderData;

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      <section className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <BadgeCheck className="size-3.5 text-primary sm:size-4" aria-hidden="true" />
          <h3 className="text-[12px] font-bold text-foreground sm:text-sm">
            Job Seeker Journey
          </h3>
        </div>
        <ol className="mt-3 flex overflow-x-auto pb-1 scrollbar-hidden">
          {data.journey.map((stage, index) => (
            <ActivityJourneyStep
              key={stage.id}
              stage={stage}
              isLast={index === data.journey.length - 1}
              formatDateTime={formatCandidateDateTimeFull}
            />
          ))}
        </ol>
        {data.applicationsRestricted ? (
          <p className="mt-2 rounded-lg bg-hero-bg px-2.5 py-1.5 text-[11px] text-muted">
            Application, interview and offer activity is hidden because you do
            not have permission to view this candidate's applications.
          </p>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-7">
        {data.applicationsRestricted ? null : (
          <>
            <ActivitySummaryTile
              label="Applications"
              value={summary.applications.toLocaleString("en-IN")}
            />
            <ActivitySummaryTile
              label="Active"
              value={summary.activeApplications.toLocaleString("en-IN")}
            />
            <ActivitySummaryTile
              label="Interviews"
              value={summary.interviews.toLocaleString("en-IN")}
            />
            <ActivitySummaryTile
              label="Offers (accepted / declined)"
              value={`${summary.offers} (${summary.offersAccepted} / ${summary.offersDeclined})`}
            />
            <ActivitySummaryTile
              label="Hired"
              value={summary.hired.toLocaleString("en-IN")}
            />
          </>
        )}
        <ActivitySummaryTile
          label="Saved jobs"
          value={summary.savedJobs.toLocaleString("en-IN")}
        />
        <ActivitySummaryTile
          label="Last activity"
          compact
          value={
            summary.lastActivityAt
              ? formatCandidateDateTimeFull(summary.lastActivityAt)
              : "—"
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
          onSelect={(category) =>
            setView((current) => filterCandidateActivity(current, category))
          }
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
                  formatDateTime={formatCandidateDateTimeFull}
                >
                  <ActivityActorBadge label={actorLabel(event)} />
                  {event.publicJobId ? (
                    <Link
                      to={operationsJobDetailPath(event.publicJobId)}
                      className="text-[10px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      View job {event.publicJobId}
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
          ariaLabel="Candidate activity pagination"
          from={pageRange.from}
          to={pageRange.to}
          total={pageInfo.total}
          limit={view.limit}
          loading={pageBusy}
          canGoBack={view.cursors.length > 1 && !pageBusy}
          canGoForward={Boolean(pageInfo.hasMore && pageInfo.nextCursor) && !pageBusy}
          onPrevious={() => setView(newerCandidateActivityPage)}
          onNext={() =>
            setView((current) =>
              olderCandidateActivityPage(current, pageInfo.nextCursor),
            )
          }
          onLimitChange={(limit) =>
            setView((current) => resizeCandidateActivity(current, limit))
          }
        />
      ) : null}
    </div>
  );
}
