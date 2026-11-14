"use client";

import { IndiaStatesMap } from "@/components/home/jobs-discovery/india-map/IndiaStatesMap";
import { indexStateJobCounts } from "@/components/home/jobs-discovery/india-map/location-browse";
import { JOB_STATES_VIEW_ALL_HREF } from "@/constants/job-locations";
import { useTranslate } from "@/i18n/translate";
import { fetchPublicLocationCounts } from "@/services/public-location-counts.service";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";

export function LocationDiscoverySection() {
  const t = useTranslate();
  const countsQuery = useQuery({
    queryKey: ["public-job-location-counts"],
    queryFn: ({ signal }) => fetchPublicLocationCounts({ signal }),
    staleTime: 60_000,
  });

  const countsStatus = countsQuery.isError
    ? "error"
    : countsQuery.data
      ? "ready"
      : "loading";

  const stateCounts = useMemo(
    () => indexStateJobCounts(countsQuery.data?.states ?? null),
    [countsQuery.data?.states],
  );

  return (
    <section aria-labelledby="browse-jobs-by-state">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="browse-jobs-by-state"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {t("home.jobsDiscovery.statesTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted sm:text-[15px]">
            {t("home.jobsDiscovery.statesSubtitle")}
          </p>
        </div>

        <Link
          href={JOB_STATES_VIEW_ALL_HREF}
          className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {t("home.jobsDiscovery.statesAction")}
        </Link>
      </div>

      <div className="mt-5 sm:mt-6">
        <IndiaStatesMap
          counts={stateCounts}
          cities={countsQuery.data?.cities ?? null}
          countsStatus={countsStatus}
        />
      </div>
    </section>
  );
}
