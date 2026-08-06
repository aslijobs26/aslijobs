import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { assertSearchFiltersAllowed } from "../rbac/field-access.guards.js";
import { filterExportFieldsByAccess } from "../rbac/field-access.sanitize.js";
import { sendSuccess } from "../../utils/api-response.js";
import { SAVED_CANDIDATE_EXPORT_CATALOG_MAP } from "./saved-candidate-export.constants.js";
import { savedCandidateExportService } from "./saved-candidate-export.service.js";
import type { SavedCandidateExportField } from "./saved-candidate-export.types.js";
import type { SavedCandidateExportBodySchema } from "./saved-candidate-export.validation.js";
import { savedCandidateService } from "./saved-candidate.service.js";
import type {
  ListSavedCandidatesQuerySchema,
  SaveCandidateBodySchema,
  SavedCandidateIdParamsSchema,
  UpdateSavedCandidateBodySchema,
} from "./saved-candidate.validation.js";

function requireEmployerId(req: Request): string {
  if (!req.employerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.employerId;
}

function resolveActor(req: Request) {
  const companyName =
    typeof req.employer?.companyName === "string"
      ? req.employer.companyName.trim()
      : "";

  return {
    teamMemberId: req.teamMemberId,
    displayName: companyName || "Employer",
  };
}

function resolveClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return req.ip ?? null;
}

const ZIP_REPORT_FIELDS: SavedCandidateExportField[] = [
  "candidateName",
  "phone",
  "email",
  "currentRole",
  "experience",
  "location",
  "expectedSalary",
  "availability",
  "appliedJob",
  "savedDate",
  "priority",
  "tags",
  "notes",
  "skills",
  "resumeAvailable",
  "resumeFileName",
  "resume",
];

function buildExportInput(req: Request, body: SavedCandidateExportBodySchema) {
  const employerId = requireEmployerId(req);
  const actor = resolveActor(req);

  assertSearchFiltersAllowed(req.rbac, "candidates", [
    { field: "location", active: Boolean(body.location?.trim()) },
  ]);

  const requestedFields =
    body.format === "zip"
      ? ZIP_REPORT_FIELDS
      : (body.fields as SavedCandidateExportField[]);

  const allowedFields = filterExportFieldsByAccess(
    req.rbac,
    "candidates",
    requestedFields,
    SAVED_CANDIDATE_EXPORT_CATALOG_MAP,
  );

  if (allowedFields.length === 0) {
    throw new AppError(
      "No exportable fields are available for your role.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (body.format === "zip" && !allowedFields.includes("resume")) {
    throw new AppError(
      "You do not have permission to export resumes.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  return {
    employerId,
    format: body.format,
    fields: allowedFields,
    search: body.search,
    publicJobId: body.publicJobId || undefined,
    jobTitle: body.jobTitle || undefined,
    location: body.location || undefined,
    experience: body.experience || undefined,
    availability: body.availability || undefined,
    applicationStatus: body.applicationStatus || undefined,
    priority: body.priority,
    tag: body.tag || undefined,
    sort: body.sort,
    actor: {
      teamMemberId: actor.teamMemberId ?? null,
      displayName: actor.displayName,
      ip: resolveClientIp(req),
    },
  };
}

export class SavedCandidateController {
  getStats = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const stats = await savedCandidateService.getStats(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Saved candidate stats retrieved.",
      data: { stats },
    });
  };

  listIds = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const result = await savedCandidateService.listIds(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Saved candidate ids retrieved.",
      data: result,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListSavedCandidatesQuerySchema;
    const result = await savedCandidateService.list(employerId, query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Saved candidates retrieved.",
      data: result,
    });
  };

  save = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const body = req.body as SaveCandidateBodySchema;
    const result = await savedCandidateService.save({
      employerId,
      actor: resolveActor(req),
      ...body,
    });

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Candidate saved successfully.",
      data: result,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const params = req.params as unknown as SavedCandidateIdParamsSchema;
    const body = req.body as UpdateSavedCandidateBodySchema;
    const result = await savedCandidateService.update({
      employerId,
      savedCandidateId: params.savedCandidateId,
      actor: resolveActor(req),
      ...body,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Saved candidate updated.",
      data: result,
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const params = req.params as unknown as SavedCandidateIdParamsSchema;
    const result = await savedCandidateService.remove({
      employerId,
      savedCandidateId: params.savedCandidateId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Candidate removed from saved list.",
      data: result,
    });
  };

  removeByApplication = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const params = req.params as {
      applicationId: string;
    };
    const result = await savedCandidateService.removeByApplication({
      employerId,
      applicationId: params.applicationId,
    });

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Candidate removed from saved list.",
      data: result,
    });
  };

  previewExport = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as SavedCandidateExportBodySchema;
    const input = buildExportInput(req, body);
    const result = await savedCandidateExportService.preview(input);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Export preview retrieved.",
      data: result,
    });
  };

  export = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as SavedCandidateExportBodySchema;
    const input = buildExportInput(req, body);
    const file = await savedCandidateExportService.export(input);

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    res.setHeader("Content-Length", String(file.buffer.length));
    res.status(HTTP_STATUS.OK).send(file.buffer);
  };
}

export const savedCandidateController = new SavedCandidateController();
