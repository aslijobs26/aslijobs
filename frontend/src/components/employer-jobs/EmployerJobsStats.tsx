"use client";

import {
  EMPLOYER_JOB_STAT_CARDS,
  type EmployerJobStatKey,
} from "@/constants/employer-jobs";
import { useTranslate } from "@/i18n/translate";
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
  const t = useTranslate();

  return (
    <section
      aria-label={t("employer.jobs.statsAria")}
      className={cn(
        "employer-jobs-stats grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 lg:gap-2",
        className,
      )}
    >
      {EMPLOYER_JOB_STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = values?.[card.key];

        return (
          <article
            key={card.key}
            className={cn(
              "employer-jobs-stat group flex h-full min-h-[6.75rem] flex-col rounded-xl border px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:shadow-md sm:min-h-[7.25rem] sm:px-4 sm:py-3.5 lg:min-h-0 lg:rounded-lg lg:px-2.5 lg:py-2",
              card.cardClassName,
            )}
          >
            <div
              className={cn(
                "employer-jobs-stat__icon inline-flex size-8 items-center justify-center rounded-lg sm:size-9 lg:size-7 lg:rounded-md",
                card.iconWrapClassName,
              )}
              aria-hidden="true"
            >
              <Icon
                className={cn("size-3.5 sm:size-4 lg:size-3.5", card.iconClassName)}
                strokeWidth={2}
              />
            </div>

            <p className="employer-jobs-stat__label mt-2 break-words text-[10px] font-medium leading-tight text-muted sm:mt-3 sm:text-xs lg:mt-1.5 lg:text-[0.625rem]">
              {t(`employer.stats.${card.key}`)}
            </p>

            {isLoading ? (
              <div
                className="mt-auto h-6 w-12 animate-pulse rounded bg-border-subtle/80 sm:h-7 sm:w-14 lg:h-5 lg:w-10"
                aria-hidden="true"
              />
            ) : (
              <p
                className={cn(
                  "employer-jobs-stat__value mt-auto pt-1 text-lg font-bold tracking-tight sm:text-[1.625rem] sm:leading-none lg:pt-0.5 lg:text-xl",
                  card.valueClassName,
                )}
              >
                {formatEmployerJobCount(value ?? 0)}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
