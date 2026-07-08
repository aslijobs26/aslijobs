import type { ResourceIconKey } from "@/types/trust-resources";
import {
  ClipboardList,
  FileText,
  IndianRupee,
  TrendingUp,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

const iconClassName = "size-5";

const iconMap: Record<ResourceIconKey, ReactNode> = {
  guide: (
    <ClipboardList
      className={iconClassName}
      strokeWidth={2}
      aria-hidden="true"
    />
  ),
  resume: (
    <FileText className={iconClassName} strokeWidth={2} aria-hidden="true" />
  ),
  interview: (
    <UserRound className={iconClassName} strokeWidth={2} aria-hidden="true" />
  ),
  salary: (
    <IndianRupee
      className={iconClassName}
      strokeWidth={2}
      aria-hidden="true"
    />
  ),
  career: (
    <TrendingUp className={iconClassName} strokeWidth={2} aria-hidden="true" />
  ),
};

export function ResourceIcon({ icon }: { icon: ResourceIconKey }) {
  return iconMap[icon];
}
