"use client";

type ProfileStrengthCircleProps = {
  percentage: number;
  size?: number;
};

export function ProfileStrengthCircle({
  percentage,
  size = 72,
}: ProfileStrengthCircleProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={`Profile strength ${clamped}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-primary-light"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <span className="relative z-10 text-sm font-bold tabular-nums text-foreground">
        {clamped}%
      </span>
    </div>
  );
}
