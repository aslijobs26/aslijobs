import { Building2, Handshake, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OperationsEmployersAnalyticsNamedCount } from "../../../../types/operations-employers";
import { OperationsCard } from "../../../ui/OperationsCard";
import {
  EMPLOYERS_OVERVIEW_BAR_COLORS,
  EMPLOYERS_TYPE_COLORS,
} from "./employers-overview-theme";

interface EmployersByAccountTypeProps {
  items: OperationsEmployersAnalyticsNamedCount[];
}

const ACCOUNT_TYPE_META: Record<
  string,
  { icon: LucideIcon; description: string; color: string }
> = {
  company: {
    icon: Building2,
    description: "Registered company employers",
    color: EMPLOYERS_TYPE_COLORS.company,
  },
  consultancy: {
    icon: Handshake,
    description: "Consultancy & staffing partners",
    color: EMPLOYERS_TYPE_COLORS.consultancy,
  },
  individual: {
    icon: UserRound,
    description: "Individual hiring accounts",
    color: EMPLOYERS_TYPE_COLORS.individual,
  },
  unspecified: {
    icon: Building2,
    description: "Account type not set",
    color: EMPLOYERS_OVERVIEW_BAR_COLORS[7] ?? "#64748b",
  },
};

export function EmployersByAccountType({ items }: EmployersByAccountTypeProps) {
  const rows = Array.isArray(items) ? items : [];
  const total = rows.reduce((sum, item) => sum + item.count, 0);
  const hasData = total > 0;

  return (
    <OperationsCard
      title="Account Types"
      subtitle="Individual, company & consultancy mix"
      className="employers-analytics-card min-w-0"
    >
      {!hasData ? (
        <p className="flex min-h-44 items-center justify-center text-center text-xs text-muted xl:min-h-36">
          No account type data available.
        </p>
      ) : (
        <div className="flex min-h-44 flex-col justify-center gap-3 xl:min-h-36 xl:gap-2.5">
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-hero-bg"
            role="img"
            aria-label="Account type distribution"
          >
            {rows
              .filter((item) => item.count > 0)
              .map((item) => {
                const widthPercent = Math.max(
                  4,
                  Math.round((item.count / total) * 100),
                );
                const meta = ACCOUNT_TYPE_META[item.id];
                return (
                  <div
                    key={item.id}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor:
                        meta?.color ?? EMPLOYERS_OVERVIEW_BAR_COLORS[0],
                    }}
                    title={`${item.label}: ${item.count.toLocaleString("en-IN")}`}
                  />
                );
              })}
          </div>

          <ul className="flex flex-col gap-2 xl:gap-1.5">
            {rows.map((item) => {
              const meta = ACCOUNT_TYPE_META[item.id] ?? ACCOUNT_TYPE_META.unspecified;
              const Icon = meta.icon;
              const percent =
                item.percent ??
                (total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0);
              const barWidth = Math.max(
                item.count > 0 ? 6 : 0,
                Math.round((item.count / Math.max(total, 1)) * 100),
              );

              return (
                <li key={item.id}>
                  <div className="flex items-start gap-2.5 rounded-lg border border-border-subtle/80 bg-hero-bg/35 px-2.5 py-2 xl:gap-2 xl:px-2 xl:py-1.5">
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg xl:size-7"
                      style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                      aria-hidden="true"
                    >
                      <Icon className="size-4 xl:size-3.5" strokeWidth={2} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold leading-tight text-foreground xl:text-[11px]">
                            {item.label}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] leading-tight text-muted xl:text-[9px]">
                            {meta.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-bold tabular-nums leading-none text-foreground xl:text-[12px]">
                            {item.count.toLocaleString("en-IN")}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium tabular-nums text-muted xl:text-[9px]">
                            {percent}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface xl:mt-1 xl:h-1">
                        <div
                          className="h-full rounded-full transition-[width] duration-300 ease-out"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </OperationsCard>
  );
}
