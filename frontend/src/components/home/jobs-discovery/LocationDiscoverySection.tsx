import {
  JOB_CITIES,
  JOB_CITIES_VIEW_ALL_HREF,
  JOB_STATES,
  JOB_STATES_VIEW_ALL_HREF,
} from "@/constants/job-locations";
import { LocationJobList } from "./LocationJobList";

export function LocationDiscoverySection() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0">
      <div className="border-b border-border-subtle lg:pr-8">
        <LocationJobList
          title="Browse Jobs by State"
          titleId="browse-jobs-by-state"
          actionLabel="View all states →"
          actionHref={JOB_STATES_VIEW_ALL_HREF}
          items={JOB_STATES}
          iconType="state"
        />
      </div>

      <div className="border-b border-border-subtle lg:border-l lg:pl-8">
        <LocationJobList
          title="Browse Jobs by City"
          titleId="browse-jobs-by-city"
          actionLabel="View all cities →"
          actionHref={JOB_CITIES_VIEW_ALL_HREF}
          items={JOB_CITIES}
          iconType="city"
        />
      </div>
    </div>
  );
}
