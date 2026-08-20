import {
  BarChart3,
  Briefcase,
  MessageCircle,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react";
import {
  OPERATIONS_LOGIN_FEATURES,
  OPERATIONS_LOGIN_FEATURE_AUTOPLAY_MS,
  OPERATIONS_LOGIN_FEATURE_TRANSITION_MS,
} from "../../../constants/operations-login";
import { cn } from "../../../utils/cn";

const FEATURE_ICONS = {
  "whatsapp-first": MessageCircle,
  "verified-candidates": Users,
  "quick-job-posting": Briefcase,
  "real-time-insights": BarChart3,
} as const;

type Feature = (typeof OPERATIONS_LOGIN_FEATURES)[number];

const SLIDE_COUNT = OPERATIONS_LOGIN_FEATURES.length;

const EXTENDED_SLIDES: Feature[] = [
  OPERATIONS_LOGIN_FEATURES[SLIDE_COUNT - 1],
  ...OPERATIONS_LOGIN_FEATURES,
  OPERATIONS_LOGIN_FEATURES[0],
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

function OperationsLoginFeatureCard({
  title,
  description,
  iconId,
}: {
  title: string;
  description: string;
  iconId: keyof typeof FEATURE_ICONS;
}) {
  const Icon = FEATURE_ICONS[iconId];

  return (
    <article className="operations-login-feature-card">
      <span className="operations-login-feature-icon" aria-hidden="true">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <h2 className="operations-login-feature-title">{title}</h2>
      <p className="operations-login-feature-description">{description}</p>
    </article>
  );
}

export function OperationsLoginFeatureCarousel() {
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
    }, OPERATIONS_LOGIN_FEATURE_AUTOPLAY_MS);

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
    "--operations-feature-slide-count": EXTENDED_SLIDE_COUNT,
    "--operations-feature-track-index": trackIndex,
    transform: `translateX(calc(-100% * ${trackIndex} / ${EXTENDED_SLIDE_COUNT}))`,
    transitionDuration: isTransitionEnabled
      ? `${OPERATIONS_LOGIN_FEATURE_TRANSITION_MS}ms`
      : "0ms",
  } as CSSProperties;

  return (
    <div
      className="operations-login-feature-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="operations-login-feature-viewport">
        <div
          className={cn(
            "operations-login-feature-track",
            !isTransitionEnabled && "operations-login-feature-track--instant",
          )}
          style={trackStyle}
          onTransitionEnd={handleTransitionEnd}
        >
          {EXTENDED_SLIDES.map((feature, index) => (
            <div
              key={`${feature.id}-${index}`}
              className="operations-login-feature-slide"
              aria-hidden={index !== trackIndex}
            >
              <OperationsLoginFeatureCard
                title={feature.title}
                description={feature.description}
                iconId={feature.id}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="operations-login-feature-dots"
        role="tablist"
        aria-label="Feature slides"
      >
        {OPERATIONS_LOGIN_FEATURES.map((feature, index) => {
          const isActive = index === activeDotIndex;

          return (
            <button
              key={feature.id}
              type="button"
              role="tab"
              aria-label={`Show ${feature.title}`}
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
