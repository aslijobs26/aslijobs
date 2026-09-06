import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import { getOperationsAuthUser } from "../../../utils/operations-auth-storage";

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName(fullName: string) {
  return fullName.split(" ").filter(Boolean)[0] || "there";
}

export function DashboardGreetingSection() {
  const sessionUser = getOperationsAuthUser();
  const { user } = useOperationsPermissions();
  const resolvedUser = user ?? sessionUser;
  const firstName = resolvedUser?.fullName
    ? getFirstName(resolvedUser.fullName)
    : "there";

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-muted">{dateLabel}</p>
        <h1 className="mt-1 text-[1.625rem] font-bold tracking-tight text-foreground sm:text-[1.75rem]">
          {getGreeting(now)}, {firstName}!
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Here&apos;s what&apos;s happening across ASLI today.
        </p>
      </div>

      <Link
        to={OPERATIONS_ROUTES.MY_WORK}
        className="group inline-flex min-h-14 w-full shrink-0 items-center gap-3 rounded-xl border border-primary/20 bg-[#E8F1FF] px-3.5 py-3 transition-colors hover:bg-primary-light sm:w-[22rem] sm:max-w-sm dark:bg-primary-light/40"
        aria-label="Ask ASLI"
      >
        <span className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden bg-transparent sm:size-16">
          <img
            src="/assets/ask-asli-robot.png"
            alt=""
            className="size-14 object-contain object-center sm:size-16"
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-foreground">
            Ask ASLI
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-muted">
            Get instant insights, find information, or take action.
          </span>
        </span>
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-sm transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
        </span>
      </Link>
    </section>
  );
}
