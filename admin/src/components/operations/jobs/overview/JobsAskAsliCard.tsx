import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";

export function JobsAskAsliCard() {
  return (
    <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] p-3.5 shadow-sm max-lg:p-3 max-sm:p-2.5 dark:from-primary/10 dark:to-surface xl:p-3">
      <p className="text-[12px] font-semibold text-foreground max-sm:text-[11px] xl:text-[11px]">
        Need Help?
      </p>
      <div className="mt-2 flex items-start gap-2.5 max-sm:gap-2 xl:mt-1.5 xl:gap-2">
        <img
          src="/assets/ask-asli-robot.png"
          alt=""
          className="size-12 shrink-0 object-contain max-sm:size-10 xl:size-10"
        />
        <p className="text-[11px] leading-snug text-muted max-sm:text-[10px] xl:text-[10px]">
          Ask ASLI for job demand trends, pending approvals, or listings at risk
          of expiry.
        </p>
      </div>
      <Link
        to={OPERATIONS_ROUTES.MY_WORK}
        className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary text-[12px] font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:mt-2.5 max-sm:h-9 max-sm:text-[11px] xl:mt-2.5 xl:h-7 xl:text-[11px]"
      >
        Ask ASLI
      </Link>
    </section>
  );
}
