"use client";

import { Suspense } from "react";
import {
  AnalyticsPageViewBeacon,
} from "./AnalyticsPageViewBeacon";
import type { AnalyticsPortal } from "./AnalyticsPageViewBeacon";

type AnalyticsBeaconProps = {
  portal: AnalyticsPortal;
};

export function AnalyticsBeacon({ portal }: AnalyticsBeaconProps) {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageViewBeacon portal={portal} />
    </Suspense>
  );
}
