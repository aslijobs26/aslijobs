import { Lightbulb } from "lucide-react";

export function MyWorkTipOfTheDay() {
  return (
    <section className="rounded-xl border border-warning/25 bg-[#FFFBEB] p-3 shadow-sm dark:bg-warning/10">
      <div className="flex items-start gap-2">
        <Lightbulb
          className="mt-0.5 size-4 shrink-0 text-warning"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground">
            Tip of the Day
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            Use quick actions to complete routine tasks faster. Prioritize P1
            items in Do Now before clearing Due Today.
          </p>
        </div>
      </div>
    </section>
  );
}
