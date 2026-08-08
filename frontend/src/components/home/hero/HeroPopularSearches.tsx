import { HERO_POPULAR_SEARCHES } from "@/constants/hero";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

export function HeroPopularSearches() {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <p className="shrink-0 text-sm font-medium text-muted">Popular Searches:</p>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {HERO_POPULAR_SEARCHES.map((term) => (
          <li key={term}>
            <Link
              href={`${ROUTES.FIND_JOBS}?q=${encodeURIComponent(term)}`}
              className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm"
            >
              {term}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
