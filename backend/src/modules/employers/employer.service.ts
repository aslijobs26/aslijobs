import path from "node:path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  EMPLOYER_COMPANY_MEDIA_MAX_COUNT,
  EMPLOYER_IMAGE_MIME_TYPES,
  isBusinessEmployerAccountType,
} from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { jwtService } from "../auth/jwt.service.js";
import { otpService } from "../otp/otp.service.js";
import { storageService } from "../storage/storage.service.js";
import { EmployerDocumentModel } from "./employer-document.model.js";
import { EmployerModel } from "./employer.model.js";
import type {
  CompleteCompanyProfileInput,
  CompleteIndividualIdentityInput,
  EmployerAccountType,
  RegisterEmployerInput,
  UpdateEmployerProfileInput,
  VerifyEmployerOtpInput,
} from "./employer.types.js";

type EmployerImageAsset = {
  url?: string;
  storagePath?: string;
  publicId?: string;
  storageProvider?: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  updatedAt?: Date | string | null;
};

function toPublicImageUpdatedAt(
  value: Date | string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toPublicImageAsset(asset?: EmployerImageAsset | null) {
  if (!asset?.url && !asset?.storagePath) {
    return null;
  }

  return {
    url: asset.url ?? "",
    storagePath: asset.storagePath ?? "",
    publicId: asset.publicId ?? "",
    storageProvider: asset.storageProvider ?? "",
    originalName: asset.originalName ?? "",
    mimeType: asset.mimeType ?? "",
    fileSize: asset.fileSize ?? 0,
    updatedAt: toPublicImageUpdatedAt(asset.updatedAt),
  };
}

function toPublicEmployer(employer: {
  _id: mongoose.Types.ObjectId;
  accountType: string;
  companyName: string;
  establishmentName?: string;
  firstName: string;
  lastName: string;
  industry?: string;
  businessCategory?: string;
  companyDescription?: string;
  website?: string;
  foundedYear?: number | null;
  companyType?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  roles?: string;
  minimumEmployees?: number | null;
  maximumEmployees?: number | null;
  companyLogo?: EmployerImageAsset | null;
  profilePhoto?: EmployerImageAsset | null;
  companyMedia?: EmployerImageAsset[];
  aboutUs?: string;
  culture?: string;
  benefits?: string;
  vision?: string;
  mission?: string;
  values?: string;
  companyAddress?: string;
  pincode?: string;
  city?: string;
  state?: string;
  emailAddress?: string;
  contactDesignation?: string;
  alternatePhone?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  } | null;
  profileViews?: number;
  whatsappNumber: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  companyProfileVisited?: boolean;
  registrationStatus: string;
  documentIds?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: employer._id.toString(),
    accountType: employer.accountType,
    companyName: employer.companyName,
    establishmentName: employer.establishmentName ?? "",
    firstName: employer.firstName,
    lastName: employer.lastName,
    industry: employer.industry ?? "",
    businessCategory: employer.businessCategory ?? "",
    companyDescription: employer.companyDescription ?? "",
    website: employer.website ?? "",
    foundedYear: employer.foundedYear ?? null,
    companyType: employer.companyType ?? "",
    gstNumber: employer.gstNumber ?? "",
    panNumber: employer.panNumber ?? "",
    registrationNumber: employer.registrationNumber ?? "",
    roles: employer.roles ?? "",
    minimumEmployees: employer.minimumEmployees ?? null,
    maximumEmployees: employer.maximumEmployees ?? null,
    companyLogo: toPublicImageAsset(employer.companyLogo),
    profilePhoto: toPublicImageAsset(employer.profilePhoto),
    companyMedia: (employer.companyMedia ?? [])
      .map((asset) => toPublicImageAsset(asset))
      .filter((asset) => asset !== null),
    companyMediaLimit: EMPLOYER_COMPANY_MEDIA_MAX_COUNT,
    aboutUs: employer.aboutUs ?? "",
    culture: employer.culture ?? "",
    benefits: employer.benefits ?? "",
    vision: employer.vision ?? "",
    mission: employer.mission ?? "",
    values: employer.values ?? "",
    companyAddress: employer.companyAddress ?? "",
    pincode: employer.pincode ?? "",
    city: employer.city ?? "",
    state: employer.state ?? "",
    emailAddress: employer.emailAddress ?? "",
    contactDesignation: employer.contactDesignation ?? "",
    alternatePhone: employer.alternatePhone ?? "",
    socialLinks: {
      linkedin: employer.socialLinks?.linkedin ?? "",
      facebook: employer.socialLinks?.facebook ?? "",
      instagram: employer.socialLinks?.instagram ?? "",
      twitter: employer.socialLinks?.twitter ?? "",
      youtube: employer.socialLinks?.youtube ?? "",
    },
    profileViews: employer.profileViews ?? 0,
    whatsappNumber: employer.whatsappNumber,
    isWhatsappVerified: employer.isWhatsappVerified,
    isProfileComplete: employer.isProfileComplete,
    companyProfileVisited: employer.companyProfileVisited ?? false,
    registrationStatus: employer.registrationStatus,
    documentIds: (employer.documentIds ?? []).map((id) => id.toString()),
    createdAt: employer.createdAt,
    updatedAt: employer.updatedAt,
  };
}

function assertImageFile(file: Express.Multer.File, label: string) {
  if (
    !(EMPLOYER_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)
  ) {
    throw new AppError(
      `${label} must be a PNG, JPG, JPEG, or WEBP image`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

async function uploadEmployerImageAsset(input: {
  file: Express.Multer.File;
  folder: string;
  fileBaseName: string;
  label: string;
}) {
  assertImageFile(input.file, input.label);

  try {
    const storedFile = await storageService.upload({
      buffer: input.file.buffer,
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
      folder: input.folder,
      fileBaseName: input.fileBaseName,
    });

    return {
      url: storedFile.url ?? "",
      storagePath: storedFile.storagePath,
      publicId: storedFile.publicId ?? "",
      storageProvider: storedFile.storageProvider,
      originalName: storedFile.originalName,
      mimeType: storedFile.mimeType,
      fileSize: storedFile.fileSize,
      updatedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Upload failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

async function deleteEmployerImageAsset(asset?: EmployerImageAsset | null) {
  if (!asset?.storagePath) {
    return;
  }

  const provider =
    asset.storageProvider === "cloudinary" ? "cloudinary" : "local";

  try {
    await storageService.delete({
      storagePath: asset.storagePath,
      publicId: asset.publicId || undefined,
      storageProvider: provider,
    });
  } catch {
    // Best-effort cleanup; profile update should still succeed.
  }
}

function emptyImageAsset() {
  return {
    url: "",
    storagePath: "",
    publicId: "",
    storageProvider: "",
    originalName: "",
    mimeType: "",
    fileSize: 0,
    updatedAt: null as Date | null,
  };
}

function parseProfileAssetKeys(value: string | undefined, label: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !Array.isArray(parsed) ||
      !parsed.every((entry) => typeof entry === "string")
    ) {
      throw new Error("Invalid list");
    }
    return [...new Set(parsed.map((entry) => entry.trim()).filter(Boolean))];
  } catch {
    throw new AppError(`${label} is invalid`, HTTP_STATUS.BAD_REQUEST);
  }
}

function getImageAssetKey(asset: EmployerImageAsset): string {
  return asset.publicId?.trim() || asset.storagePath?.trim() || "";
}

async function issueEmployerRegistrationSession(employer: {
  _id: mongoose.Types.ObjectId;
  accountType: string;
  whatsappNumber: string;
  refreshTokenHash?: string | null;
  refreshTokenExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  save: () => Promise<unknown>;
}) {
  const tokens = jwtService.issueEmployerTokens({
    sub: employer._id.toString(),
    accountType: employer.accountType as EmployerAccountType,
    whatsappNumber: employer.whatsappNumber,
  });

  employer.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
  employer.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
  employer.lastLoginAt = new Date();
  await employer.save();

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
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
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

async function findEmployerOrThrow(employerId: string) {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    throw new AppError("Invalid employer id", HTTP_STATUS.BAD_REQUEST);
  }

  const employer = await EmployerModel.findById(employerId).select(
    "+otpHash +otpExpiresAt +otpAttempts +lastOtpSentAt",
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
    }).select("+otpHash +otpExpiresAt +otpAttempts +lastOtpSentAt");

    const registrationStatus =
      input.accountType === "individual" ? "otp_sent" : "pending_otp";

    let employer = existing;

    try {
      if (employer) {
        employer.accountType = input.accountType;
        employer.companyName = input.companyName;
        employer.establishmentName =
          input.accountType === "individual"
            ? (input.establishmentName ?? "").trim()
            : "";
        employer.firstName = input.firstName;
        employer.lastName = input.lastName;
        employer.emailAddress = input.emailAddress ?? "";
        employer.whatsappNumber = input.whatsappNumber;
        employer.isWhatsappVerified = false;
        employer.isProfileComplete = false;
        employer.registrationStatus = registrationStatus;
        await employer.save();
      } else {
        employer = await EmployerModel.create({
          accountType: input.accountType,
          companyName: input.companyName,
          establishmentName:
            input.accountType === "individual"
              ? (input.establishmentName ?? "").trim()
              : "",
          firstName: input.firstName,
          lastName: input.lastName,
          emailAddress: input.emailAddress ?? "",
          whatsappNumber: input.whatsappNumber,
          isWhatsappVerified: false,
          isProfileComplete: false,
          registrationStatus,
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

    const delivery = await otpService.issueAndDeliver(
      employer,
      input.whatsappNumber,
      { purpose: "registration" },
    );

    return {
      employer: toPublicEmployer(employer),
      employerId: employer._id.toString(),
      ...delivery,
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

    employer.registrationStatus =
      employer.accountType === "individual" ? "otp_sent" : "pending_otp";
    await employer.save();

    const delivery = await otpService.issueAndDeliver(
      employer,
      employer.whatsappNumber,
      { purpose: "registration" },
    );

    return {
      employerId: employer._id.toString(),
      ...delivery,
    };
  }

  async verifyEmployerOtp(input: VerifyEmployerOtpInput) {
    const employer = await findEmployerOrThrow(input.employerId);
    const acceptedViaTestOtp = otpService.matchesTestOtp(input.otp);

    // Test OTP bypasses delivery/expiry only — registration flow continues unchanged.
    if (!acceptedViaTestOtp) {
      if ((employer.otpAttempts ?? 0) >= otpService.maxAttempts) {
        otpService.logVerificationFailure("MAX_ATTEMPTS");
      } else if (
        !employer.otpExpiresAt ||
        employer.otpExpiresAt.getTime() < Date.now()
      ) {
        otpService.logVerificationFailure("EXPIRED");
      }

      otpService.assertCanAttempt(employer.otpAttempts ?? 0);
      otpService.assertNotExpired(employer.otpExpiresAt);
    }

    const isValid = await otpService.verifyOtpHash(
      input.otp,
      employer.otpHash,
    );

    if (!isValid) {
      employer.otpAttempts = (employer.otpAttempts ?? 0) + 1;
      await employer.save();
      otpService.logVerificationFailure("INVALID_OTP");
      throw new AppError("Invalid OTP", HTTP_STATUS.BAD_REQUEST);
    }

    otpService.logVerificationSuccess();

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
    files: {
      document?: Express.Multer.File;
      companyLogo?: Express.Multer.File;
    },
  ) {
    const file = files.document;

    if (!file) {
      throw new AppError(
        "Business verification document is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const employer = await findEmployerOrThrow(input.employerId);

    if (!isBusinessEmployerAccountType(employer.accountType as EmployerAccountType)) {
      throw new AppError(
        "Business profile is only available for Company / Business and Consultancy accounts",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (!employer.isWhatsappVerified) {
      throw new AppError(
        "WhatsApp number must be verified before completing business profile",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (employer.accountType === "consultancy" && !files.companyLogo) {
      throw new AppError(
        "Company logo is required",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (employer.accountType === "company") {
      if (!input.industry?.trim()) {
        throw new AppError("Industry is required", HTTP_STATUS.BAD_REQUEST);
      }

      if (!input.businessCategory?.trim()) {
        throw new AppError(
          "Business category is required",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (
        typeof input.minimumEmployees !== "number" ||
        typeof input.maximumEmployees !== "number"
      ) {
        throw new AppError(
          "Company strength is required",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }

    await assertNoCompletedDuplicateWhatsapp(
      employer.whatsappNumber,
      employer._id,
    );
    await assertNoCompletedDuplicateEmail(employer.emailAddress, employer._id);

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

    let companyLogoAsset = null;
    if (files.companyLogo) {
      companyLogoAsset = await uploadEmployerImageAsset({
        file: files.companyLogo,
        folder: "employer-logos",
        fileBaseName:
          employer.accountType === "consultancy"
            ? "consultancy-logo"
            : "company-logo",
        label:
          employer.accountType === "consultancy"
            ? "Consultancy logo"
            : "Company logo",
      });
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
      employer.industry = input.industry?.trim() ?? "";
      employer.businessCategory = input.businessCategory?.trim() ?? "";
      employer.roles = "";
      employer.minimumEmployees =
        typeof input.minimumEmployees === "number"
          ? input.minimumEmployees
          : null;
      employer.maximumEmployees =
        typeof input.maximumEmployees === "number"
          ? input.maximumEmployees
          : null;
      employer.companyAddress = input.companyAddress;
      employer.pincode = input.pincode;
      employer.city = input.city;
      employer.state = input.state;
      if (companyLogoAsset) {
        employer.companyLogo = companyLogoAsset;
      }
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

    const session = await issueEmployerRegistrationSession(employer);

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
      ...session,
      nextStep: "dashboard" as const,
    };
  }

  async completeIndividualIdentity(
    input: CompleteIndividualIdentityInput,
    files: {
      document?: Express.Multer.File;
      profilePhoto?: Express.Multer.File;
    },
  ) {
    const file = files.document;

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

    let profilePhotoAsset = null;
    if (files.profilePhoto) {
      profilePhotoAsset = await uploadEmployerImageAsset({
        file: files.profilePhoto,
        folder: `employer-profile-photos/${employerCode}`,
        fileBaseName: "profile-photo",
        label: "Profile photo",
      });
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
      if (profilePhotoAsset) {
        employer.profilePhoto = profilePhotoAsset;
      }
      employer.registrationStatus = "completed";
      employer.isProfileComplete = true;
      await employer.save();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Database error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const session = await issueEmployerRegistrationSession(employer);

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
      ...session,
      nextStep: "dashboard" as const,
    };
  }

  async updateEmployerProfile(
    input: UpdateEmployerProfileInput,
    files: {
      companyLogo?: Express.Multer.File;
      profilePhoto?: Express.Multer.File;
      companyMedia?: Express.Multer.File[];
    } = {},
  ) {
    const employer = await findEmployerOrThrow(input.employerId);

    if (typeof input.companyName === "string") {
      employer.companyName = input.companyName;
    }
    if (typeof input.establishmentName === "string") {
      employer.establishmentName = input.establishmentName;
    }
    if (typeof input.industry === "string") {
      employer.industry = input.industry;
    }
    if (typeof input.businessCategory === "string") {
      employer.businessCategory = input.businessCategory;
    }
    if (typeof input.companyDescription === "string") {
      employer.companyDescription = input.companyDescription;
    }
    if (typeof input.website === "string") {
      employer.website = input.website;
    }
    if (typeof input.foundedYear === "number" || input.foundedYear === null) {
      employer.foundedYear = input.foundedYear;
    }
    if (typeof input.companyType === "string") {
      employer.companyType = input.companyType;
    }
    if (typeof input.gstNumber === "string") {
      employer.gstNumber = input.gstNumber;
    }
    if (typeof input.panNumber === "string") {
      employer.panNumber = input.panNumber;
    }
    if (typeof input.registrationNumber === "string") {
      employer.registrationNumber = input.registrationNumber;
    }
    if (typeof input.minimumEmployees === "number") {
      employer.minimumEmployees = input.minimumEmployees;
    }
    if (typeof input.maximumEmployees === "number") {
      employer.maximumEmployees = input.maximumEmployees;
    }
    if (typeof input.companyAddress === "string") {
      employer.companyAddress = input.companyAddress;
    }
    if (typeof input.pincode === "string") {
      employer.pincode = input.pincode;
    }
    if (typeof input.city === "string") {
      employer.city = input.city;
    }
    if (typeof input.state === "string") {
      employer.state = input.state;
    }
    if (typeof input.emailAddress === "string") {
      employer.emailAddress = input.emailAddress;
    }
    if (typeof input.firstName === "string") {
      employer.firstName = input.firstName;
    }
    if (typeof input.lastName === "string") {
      employer.lastName = input.lastName;
    }
    if (typeof input.contactDesignation === "string") {
      employer.contactDesignation = input.contactDesignation;
    }
    if (typeof input.alternatePhone === "string") {
      employer.alternatePhone = input.alternatePhone;
    }
    if (typeof input.aboutUs === "string") {
      employer.aboutUs = input.aboutUs;
    }
    if (typeof input.culture === "string") {
      employer.culture = input.culture;
    }
    if (typeof input.benefits === "string") {
      employer.benefits = input.benefits;
    }
    if (typeof input.vision === "string") {
      employer.vision = input.vision;
    }
    if (typeof input.mission === "string") {
      employer.mission = input.mission;
    }
    if (typeof input.values === "string") {
      employer.values = input.values;
    }
    if (input.companyProfileVisited === true) {
      employer.companyProfileVisited = true;
    }

    const socialLinkUpdates = {
      linkedin: input.linkedinUrl,
      facebook: input.facebookUrl,
      instagram: input.instagramUrl,
      twitter: input.twitterUrl,
      youtube: input.youtubeUrl,
    };
    for (const [key, value] of Object.entries(socialLinkUpdates)) {
      if (typeof value === "string") {
        employer.set(`socialLinks.${key}`, value);
      }
    }

    if (input.removeCompanyLogo) {
      await deleteEmployerImageAsset(employer.companyLogo);
      employer.companyLogo = emptyImageAsset();
    }

    if (input.removeProfilePhoto) {
      await deleteEmployerImageAsset(employer.profilePhoto);
      employer.profilePhoto = emptyImageAsset();
    }

    if (files.companyLogo) {
      if (
        !isBusinessEmployerAccountType(
          employer.accountType as EmployerAccountType,
        )
      ) {
        throw new AppError(
          "Logo upload is only available for Company / Business and Consultancy accounts",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
      await deleteEmployerImageAsset(employer.companyLogo);
      employer.companyLogo = await uploadEmployerImageAsset({
        file: files.companyLogo,
        folder: "employer-logos",
        fileBaseName:
          employer.accountType === "consultancy"
            ? "consultancy-logo"
            : "company-logo",
        label:
          employer.accountType === "consultancy"
            ? "Consultancy logo"
            : "Company logo",
      });
      employer.markModified("companyLogo");
    }

    if (files.profilePhoto) {
      const employerCode = toEmployerStorageCode(employer._id);
      await deleteEmployerImageAsset(employer.profilePhoto);
      employer.profilePhoto = await uploadEmployerImageAsset({
        file: files.profilePhoto,
        folder: `employer-profile-photos/${employerCode}`,
        fileBaseName: "profile-photo",
        label: "Profile photo",
      });
      employer.markModified("profilePhoto");
    }

    const mediaFiles = files.companyMedia ?? [];
    const removeMediaKeys = new Set(
      parseProfileAssetKeys(
        input.removeCompanyMediaPublicIds,
        "Company media removal list",
      ),
    );
    const requestedOrder = parseProfileAssetKeys(
      input.companyMediaOrder,
      "Company media order",
    );

    if (
      mediaFiles.length > 0 &&
      !isBusinessEmployerAccountType(
        employer.accountType as EmployerAccountType,
      )
    ) {
      throw new AppError(
        "Company media is only available for Company / Business and Consultancy accounts",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existingMedia = (employer.companyMedia ?? []) as EmployerImageAsset[];
    const removedMedia = existingMedia.filter((asset) =>
      removeMediaKeys.has(getImageAssetKey(asset)),
    );
    let retainedMedia = existingMedia.filter(
      (asset) => !removeMediaKeys.has(getImageAssetKey(asset)),
    );

    if (
      retainedMedia.length + mediaFiles.length >
      EMPLOYER_COMPANY_MEDIA_MAX_COUNT
    ) {
      throw new AppError(
        `Company media is limited to ${EMPLOYER_COMPANY_MEDIA_MAX_COUNT} images`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (requestedOrder.length > 0) {
      const mediaByKey = new Map(
        retainedMedia.map((asset) => [getImageAssetKey(asset), asset]),
      );
      const ordered = requestedOrder
        .map((key) => mediaByKey.get(key))
        .filter((asset): asset is EmployerImageAsset => Boolean(asset));
      const orderedKeys = new Set(ordered.map(getImageAssetKey));
      retainedMedia = [
        ...ordered,
        ...retainedMedia.filter(
          (asset) => !orderedKeys.has(getImageAssetKey(asset)),
        ),
      ];
    }

    const uploadedMedia = await Promise.all(
      mediaFiles.map((file, index) =>
        uploadEmployerImageAsset({
          file,
          folder: `employer-company-media/${toEmployerStorageCode(employer._id)}`,
          fileBaseName: `company-media-${Date.now()}-${index + 1}`,
          label: "Company media",
        }),
      ),
    );

    if (
      removeMediaKeys.size > 0 ||
      requestedOrder.length > 0 ||
      uploadedMedia.length > 0
    ) {
      employer.set("companyMedia", [...retainedMedia, ...uploadedMedia]);
    }

    await employer.save();

    await Promise.all(removedMedia.map((asset) => deleteEmployerImageAsset(asset)));

    return {
      employer: toPublicEmployer(employer),
    };
  }
}

export const employerService = new EmployerService();