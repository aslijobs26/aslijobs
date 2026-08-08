import { HOME_STATS } from "@/constants/home-stats";
import type { HomeStatIconKey } from "@/types/home-stats";
import { cn } from "@/utils/cn";
import {
  ClipboardList,
  Handshake,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

function StatIcon({ icon }: { icon: HomeStatIconKey }): ReactNode {
  const className = "size-5 shrink-0 md:size-6 lg:size-7";

  switch (icon) {
    case "user":
      return <UserRound className={className} strokeWidth={1.75} aria-hidden="true" />;
    case "clipboard":
      return (
        <ClipboardList className={className} strokeWidth={1.75} aria-hidden="true" />
      );
    case "handshake":
      return <Handshake className={className} strokeWidth={1.75} aria-hidden="true" />;
    case "shield":
      return (
        <ShieldCheck className={className} strokeWidth={1.75} aria-hidden="true" />
      );
    case "star":
      return <Star className={className} strokeWidth={1.75} aria-hidden="true" />;
  }
}

export function HomeStatsBanner() {
  return (
    <section aria-label="AsliJobs platform statistics">
      <div className="rounded-2xl bg-stats-banner px-4 py-2 mobile:px-4 mobile:py-1.5 md:px-5 md:py-6 lg:px-4 lg:py-7 xl:px-5 xl:py-8">
        <ul className="flex flex-col md:flex-row md:items-stretch md:overflow-x-auto md:overscroll-x-contain md:[-ms-overflow-style:none] md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden">
          {HOME_STATS.map((stat, index) => (
            <li
              key={stat.id}
              className={cn(
                "relative flex items-center gap-3 py-3.5 mobile:py-3.5 md:min-w-[12rem] md:flex-1 md:gap-3 md:px-4 md:py-0 lg:min-w-0 lg:justify-center lg:px-3 xl:px-5",
                index > 0 && "border-t border-surface/20 md:border-t-0",
              )}
            >
              {index > 0 ? (
                <span
                  className="absolute left-0 top-[18%] hidden h-[64%] w-px bg-surface/25 md:block"
                  aria-hidden="true"
                />
              ) : null}

              <span className="text-stats-banner-icon">
                <StatIcon icon={stat.icon} />
              </span>

              <div className="min-w-0">
                <p className="text-lg font-bold leading-none tracking-tight text-white md:text-xl lg:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs leading-snug text-white/90 md:mt-1.5 md:text-xs lg:text-sm">
                  {stat.label}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
