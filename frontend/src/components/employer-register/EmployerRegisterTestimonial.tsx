"use client";

import {
  EMPLOYER_REGISTER_TESTIMONIALS,
  EMPLOYER_REGISTER_TESTIMONIAL_AUTOPLAY_MS,
  EMPLOYER_REGISTER_TESTIMONIAL_TRANSITION_MS,
} from "@/constants/employer-register";
import type { EmployerRegisterTestimonial as Testimonial } from "@/types/employer-register";
import { cn } from "@/utils/cn";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

const SLIDE_COUNT = EMPLOYER_REGISTER_TESTIMONIALS.length;

/** Priya Reddy is shown first to match the reference design. */
const INITIAL_INDEX = 1;

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
  const [activeIndex, setActiveIndex] = useState(INITIAL_INDEX);
  const [isHovered, setIsHovered] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    const syncVisibility = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (isHovered || !isPageVisible || SLIDE_COUNT < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDE_COUNT);
    }, EMPLOYER_REGISTER_TESTIMONIAL_AUTOPLAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isHovered, isPageVisible]);

  const safeIndex = ((activeIndex % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;

  const trackStyle = {
    "--testimonial-slide-count": SLIDE_COUNT,
    "--testimonial-track-index": safeIndex,
    transform: `translateX(calc(-100% * ${safeIndex} / ${SLIDE_COUNT}))`,
    transitionDuration: `${EMPLOYER_REGISTER_TESTIMONIAL_TRANSITION_MS}ms`,
  } as CSSProperties;

  return (
    <div
      className="employer-register-testimonial"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="employer-register-testimonial-viewport">
        <div className="employer-register-testimonial-track" style={trackStyle}>
          {EMPLOYER_REGISTER_TESTIMONIALS.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="employer-register-testimonial-slide"
              aria-hidden={index !== safeIndex}
            >
              <TestimonialCard
                testimonial={testimonial}
                priority={index === INITIAL_INDEX}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn("employer-register-testimonial-dots")}
        role="tablist"
        aria-label="Testimonial slides"
      >
        {EMPLOYER_REGISTER_TESTIMONIALS.map((testimonial, index) => {
          const isActive = index === safeIndex;

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
              onClick={() => setActiveIndex(index)}
            />
          );
        })}
      </div>
    </div>
  );
}
