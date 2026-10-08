"use client";

import { useInAppBrowserDetection } from "@/hooks/useInAppBrowserDetection";
import { useTranslate } from "@/i18n/translate";
import {
  getExternalBrowserHandoffHref,
  getSameOriginHandoffUrl,
  type InAppBrowserPlatform,
} from "@/utils/in-app-browser";
import { useEffect, useState, type ReactNode } from "react";

type InAppBrowserHandoffProps = {
  platform: InAppBrowserPlatform;
  variant?: "page" | "embedded";
};

export function InAppBrowserHandoff({
  platform,
  variant = "page",
}: InAppBrowserHandoffProps) {
  const t = useTranslate();
  const [handoffHref, setHandoffHref] = useState("#");

  useEffect(() => {
    const pageUrl = getSameOriginHandoffUrl(window.location);
    setHandoffHref(getExternalBrowserHandoffHref(pageUrl, platform));
  }, [platform]);

  const ctaLabel =
    platform === "android"
      ? t("auth.inAppBrowser.continueInChrome")
      : t("auth.inAppBrowser.openInBrowser");

  const content = (
    <div
      className="flex w-full max-w-md flex-col gap-4 text-left"
      role="region"
      aria-labelledby="in-app-browser-handoff-title"
    >
      <h1
        id="in-app-browser-handoff-title"
        className="employer-register-form-heading"
      >
        {t("auth.inAppBrowser.title")}
      </h1>
      <p className="break-words text-sm leading-relaxed text-muted">
        {t("auth.inAppBrowser.body")}
      </p>
      <a
        href={handoffHref}
        className="employer-register-form-submit no-underline"
        rel="noopener noreferrer"
      >
        {ctaLabel}
      </a>
      <p
        className="break-words text-sm leading-relaxed text-foreground"
        role="note"
      >
        {t("auth.inAppBrowser.fallback")}
      </p>
      {platform === "ios" ? (
        <p className="break-words text-sm leading-relaxed text-muted">
          {t("auth.inAppBrowser.fallbackIos")}
        </p>
      ) : null}
    </div>
  );

  if (variant === "embedded") {
    return content;
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-hero-bg px-6 py-10">
      {content}
    </div>
  );
}

type InAppBrowserHandoffGateProps = {
  children: ReactNode;
  loadingFallback: ReactNode;
};

export function InAppBrowserHandoffGate({
  children,
  loadingFallback,
}: InAppBrowserHandoffGateProps) {
  const detection = useInAppBrowserDetection();

  if (!detection.isReady) {
    return <>{loadingFallback}</>;
  }

  if (detection.isInApp) {
    return (
      <div className="employer-register-form-body">
        <InAppBrowserHandoff platform={detection.platform} variant="embedded" />
      </div>
    );
  }

  return <>{children}</>;
}
