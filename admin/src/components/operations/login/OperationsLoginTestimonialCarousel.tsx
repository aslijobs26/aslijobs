import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react";
import {
  OPERATIONS_LOGIN_TESTIMONIAL_AUTOPLAY_MS,
  OPERATIONS_LOGIN_TESTIMONIALS,
  OPERATIONS_LOGIN_TESTIMONIAL_TRANSITION_MS,
} from "../../../constants/operations-login";
import type { OperationsLoginTestimonial } from "../../../types/operations-login";
import { cn } from "../../../utils/cn";

const SLIDE_COUNT = OPERATIONS_LOGIN_TESTIMONIALS.length;

const EXTENDED_SLIDES: OperationsLoginTestimonial[] = [
  OPERATIONS_LOGIN_TESTIMONIALS[SLIDE_COUNT - 1],
  ...OPERATIONS_LOGIN_TESTIMONIALS,
  OPERATIONS_LOGIN_TESTIMONIALS[0],
];

const EXTENDED_SLIDE_COUNT = EXTENDED_SLIDES.length;
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

function OperationsLoginTestimonialCard({
  testimonial,
}: {
  testimonial: OperationsLoginTestimonial;
}) {
  return (
    <article className="operations-login-testimonial-card">
      <p className="operations-login-testimonial-quote">{testimonial.quote}</p>
      <div className="operations-login-testimonial-author">
        <img
          src={testimonial.avatar}
          alt={testimonial.avatarAlt}
          className="operations-login-testimonial-avatar-img"
        />
        <div className="operations-login-testimonial-author-copy">
          <p className="operations-login-testimonial-name">
            {testimonial.authorName}
          </p>
          <p className="operations-login-testimonial-role">
            {testimonial.authorRole}
          </p>
        </div>
      </div>
    </article>
  );
}

export function OperationsLoginTestimonialCarousel() {
  const [trackIndex, setTrackIndex] = useState(INITIAL_TRACK_INDEX);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
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

  useEffect(() => {
    let outerFrameId = 0;
    let innerFrameId = 0;

    outerFrameId = window.requestAnimationFrame(() => {
      innerFrameId = window.requestAnimationFrame(() => {
        setIsAutoplayReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(outerFrameId);
      window.cancelAnimationFrame(innerFrameId);
    };
  }, []);

  useEffect(() => {
    if (!isAutoplayReady || isHovered) {
      return;
    }

    const intervalId = window.setInterval(() => {
      goToNext();
    }, OPERATIONS_LOGIN_TESTIMONIAL_AUTOPLAY_MS);

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
    "--operations-testimonial-slide-count": EXTENDED_SLIDE_COUNT,
    "--operations-testimonial-track-index": trackIndex,
    transitionDuration: isTransitionEnabled
      ? `${OPERATIONS_LOGIN_TESTIMONIAL_TRANSITION_MS}ms`
      : "0ms",
  } as CSSProperties;

  return (
    <div
      className="operations-login-testimonial-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="operations-login-testimonial-viewport">
        <div
          className={cn(
            "operations-login-testimonial-track",
            !isTransitionEnabled && "operations-login-testimonial-track--instant",
          )}
          style={trackStyle}
          onTransitionEnd={handleTransitionEnd}
        >
          {EXTENDED_SLIDES.map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className="operations-login-testimonial-slide"
              aria-hidden={index !== trackIndex}
            >
              <OperationsLoginTestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="operations-login-dots"
        role="tablist"
        aria-label="Testimonial slides"
      >
        {OPERATIONS_LOGIN_TESTIMONIALS.map((testimonial, index) => {
          const isActive = index === activeDotIndex;

          return (
            <button
              key={testimonial.id}
              type="button"
              role="tab"
              aria-label={`Show testimonial from ${testimonial.authorName}`}
              aria-selected={isActive}
              className={cn(
                "operations-login-dot",
                isActive && "operations-login-dot--active",
              )}
              onClick={() => goToRealIndex(index)}
            />
          );
        })}
      </div>
    </div>
  );
}
