"use client";

import { cn } from "@/utils/cn";

type ProfileStrengthCircleProps = {
  percentage: number;
  size?: number;
  className?: string;
  /** Softer, higher-contrast treatment for compact mobile placements. */
  variant?: "default" | "soft";
};

export function ProfileStrengthCircle({
  percentage,
  size = 72,
  className,
  variant = "default",
}: ProfileStrengthCircleProps) {
  const isSoft = variant === "soft";
  const strokeWidth = isSoft
    ? 5.5
    : size >= 64
      ? 7
      : size >= 52
        ? 6
        : 5;
  const padding = isSoft ? 3 : 2;
  const radius = (size - strokeWidth) / 2 - padding;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  const offset = circumference * (1 - clamped / 100);
  const labelSize = isSoft
    ? "text-[0.8125rem] leading-none"
    : size >= 64
      ? "text-sm"
      : size >= 52
        ? "text-[0.8125rem]"
        : "text-xs";
  const innerInset = isSoft
    ? Math.round(size * 0.16)
    : Math.max(6, Math.round(size * 0.125));

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        isSoft && "bg-surface",
        className,
      )}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={`Profile strength ${clamped}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <span
        className={cn(
          "absolute rounded-full",
          isSoft ? "bg-primary-light/55" : "bg-primary-light/80",
        )}
        style={{ inset: innerInset }}
        aria-hidden="true"
      />
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
          className={isSoft ? "stroke-primary/15" : "stroke-primary-light"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <span
        className={cn(
          "relative z-10 font-bold tabular-nums tracking-tight text-primary",
          labelSize,
        )}
      >
        {clamped}
        <span className="text-[0.7em] font-semibold opacity-80">%</span>
      </span>
    </div>
  );
}
