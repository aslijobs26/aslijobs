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
  offsetPx = 140,
}: UseActiveLegalSectionOptions): UseActiveLegalSectionResult {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const activeIdRef = useRef(sectionIds[0] ?? "");
  const isClickNavigationRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const maxLockTimerRef = useRef<number | null>(null);
  const scrollListenerRef = useRef<(() => void) | null>(null);

  const sectionIdsKey = sectionIds.join("|");

  const clearNavigationLockTimers = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (maxLockTimerRef.current !== null) {
      window.clearTimeout(maxLockTimerRef.current);
      maxLockTimerRef.current = null;
    }

    if (scrollListenerRef.current) {
      window.removeEventListener("scroll", scrollListenerRef.current);
      scrollListenerRef.current = null;
    }
  }, []);

  const unlockNavigation = useCallback(() => {
    clearNavigationLockTimers();
    isClickNavigationRef.current = false;
  }, [clearNavigationLockTimers]);

  const activateSection = useCallback(
    (id: string) => {
      activeIdRef.current = id;
      setActiveId(id);
      isClickNavigationRef.current = true;
      clearNavigationLockTimers();

      let didScroll = false;

      const onScrollDuringNavigation = () => {
        didScroll = true;

        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }

        if (settleTimerRef.current !== null) {
          window.clearTimeout(settleTimerRef.current);
        }

        settleTimerRef.current = window.setTimeout(() => {
          unlockNavigation();
        }, 200);
      };

      scrollListenerRef.current = onScrollDuringNavigation;
      window.addEventListener("scroll", onScrollDuringNavigation, {
        passive: true,
      });

      // Already at target → no scroll events → unlock soon.
      idleTimerRef.current = window.setTimeout(() => {
        if (!didScroll) {
          unlockNavigation();
        }
      }, 120);

      maxLockTimerRef.current = window.setTimeout(() => {
        unlockNavigation();
      }, 1800);
    },
    [clearNavigationLockTimers, unlockNavigation],
  );

  useEffect(() => {
    const ids = sectionIdsKey.split("|").filter(Boolean);

    if (ids.length === 0) {
      return;
    }

    const resolveActiveSection = () => {
      if (isClickNavigationRef.current) {
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

      if (activeIdRef.current === currentId) {
        return;
      }

      activeIdRef.current = currentId;
      setActiveId(currentId);
    };

    const onScrollOrResize = () => {
      if (isClickNavigationRef.current) {
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
  }, [clearNavigationLockTimers, offsetPx, sectionIdsKey]);

  return { activeId, activateSection };
}
