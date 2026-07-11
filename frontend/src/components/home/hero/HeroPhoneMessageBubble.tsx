import type { HeroFeatureMessage } from "@/types/hero";
import { cn } from "@/utils/cn";

type HeroPhoneMessageBubbleProps = {
  id: string;
  message: HeroFeatureMessage | null;
  visible: boolean;
};

/**
 * Contextual chat bubble anchored just above the phone in the person's hand.
 * Desktop / hover-capable only — positioned relative to the Hero visual
 * container, never the viewport. Animation grows from the bottom-left (phone)
 * origin so it reads as a message coming from the phone.
 */
export function HeroPhoneMessageBubble({
  id,
  message,
  visible,
}: HeroPhoneMessageBubbleProps) {
  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none absolute z-40 hidden origin-bottom-left transition-all duration-[260ms] ease-out will-change-transform motion-reduce:transition-none lg:left-[14%] lg:top-[34%]",
        "[@media(hover:hover)_and_(min-width:1024px)]:block",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-2 scale-[0.94] opacity-0",
      )}
    >
      <div className="relative w-max max-w-none rounded-2xl bg-whatsapp-cta px-3 py-1.5 shadow-md">
        <p className="whitespace-nowrap text-xs font-semibold leading-snug text-foreground sm:text-sm">
          {message?.emoji ? (
            <>
              <span aria-hidden="true">{message.emoji}</span>{" "}
              {message.text}
            </>
          ) : (
            message?.text
          )}
        </p>
        <div
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex items-center justify-end gap-1 text-xs font-medium text-muted transition-opacity duration-200 delay-100 motion-reduce:transition-none",
            visible ? "opacity-100" : "opacity-0",
          )}
        >
          <span>12:30</span>
          <i className="bi bi-check2-all leading-none text-whatsapp-dark" />
        </div>
        <span
          aria-hidden="true"
          className="absolute -bottom-1 left-5 size-3 rotate-45 rounded-sm bg-whatsapp-cta"
        />
      </div>
    </div>
  );
}
