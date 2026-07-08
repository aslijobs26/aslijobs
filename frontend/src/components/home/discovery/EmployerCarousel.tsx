"use client";

import type { Employer } from "@/types/discovery";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

type EmployerCarouselProps = {
  employers: Employer[];
};

// Seconds for the track to travel exactly one full employer set (one seamless
// loop). Speed is derived from the measured set width so the cycle stays ~60s
// across every breakpoint — slow, continuous, premium.
const LOOP_SECONDS = 60;
// Manual arrow nudge easing (fraction of remaining distance applied per frame).
const MANUAL_EASE = 0.15;
// Clamp per-frame delta so returning to a backgrounded tab never jumps.
const MAX_FRAME_SECONDS = 0.05;

export function EmployerCarousel({ employers }: EmployerCarouselProps) {
  // Render the employer sequence twice so the track can loop seamlessly: once
  // the offset passes the first set's width we wrap by exactly that width and
  // the identical second set is already in place — no gap, flicker, or reset.
  const loopEmployers = [...employers, ...employers];

  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0); // current translateX (px, <= 0)
  const setWidthRef = useRef(0); // width of one employer set (loop period)
  const pendingRef = useRef(0); // remaining manual-nudge distance to ease in
  const hoverRef = useRef(false);
  const focusRef = useRef(false);
  const reducedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || employers.length === 0) {
      return;
    }
    const items = track.children;
    const first = items[0] as HTMLElement | undefined;
    const firstOfSecondSet = items[employers.length] as HTMLElement | undefined;
    if (!first || !firstOfSecondSet) {
      return;
    }
    // Distance between an item and its duplicate = one seamless loop period.
    const period = firstOfSecondSet.offsetLeft - first.offsetLeft;
    if (period > 0) {
      setWidthRef.current = period;
      // Keep the current offset inside the new period after a resize.
      if (offsetRef.current <= -period) {
        offsetRef.current = ((offsetRef.current % period) + period) % period - period;
      }
    }
  }, [employers.length]);

  const nudge = useCallback(
    (direction: "left" | "right") => {
      const period = setWidthRef.current;
      const step =
        period > 0 && employers.length > 0 ? period / employers.length : 220;
      // Left arrow reveals previous items (track slides right → offset up);
      // right arrow advances (track slides left → offset down).
      pendingRef.current += direction === "left" ? step : -step;
    },
    [employers.length],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => {
      reducedRef.current = media.matches;
    };
    applyMotionPref();
    media.addEventListener("change", applyMotionPref);

    measure();
    const track = trackRef.current;
    const observer = new ResizeObserver(() => measure());
    if (track) {
      observer.observe(track);
    }

    const tick = (time: number) => {
      const last = lastTimeRef.current ?? time;
      let dt = (time - last) / 1000;
      lastTimeRef.current = time;
      if (dt > MAX_FRAME_SECONDS) {
        dt = MAX_FRAME_SECONDS;
      }

      const period = setWidthRef.current;

      // Ease in any pending manual nudge.
      const pending = pendingRef.current;
      if (Math.abs(pending) > 0.5) {
        const move = pending * MANUAL_EASE;
        offsetRef.current += move;
        pendingRef.current = pending - move;
      } else if (pending !== 0) {
        offsetRef.current += pending;
        pendingRef.current = 0;
      }

      const manualActive = Math.abs(pendingRef.current) > 0.5;
      const autoAllowed =
        !hoverRef.current &&
        !focusRef.current &&
        !reducedRef.current &&
        !manualActive;

      if (autoAllowed && period > 0) {
        offsetRef.current -= (period / LOOP_SECONDS) * dt;
      }

      if (period > 0) {
        while (offsetRef.current <= -period) {
          offsetRef.current += period;
        }
        while (offsetRef.current > 0) {
          offsetRef.current -= period;
        }
      }

      if (track) {
        track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      observer.disconnect();
      media.removeEventListener("change", applyMotionPref);
    };
  }, [measure]);

  return (
    <div
      className="relative rounded-2xl border border-border-subtle bg-surface shadow-sm"
      onMouseEnter={() => {
        hoverRef.current = true;
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
      }}
      onFocusCapture={() => {
        focusRef.current = true;
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          focusRef.current = false;
        }
      }}
    >
      <button
        type="button"
        aria-label="Previous employers"
        onClick={() => nudge("left")}
        className={cn(
          "absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40 sm:left-3",
        )}
      >
        <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="overflow-hidden px-12 py-5 sm:px-14 sm:py-6">
        <div
          ref={trackRef}
          className="flex gap-4 will-change-transform sm:gap-6"
          style={{ transform: "translate3d(0, 0, 0)" }}
        >
          {loopEmployers.map((employer, index) => {
            const isClone = index >= employers.length;

            return (
              <Link
                key={`${employer.id}-${index}`}
                href={employer.href}
                aria-hidden={isClone || undefined}
                tabIndex={isClone ? -1 : undefined}
                className="flex w-[calc((100%-1rem)/2)] min-w-[calc((100%-1rem)/2)] shrink-0 flex-col items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:w-28 sm:min-w-28"
              >
                <div
                  className={cn(
                    "relative h-12 w-full overflow-hidden rounded-lg sm:h-14",
                    employer.logo ? "bg-surface" : "bg-hero-glow",
                  )}
                >
                  {employer.logo ? (
                    <Image
                      src={employer.logo}
                      alt={`${employer.name} logo`}
                      fill
                      sizes="112px"
                      className="object-contain object-center p-2"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2">
                      <span className="text-sm font-bold text-foreground">
                        {employer.initials}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-center text-xs font-bold text-muted sm:text-sm">
                  {employer.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-label="Next employers"
        onClick={() => nudge("right")}
        className={cn(
          "absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40 sm:right-3",
        )}
      >
        <ChevronRight className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
