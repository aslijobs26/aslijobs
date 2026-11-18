export function formatBlogDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Article byline date: "17 November", with the year when it is not the current year. */
export function formatBlogDateLong(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  }).format(date);
}

export function isSameBlogDay(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false;
  const a = new Date(left);
  const b = new Date(right);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatReadingTime(minutes: number): string {
  const safe = Math.max(1, minutes || 1);
  return `${safe} min read`;
}
