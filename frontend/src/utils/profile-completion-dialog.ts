import type { ProfileApplyGap } from "@/utils/profile-apply-gate";

export type ProfileCompletionDialogRequest = {
  jobId: string;
  jobTitle: string;
  missingSections: ProfileApplyGap[];
  onCompleteProfile: () => void;
  onClose: () => void;
};

type Listener = (request: ProfileCompletionDialogRequest | null) => void;

let listener: Listener | null = null;
let isOpen = false;

export function registerProfileCompletionDialog(next: Listener | null): void {
  listener = next;
  if (!next) {
    isOpen = false;
  }
}

export function openProfileCompletionDialog(
  request: ProfileCompletionDialogRequest,
): void {
  if (!listener || isOpen) {
    return;
  }
  isOpen = true;
  listener(request);
}

export function closeProfileCompletionDialog(): void {
  isOpen = false;
  listener?.(null);
}
