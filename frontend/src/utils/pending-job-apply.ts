const PENDING_JOB_APPLY_KEY = "aslijobs:pending-job-apply";
const listeners = new Set<() => void>();

function notifyPendingJobApply(): void {
  listeners.forEach((listener) => listener());
}

export function subscribePendingJobApply(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type PendingJobApply = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  returnUrl: string;
};

let cachedRaw: string | null = null;
let cachedSnapshot: PendingJobApply | null = null;

function parsePendingJobApply(raw: string | null): PendingJobApply | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PendingJobApply>;
    if (!parsed.jobId?.trim() || !parsed.returnUrl?.trim()) {
      return null;
    }
    return {
      jobId: parsed.jobId.trim(),
      jobTitle: parsed.jobTitle?.trim() || parsed.jobId.trim(),
      companyName: parsed.companyName?.trim() || "",
      returnUrl: parsed.returnUrl.trim(),
    };
  } catch {
    return null;
  }
}

export function storePendingJobApply(intent: PendingJobApply): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(PENDING_JOB_APPLY_KEY, JSON.stringify(intent));
  notifyPendingJobApply();
}

export function readPendingJobApply(): PendingJobApply | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(PENDING_JOB_APPLY_KEY);
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }
  cachedRaw = raw;
  cachedSnapshot = parsePendingJobApply(raw);
  return cachedSnapshot;
}

export function clearPendingJobApply(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(PENDING_JOB_APPLY_KEY);
  notifyPendingJobApply();
}
