export function formatWorkDueLabel(dueAt: string | null): {
  label: string;
  tone: "danger" | "warning" | "neutral";
} {
  if (!dueAt) {
    return { label: "—", tone: "neutral" };
  }
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return { label: "—", tone: "neutral" };
  }
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const endToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const tomorrowEnd = new Date(endToday.getTime() + 24 * 60 * 60 * 1000);

  if (diffMs < 0) {
    const abs = Math.abs(diffMs);
    const hours = Math.floor(abs / 3_600_000);
    const mins = Math.floor((abs % 3_600_000) / 60_000);
    if (hours < 24) {
      return {
        label: hours > 0 ? `${hours}h ${mins}m overdue` : `${mins}m overdue`,
        tone: "danger",
      };
    }
    return {
      label: due.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      tone: "danger",
    };
  }

  if (due <= endToday) {
    if (diffMs < 12 * 3_600_000) {
      const hours = Math.floor(diffMs / 3_600_000);
      const mins = Math.floor((diffMs % 3_600_000) / 60_000);
      return {
        label: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
        tone: hours < 2 ? "danger" : "warning",
      };
    }
    return {
      label: `Today ${due.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })}`,
      tone: "warning",
    };
  }

  if (due <= tomorrowEnd && due > endToday) {
    return {
      label: `Tomorrow ${due.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })}`,
      tone: "neutral",
    };
  }

  return {
    label: due.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    tone: "neutral",
  };
}

export function relatedEntityHref(
  type: string | null,
  id: string | null,
): string | null {
  if (!type || !id) return null;
  switch (type) {
    case "employer":
    case "verification":
      return `/operations/verifications/${encodeURIComponent(id)}`;
    case "job":
      return `/operations/jobs/${encodeURIComponent(id)}`;
    case "candidate":
      return `/operations/candidates/${encodeURIComponent(id)}`;
    case "placement":
    case "application":
      return `/operations/placements/${encodeURIComponent(id)}`;
    default:
      return null;
  }
}
