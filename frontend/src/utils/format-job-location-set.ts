type LocationSetEntry = {
  stateName?: string | null;
  cityName?: string | null;
};

export function formatJobLocationSet(
  locations: readonly LocationSetEntry[] | null | undefined,
): string {
  const labels = [
    ...new Set(
      (locations ?? [])
        .map((location) =>
          [location.cityName?.trim(), location.stateName?.trim()]
            .filter(Boolean)
            .join(", "),
        )
        .filter(Boolean),
    ),
  ];
  return labels.length > 1 ? labels.join(" · ") : "";
}
