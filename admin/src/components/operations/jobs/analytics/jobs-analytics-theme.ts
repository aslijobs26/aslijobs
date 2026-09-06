export const JOBS_ANALYTICS_STATUS_COLORS: Record<string, string> = {
  active: "#00baa5",
  pending_approval: "#ea580c",
  paused: "#64748b",
  draft: "#94a3b8",
  expired: "#dc2626",
  closed: "#475569",
  rejected: "#b91c1c",
};

export const JOBS_ANALYTICS_PAYMENT_COLORS: Record<string, string> = {
  paid: "#00baa5",
  pending: "#ea580c",
  unpaid: "#dc2626",
  not_applicable: "#94a3b8",
};

export const JOBS_ANALYTICS_BAR_COLORS = [
  "#2563eb",
  "#00baa5",
  "#f59e0b",
  "#7c3aed",
  "#db2777",
  "#0284c7",
  "#16a34a",
  "#64748b",
];

export const JOBS_ANALYTICS_CARD_CLASS =
  "flex h-full min-h-[22rem] min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#e7eef3] bg-[color-mix(in_srgb,white_92%,#e8f4f8)] p-4 shadow-[0_6px_22px_rgba(26,43,60,0.045)] sm:p-5 xl:min-h-[16.75rem] xl:p-4 dark:border-white/10 dark:bg-[color-mix(in_srgb,var(--color-surface)_88%,#1e293b)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.22)]";

export const JOBS_ANALYTICS_INSIGHT_CLASS =
  "flex min-w-0 flex-col gap-3 rounded-[20px] border border-[#dceef3] bg-[color-mix(in_srgb,#e8f6fa_70%,white)] px-4 py-4 shadow-[0_6px_22px_rgba(26,43,60,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5 xl:gap-2 xl:px-4 xl:py-3.5 dark:border-white/10 dark:bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))]";
