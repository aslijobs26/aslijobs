"use client";

import { useSiteLanguage } from "@/i18n/site-language";
import { useMemo } from "react";
import { JobSeekerContentPage } from "./JobSeekerContentPage";
import {
  localizePublicPage,
  type PublicPageKey,
} from "./localize-public-page";

type LocalizedPublicPageProps = {
  pageKey: PublicPageKey;
};

export function LocalizedPublicPage({ pageKey }: LocalizedPublicPageProps) {
  const language = useSiteLanguage();
  const content = useMemo(
    () => localizePublicPage(language.code, pageKey),
    [language.code, pageKey],
  );

  return <JobSeekerContentPage content={content} />;
}
