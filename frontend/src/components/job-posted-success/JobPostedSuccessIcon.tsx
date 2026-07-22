"use client";

/**
 * Pure SVG + CSS success icon for Job Posted Successfully.
 * No raster assets — scales crisply at every breakpoint.
 */
export function JobPostedSuccessIcon() {
  return (
    <div
      className="job-posted-success-icon-wrap"
      role="img"
      aria-label="Job posted successfully"
    >
      <svg
        className="job-posted-success-icon"
        viewBox="-48 -48 336 336"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Three soft concentric glow circles — decreasing opacity */}
        <circle
          className="job-posted-success-glow-ring glow-3"
          cx="120"
          cy="120"
          r="108"
          fill="var(--color-primary-soft)"
        />
        <circle
          className="job-posted-success-glow-ring glow-2"
          cx="120"
          cy="120"
          r="88"
          fill="var(--color-primary-soft)"
        />
        <circle
          className="job-posted-success-glow-ring glow-1"
          cx="120"
          cy="120"
          r="68"
          fill="var(--color-primary-soft)"
        />

        {/* Solid success circle + centered check */}
        <g className="job-posted-success-core">
          <circle
            cx="120"
            cy="120"
            r="46"
            fill="var(--color-primary-soft)"
          />
          <path
            d="M98 121.5 L111.5 135 L144 102"
            stroke="var(--color-surface)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Confetti — spread farther from the core */}
        <g className="job-posted-success-dust-group">
          <rect
            className="job-posted-success-dust"
            x="-8"
            y="8"
            width="14"
            height="4.5"
            rx="2.25"
            fill="var(--color-benefit-ai-matching-icon)"
            transform="rotate(-42 -1 10.25)"
          />
          <path
            className="job-posted-success-dust"
            d="M72 -12c3-5.5 8.5-5.5 11.5 0s8.5 5.5 11.5 0"
            stroke="var(--color-brand-accent)"
            strokeWidth="3.25"
            strokeLinecap="round"
          />
          <rect
            className="job-posted-success-dust"
            x="222"
            y="6"
            width="14"
            height="4.5"
            rx="2.25"
            fill="var(--color-benefit-ai-matching-icon)"
            transform="rotate(48 229 8.25)"
          />
          <path
            className="job-posted-success-dust"
            d="M238 42c3-5.5 8.5-5.5 11.5 0s8.5 5.5 11.5 0"
            stroke="var(--color-brand-accent)"
            strokeWidth="3.25"
            strokeLinecap="round"
            transform="rotate(18 250 42)"
          />
          <rect
            className="job-posted-success-dust"
            x="248"
            y="108"
            width="4.5"
            height="14"
            rx="2.25"
            fill="var(--color-primary-soft)"
            transform="rotate(10 250.25 115)"
          />
          <rect
            className="job-posted-success-dust"
            x="246"
            y="158"
            width="14"
            height="4.5"
            rx="2.25"
            fill="var(--color-benefit-languages-icon)"
            transform="rotate(62 253 160.25)"
          />
          <rect
            className="job-posted-success-dust"
            x="214"
            y="218"
            width="14"
            height="4.5"
            rx="2.25"
            fill="var(--color-benefit-free-icon)"
            transform="rotate(-32 221 220.25)"
          />
          <rect
            className="job-posted-success-dust"
            x="158"
            y="246"
            width="14"
            height="4.5"
            rx="2.25"
            fill="var(--color-benefit-verified-icon)"
            transform="rotate(16 165 248.25)"
          />
          <rect
            className="job-posted-success-dust"
            x="100"
            y="250"
            width="13"
            height="4.5"
            rx="2.25"
            fill="var(--color-benefit-languages-icon)"
            transform="rotate(-8 106.5 252.25)"
          />
          <rect
            className="job-posted-success-dust"
            x="16"
            y="222"
            width="14"
            height="4.5"
            rx="2.25"
            fill="var(--color-primary-soft)"
            transform="rotate(36 23 224.25)"
          />
          <path
            className="job-posted-success-dust"
            d="M4 248c3-5.5 8.5-5.5 11.5 0s8.5 5.5 11.5 0"
            stroke="var(--color-brand-accent)"
            strokeWidth="3.25"
            strokeLinecap="round"
            transform="rotate(-22 16 248)"
          />
          <rect
            className="job-posted-success-dust"
            x="-22"
            y="116"
            width="14"
            height="4.5"
            rx="2.25"
            fill="var(--color-brand-accent)"
            transform="rotate(-4 -15 118.25)"
          />
          <rect
            className="job-posted-success-dust"
            x="-16"
            y="58"
            width="13"
            height="4.5"
            rx="2.25"
            fill="var(--color-resource-guide-icon)"
            transform="rotate(-58 -9.5 60.25)"
          />
          <rect
            className="job-posted-success-dust"
            x="240"
            y="68"
            width="13"
            height="4.5"
            rx="2.25"
            fill="var(--color-resource-guide-icon)"
            transform="rotate(70 246.5 70.25)"
          />
        </g>
      </svg>
    </div>
  );
}
