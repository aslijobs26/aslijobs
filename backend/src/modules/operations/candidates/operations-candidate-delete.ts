import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { PhoneAccountIdentityModel } from "../../accounts/phone-account-identity.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { ResumeModel } from "../../resumes/resume.model.js";
import { SavedCandidateModel } from "../../saved-candidates/saved-candidate.model.js";
import { SavedJobModel } from "../../saved-jobs/saved-job.model.js";
import { storageService } from "../../storage/storage.service.js";
import type { StorageProviderName } from "../../storage/storage.types.js";
import { WhatsAppNotificationDispatchModel } from "../../whatsapp/notifications/whatsapp-notification.model.js";
import { OperationsNotificationModel } from "../registration-awareness/operations-notification.model.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";

type StoredAsset = {
  storagePath?: string | null;
  publicId?: string | null;
  storageProvider?: string | null;
};

function storedProvider(value: string | null | undefined): StorageProviderName | null {
  if (value === "cloudinary" || value === "local") {
    return value;
  }
  return null;
}

async function deleteStoredAsset(asset: StoredAsset | null | undefined): Promise<void> {
  const storagePath = asset?.storagePath?.trim() ?? "";
  const storageProvider = storedProvider(asset?.storageProvider);
  if (!storagePath || !storageProvider) {
    return;
  }

  try {
    await storageService.delete({
      storagePath,
      storageProvider,
      publicId: asset?.publicId?.trim() || undefined,
    });
  } catch {
    // File cleanup must not keep the job seeker account in the database.
  }
}

/**
 * Permanently removes one job seeker account and the records that belong
 * only to that account. Employer accounts and job posts are not deleted.
 */
export async function deleteOperationsJobSeekerAccount(
  jobSeekerId: string,
): Promise<{
  jobSeekerId: string;
  displayName: string;
}> {
  if (!mongoose.Types.ObjectId.isValid(jobSeekerId)) {
    throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
  }

  const seekerObjectId = new mongoose.Types.ObjectId(jobSeekerId);
  const jobSeeker = await JobSeekerModel.findById(seekerObjectId)
    .select("fullName profilePhoto uploadedResume")
    .lean();

  if (!jobSeeker) {
    throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
  }

  const displayName = jobSeeker.fullName?.trim() || "Candidate";

  const [applications, resumes] = await Promise.all([
    ApplicationModel.find({ jobSeekerId: seekerObjectId }).select("_id").lean(),
    ResumeModel.find({ jobSeekerId: seekerObjectId })
      .select("pdfStoragePath pdfPublicId pdfStorageProvider")
      .lean(),
  ]);

  const applicationIds = applications.map((application) =>
    application._id.toString(),
  );
  const dispatchEntityIds = [jobSeekerId, ...applicationIds];

  const notificationClauses: Record<string, unknown>[] = [
    { recipientType: "job_seeker", recipientId: seekerObjectId },
  ];
  if (applicationIds.length > 0) {
    notificationClauses.push({
      referenceType: "application",
      referenceId: { $in: applicationIds },
    });
  }

  const workItemClauses: Record<string, unknown>[] = [
    { relatedEntityType: "candidate", relatedEntityId: jobSeekerId },
  ];
  if (applicationIds.length > 0) {
    workItemClauses.push(
      {
        relatedEntityType: "application",
        relatedEntityId: { $in: applicationIds },
      },
      {
        relatedEntityType: "placement",
        relatedEntityId: { $in: applicationIds },
      },
    );
  }

  await Promise.all([
    ApplicationModel.deleteMany({ jobSeekerId: seekerObjectId }),
    SavedCandidateModel.deleteMany({ jobSeekerId: seekerObjectId }),
    SavedJobModel.deleteMany({ jobSeekerId: seekerObjectId }),
    ResumeModel.deleteMany({ jobSeekerId: seekerObjectId }),
    NotificationModel.deleteMany({ $or: notificationClauses }),
    WhatsAppNotificationDispatchModel.deleteMany({
      entityId: { $in: dispatchEntityIds },
    }),
    OperationsWorkItemModel.deleteMany({ $or: workItemClauses }),
    OperationsNotificationModel.deleteMany({
      entityType: "candidate",
      entityId: jobSeekerId,
    }),
    PhoneAccountIdentityModel.deleteMany({
      accountKind: "job_seeker",
      accountId: seekerObjectId,
    }),
  ]);

  await Promise.all([
    deleteStoredAsset(jobSeeker.profilePhoto),
    deleteStoredAsset(jobSeeker.uploadedResume),
    ...resumes.map((resume) =>
      deleteStoredAsset({
        storagePath: resume.pdfStoragePath,
        publicId: resume.pdfPublicId,
        storageProvider: resume.pdfStorageProvider,
      }),
    ),
  ]);

  const removed = await JobSeekerModel.deleteOne({ _id: seekerObjectId });
  if ((removed.deletedCount ?? 0) === 0) {
    throw new AppError("Candidate not found.", HTTP_STATUS.NOT_FOUND);
  }

  return { jobSeekerId, displayName };
}
