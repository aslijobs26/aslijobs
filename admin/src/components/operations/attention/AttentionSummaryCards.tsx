import {
  AlertTriangle,
  CircleAlert,
  Clock3,
  FileWarning,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { AttentionSummaryCard } from "../../../types/operations-attention";
import { cn } from "../../../utils/cn";

interface AttentionSummaryCardsProps {
  cards: AttentionSummaryCard[];
  activeId: string;
  onSelect: (id: AttentionSummaryCard["id"]) => void;
}

const TONE_STYLES: Record<
  AttentionSummaryCard["tone"],
  { card: string; iconWrap: string; Icon: LucideIcon }
> = {
  total: {
    card: "border-danger/20 bg-[#FEF2F2]",
    iconWrap: "bg-danger/15 text-danger",
    Icon: CircleAlert,
  },
  urgent: {
    card: "border-danger/15 bg-[#FFF1F2]",
    iconWrap: "bg-danger/10 text-danger",
    Icon: AlertTriangle,
  },
  sla: {
    card: "border-warning/25 bg-[#FFF7ED]",
    iconWrap: "bg-warning/15 text-warning",
    Icon: Clock3,
  },
  priority: {
    card: "border-primary/20 bg-[#EFF6FF]",
    iconWrap: "bg-primary/10 text-primary",
    Icon: FileWarning,
  },
  unassigned: {
    card: "border-border-subtle bg-[#F8FAFC]",
    iconWrap: "bg-slate-200/80 text-muted",
    Icon: UserRound,
  },
};

export function AttentionSummaryCards({
  cards,
  activeId,
  onSelect,
}: AttentionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const tone = TONE_STYLES[card.tone];
        const Icon = tone.Icon;
        const selected = activeId === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              "flex min-w-0 items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              tone.card,
              selected && "ring-2 ring-primary/35 shadow-sm",
            )}
            aria-pressed={selected}
          >
            <span
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                tone.iconWrap,
              )}
            >
              <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[22px] font-bold leading-none text-foreground">
                {card.value}
              </span>
              <span className="mt-1 block text-[12px] font-semibold text-foreground">
                {card.label}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                {card.detail}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
