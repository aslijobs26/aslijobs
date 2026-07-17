"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseActiveLegalSectionOptions = {
  sectionIds: string[];
  offsetPx?: number;
};

type UseActiveLegalSectionResult = {
  activeId: string;
  activateSection: (id: string) => void;
};

function getDocumentTop(element: HTMLElement): number {
  return element.getBoundingClientRect().top + window.scrollY;
}

export function useActiveLegalSection({
  sectionIds,
  offsetPx = 128,
}: UseActiveLegalSectionOptions): UseActiveLegalSectionResult {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const activeIdRef = useRef(sectionIds[0] ?? "");
  const lockedTargetIdRef = useRef<string | null>(null);
  const frameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const maxLockTimerRef = useRef<number | null>(null);
  const scrollListenerRef = useRef<(() => void) | null>(null);
  const scrollEndListenerRef = useRef<(() => void) | null>(null);

  const sectionIdsKey = sectionIds.join("|");

  const clearNavigationLockTimers = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    if (maxLockTimerRef.current !== null) {
      window.clearTimeout(maxLockTimerRef.current);
      maxLockTimerRef.current = null;
    }

    if (scrollListenerRef.current) {
      window.removeEventListener("scroll", scrollListenerRef.current);
      scrollListenerRef.current = null;
    }

    if (scrollEndListenerRef.current) {
      window.removeEventListener("scrollend", scrollEndListenerRef.current);
      scrollEndListenerRef.current = null;
    }
  }, []);

  const commitActiveId = useCallback((id: string) => {
    if (activeIdRef.current === id) {
      return;
    }

    activeIdRef.current = id;
    setActiveId(id);
  }, []);

  const unlockNavigation = useCallback(
    (keepId?: string) => {
      clearNavigationLockTimers();
      lockedTargetIdRef.current = null;

      if (keepId) {
        commitActiveId(keepId);
      }
    },
    [clearNavigationLockTimers, commitActiveId],
  );

  const activateSection = useCallback(
    (id: string) => {
      lockedTargetIdRef.current = id;
      commitActiveId(id);
      clearNavigationLockTimers();

      const finishNavigation = () => {
        if (lockedTargetIdRef.current !== id) {
          return;
        }

        unlockNavigation(id);
      };

      const onScrollDuringNavigation = () => {
        if (settleTimerRef.current !== null) {
          window.clearTimeout(settleTimerRef.current);
        }

        // Keep the clicked section active for the whole smooth-scroll.
        commitActiveId(id);

        const settleMs =
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 1023px)").matches
            ? 280
            : 180;

        settleTimerRef.current = window.setTimeout(() => {
          finishNavigation();
        }, settleMs);
      };

      scrollListenerRef.current = onScrollDuringNavigation;
      scrollEndListenerRef.current = finishNavigation;
      window.addEventListener("scroll", onScrollDuringNavigation, {
        passive: true,
      });
      window.addEventListener("scrollend", finishNavigation, { passive: true });

      const target = document.getElementById(id);
      const alreadyAtTarget =
        target !== null &&
        Math.abs(getDocumentTop(target) - (window.scrollY + offsetPx)) <= 8;

      if (alreadyAtTarget) {
        settleTimerRef.current = window.setTimeout(() => {
          finishNavigation();
        }, 50);
      }

      const maxLockMs =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 1023px)").matches
          ? 2800
          : 2000;

      maxLockTimerRef.current = window.setTimeout(() => {
        finishNavigation();
      }, maxLockMs);
    },
    [clearNavigationLockTimers, commitActiveId, offsetPx, unlockNavigation],
  );

  useEffect(() => {
    const ids = sectionIdsKey.split("|").filter(Boolean);

    if (ids.length === 0) {
      return;
    }

    const resolveActiveSection = () => {
      // While a sidebar click is navigating, only the clicked section stays active.
      if (lockedTargetIdRef.current) {
        commitActiveId(lockedTargetIdRef.current);
        return;
      }

      const elements = ids
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element !== null);

      if (elements.length === 0) {
        return;
      }

      const scrollPosition = window.scrollY + offsetPx;
      let currentId = ids[0] ?? "";

      for (const element of elements) {
        if (getDocumentTop(element) <= scrollPosition + 1) {
          currentId = element.id;
        }
      }

      commitActiveId(currentId);
    };

    const onScrollOrResize = () => {
      if (lockedTargetIdRef.current) {
        return;
      }

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        resolveActiveSection();
      });
    };

    resolveActiveSection();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      clearNavigationLockTimers();
    };
  }, [clearNavigationLockTimers, commitActiveId, offsetPx, sectionIdsKey]);

  return { activeId, activateSection };
}
