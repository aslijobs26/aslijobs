import {
  Briefcase,
  Building2,
  Handshake,
  Headphones,
  Layers3,
  Megaphone,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export type DepartmentVisual = {
  icon: LucideIcon;
  wrapClass: string;
  iconClass: string;
};

const PALETTE: DepartmentVisual[] = [
  {
    icon: Building2,
    wrapClass: "bg-sky-500/15",
    iconClass: "text-sky-600",
  },
  {
    icon: Briefcase,
    wrapClass: "bg-violet-500/15",
    iconClass: "text-violet-600",
  },
  {
    icon: Users,
    wrapClass: "bg-emerald-500/15",
    iconClass: "text-emerald-600",
  },
  {
    icon: Handshake,
    wrapClass: "bg-amber-500/15",
    iconClass: "text-amber-600",
  },
  {
    icon: Headphones,
    wrapClass: "bg-rose-500/15",
    iconClass: "text-rose-600",
  },
  {
    icon: Megaphone,
    wrapClass: "bg-orange-500/15",
    iconClass: "text-orange-600",
  },
  {
    icon: Shield,
    wrapClass: "bg-indigo-500/15",
    iconClass: "text-indigo-600",
  },
  {
    icon: Layers3,
    wrapClass: "bg-teal-500/15",
    iconClass: "text-teal-600",
  },
];

const SLUG_VISUALS: Record<string, DepartmentVisual> = {
  employer: {
    icon: Handshake,
    wrapClass: "bg-amber-500/15",
    iconClass: "text-amber-600",
  },
  employers: {
    icon: Handshake,
    wrapClass: "bg-amber-500/15",
    iconClass: "text-amber-600",
  },
  jobseeker: {
    icon: Users,
    wrapClass: "bg-emerald-500/15",
    iconClass: "text-emerald-600",
  },
  jobseekers: {
    icon: Users,
    wrapClass: "bg-emerald-500/15",
    iconClass: "text-emerald-600",
  },
  "job-operations": {
    icon: Briefcase,
    wrapClass: "bg-violet-500/15",
    iconClass: "text-violet-600",
  },
  "job-ops": {
    icon: Briefcase,
    wrapClass: "bg-violet-500/15",
    iconClass: "text-violet-600",
  },
  hiring: {
    icon: Megaphone,
    wrapClass: "bg-orange-500/15",
    iconClass: "text-orange-600",
  },
  support: {
    icon: Headphones,
    wrapClass: "bg-rose-500/15",
    iconClass: "text-rose-600",
  },
  operations: {
    icon: Layers3,
    wrapClass: "bg-teal-500/15",
    iconClass: "text-teal-600",
  },
  team: {
    icon: Users,
    wrapClass: "bg-sky-500/15",
    iconClass: "text-sky-600",
  },
};

function hashKey(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getDepartmentVisual(
  slug: string,
  name?: string,
): DepartmentVisual {
  const key = slug.trim().toLowerCase();
  if (key && SLUG_VISUALS[key]) {
    return SLUG_VISUALS[key];
  }

  for (const [slugKey, visual] of Object.entries(SLUG_VISUALS)) {
    if (key.includes(slugKey) || (name ?? "").toLowerCase().includes(slugKey)) {
      return visual;
    }
  }

  return PALETTE[hashKey(key || name || "department") % PALETTE.length]!;
}
