"use client";

type EmployerProfileCompletionCircleProps = {
  percentage: number;
};

const CIRCLE_SIZE = 64;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function EmployerProfileCompletionCircle({
  percentage,
}: EmployerProfileCompletionCircleProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex size-16 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface shadow-sm"
      role="progressbar"
      aria-label={`Profile ${clamped}% complete`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <svg
        width={CIRCLE_SIZE}
        height={CIRCLE_SIZE}
        viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-primary-light"
        />
        <circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <span
        className="relative z-10 flex flex-col items-center justify-center leading-none"
        aria-live="polite"
      >
        <span className="text-sm font-bold tabular-nums text-foreground">
          {clamped}%
        </span>
      </span>
    </div>
  );
}
