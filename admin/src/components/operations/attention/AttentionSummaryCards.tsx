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
    <div className="grid grid-cols-2 gap-2 max-sm:gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => {
        const tone = TONE_STYLES[card.tone];
        const Icon = tone.Icon;
        const selected = activeId === card.id;
        const isLastOddOnMobile =
          cards.length % 2 === 1 && index === cards.length - 1;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              "flex min-w-0 items-start gap-2 rounded-xl border px-2.5 py-2.5 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:gap-2 max-sm:rounded-lg max-sm:px-2.5 max-sm:py-2.5 sm:gap-3 sm:px-3.5 sm:py-3",
              tone.card,
              selected && "ring-2 ring-primary/35 shadow-sm",
              isLastOddOnMobile && "max-sm:col-span-2 sm:col-span-1",
            )}
            aria-pressed={selected}
          >
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg max-sm:size-8 sm:size-9",
                tone.iconWrap,
              )}
            >
              <Icon
                className="size-3.5 sm:size-4"
                strokeWidth={2}
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-[18px] font-bold leading-none text-foreground max-sm:text-[18px] sm:text-[22px]">
                {card.value}
              </span>
              <span className="mt-1 block truncate text-[11px] font-semibold text-foreground max-sm:text-[11px] sm:text-[12px]">
                {card.label}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-muted max-sm:text-[10px] sm:text-[11px]">
                {card.detail}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
