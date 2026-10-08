import path from "node:path";
import mongoose from "mongoose";
import { EMPLOYER_DOCUMENT_TYPES } from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { STORAGE_FOLDERS } from "../storage/storage.constants.js";
import { storageService } from "../storage/storage.service.js";
import { scheduleEmployerVerificationWork } from "../operations/work/operations-work-emit.js";
import { openEmployerDocumentFile } from "./employer-document.file.js";
import { formatEmployerDocumentTypeLabel } from "./employer-document.labels.js";
import { EmployerDocumentModel } from "./employer-document.model.js";
import { assertEmployerDocumentTypeForAccount } from "./employer-document.policy.js";
import { documentUploadLeavesEmployerRejected } from "./employer-verification-resubmit.policy.js";
import { EmployerModel } from "./employer.model.js";
import type { EmployerAccountType } from "./employer.types.js";

export type EmployerVerificationDocumentPublic = {
  id: string;
  documentType: string;
  documentTypeLabel: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: string;
  uploadedAt: string;
};

function toEmployerStorageCode(employerId: mongoose.Types.ObjectId): string {
  const numeric =
    Number.parseInt(employerId.toString().slice(-6), 16) % 1_000_000;
  return `EMP${String(numeric).padStart(6, "0")}`;
}

function resolveFileExtension(file: Express.Multer.File): string {
  const fromName = path.extname(file.originalname).toLowerCase();
  if (fromName) {
    return fromName;
  }

  switch (file.mimetype) {
    case "application/pdf":
      return ".pdf";
    case "image/png":
      return ".png";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

function documentFolder(
  accountType: EmployerAccountType,
  employerId: mongoose.Types.ObjectId,
): string {
  if (accountType === "individual") {
    return `${STORAGE_FOLDERS.INDIVIDUAL_DOCUMENTS}/${toEmployerStorageCode(employerId)}`;
  }
  return STORAGE_FOLDERS.EMPLOYER_DOCUMENTS;
}

function toPublicDocument(doc: {
  _id: mongoose.Types.ObjectId;
  documentType?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  verificationStatus?: string;
  uploadedAt?: Date;
}): EmployerVerificationDocumentPublic {
  const uploadedAt =
    doc.uploadedAt instanceof Date && !Number.isNaN(doc.uploadedAt.getTime())
      ? doc.uploadedAt.toISOString()
      : new Date().toISOString();

  return {
    id: doc._id.toString(),
    documentType: String(doc.documentType ?? "").trim(),
    documentTypeLabel: formatEmployerDocumentTypeLabel(
      String(doc.documentType ?? "").trim(),
    ),
    originalName: String(doc.originalName ?? "").trim() || "Document",
    mimeType: String(doc.mimeType ?? "").trim(),
    fileSize: typeof doc.fileSize === "number" ? doc.fileSize : 0,
    verificationStatus: String(doc.verificationStatus ?? "pending").trim() || "pending",
    uploadedAt,
  };
}

async function requireEmployer(employerId: string) {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const employer = await EmployerModel.findById(employerId);
  if (!employer) {
    throw new AppError("Employer not found", HTTP_STATUS.NOT_FOUND);
  }

  return employer;
}

function requireUploadedFile(file: Express.Multer.File | undefined) {
  if (!file) {
    throw new AppError("Document file is required", HTTP_STATUS.BAD_REQUEST, {
      fieldErrors: { document: "Upload a PDF, PNG, JPG, or WEBP file." },
    });
  }
  return file;
}

async function queueVerificationReview(employer: {
  _id: mongoose.Types.ObjectId;
  companyName?: string | null;
  establishmentName?: string | null;
  city?: string | null;
  state?: string | null;
  verificationStatus?: string | null;
  verificationSubmittedAt?: Date | null;
}): Promise<void> {
  if (documentUploadLeavesEmployerRejected(employer.verificationStatus)) {
    return;
  }

  const current = String(employer.verificationStatus ?? "pending").toLowerCase();
  const kind = current === "pending" ? "submitted" : "resubmitted";

  employer.verificationStatus = "pending";
  employer.verificationSubmittedAt = new Date();

  scheduleEmployerVerificationWork({
    employerId: employer._id.toString(),
    companyName:
      employer.companyName?.trim() ||
      employer.establishmentName?.trim() ||
      "Employer",
    locationLabel: [employer.city, employer.state].filter(Boolean).join(", "),
    submittedAt: employer.verificationSubmittedAt,
    kind,
  });
}

export const employerDocumentsService = {
  async list(employerId: string): Promise<EmployerVerificationDocumentPublic[]> {
    const employer = await requireEmployer(employerId);
    const documents = await EmployerDocumentModel.find({
      employerId: employer._id,
    })
      .sort({ uploadedAt: -1 })
      .lean();

    return documents.map((doc) => toPublicDocument(doc));
  },

  open(employerId: string, documentId: string) {
    return openEmployerDocumentFile({ employerId, documentId });
  },

  async upload(
    employerId: string,
    documentType: string,
    file: Express.Multer.File | undefined,
  ): Promise<EmployerVerificationDocumentPublic> {
    const employer = await requireEmployer(employerId);
    const accountType = employer.accountType as EmployerAccountType;
    const uploaded = requireUploadedFile(file);
    const nextType = documentType.trim();
    assertEmployerDocumentTypeForAccount(accountType, nextType);

    const storedFile = await storageService.upload({
      buffer: uploaded.buffer,
      originalName: uploaded.originalname,
      mimeType: uploaded.mimetype,
      folder: documentFolder(accountType, employer._id),
      fileBaseName: nextType,
    });

    const document = await EmployerDocumentModel.create({
      employerId: employer._id,
      documentType: nextType as (typeof EMPLOYER_DOCUMENT_TYPES)[number],
      originalName:
        uploaded.originalname.trim() ||
        `${nextType}${resolveFileExtension(uploaded) || path.extname(uploaded.originalname)}`,
      storedName: storedFile.storedName,
      storageProvider: storedFile.storageProvider,
      storagePath: storedFile.storagePath,
      publicId: storedFile.publicId ?? "",
      url: storedFile.url ?? "",
      folder: storedFile.folder ?? "",
      bucketName: storedFile.bucketName ?? "",
      mimeType: storedFile.mimeType,
      fileSize: storedFile.fileSize,
      verificationStatus: "pending",
      uploadedAt: new Date(),
    });

    employer.documentIds = [...(employer.documentIds ?? []), document._id];
    await queueVerificationReview(employer);
    await employer.save();

    return toPublicDocument(document);
  },

  async reupload(
    employerId: string,
    documentId: string,
    documentType: string | undefined,
    file: Express.Multer.File | undefined,
  ): Promise<EmployerVerificationDocumentPublic> {
    const employer = await requireEmployer(employerId);
    const uploaded = requireUploadedFile(file);

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
    }

    const document = await EmployerDocumentModel.findOne({
      _id: new mongoose.Types.ObjectId(documentId),
      employerId: employer._id,
    });

    if (!document) {
      throw new AppError("Document not found.", HTTP_STATUS.NOT_FOUND);
    }

    const accountType = employer.accountType as EmployerAccountType;
    const nextType = (documentType?.trim() || document.documentType).trim();
    assertEmployerDocumentTypeForAccount(accountType, nextType);

    const storedFile = await storageService.replace({
      previous: {
        storagePath: document.storagePath,
        storageProvider: document.storageProvider as "local" | "cloudinary",
        publicId: document.publicId || undefined,
        mimeType: document.mimeType,
      },
      upload: {
        buffer: uploaded.buffer,
        originalName: uploaded.originalname,
        mimeType: uploaded.mimetype,
        folder: document.folder || documentFolder(accountType, employer._id),
        fileBaseName: nextType,
      },
    });

    document.documentType = nextType as (typeof EMPLOYER_DOCUMENT_TYPES)[number];
    document.originalName =
      uploaded.originalname.trim() ||
      `${nextType}${resolveFileExtension(uploaded) || path.extname(uploaded.originalname)}`;
    document.storedName = storedFile.storedName;
    document.storageProvider = storedFile.storageProvider;
    document.storagePath = storedFile.storagePath;
    document.publicId = storedFile.publicId ?? "";
    document.url = storedFile.url ?? "";
    document.folder = storedFile.folder ?? document.folder;
    document.bucketName = storedFile.bucketName ?? "";
    document.mimeType = storedFile.mimeType;
    document.fileSize = storedFile.fileSize;
    document.verificationStatus = "pending";
    document.uploadedAt = new Date();
    await document.save();

    await queueVerificationReview(employer);
    await employer.save();

    return toPublicDocument(document);
  },
};
