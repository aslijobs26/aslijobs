import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  PieChart,
  UserRound,
  Zap,
} from "lucide-react";

export const PERFORMANCE_METRIC_ICON_PRESETS = {
  open: {
    Icon: FolderOpen,
    iconWrapClassName: "bg-sky-500/20",
    iconClassName: "text-sky-600",
    cardClassName:
      "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
  },
  completedTotal: {
    Icon: CheckCircle2,
    iconWrapClassName: "bg-primary/20",
    iconClassName: "text-primary",
    cardClassName:
      "border-primary/20 bg-gradient-to-br from-primary/10 to-white dark:from-primary/15 dark:to-surface",
  },
  completed7d: {
    Icon: CalendarCheck2,
    iconWrapClassName: "bg-violet-500/20",
    iconClassName: "text-violet-600",
    cardClassName:
      "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
  },
  completionRate: {
    Icon: PieChart,
    iconWrapClassName: "bg-success/20",
    iconClassName: "text-success",
    cardClassName:
      "border-success/20 bg-gradient-to-br from-success/10 to-white dark:from-success/15 dark:to-surface",
  },
  overdue: {
    Icon: AlertTriangle,
    iconWrapClassName: "bg-danger/20",
    iconClassName: "text-danger",
    cardClassName:
      "border-danger/20 bg-gradient-to-br from-danger/10 to-white dark:from-danger/15 dark:to-surface",
  },
  sla: {
    Icon: ClipboardList,
    iconWrapClassName: "bg-warning/20",
    iconClassName: "text-warning",
    cardClassName:
      "border-warning/25 bg-gradient-to-br from-warning/10 to-white dark:from-warning/15 dark:to-surface",
  },
  resolution: {
    Icon: Zap,
    iconWrapClassName: "bg-cyan-500/20",
    iconClassName: "text-cyan-600",
    cardClassName:
      "border-cyan-200/80 bg-gradient-to-br from-cyan-50 to-white dark:border-cyan-500/25 dark:from-cyan-500/10 dark:to-surface",
  },
  response: {
    Icon: UserRound,
    iconWrapClassName: "bg-fuchsia-500/20",
    iconClassName: "text-fuchsia-600",
    cardClassName:
      "border-fuchsia-200/80 bg-gradient-to-br from-fuchsia-50 to-white dark:border-fuchsia-500/25 dark:from-fuchsia-500/10 dark:to-surface",
  },
} as const;
