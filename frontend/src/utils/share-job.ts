"use client";

type ToastTone = "success" | "error";

let toastHost: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function ensureToastHost() {
  if (typeof document === "undefined") {
    return null;
  }

  if (toastHost && document.body.contains(toastHost)) {
    return toastHost;
  }

  toastHost = document.createElement("div");
  toastHost.setAttribute("aria-live", "polite");
  toastHost.setAttribute("aria-atomic", "true");
  toastHost.className =
    "pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4";
  document.body.appendChild(toastHost);
  return toastHost;
}

export function showAppToast(
  message: string,
  tone: ToastTone = "success",
  durationMs = 2500,
) {
  const host = ensureToastHost();
  if (!host) {
    return;
  }

  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  host.replaceChildren();

  const toast = document.createElement("div");
  toast.role = "status";
  toast.className =
    tone === "success"
      ? "rounded-lg border border-primary-soft/30 bg-surface px-4 py-2.5 text-sm font-semibold text-primary-soft shadow-lg"
      : "rounded-lg border border-red-200 bg-surface px-4 py-2.5 text-sm font-semibold text-red-600 shadow-lg";
  toast.textContent = message;
  host.appendChild(toast);

  hideTimer = setTimeout(() => {
    toast.remove();
    hideTimer = null;
  }, durationMs);
}

export async function shareOrCopyText(options: {
  title: string;
  text: string;
  url: string;
  successMessage: string;
  errorMessage?: string;
}) {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(options.url);
      showAppToast(options.successMessage);
    } else {
      throw new Error("Clipboard unavailable");
    }

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === "AbortError" || error.name === "NotAllowedError")
        ) {
          return;
        }
      }
    }
  } catch {
    showAppToast(
      options.errorMessage ?? "Unable to share job link. Please try again.",
      "error",
    );
  }
}

export function buildAbsolutePublicJobUrl(publicJobId: string) {
  if (typeof window === "undefined") {
    return `/jobs/${publicJobId}`;
  }

  return `${window.location.origin}/jobs/${publicJobId}`;
}
