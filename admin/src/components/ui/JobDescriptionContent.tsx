import { cn } from "../../utils/cn";
import {
  looksLikeJobDescriptionHtml,
  sanitizeJobDescriptionHtml,
} from "../../utils/job-description-html";

type JobDescriptionContentProps = {
  html: string;
  className?: string;
  emptyFallback?: string;
};

/**
 * Renders stored job description HTML safely.
 * Plain-text legacy descriptions remain whitespace-preserving.
 */
export function JobDescriptionContent({
  html,
  className,
  emptyFallback,
}: JobDescriptionContentProps) {
  const trimmed = html.trim();
  if (!trimmed) {
    if (!emptyFallback) {
      return null;
    }
    return <p className={className}>{emptyFallback}</p>;
  }

  if (!looksLikeJobDescriptionHtml(trimmed)) {
    return (
      <div className={cn("whitespace-pre-wrap break-words", className)}>
        {trimmed}
      </div>
    );
  }

  const safeHtml = sanitizeJobDescriptionHtml(trimmed);
  if (!safeHtml) {
    if (!emptyFallback) {
      return null;
    }
    return <p className={className}>{emptyFallback}</p>;
  }

  return (
    <div
      className={cn(
        "job-description-html break-words",
        "[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground",
        "[&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground",
        "[&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_h4]:mb-1.5 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-foreground",
        "[&_h5]:mb-1 [&_h5]:text-sm [&_h5]:font-medium [&_h5]:text-foreground",
        "[&_h6]:mb-1 [&_h6]:text-xs [&_h6]:font-medium [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:text-foreground",
        "[&_p]:mb-2 [&_p]:last:mb-0",
        "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:mb-0.5",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_strong]:font-semibold [&_b]:font-semibold",
        "[&_em]:italic [&_i]:italic",
        "[&_u]:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
