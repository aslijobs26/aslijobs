"use client";

import {
  EMPLOYER_REGISTER_TESTIMONIALS,
  EMPLOYER_REGISTER_TESTIMONIAL_AUTOPLAY_MS,
  EMPLOYER_REGISTER_TESTIMONIAL_TRANSITION_MS,
} from "@/constants/employer-register";
import type { EmployerRegisterTestimonial as Testimonial } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react";

const SLIDE_COUNT = EMPLOYER_REGISTER_TESTIMONIALS.length;

const EXTENDED_SLIDES: Testimonial[] = [
  EMPLOYER_REGISTER_TESTIMONIALS[SLIDE_COUNT - 1],
  ...EMPLOYER_REGISTER_TESTIMONIALS,
  EMPLOYER_REGISTER_TESTIMONIALS[0],
];

const EXTENDED_SLIDE_COUNT = EXTENDED_SLIDES.length;

/** First real card (Sneha Patel) sits at track index 1 (index 0 is the loop clone). */
const INITIAL_TRACK_INDEX = 1;

function getRealIndex(trackIndex: number) {
  if (trackIndex === 0) {
    return SLIDE_COUNT - 1;
  }

  if (trackIndex === SLIDE_COUNT + 1) {
    return 0;
  }

  return trackIndex - 1;
}

function TestimonialCard({
  testimonial,
  priority = false,
}: {
  testimonial: Testimonial;
  priority?: boolean;
}) {
  return (
    <article className="employer-register-testimonial-card">
      <p className="employer-register-testimonial-quote">{testimonial.quote}</p>

      <div className="employer-register-testimonial-author">
        <Image
          src={testimonial.avatar}
          alt={testimonial.avatarAlt}
          width={40}
          height={40}
          sizes="40px"
          priority={priority}
          className="employer-register-testimonial-avatar"
        />
        <div className="employer-register-testimonial-author-copy">
          <p className="employer-register-testimonial-name">{testimonial.name}</p>
          <p className="employer-register-testimonial-role">
            {testimonial.designation}
          </p>
        </div>
      </div>
    </article>
  );
}

export function EmployerRegisterTestimonial() {
  const [trackIndex, setTrackIndex] = useState(INITIAL_TRACK_INDEX);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAutoplayReady, setIsAutoplayReady] = useState(false);
  const isJumpingRef = useRef(false);

  const goToRealIndex = useCallback((realIndex: number) => {
    setIsTransitionEnabled(true);
    setTrackIndex(realIndex + 1);
  }, []);

  const goToNext = useCallback(() => {
    setIsTransitionEnabled(true);
    setTrackIndex((current) => current + 1);
  }, []);

  useLayoutEffect(() => {
    setTrackIndex(INITIAL_TRACK_INDEX);
    setIsTransitionEnabled(false);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsTransitionEnabled(true);
      setIsAutoplayReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!isAutoplayReady || isHovered) {
      return;
    }

    const intervalId = window.setInterval(() => {
      goToNext();
    }, EMPLOYER_REGISTER_TESTIMONIAL_AUTOPLAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [goToNext, isAutoplayReady, isHovered]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== "transform" || isJumpingRef.current) {
      return;
    }

    if (trackIndex === 0) {
      isJumpingRef.current = true;
      setIsTransitionEnabled(false);
      setTrackIndex(SLIDE_COUNT);
      return;
    }

    if (trackIndex === SLIDE_COUNT + 1) {
      isJumpingRef.current = true;
      setIsTransitionEnabled(false);
      setTrackIndex(INITIAL_TRACK_INDEX);
    }
  };

  useEffect(() => {
    if (isTransitionEnabled || !isJumpingRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        isJumpingRef.current = false;
        setIsTransitionEnabled(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isTransitionEnabled, trackIndex]);

  const activeDotIndex = getRealIndex(trackIndex);

  const trackStyle = {
    "--testimonial-slide-count": EXTENDED_SLIDE_COUNT,
    "--testimonial-track-index": trackIndex,
    transform: `translateX(calc(-100% * ${trackIndex} / ${EXTENDED_SLIDE_COUNT}))`,
    transitionDuration: isTransitionEnabled
      ? `${EMPLOYER_REGISTER_TESTIMONIAL_TRANSITION_MS}ms`
      : "0ms",
  } as CSSProperties;

  return (
    <div
      className="employer-register-testimonial"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="employer-register-testimonial-viewport">
        <div
          className={cn(
            "employer-register-testimonial-track",
            !isTransitionEnabled && "employer-register-testimonial-track--instant",
          )}
          style={trackStyle}
          onTransitionEnd={handleTransitionEnd}
        >
          {EXTENDED_SLIDES.map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className="employer-register-testimonial-slide"
              aria-hidden={index !== trackIndex}
            >
              <TestimonialCard
                testimonial={testimonial}
                priority={index === INITIAL_TRACK_INDEX}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="employer-register-testimonial-dots"
        role="tablist"
        aria-label="Testimonial slides"
      >
        {EMPLOYER_REGISTER_TESTIMONIALS.map((testimonial, index) => {
          const isActive = index === activeDotIndex;

          return (
            <button
              key={testimonial.id}
              type="button"
              role="tab"
              aria-label={`Show testimonial from ${testimonial.name}`}
              aria-selected={isActive}
              className={cn(
                "employer-register-testimonial-dot transition-colors",
                isActive ? "bg-surface" : "bg-surface/35",
              )}
              onClick={() => goToRealIndex(index)}
            />
          );
        })}
      </div>
    </div>
  );
}
