import type { PlacementJoiningStatus } from "../../../types/operations-placements";

/** Badge variants aligned to placement joining status colors. */
export function placementJoiningStatusBadgeVariant(
  status: PlacementJoiningStatus | string | null | undefined,
): "default" | "medium" | "high" | "low" | "candidate" | "verification" {
  switch (status) {
    case "joined":
      return "candidate"; // green
    case "joining_pending":
      return "medium"; // orange
    case "did_not_join":
      return "high"; // red
    default:
      return "low";
  }
}

export function placementCandidateInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "PL";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}
