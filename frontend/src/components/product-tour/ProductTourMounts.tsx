"use client";

import { ProductTourHost } from "@/components/product-tour/ProductTourHost";
import { EMPLOYER_TOURS } from "@/components/product-tour/employer-tours";
import { JOB_SEARCH_TOURS, JOB_SEEKER_TOURS } from "@/components/product-tour/job-seeker-tours";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";

export function JobSeekerProductTour() {
  const profile = useJobSeekerProfile();
  const accountKey = profile.data?.id ? `seeker:${profile.data.id}` : null;
  return <ProductTourHost accountKey={accountKey} tours={JOB_SEEKER_TOURS} />;
}

export function EmployerProductTour() {
  const profile = useEmployerProfile();
  const accountKey = profile.data?.id ? `employer:${profile.data.id}` : null;
  return <ProductTourHost accountKey={accountKey} tours={EMPLOYER_TOURS} />;
}

export function JobSearchProductTour() {
  const profile = useJobSeekerProfile();
  const accountKey = profile.data?.id
    ? `seeker:${profile.data.id}`
    : profile.isLoading || profile.isFetching
      ? null
      : "guest";

  return (
    <ProductTourHost
      accountKey={accountKey}
      tours={JOB_SEARCH_TOURS}
      autoStart={Boolean(profile.data?.id)}
    />
  );
}

