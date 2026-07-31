import { isAxiosError } from "axios";

export function getTeamApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function formatDepartmentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRelativeActivity(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDepartmentDate(iso);
}

export function formatLastActive(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Today, ${time}`;
  return `${formatDepartmentDate(iso)}, ${time}`;
}

export function roleBadgeClass(roleName: string): string {
  const normalized = roleName.trim().toLowerCase();
  const named: Record<string, string> = {
    admin: "bg-primary-light text-primary",
    "hr manager": "bg-sky-50 text-sky-700",
    recruiter: "bg-violet-50 text-violet-700",
    "hiring manager": "bg-orange-50 text-orange-700",
    "team lead": "bg-cyan-50 text-cyan-700",
    coordinator: "bg-rose-50 text-rose-700",
    viewer: "bg-slate-100 text-slate-600",
  };
  if (named[normalized]) {
    return named[normalized]!;
  }

  const palette = [
    "bg-primary-light text-primary",
    "bg-sky-50 text-sky-700",
    "bg-violet-50 text-violet-700",
    "bg-amber-50 text-amber-700",
    "bg-rose-50 text-rose-700",
    "bg-slate-100 text-slate-600",
  ];
  let hash = 0;
  for (let i = 0; i < roleName.length; i += 1) {
    hash = (hash + roleName.charCodeAt(i) * (i + 1)) % palette.length;
  }
  return palette[hash] ?? palette[0]!;
}

export function roleChartColor(roleName: string, index: number): string {
  const normalized = roleName.trim().toLowerCase();
  const named: Record<string, string> = {
    admin: "#10b981",
    "hr manager": "#0ea5e9",
    recruiter: "#8b5cf6",
    "hiring manager": "#f97316",
    "team lead": "#06b6d4",
    coordinator: "#f43f5e",
    viewer: "#94a3b8",
  };
  if (named[normalized]) {
    return named[normalized]!;
  }
  const palette = [
    "#10b981",
    "#0ea5e9",
    "#8b5cf6",
    "#f59e0b",
    "#f43f5e",
    "#06b6d4",
    "#94a3b8",
  ];
  return palette[index % palette.length]!;
}
