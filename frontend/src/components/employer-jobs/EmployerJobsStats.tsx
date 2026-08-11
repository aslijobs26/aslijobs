import {
  EMPLOYER_JOB_STAT_CARDS,
  type EmployerJobStatKey,
} from "@/constants/employer-jobs";
import { formatEmployerJobCount } from "@/utils/employer-jobs-format";
import { cn } from "@/utils/cn";

type EmployerJobsStatsProps = {
  values?: Partial<Record<EmployerJobStatKey, number>>;
  isLoading?: boolean;
  className?: string;
};

export function EmployerJobsStats({
  values,
  isLoading = false,
  className,
}: EmployerJobsStatsProps) {
  return (
    <section
      aria-label="Job performance statistics"
      className={cn(
        "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6",
        className,
      )}
    >
      {EMPLOYER_JOB_STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = values?.[card.key];

        return (
          <article
            key={card.key}
            className="group flex h-full min-h-[6.75rem] flex-col rounded-xl border border-border-subtle bg-surface px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-primary/20 hover:shadow-md sm:min-h-[7.25rem] sm:px-4 sm:py-3.5"
          >
            <div
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-lg sm:size-9",
                card.iconWrapClassName,
              )}
              aria-hidden="true"
            >
              <Icon
                className={cn("size-3.5 sm:size-4", card.iconClassName)}
                strokeWidth={2}
              />
            </div>

            <p className="mt-2 text-[10px] font-medium leading-tight text-muted sm:mt-3 sm:text-xs">
              {card.label}
            </p>

            {isLoading ? (
              <div
                className="mt-auto h-6 w-12 animate-pulse rounded bg-border-subtle sm:h-7 sm:w-14"
                aria-hidden="true"
              />
            ) : (
              <p className="mt-auto pt-1 text-lg font-bold tracking-tight text-foreground sm:text-[1.625rem] sm:leading-none">
                {formatEmployerJobCount(value ?? 0)}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
