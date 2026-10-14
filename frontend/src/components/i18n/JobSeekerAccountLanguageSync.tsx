"use client";

import {
  parseSiteLanguageQuery,
  type SiteLanguageOption,
} from "@/constants/site-language";
import {
  JOB_SEEKER_PROFILE_QUERY_KEY,
  useJobSeekerProfile,
} from "@/hooks/useJobSeekerProfile";
import {
  applyAccountSiteLanguage,
  hasExplicitSiteLanguageChoiceThisVisit,
  readExplicitSiteLanguage,
  setSiteLanguageAccountPersister,
} from "@/i18n/site-language";
import { updateJobSeekerProfile } from "@/services/job-seeker-profile.service";
import { isJobSeekerAuthActive } from "@/utils/auth-realm";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

function persistPreferredLanguage(
  option: SiteLanguageOption,
  onUpdated: (preferredLanguage: string) => void,
): void {
  if (!isJobSeekerAuthActive()) {
    return;
  }

  void updateJobSeekerProfile({ preferredLanguage: option.code })
    .then((jobSeeker) => {
      onUpdated(jobSeeker.preferredLanguage ?? option.code);
    })
    .catch(() => {
      // Local preference remains even if the account persist fails.
    });
}

export function JobSeekerAccountLanguageSync() {
  const queryClient = useQueryClient();
  const { data: jobSeeker } = useJobSeekerProfile();

  useEffect(() => {
    setSiteLanguageAccountPersister((option) => {
      persistPreferredLanguage(option, (preferredLanguage) => {
        const current = queryClient.getQueryData(JOB_SEEKER_PROFILE_QUERY_KEY);
        if (current && typeof current === "object") {
          queryClient.setQueryData(JOB_SEEKER_PROFILE_QUERY_KEY, {
            ...current,
            preferredLanguage,
          });
        }
      });
    });

    return () => {
      setSiteLanguageAccountPersister(null);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!jobSeeker) {
      return;
    }

    if (hasExplicitSiteLanguageChoiceThisVisit()) {
      const stored = readExplicitSiteLanguage();
      const account = parseSiteLanguageQuery(jobSeeker.preferredLanguage);
      if (stored && stored.code !== account?.code) {
        persistPreferredLanguage(stored, (preferredLanguage) => {
          queryClient.setQueryData(JOB_SEEKER_PROFILE_QUERY_KEY, {
            ...jobSeeker,
            preferredLanguage,
          });
        });
      }
      return;
    }

    applyAccountSiteLanguage(jobSeeker.preferredLanguage);
  }, [jobSeeker, queryClient]);

  return null;
}
