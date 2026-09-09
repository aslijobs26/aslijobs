import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { OperationsVerificationsOverviewKpis } from "../../../../types/operations-verifications";
import { cn } from "../../../../utils/cn";

interface VerificationsOverviewKpiStripProps {
  kpis: OperationsVerificationsOverviewKpis;
}

const KPI_CARDS: {
  valueKey: keyof Pick<
    OperationsVerificationsOverviewKpis,
    | "totalVerifications"
    | "pendingReview"
    | "verifiedEmployers"
    | "needsAttention"
    | "rejected"
  >;
  trendKey: keyof Pick<
    OperationsVerificationsOverviewKpis,
    | "totalVerificationsTrendPercent"
    | "pendingReviewTrendPercent"
    | "verifiedEmployersTrendPercent"
    | "needsAttentionTrendPercent"
    | "rejectedTrendPercent"
  >;
  captionKey: keyof Pick<
    OperationsVerificationsOverviewKpis,
    | "totalVerificationsCaption"
    | "pendingReviewCaption"
    | "verifiedEmployersCaption"
    | "needsAttentionCaption"
    | "rejectedCaption"
  >;
  label: string;
  icon: LucideIcon;
  cardBg: string;
  iconWrap: string;
  iconColor: string;
}[] = [
  {
    valueKey: "totalVerifications",
    trendKey: "totalVerificationsTrendPercent",
    captionKey: "totalVerificationsCaption",
    label: "Total Verifications",
    icon: ShieldCheck,
    cardBg: "bg-success/10 border-success/15",
    iconWrap: "bg-success/15",
    iconColor: "text-success",
  },
  {
    valueKey: "pendingReview",
    trendKey: "pendingReviewTrendPercent",
    captionKey: "pendingReviewCaption",
    label: "Pending Review",
    icon: Clock,
    cardBg: "bg-primary-light/80 border-primary/15",
    iconWrap: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    valueKey: "verifiedEmployers",
    trendKey: "verifiedEmployersTrendPercent",
    captionKey: "verifiedEmployersCaption",
    label: "Verified Employers",
    icon: Users,
    cardBg: "bg-chart-accent-alt/10 border-chart-accent-alt/15",
    iconWrap: "bg-chart-accent-alt/15",
    iconColor: "text-chart-accent-alt",
  },
  {
    valueKey: "needsAttention",
    trendKey: "needsAttentionTrendPercent",
    captionKey: "needsAttentionCaption",
    label: "Needs Attention",
    icon: AlertTriangle,
    cardBg: "bg-warning/10 border-warning/20",
    iconWrap: "bg-warning/15",
    iconColor: "text-warning",
  },
  {
    valueKey: "rejected",
    trendKey: "rejectedTrendPercent",
    captionKey: "rejectedCaption",
    label: "Rejected",
    icon: XCircle,
    cardBg: "bg-danger/10 border-danger/15",
    iconWrap: "bg-danger/15",
    iconColor: "text-danger",
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function VerificationsOverviewKpiStrip({
  kpis,
}: VerificationsOverviewKpiStripProps) {
  return (
    <section
      aria-label="Verification overview KPIs"
      className="grid grid-cols-2 gap-2 max-sm:gap-1.5 sm:grid-cols-3 xl:grid-cols-5"
    >
      {KPI_CARDS.map((card) => {
        const Icon = card.icon;
        const trend = kpis[card.trendKey];
        const isUp = trend != null && trend >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;

        return (
          <article
            key={card.valueKey}
            className={cn(
              "flex min-w-0 items-start gap-2.5 rounded-xl border p-2.5 shadow-sm max-sm:gap-2 max-sm:p-2 sm:p-3 max-lg:last:col-span-2 sm:last:col-span-1 xl:last:col-span-1",
              card.cardBg,
            )}
          >
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-7",
                card.iconWrap,
                card.iconColor,
              )}
            >
              <Icon className="size-3.5 max-sm:size-3" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-none tracking-tight tabular-nums text-foreground max-sm:text-base sm:text-xl">
                {formatCount(kpis[card.valueKey])}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted max-sm:text-[10px]">
                {card.label}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] max-sm:mt-1 max-sm:text-[9px]">
                {trend != null ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-semibold",
                      isUp ? "text-success" : "text-danger",
                    )}
                  >
                    <TrendIcon className="size-2.5" aria-hidden="true" />
                    {Math.abs(trend)}%
                  </span>
                ) : null}
                <span className="truncate font-medium text-muted">
                  {kpis[card.captionKey]}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
