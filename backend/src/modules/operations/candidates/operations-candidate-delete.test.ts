import assert from "node:assert/strict";
import { mock, test } from "node:test";
import mongoose from "mongoose";
import { PhoneAccountIdentityModel } from "../../accounts/phone-account-identity.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { ResumeModel } from "../../resumes/resume.model.js";
import { SavedCandidateModel } from "../../saved-candidates/saved-candidate.model.js";
import { SavedJobModel } from "../../saved-jobs/saved-job.model.js";
import { storageService } from "../../storage/storage.service.js";
import { WhatsAppNotificationDispatchModel } from "../../whatsapp/notifications/whatsapp-notification.model.js";
import { OperationsNotificationModel } from "../registration-awareness/operations-notification.model.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";
import { deleteOperationsJobSeekerAccount } from "./operations-candidate-delete.js";

function queryResult<T>(value: T) {
  const query = {
    select() {
      return query;
    },
    lean: async () => value,
  };
  return query;
}

test("deleteOperationsJobSeekerAccount removes only that seeker's records", async () => {
  const jobSeekerId = new mongoose.Types.ObjectId().toString();
  const applicationId = new mongoose.Types.ObjectId();
  const deleted: Array<{ model: string; filter: unknown }> = [];
  const forbiddenDeletes: string[] = [];

  const record =
    (model: string) =>
    async (filter: unknown) => {
      deleted.push({ model, filter });
      return { deletedCount: 1 };
    };

  mock.method(JobSeekerModel, "findById", () =>
    queryResult({
      _id: jobSeekerId,
      fullName: "Asha Rao",
      profilePhoto: {
        storagePath: "photos/seeker.jpg",
        publicId: "photo-1",
        storageProvider: "local",
      },
      uploadedResume: {
        storagePath: "resumes/seeker.pdf",
        publicId: "resume-1",
        storageProvider: "local",
      },
    }),
  );
  mock.method(ApplicationModel, "find", () =>
    queryResult([{ _id: applicationId }]),
  );
  mock.method(ResumeModel, "find", () =>
    queryResult([
      {
        pdfStoragePath: "resumes/generated.pdf",
        pdfPublicId: "pdf-1",
        pdfStorageProvider: "local",
      },
    ]),
  );
  mock.method(ApplicationModel, "deleteMany", record("applications"));
  mock.method(SavedCandidateModel, "deleteMany", record("savedCandidates"));
  mock.method(SavedJobModel, "deleteMany", record("savedJobs"));
  mock.method(ResumeModel, "deleteMany", record("resumes"));
  mock.method(NotificationModel, "deleteMany", record("notifications"));
  mock.method(
    WhatsAppNotificationDispatchModel,
    "deleteMany",
    record("dispatches"),
  );
  mock.method(OperationsWorkItemModel, "deleteMany", record("workItems"));
  mock.method(
    OperationsNotificationModel,
    "deleteMany",
    record("operationsNotifications"),
  );
  mock.method(PhoneAccountIdentityModel, "deleteMany", record("phoneIdentity"));
  mock.method(JobSeekerModel, "deleteOne", record("jobSeeker"));
  mock.method(JobModel, "deleteMany", async () => {
    forbiddenDeletes.push("jobs");
    return { deletedCount: 0 };
  });
  mock.method(EmployerModel, "deleteMany", async () => {
    forbiddenDeletes.push("employers");
    return { deletedCount: 0 };
  });
  const removedAssets: string[] = [];
  mock.method(storageService, "delete", async (asset: { storagePath: string }) => {
    removedAssets.push(asset.storagePath);
  });

  try {
    const result = await deleteOperationsJobSeekerAccount(jobSeekerId);

    assert.equal(result.jobSeekerId, jobSeekerId);
    assert.equal(result.displayName, "Asha Rao");
    assert.deepEqual(
      deleted.map((entry) => entry.model),
      [
        "applications",
        "savedCandidates",
        "savedJobs",
        "resumes",
        "notifications",
        "dispatches",
        "workItems",
        "operationsNotifications",
        "phoneIdentity",
        "jobSeeker",
      ],
    );
    assert.deepEqual(forbiddenDeletes, []);
    assert.deepEqual(removedAssets.sort(), [
      "photos/seeker.jpg",
      "resumes/generated.pdf",
      "resumes/seeker.pdf",
    ]);

    const phoneDelete = deleted.find((entry) => entry.model === "phoneIdentity");
    const phoneFilter = phoneDelete?.filter as {
      accountKind?: string;
      accountId?: { toString(): string };
    };
    assert.equal(phoneFilter.accountKind, "job_seeker");
    assert.equal(String(phoneFilter.accountId), jobSeekerId);
    const dispatchDelete = deleted.find((entry) => entry.model === "dispatches");
    assert.deepEqual(dispatchDelete?.filter, {
      entityId: { $in: [jobSeekerId, applicationId.toString()] },
    });
  } finally {
    mock.restoreAll();
  }
});

test("deleteOperationsJobSeekerAccount returns not found for a missing seeker", async () => {
  mock.method(JobSeekerModel, "findById", () => queryResult(null));
  mock.method(JobSeekerModel, "deleteOne", async () => {
    throw new Error("must not delete");
  });

  try {
    await assert.rejects(
      () => deleteOperationsJobSeekerAccount(new mongoose.Types.ObjectId().toString()),
      (error: unknown) => {
        assert.equal(
          error instanceof Error ? error.message : "",
          "Candidate not found.",
        );
        return true;
      },
    );
  } finally {
    mock.restoreAll();
  }
});

test("deleteOperationsJobSeekerAccount rejects an invalid id before any lookup", async () => {
  mock.method(JobSeekerModel, "findById", () => {
    throw new Error("must not look up");
  });

  try {
    await assert.rejects(
      () => deleteOperationsJobSeekerAccount("not-an-id"),
      (error: unknown) => {
        assert.equal(
          error instanceof Error ? error.message : "",
          "Candidate not found.",
        );
        return true;
      },
    );
  } finally {
    mock.restoreAll();
  }
});
