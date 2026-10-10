import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  getUploadedFile,
  getUploadedFiles,
} from "../../middleware/employer-document-upload.middleware.js";
import { assertFieldsEditable } from "../rbac/field-access.guards.js";
import { sanitizeCompanyProfileDto } from "../rbac/field-access.response.js";
import { sendSuccess } from "../../utils/api-response.js";
import { resolveDocumentFileHeaders } from "../operations/documents/document-preview-headers.js";
import { employerDocumentsService } from "./employer-documents.service.js";
import { employerService } from "./employer.service.js";
import type {
  CompleteCompanyProfileSchema,
  CompleteIndividualIdentitySchema,
  EmployerDocumentIdParams,
  ReuploadEmployerDocumentSchema,
  RegisterEmployerSchema,
  UpdateEmployerProfileSchema,
  UploadEmployerDocumentSchema,
  VerifyEmployerOtpSchema,
} from "./employer.validation.js";

export class EmployerController {
  register = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RegisterEmployerSchema;
    const result = await employerService.registerEmployer(body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "OTP sent to WhatsApp.",
      data: result,
    });
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const result = await employerService.resendOtp(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "OTP sent to WhatsApp.",
      data: result,
    });
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const body = req.body as VerifyEmployerOtpSchema;
    const result = await employerService.verifyEmployerOtp({
      employerId,
      otp: body.otp,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "WhatsApp number verified successfully",
      data: result,
    });
  };

  completeCompanyProfile = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const body = req.body as CompleteCompanyProfileSchema;
    const result = await employerService.completeCompanyProfile(
      {
        employerId,
        ...body,
      },
      {
        document: getUploadedFile(req.files, "document"),
        companyLogo: getUploadedFile(req.files, "companyLogo"),
      },
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Company profile completed successfully",
      data: result,
    });
  };

  completeIndividualIdentity = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const { employerId } = req.params as { employerId: string };
    const body = req.body as CompleteIndividualIdentitySchema;
    const result = await employerService.completeIndividualIdentity(
      {
        employerId,
        documentType: body.documentType,
        companyAddress: body.companyAddress,
        pincode: body.pincode,
        city: body.city,
        state: body.state,
      },
      {
        document: getUploadedFile(req.files, "document"),
        profilePhoto: getUploadedFile(req.files, "profilePhoto"),
      },
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Identity document uploaded successfully",
      data: result,
    });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;

    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as UpdateEmployerProfileSchema;
    const editableFields: string[] = [];
    if (typeof body.gstNumber === "string") editableFields.push("gst");
    if (typeof body.panNumber === "string") editableFields.push("pan");
    if (editableFields.length > 0) {
      assertFieldsEditable(req.rbac, "company_profile", editableFields);
    }

    const result = await employerService.updateEmployerProfile(
      {
        employerId,
        ...body,
      },
      {
        companyLogo: getUploadedFile(req.files, "companyLogo"),
        profilePhoto: getUploadedFile(req.files, "profilePhoto"),
        companyMedia: getUploadedFiles(req.files, "companyMedia"),
      },
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer profile updated successfully",
      data: sanitizeCompanyProfileDto(
        req.rbac,
        result as unknown as Record<string, unknown>,
      ),
    });
  };

  submitVerification = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;
    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await employerService.submitVerification(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: result.alreadySubmitted
        ? "Verification is already pending review."
        : "Profile submitted for verification.",
      data: result,
    });
  };

  resubmitVerification = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;
    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await employerService.resubmitVerification(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: result.alreadyPending
        ? "Verification is already pending review."
        : "Verification resubmitted for Operations review.",
      data: result,
    });
  };

  listDocuments = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;
    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const documents = await employerDocumentsService.list(employerId);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Verification documents fetched successfully.",
      data: { documents },
    });
  };

  downloadDocument = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;
    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { documentId } = req.params as EmployerDocumentIdParams;
    const file = await employerDocumentsService.open(employerId, documentId);
    const headers = resolveDocumentFileHeaders({
      mimeType: file.mimeType,
      fileName: file.fileName,
      disposition: "inline",
    });
    res.setHeader("Content-Type", headers.contentType);
    res.setHeader("Content-Disposition", headers.contentDisposition);
    if (file.contentLength != null) {
      res.setHeader("Content-Length", String(file.contentLength));
    }
    res.status(HTTP_STATUS.OK);
    file.stream.pipe(res);
  };

  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;
    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const body = req.body as UploadEmployerDocumentSchema;
    const document = await employerDocumentsService.upload(
      employerId,
      body.documentType,
      getUploadedFile(req.files, "document") ??
        (req.file as Express.Multer.File | undefined),
    );

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Verification document uploaded successfully.",
      data: { document },
    });
  };

  reuploadDocument = async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId;
    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const { documentId } = req.params as EmployerDocumentIdParams;
    const body = req.body as ReuploadEmployerDocumentSchema;
    const document = await employerDocumentsService.reupload(
      employerId,
      documentId,
      body.documentType,
      getUploadedFile(req.files, "document") ??
        (req.file as Express.Multer.File | undefined),
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Verification document replaced successfully.",
      data: { document },
    });
  };
}

export const employerController = new EmployerController();
