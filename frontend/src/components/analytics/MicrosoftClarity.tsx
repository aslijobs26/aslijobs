"use client";

import { useEffect } from "react";
import { startMicrosoftClarity } from "./clarity-controller";

/** Microsoft Clarity loads after hydration and only when the project id is set. */
export function MicrosoftClarity() {
  useEffect(() => {
    startMicrosoftClarity(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
  }, []);

  return null;
}
