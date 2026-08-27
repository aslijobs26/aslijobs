interface CandidateEmptyStatePanelProps {
  title: string;
  description: string;
}

export function CandidateEmptyStatePanel({
  title,
  description,
}: CandidateEmptyStatePanelProps) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface px-4 py-16 text-center shadow-sm">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </section>
  );
}
