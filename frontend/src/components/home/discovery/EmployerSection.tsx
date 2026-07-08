import { TOP_EMPLOYERS } from "@/constants/employers";
import { ROUTES } from "@/constants/routes";
import { DiscoverySectionHeader } from "./DiscoverySectionHeader";
import { EmployerCarousel } from "./EmployerCarousel";

export function EmployerSection() {
  return (
    <section aria-labelledby="top-employers-hiring-now">
      <DiscoverySectionHeader
        title="Top Employers Hiring Now"
        titleId="top-employers-hiring-now"
        actionLabel="View all employers →"
        actionHref={ROUTES.EMPLOYERS}
      />

      <EmployerCarousel employers={TOP_EMPLOYERS} />
    </section>
  );
}
