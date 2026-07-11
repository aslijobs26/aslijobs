import type { CategoryIconKey } from "@/types/discovery";
import {
  Bike,
  Car,
  Factory,
  HardHat,
  LayoutGrid,
  Shield,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";

const iconMap: Record<CategoryIconKey, ReactNode> = {
  drivers: <Car className="size-5" strokeWidth={2} aria-hidden="true" />,
  delivery: <Bike className="size-5" strokeWidth={2} aria-hidden="true" />,
  warehouse: (
    <Warehouse className="size-5" strokeWidth={2} aria-hidden="true" />
  ),
  security: <Shield className="size-5" strokeWidth={2} aria-hidden="true" />,
  construction: (
    <HardHat className="size-5" strokeWidth={2.75} aria-hidden="true" />
  ),
  hospitality: (
    <UtensilsCrossed className="size-5" strokeWidth={2} aria-hidden="true" />
  ),
  manufacturing: (
    <Factory className="size-5" strokeWidth={2} aria-hidden="true" />
  ),
  "view-all": (
    <LayoutGrid className="size-5" strokeWidth={2.75} aria-hidden="true" />
  ),
};

export function CategoryIcon({ icon }: { icon: CategoryIconKey }) {
  return iconMap[icon];
}
