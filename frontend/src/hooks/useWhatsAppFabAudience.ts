"use client";

import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { useJobSeekerProfile } from "@/hooks/useJobSeekerProfile";
import {
  getActiveAuthRealm,
  type AuthRealm,
} from "@/utils/auth-realm";
import {
  EMPLOYER_ACCESS_TOKEN_STORAGE_KEY,
  EMPLOYER_AUTH_CHANGE_EVENT,
} from "@/utils/employer-auth-storage";
import {
  JOB_SEEKER_ACCESS_TOKEN_STORAGE_KEY,
  JOB_SEEKER_AUTH_CHANGE_EVENT,
} from "@/utils/job-seeker-auth-storage";
import {
  resolveWhatsAppFabAudience,
  whatsappFabActionAudience,
  type WhatsAppFabAudienceStatus,
} from "@/utils/whatsapp-fab-audience";
import { useCallback, useEffect, useState } from "react";

function readRealm(): AuthRealm | null {
  if (typeof window === "undefined") {
    return null;
  }
  return getActiveAuthRealm();
}

/**
 * Authoritative FAB audience: active auth realm + successful /me profile.
 * Subscribes to login/logout events so logout returns to guest actions immediately.
 */
export function useWhatsAppFabAudience(): {
  status: WhatsAppFabAudienceStatus;
  actionAudience: ReturnType<typeof whatsappFabActionAudience>;
  retry: () => void;
} {
  const [realm, setRealm] = useState<AuthRealm | null>(null);
  const [authHydrated, setAuthHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setRealm(readRealm());
      setAuthHydrated(true);
    };
    sync();

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === EMPLOYER_ACCESS_TOKEN_STORAGE_KEY ||
        event.key === JOB_SEEKER_ACCESS_TOKEN_STORAGE_KEY
      ) {
        sync();
      }
    };

    window.addEventListener("pageshow", sync);
    window.addEventListener("storage", onStorage);
    window.addEventListener(JOB_SEEKER_AUTH_CHANGE_EVENT, sync);
    window.addEventListener(EMPLOYER_AUTH_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(JOB_SEEKER_AUTH_CHANGE_EVENT, sync);
      window.removeEventListener(EMPLOYER_AUTH_CHANGE_EVENT, sync);
    };
  }, []);

  const employerQuery = useEmployerProfile({
    enabled: authHydrated && realm === "employer",
  });
  const seekerQuery = useJobSeekerProfile({
    enabled: authHydrated && realm === "job-seeker",
  });

  const status: WhatsAppFabAudienceStatus = !authHydrated
    ? "loading"
    : resolveWhatsAppFabAudience({
        realm,
        employer: {
          isPending: employerQuery.isPending,
          isFetching: employerQuery.isFetching,
          isSuccess: employerQuery.isSuccess,
          isError: employerQuery.isError,
          hasData: Boolean(employerQuery.data),
        },
        seeker: {
          isPending: seekerQuery.isPending,
          isFetching: seekerQuery.isFetching,
          isSuccess: seekerQuery.isSuccess,
          isError: seekerQuery.isError,
          hasData: Boolean(seekerQuery.data),
        },
      });

  const retry = useCallback(() => {
    if (realm === "employer") {
      void employerQuery.refetch();
      return;
    }
    if (realm === "job-seeker") {
      void seekerQuery.refetch();
    }
  }, [employerQuery, realm, seekerQuery]);

  return {
    status,
    actionAudience: whatsappFabActionAudience(status),
    retry,
  };
}
