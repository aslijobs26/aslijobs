"use client";

import { SaveCandidateModal } from "@/components/employer-saved-candidates/SaveCandidateModal";
import type { SavedCandidateListItem } from "@/types/saved-candidates";

type SavedCandidateTagsModalProps = {
  item: SavedCandidateListItem;
  onClose: () => void;
};

/** Edit priority, tags, and notes for an existing saved candidate. */
export function SavedCandidateTagsModal({
  item,
  onClose,
}: SavedCandidateTagsModalProps) {
  return (
    <SaveCandidateModal
      application={{
        applicationId: item.applicationId,
        candidateName: item.candidateName,
        jobTitle: item.jobTitle,
        experience: item.candidateExperienceLabel,
        location: item.candidateLocation,
      }}
      mode="edit"
      savedCandidateId={item.id}
      initialValues={{
        priority: item.priority ?? "medium",
        tags: item.tags ?? [],
        notes: item.notes ?? "",
      }}
      onClose={onClose}
    />
  );
}
