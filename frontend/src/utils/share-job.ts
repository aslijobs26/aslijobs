"use client";

type ToastTone = "success" | "error" | "warning" | "info";

let toastHost: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

const TOAST_EXIT_MS = 250;

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

function getToastIconSvg(tone: ToastTone): string {
  switch (tone) {
    case "success":
      return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.5"/><path d="M8.4 12.15 10.9 14.55 15.6 9.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case "warning":
      return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5.2 19.6 18.6H4.4L12 5.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 10.2v4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 16.85v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
    case "info":
      return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.5"/><path d="M12 11.1v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 8.1v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
    case "error":
    default:
      return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.5"/><path d="M12 8.2v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 16.1v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  }
}

function clearToastTimers() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
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

  clearToastTimers();
  host.replaceChildren();

  const toast = document.createElement("div");
  toast.role = "status";
  toast.className = `asli-toast asli-toast--${tone}`;

  const icon = document.createElement("span");
  icon.className = "asli-toast__icon";
  icon.innerHTML = getToastIconSvg(tone);

  const text = document.createElement("p");
  text.className = "asli-toast__message";
  text.textContent = message;

  toast.append(icon, text);
  host.appendChild(toast);

  const leaveDelay = Math.max(0, durationMs - TOAST_EXIT_MS);

  hideTimer = setTimeout(() => {
    toast.classList.add("asli-toast--leaving");
    leaveTimer = setTimeout(() => {
      toast.remove();
      hideTimer = null;
      leaveTimer = null;
    }, TOAST_EXIT_MS);
  }, leaveDelay);
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
