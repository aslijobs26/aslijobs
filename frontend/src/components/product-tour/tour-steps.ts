import type { ProductTourStep } from "./types";

export const replayStep: ProductTourStep = {
  target: "take-tour",
  title: "Replay any time",
  description:
    "Select Take a tour to replay the walkthrough for the page you are on, whenever that page has one.",
  side: "bottom",
  align: "end",
};

export function employerSidebarStep(id: string, name: string): ProductTourStep {
  return {
    target: `employer-nav-${id}`,
    title: `${name} in the sidebar`,
    description: `${name} in the sidebar always brings you back to this page.`,
    side: "right",
  };
}

export function seekerSidebarStep(id: string, name: string): ProductTourStep {
  return {
    target: `seeker-nav-${id}`,
    title: `${name} in the sidebar`,
    description: `${name} in the sidebar always brings you back to this page.`,
    side: "right",
  };
}

export function pagesStep(target: string, noun: string): ProductTourStep {
  return {
    target,
    title: "Pages",
    description: `Move between pages when there are more ${noun} than fit on one.`,
    side: "top",
  };
}
