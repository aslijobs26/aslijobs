import { JobSearchPageContent } from "@/components/job-search/JobSearchPageContent";
import type { Metadata } from "next";
import { Suspense } from "react";

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export async function generateMetadata({
  searchParams,
}: JobsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim();
  const city = firstParam(params.city)?.trim();
  const state = firstParam(params.state)?.trim();

  const locationParts = [city, state].filter(Boolean);
  const locationLabel = locationParts.join(", ");

  let title = "Search Jobs | AsliJobs";
  if (q && locationLabel) {
    title = `${q} jobs in ${locationLabel} | AsliJobs`;
  } else if (q) {
    title = `${q} jobs | AsliJobs`;
  } else if (locationLabel) {
    title = `Jobs in ${locationLabel} | AsliJobs`;
  }

  return {
    title,
    description:
      "Search verified jobs near you on AsliJobs. Filter by location, salary, experience, and apply on WhatsApp.",
  };
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm text-muted">Loading jobs…</p>
        </main>
      }
    >
      <JobSearchPageContent />
    </Suspense>
  );
}
