"use client";

import { runLocationLanguageDetection } from "@/i18n/detect-location-language";
import { reverseGeocodeLanguageRegionFromCoords } from "@/services/language-region.service";
import { useEffect } from "react";

const START_DELAY_MS = 800;

/**
 * Asks for location once, after the page has loaded. A supported language
 * stays pending until the visitor confirms it. This component renders nothing.
 */
export function LocationLanguageDetector() {
  useEffect(() => {
    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => {
        void runLocationLanguageDetection({
          reverseGeocode: reverseGeocodeLanguageRegionFromCoords,
        });
      }, START_DELAY_MS);
    };

    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      window.removeEventListener("load", start);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
