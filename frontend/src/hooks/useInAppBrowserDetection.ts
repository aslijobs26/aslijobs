"use client";

import {
  detectInAppBrowser,
  type InAppBrowserPlatform,
} from "@/utils/in-app-browser";
import { useEffect, useState } from "react";

type InAppBrowserDetectionState = {
  isReady: boolean;
  isInApp: boolean;
  isWhatsApp: boolean;
  platform: InAppBrowserPlatform;
};

const INITIAL_STATE: InAppBrowserDetectionState = {
  isReady: false,
  isInApp: false,
  isWhatsApp: false,
  platform: "other",
};

/**
 * Client-only detection so SSR/hydration does not assume a WhatsApp webview.
 */
export function useInAppBrowserDetection(): InAppBrowserDetectionState {
  const [state, setState] = useState<InAppBrowserDetectionState>(INITIAL_STATE);

  useEffect(() => {
    const detected = detectInAppBrowser(navigator.userAgent);
    setState({
      isReady: true,
      isInApp: detected.isInApp,
      isWhatsApp: detected.isWhatsApp,
      platform: detected.platform,
    });
  }, []);

  return state;
}
