import path from "node:path";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { otpService } from "../otp/otp.service.js";
import { storageService } from "../storage/storage.service.js";
import { EmployerDocumentModel } from "./employer-document.model.js";
import { EmployerModel } from "./employer.model.js";
import type {
  CompleteCompanyProfileInput,
  CompleteIndividualIdentityInput,
  RegisterEmployerInput,
  VerifyEmployerOtpInput,
} from "./employer.types.js";

function toPublicEmployer(employer: {
  _id: mongoose.Types.ObjectId;
  accountType: string;
  companyName: string;
  firstName: string;
  lastName: string;
  industry?: string;
  businessCategory?: string;
  companyAddress?: string;
  pincode?: string;
  city?: string;
  state?: string;
  emailAddress?: string;
  whatsappNumber: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  registrationStatus: string;
  documentIds?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: employer._id.toString(),
    accountType: employer.accountType,
    companyName: employer.companyName,
    firstName: employer.firstName,
    lastName: employer.lastName,
    industry: employer.industry ?? "",
    businessCategory: employer.businessCategory ?? "",
    companyAddress: employer.companyAddress ?? "",
    pincode: employer.pincode ?? "",
    city: employer.city ?? "",
    state: employer.state ?? "",
    emailAddress: employer.emailAddress ?? "",
    whatsappNumber: employer.whatsappNumber,
    isWhatsappVerified: employer.isWhatsappVerified,
    isProfileComplete: employer.isProfileComplete,
    registrationStatus: employer.registrationStatus,
    documentIds: (employer.documentIds ?? []).map((id) => id.toString()),
    createdAt: employer.createdAt,
    updatedAt: employer.updatedAt,
  };
}

function toEmployerStorageCode(employerId: mongoose.Types.ObjectId): string {
  const numeric = Number.parseInt(employerId.toString().slice(-6), 16) % 1_000_000;
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
    default:
      return "";
  }
}

async function findEmployerOrThrow(employerId: string) {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    throw new AppError("Invalid employer id", HTTP_STATUS.BAD_REQUEST);
  }

  const employer = await EmployerModel.findById(employerId).select(
    "+otpHash +otpExpiresAt +otpAttempts",
  );

  if (!employer) {
    throw new AppError("Employer not found", HTTP_STATUS.NOT_FOUND);
  }

  return employer;
}

async function assertNoCompletedDuplicateWhatsapp(
  whatsappNumber: string,
  excludeEmployerId?: mongoose.Types.ObjectId,
) {
  const query: Record<string, unknown> = {
    whatsappNumber,
    registrationStatus: "completed",
  };

  if (excludeEmployerId) {
    query._id = { $ne: excludeEmployerId };
  }

  const existing = await EmployerModel.findOne(query).select("_id");
  if (existing) {
    throw new AppError("Duplicate WhatsApp Number", HTTP_STATUS.CONFLICT);
  }
}

async function assertNoCompletedDuplicateEmail(
  emailAddress: string | undefined,
  excludeEmployerId?: mongoose.Types.ObjectId,
) {
  const normalized = emailAddress?.trim().toLowerCase();
  if (!normalized) {
    return;
  }

  const query: Record<string, unknown> = {
    emailAddress: normalized,
    registrationStatus: "completed",
  };

  if (excludeEmployerId) {
    query._id = { $ne: excludeEmployerId };
  }

  const existing = await EmployerModel.findOne(query).select("_id");
  if (existing) {
    throw new AppError("Duplicate Email", HTTP_STATUS.CONFLICT);
  }
}

export class EmployerService {
  async registerEmployer(input: RegisterEmployerInput) {
    await assertNoCompletedDuplicateWhatsapp(input.whatsappNumber);
    await assertNoCompletedDuplicateEmail(input.emailAddress);

    const existing = await EmployerModel.findOne({
      whatsappNumber: input.whatsappNumber,
      registrationStatus: { $ne: "completed" },
    });

    const generated = await otpService.createOtp();
    const registrationStatus =
      input.accountType === "individual" ? "otp_sent" : "pending_otp";

    let employer = existing;

    try {
      if (employer) {
        employer.accountType = input.accountType;
        employer.companyName = input.companyName;
        employer.firstName = input.firstName;
        employer.lastName = input.lastName;
        employer.emailAddress = input.emailAddress ?? "";
        employer.whatsappNumber = input.whatsappNumber;
        employer.isWhatsappVerified = false;
        employer.isProfileComplete = false;
        employer.registrationStatus = registrationStatus;
        employer.otpHash = generated.otpHash;
        employer.otpExpiresAt = generated.expiresAt;
        employer.otpAttempts = 0;
        await employer.save();
      } else {
        employer = await EmployerModel.create({
          accountType: input.accountType,
          companyName: input.companyName,
          firstName: input.firstName,
          lastName: input.lastName,
          emailAddress: input.emailAddress ?? "",
          whatsappNumber: input.whatsappNumber,
          isWhatsappVerified: false,
          isProfileComplete: false,
          registrationStatus,
          otpHash: generated.otpHash,
          otpExpiresAt: generated.expiresAt,
          otpAttempts: 0,
        });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (
        error instanceof mongoose.Error.ValidationError ||
        (typeof error === "object" &&
          error !== null &&
          "name" in error &&
          error.name === "ValidationError")
      ) {
        const validationError = error as mongoose.Error.ValidationError;
        const firstMessage = Object.values(validationError.errors ?? {})[0]
          ?.message;
        throw new AppError(
          firstMessage || "Validation failed",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new AppError(
          "Duplicate WhatsApp Number",
          HTTP_STATUS.CONFLICT,
        );
      }

      console.error("Employer registration persistence failed:", error);
      throw new AppError("Database error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    await otpService.deliverOtp(
      input.whatsappNumber,
      generated.otp,
      generated.expiresAt,
    );

    return {
      employer: toPublicEmployer(employer),
      employerId: employer._id.toString(),
      otpExpiresAt: generated.expiresAt.toISOString(),
      ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
    };
  }

  async resendOtp(employerId: string) {
    const employer = await findEmployerOrThrow(employerId);

    if (employer.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number is already verified",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const generated = await otpService.createOtp();
    employer.otpHash = generated.otpHash;
    employer.otpExpiresAt = generated.expiresAt;
    employer.otpAttempts = 0;
    employer.registrationStatus =
      employer.accountType === "individual" ? "otp_sent" : "pending_otp";
    await employer.save();

    await otpService.deliverOtp(
      employer.whatsappNumber,
      generated.otp,
      generated.expiresAt,
    );

    return {
      employerId: employer._id.toString(),
      otpExpiresAt: generated.expiresAt.toISOString(),
      ...(env.NODE_ENV === "development" ? { otp: generated.otp } : {}),
    };
  }

  async verifyEmployerOtp(input: VerifyEmployerOtpInput) {
    const employer = await findEmployerOrThrow(input.employerId);

    otpService.assertCanAttempt(employer.otpAttempts ?? 0);
    otpService.assertNotExpired(employer.otpExpiresAt);

    const isValid = await otpService.verifyOtpHash(
      input.otp,
      employer.otpHash,
    );

    if (!isValid) {
      employer.otpAttempts = (employer.otpAttempts ?? 0) + 1;
      await employer.save();
      throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
    }

    employer.isWhatsappVerified = true;
    employer.otpHash = null;
    employer.otpExpiresAt = null;
    employer.otpAttempts = 0;
    employer.registrationStatus = "otp_verified";
    employer.isProfileComplete = false;

    await employer.save();

    return {
      employer: toPublicEmployer(employer),
      nextStep:
        employer.accountType === "individual"
          ? ("identity-document" as const)
          : ("company-profile" as const),
    };
  }

  async completeCompanyProfile(
    input: CompleteCompanyProfileInput,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new AppError(
        "Business verification document is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const employer = await findEmployerOrThrow(input.employerId);

    if (employer.accountType !== "company") {
      throw new AppError(
        "Company profile is only available for Company / Business accounts",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!employer.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number must be verified before completing company profile",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    await assertNoCompletedDuplicateWhatsapp(
      input.whatsappNumber,
      employer._id,
    );
    await assertNoCompletedDuplicateEmail(input.emailAddress, employer._id);

    let storedFile;
    try {
      storedFile = await storageService.upload({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        folder: "employer-documents",
        fileBaseName: input.verificationDocument,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Upload failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    let document;
    try {
      document = await EmployerDocumentModel.create({
        employerId: employer._id,
        documentType: input.verificationDocument,
        originalName: storedFile.originalName,
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

      employer.companyName = input.companyName;
      employer.industry = input.industry;
      employer.businessCategory = input.businessCategory;
      employer.companyAddress = input.companyAddress;
      employer.pincode = input.pincode;
      employer.city = input.city;
      employer.state = input.state;
      employer.emailAddress = input.emailAddress ?? employer.emailAddress;
      employer.whatsappNumber = input.whatsappNumber;
      employer.isProfileComplete = true;
      employer.registrationStatus = "completed";
      employer.documentIds = [...(employer.documentIds ?? []), document._id];
      await employer.save();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Database error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return {
      employer: toPublicEmployer(employer),
      document: {
        id: document._id.toString(),
        documentType: document.documentType,
        originalName: document.originalName,
        storageProvider: document.storageProvider,
        verificationStatus: document.verificationStatus,
        uploadedAt: document.uploadedAt,
      },
      nextStep: "post-job" as const,
    };
  }

  async completeIndividualIdentity(
    input: CompleteIndividualIdentityInput,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new AppError(
        "Identity document is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const employer = await findEmployerOrThrow(input.employerId);

    if (employer.accountType !== "individual") {
      throw new AppError(
        "Identity verification is only available for Individual accounts",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!employer.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number must be verified before uploading identity document",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (
      employer.registrationStatus !== "otp_verified" &&
      employer.registrationStatus !== "document_uploaded"
    ) {
      throw new AppError(
        "Complete WhatsApp OTP verification before uploading identity document",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const employerCode = toEmployerStorageCode(employer._id);
    const extension = resolveFileExtension(file);
    const originalName = `${input.documentType}${extension || path.extname(file.originalname)}`;

    let storedFile;
    try {
      storedFile = await storageService.upload({
        buffer: file.buffer,
        originalName,
        mimeType: file.mimetype,
        folder: `individual-documents/${employerCode}`,
        fileBaseName: input.documentType,
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Upload failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    let document;
    try {
      employer.registrationStatus = "document_uploaded";
      await employer.save();

      document = await EmployerDocumentModel.create({
        employerId: employer._id,
        documentType: input.documentType,
        originalName: storedFile.originalName,
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
      employer.registrationStatus = "completed";
      employer.isProfileComplete = true;
      await employer.save();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Database error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return {
      employer: toPublicEmployer(employer),
      document: {
        id: document._id.toString(),
        documentType: document.documentType,
        originalName: document.originalName,
        storageProvider: document.storageProvider,
        verificationStatus: document.verificationStatus,
        uploadedAt: document.uploadedAt,
      },
      nextStep: "post-job" as const,
    };
  }
}

export const employerService = new EmployerService();
