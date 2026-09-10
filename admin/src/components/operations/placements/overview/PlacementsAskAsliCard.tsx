/**
 * Ask ASLI surface for Placements.
 * No Ask ASLI chat/AI backend is wired for Operations yet — keep the card
 * presentational and avoid linking to placeholder routes or inventing replies.
 */
export function PlacementsAskAsliCard() {
  return (
    <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] p-3.5 shadow-sm max-lg:p-3 max-sm:p-2.5 dark:from-primary/10 dark:to-surface">
      <p className="text-[12px] font-semibold text-foreground max-sm:text-[11px]">
        Need Help?
      </p>
      <div className="mt-2 flex items-start gap-2.5 max-sm:gap-2">
        <img
          src="/assets/ask-asli-robot.png"
          alt=""
          className="size-12 shrink-0 object-contain max-sm:size-10"
        />
        <p className="text-[11px] leading-snug text-muted max-sm:text-[10px]">
          Get insights about placements, joining outcomes, or next best actions.
        </p>
      </div>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Ask ASLI is not available in Operations yet"
        className="mt-3 inline-flex h-8 w-full cursor-not-allowed items-center justify-center rounded-md bg-primary/70 text-[12px] font-semibold text-surface opacity-80 max-sm:mt-2.5 max-sm:h-9 max-sm:text-[11px]"
      >
        Ask ASLI · Coming soon
      </button>
    </section>
  );
}
