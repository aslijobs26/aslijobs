import type { ApplicationResumeSource } from "@/types/job-seeker-resume";
import type { PublicUploadedResume } from "@/types/job-seeker-resume";

export type ApplyResumeChooserRequest = {
  jobTitle: string;
  companyName: string;
  defaultSource: ApplicationResumeSource;
  uploadedResume: PublicUploadedResume;
  onConfirm: (source: ApplicationResumeSource) => void;
  onCancel: () => void;
};

type Listener = (request: ApplyResumeChooserRequest | null) => void;

let listener: Listener | null = null;

export function registerApplyResumeChooser(next: Listener | null): void {
  listener = next;
}

export function openApplyResumeChooser(
  request: ApplyResumeChooserRequest,
): void {
  if (!listener) {
    request.onConfirm(request.defaultSource);
    return;
  }
  listener(request);
}

export function closeApplyResumeChooser(): void {
  listener?.(null);
}
