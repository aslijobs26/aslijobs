interface JobsPendingApprovalDotProps {
  visible: boolean;
}

/** Attention marker for jobs waiting on Operations review. */
export function JobsPendingApprovalDot({ visible }: JobsPendingApprovalDotProps) {
  if (!visible) {
    return null;
  }

  return (
    <span className="relative inline-flex size-1.5 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-75 motion-reduce:hidden" />
      <span className="relative inline-flex size-1.5 rounded-full bg-warning shadow-[0_0_8px_color-mix(in_srgb,var(--color-warning)_85%,transparent)]" />
    </span>
  );
}
