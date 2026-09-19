import {
  BarChart3,
  Crown,
  Headset,
  Languages,
  Megaphone,
  Settings2,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export function getRoleVisual(roleName: string): {
  Icon: LucideIcon;
  className: string;
} {
  const key = roleName.toLowerCase();
  if (key.includes("super admin") || key === "super_admin") {
    return { Icon: Crown, className: "bg-[#E8F0FE] text-[#2563EB]" };
  }
  if (key.includes("content") || key.includes("language")) {
    return { Icon: Languages, className: "bg-[#F3E8FF] text-[#7C3AED]" };
  }
  if (key.includes("marketing")) {
    return { Icon: Megaphone, className: "bg-[#FCE7F3] text-[#DB2777]" };
  }
  if (key.includes("sales")) {
    return { Icon: BarChart3, className: "bg-[#FFF1E6] text-[#C2410C]" };
  }
  if (key.includes("support")) {
    return { Icon: Headset, className: "bg-[#E6F5F4] text-primary" };
  }
  if (key.includes("technical") || key.includes("lead")) {
    return { Icon: Users, className: "bg-[#EEF2FF] text-[#4F46E5]" };
  }
  if (key.includes("operations")) {
    return { Icon: Settings2, className: "bg-[#E8F7EE] text-[#15803D]" };
  }
  return { Icon: Shield, className: "bg-[#E8F0FE] text-[#2563EB]" };
}

export function formatRoleMemberBadge(
  memberCount: number,
  departmentName: string | null | undefined,
): string {
  const membersLabel = `${memberCount} member${memberCount === 1 ? "" : "s"}`;
  if (departmentName?.trim()) {
    return `${membersLabel} · ${departmentName.trim()}`;
  }
  return membersLabel;
}
