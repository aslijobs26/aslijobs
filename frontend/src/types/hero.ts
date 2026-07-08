import type { ReactNode } from "react";

export type HeroFeatureCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
  iconContainerClassName?: string;
};

export type HeroSearchFormValues = {
  query: string;
  state: string;
  city: string;
  category: string;
};

export type HeroFeatureCardPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type HeroFeatureCardConfig = {
  id: string;
  title: string;
  description: string;
  position: HeroFeatureCardPosition;
};
