import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";

export function EmployersAskAsliCard() {
  return (
    <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] p-3.5 shadow-sm dark:from-primary/10 dark:to-surface">
      <p className="text-[12px] font-semibold text-foreground">Need Help?</p>
      <div className="mt-2 flex items-start gap-2.5">
        <img
          src="/assets/ask-asli-robot.png"
          alt=""
          className="size-12 shrink-0 object-contain"
        />
        <p className="text-[11px] leading-snug text-muted">
          Ask ASLI for employer insights, verification summaries, or next best
          actions.
        </p>
      </div>
      <Link
        to={OPERATIONS_ROUTES.MY_WORK}
        className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary text-[12px] font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Ask ASLI
      </Link>
    </section>
  );
}
