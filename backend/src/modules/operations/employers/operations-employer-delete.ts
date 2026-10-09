import mongoose, { type Types } from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { cascadeDeleteOwnedJobs } from "../../jobs/job-cascade-delete.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobTranslationTaskModel } from "../../jobs/job-translation-task.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { SavedCandidateModel } from "../../saved-candidates/saved-candidate.model.js";
import { storageService } from "../../storage/storage.service.js";
import type { StorageProviderName } from "../../storage/storage.types.js";
import { DepartmentModel } from "../../team/department.model.js";
import { TeamActivityModel } from "../../team/team-activity.model.js";
import { TeamInvitationModel } from "../../team/team-invitation.model.js";
import { TeamMemberModel } from "../../team/team-member.model.js";
import { TeamRoleModel } from "../../team/team-role.model.js";
import { EmployerProfileCompletionReminderModel } from "../../whatsapp/notifications/employer-profile-completion-reminder.model.js";
import { JobPostIncompleteReminderModel } from "../../whatsapp/notifications/job-post-incomplete-reminder.model.js";
import { WhatsAppNotificationDispatchModel } from "../../whatsapp/notifications/whatsapp-notification.model.js";
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
    // File cleanup must not keep the employer account in the database.
  }
}

/**
 * Permanently removes an employer account and the hiring data that belongs
 * only to that account. Job seeker accounts are not deleted.
 */
export async function deleteOperationsEmployerAccount(employerId: string): Promise<{
  employerId: string;
  displayName: string;
}> {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
  }

  const employerObjectId = new mongoose.Types.ObjectId(employerId);
  const employer = await EmployerModel.findById(employerObjectId)
    .select(
      "companyName establishmentName firstName lastName companyLogo profilePhoto companyMedia",
    )
    .lean();

  if (!employer) {
    throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
  }

  const displayName =
    employer.companyName?.trim() ||
    employer.establishmentName?.trim() ||
    [employer.firstName, employer.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";

  const jobs = await JobModel.find({
    $or: [{ employerId: employerObjectId }, { companyId: employerObjectId }],
  })
    .select("_id jobId employerId")
    .lean();

  const jobsMissingOwner = jobs.filter((job) => !job.employerId);
  if (jobsMissingOwner.length > 0) {
    await JobModel.updateMany(
      { _id: { $in: jobsMissingOwner.map((job) => job._id) } },
      { $set: { employerId: employerObjectId } },
    );
  }

  const jobObjectIds = jobs.map((job) => job._id);
  const jobIdStrings = jobObjectIds.map((id) => id.toString());
  const publicJobIds = jobs
    .map((job) => String(job.jobId ?? "").trim().toUpperCase())
    .filter(Boolean);

  const applications = await ApplicationModel.find({
    $or: [
      { employerId: employerObjectId },
      ...(jobObjectIds.length > 0 ? [{ jobId: { $in: jobObjectIds } }] : []),
    ],
  })
    .select("_id")
    .lean();
  const applicationIds = applications.map((application) =>
    application._id.toString(),
  );

  if (jobObjectIds.length > 0) {
    await cascadeDeleteOwnedJobs({
      employerId,
      jobObjectIds,
    });
  }

  await Promise.all([
    ApplicationModel.deleteMany({ employerId: employerObjectId }),
    SavedCandidateModel.deleteMany({ employerId: employerObjectId }),
    jobObjectIds.length > 0
      ? JobTranslationTaskModel.deleteMany({ jobMongoId: { $in: jobObjectIds } })
      : Promise.resolve(),
    JobPostIncompleteReminderModel.deleteMany({
      $or: [
        { employerId },
        ...(jobIdStrings.length > 0
          ? [{ jobMongoId: { $in: jobIdStrings } }]
          : []),
      ],
    }),
    EmployerProfileCompletionReminderModel.deleteMany({ employerId }),
    NotificationModel.deleteMany({
      $or: notificationClauses({
        employerObjectId,
        employerId,
        jobObjectIds,
        jobIdStrings,
        publicJobIds,
        applicationIds,
      }),
    }),
    OperationsWorkItemModel.deleteMany({
      $or: workItemClauses({
        employerId,
        publicJobIds,
        applicationIds,
      }),
    }),
    TeamMemberModel.deleteMany({ employerId: employerObjectId }),
    TeamInvitationModel.deleteMany({ employerId: employerObjectId }),
    TeamRoleModel.deleteMany({ employerId: employerObjectId }),
    DepartmentModel.deleteMany({ employerId: employerObjectId }),
    TeamActivityModel.deleteMany({ employerId: employerObjectId }),
    WhatsAppNotificationDispatchModel.deleteMany({
      entityId: { $in: [employerId, ...jobIdStrings] },
    }),
  ]);

  const documents = await EmployerDocumentModel.find({
    employerId: employerObjectId,
  })
    .select("storagePath publicId storageProvider")
    .lean();

  await Promise.all([
    ...documents.map((document) => deleteStoredAsset(document)),
    deleteStoredAsset(employer.companyLogo),
    deleteStoredAsset(employer.profilePhoto),
    ...(employer.companyMedia ?? []).map((asset) => deleteStoredAsset(asset)),
  ]);
  await EmployerDocumentModel.deleteMany({ employerId: employerObjectId });

  const removed = await EmployerModel.deleteOne({ _id: employerObjectId });
  if ((removed.deletedCount ?? 0) === 0) {
    throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
  }

  return { employerId, displayName };
}

function notificationClauses(input: {
  employerObjectId: Types.ObjectId;
  employerId: string;
  jobObjectIds: Types.ObjectId[];
  jobIdStrings: string[];
  publicJobIds: string[];
  applicationIds: string[];
}): Record<string, unknown>[] {
  const clauses: Record<string, unknown>[] = [
    { recipientType: "employer", recipientId: input.employerObjectId },
    { referenceType: "employer", referenceId: input.employerId },
  ];

  if (input.applicationIds.length > 0) {
    clauses.push({
      referenceType: "application",
      referenceId: { $in: input.applicationIds },
    });
  }

  const jobReferences = [
    ...input.jobIdStrings,
    ...input.publicJobIds,
    ...input.publicJobIds.map((id) => id.toLowerCase()),
  ];
  if (jobReferences.length > 0) {
    clauses.push({
      referenceType: "job",
      referenceId: { $in: jobReferences },
    });
  }
  if (input.jobObjectIds.length > 0) {
    clauses.push({
      referenceType: "job",
      referenceId: { $in: input.jobObjectIds },
    });
  }

  return clauses;
}

function workItemClauses(input: {
  employerId: string;
  publicJobIds: string[];
  applicationIds: string[];
}): Record<string, unknown>[] {
  const clauses: Record<string, unknown>[] = [
    { relatedEntityType: "employer", relatedEntityId: input.employerId },
    { relatedEntityType: "verification", relatedEntityId: input.employerId },
  ];

  if (input.publicJobIds.length > 0) {
    clauses.push({
      relatedEntityType: "job",
      relatedEntityId: { $in: input.publicJobIds },
    });
  }

  if (input.applicationIds.length > 0) {
    clauses.push({
      relatedEntityType: "application",
      relatedEntityId: { $in: input.applicationIds },
    });
    clauses.push({
      relatedEntityType: "placement",
      relatedEntityId: { $in: input.applicationIds },
    });
  }

  return clauses;
}
