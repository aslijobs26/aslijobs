"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import {
  trackFirebaseCtaClick,
  trackFirebasePageView,
} from "./firebase-analytics";

function FirebasePageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackFirebasePageView();
  }, [pathname, searchParams]);

  useEffect(() => {
    const options = { capture: true, passive: true } as const;
    document.addEventListener("click", trackFirebaseCtaClick, options);
    return () => {
      document.removeEventListener("click", trackFirebaseCtaClick, options);
    };
  }, []);

  return null;
}

/** Google Analytics through Firebase: page views, route changes and CTA clicks. */
export function FirebaseAnalytics() {
  return (
    <Suspense fallback={null}>
      <FirebasePageTracker />
    </Suspense>
  );
}
