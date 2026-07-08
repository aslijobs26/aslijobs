import { JOB_CATEGORIES } from "@/constants/job-categories";
import { ROUTES } from "@/constants/routes";
import { CategoryCard } from "./CategoryCard";
import { DiscoverySectionHeader } from "./DiscoverySectionHeader";

export function CategorySection() {
  return (
    <section aria-labelledby="browse-jobs-by-category">
      <DiscoverySectionHeader
        title="Browse Jobs by Category"
        titleId="browse-jobs-by-category"
        actionLabel="View all categories →"
        actionHref={ROUTES.JOB_CATEGORIES}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:grid-cols-8">
        {JOB_CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
