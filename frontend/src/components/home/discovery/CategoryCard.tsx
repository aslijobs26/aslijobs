import constructionImage from "@/assets/image/categories/construction.jpg";
import deliveryImage from "@/assets/image/categories/delivery.jpg";
import driversImage from "@/assets/image/categories/drivers.jpg";
import hospitalityImage from "@/assets/image/categories/hospitality.jpg";
import manufacturingImage from "@/assets/image/categories/manufacturing.jpg";
import securityImage from "@/assets/image/categories/security.jpg";
import viewAllImage from "@/assets/image/categories/view-all.jpg";
import warehouseImage from "@/assets/image/categories/warehouse.jpg";
import type { CategoryIconKey, JobCategory } from "@/types/discovery";
import { cn } from "@/utils/cn";
import { ArrowRight } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

const CATEGORY_IMAGES: Record<CategoryIconKey, StaticImageData> = {
  drivers: driversImage,
  delivery: deliveryImage,
  warehouse: warehouseImage,
  security: securityImage,
  construction: constructionImage,
  hospitality: hospitalityImage,
  manufacturing: manufacturingImage,
  "view-all": viewAllImage,
};

type CategoryCardProps = {
  category: JobCategory;
};

export function CategoryCard({ category }: CategoryCardProps) {
  const detail = category.jobCount ?? category.subtitle;

  return (
    <Link
      href={category.href}
      className={cn(
        "group flex min-w-0 flex-col gap-1.5",
        "md:relative md:block md:aspect-[4/5] md:gap-0 md:overflow-hidden md:rounded-xl md:bg-surface md:shadow-sm",
        "lg:aspect-[9/16] lg:rounded-2xl",
        "transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] md:hover:shadow-md",
      )}
    >
      <span className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-surface shadow-sm md:absolute md:inset-0 md:aspect-auto md:rounded-none md:shadow-none">
        <Image
          src={CATEGORY_IMAGES[category.icon]}
          alt=""
          fill
          sizes="(min-width: 1024px) 140px, (min-width: 768px) 22vw, 22vw"
          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <span
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-black/80 via-black/20 to-transparent md:block"
          aria-hidden="true"
        />
        <span className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm md:bottom-2 md:right-2 lg:bottom-2.5 lg:right-2.5 lg:size-6">
          <ArrowRight className="size-2.5 lg:size-3" aria-hidden="true" />
        </span>
      </span>

      <span className="min-w-0 px-0.5 md:absolute md:inset-x-0 md:bottom-0 md:px-2 md:pb-2 md:pr-8 lg:px-2.5 lg:pb-2.5 lg:pr-9">
        <span className="block text-[11px] font-bold leading-tight text-foreground md:text-white">
          {category.name}
        </span>
        {detail ? (
          <span className="mt-0.5 block text-[10px] leading-tight text-muted md:text-white/85">
            {detail}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
