export function readOperationsCssColor(
  variable: `--${string}`,
  fallback = "",
): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  return value || fallback;
}
