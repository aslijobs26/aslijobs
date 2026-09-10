import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import {
  APPLICATION_EVENT_NAMES,
  APPLICATION_STATUS_LABELS,
  PLACEMENT_APPLICATION_STATUSES,
} from "../../applications/application.constants.js";
import { ApplicationModel } from "../../applications/application.model.js";
import type { ApplicationStatus } from "../../applications/application.types.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { JobModel } from "../../jobs/job.model.js";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { notificationService } from "../../notifications/notification.service.js";
import type { ApplicationNotificationContext } from "../../notifications/notification.types.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import {
  resolveCityLabelFromLocationFields,
  resolveIndiaStateFromLocationFields,
} from "../employers/india-state-normalize.js";
import { operationsAccessCanKey } from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import {
  CANDIDATE_FIELD_PERMISSION_KEYS,
  EMPLOYER_FIELD_PERMISSION_KEYS,
  PLACEMENTS_DETAIL_UPDATE_JOINING_KEY,
} from "../rbac/operations-permission-catalog.js";
import { omitKey } from "../rbac/omit-key.js";
import { resolveEmployerIndustryLabel } from "../verifications/operations-verifications-industry.js";
import {
  getPlacementsAnalytics,
  resolvePlacementsAnalyticsDateRange,
} from "./operations-placements-analytics.js";
import {
  PLACEMENT_STATUS_MATCH,
  daysBetweenOfferAndJoin,
  extractPlacementSearchObjectId,
  findStatusHistoryAt,
  formatPlacementDisplayId,
  joiningStatusToApplicationStatus,
  parseOfferDate,
  placementCohortAtStages,
  placementStatusLabel,
  resolvePlacementCohortDate,
  resolvePlacementJoiningStatus,
} from "./operations-placements-domain.js";
import {
  buildOperationsPlacementsExportFile,
  type OperationsPlacementsExportFileResult,
  type OperationsPlacementsExportFormat,
} from "./operations-placements-export.js";
import type {
  OperationsPlacementDetail,
  OperationsPlacementListItem,
  OperationsPlacementTimelineEntry,
  OperationsPlacementsAnalyticsQuery,
  OperationsPlacementsAnalyticsResult,
  OperationsPlacementsFilterOptions,
  OperationsPlacementsListResult,
  PlacementJoiningStatus,
} from "./operations-placements.types.js";
import type {
  ExportOperationsPlacementsQuery,
  ListOperationsPlacementsQuery,
  UpdatePlacementJoiningStatusBody,
} from "./operations-placements.validation.js";

const EXPORT_PAGE_SIZE = 500;
const EXPORT_MAX_ROWS = 10_000;

function text(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatLocation(city: string, state: string): string {
  return [city, state].filter(Boolean).join(", ");
}

function isoOrNull(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const parsed = parseOfferDate(value);
  return parsed ? parsed.toISOString() : text(value) || null;
}

function offerDateOrNull(value: unknown): string | null {
  const raw = text(value);
  return raw || null;
}

type AggregatePlacementRow = {
  _id: mongoose.Types.ObjectId;
  status: string;
  publicJobId?: string;
  appliedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  statusHistory?: Array<{
    status?: string;
    at?: Date | string;
    actorType?: string;
    remark?: string;
  }>;
  offer?: {
    offerDate?: string;
    joiningDate?: string;
    packageText?: string;
    notes?: string;
  } | null;
  jobId?: mongoose.Types.ObjectId;
  employerId?: mongoose.Types.ObjectId;
  jobSeekerId?: mongoose.Types.ObjectId;
  job?: Array<{
    _id?: mongoose.Types.ObjectId;
    jobId?: string;
    jobTitle?: string;
    companyName?: string;
    industry?: string;
    city?: string;
    cityName?: string;
    state?: string;
    stateName?: string;
  }>;
  employer?: Array<{
    _id?: mongoose.Types.ObjectId;
    companyName?: string;
    establishmentName?: string;
    phone?: string;
    whatsappNumber?: string;
    email?: string;
    verificationStatus?: string;
    companyLogo?: { url?: string } | null;
    profilePhoto?: { url?: string } | null;
  }>;
  seeker?: Array<{
    _id?: mongoose.Types.ObjectId;
    fullName?: string;
    whatsappNumber?: string;
    city?: string;
    state?: string;
    preferredJobLocation?: string;
  }>;
  resumeSnapshot?: {
    resumeJson?: {
      header?: { fullName?: string; phone?: string; email?: string };
      sections?: {
        contact?: { fullName?: string; phone?: string; email?: string };
      };
    };
  } | null;
};

function candidateNameFromRow(row: AggregatePlacementRow): string {
  const seeker = row.seeker?.[0];
  const header = row.resumeSnapshot?.resumeJson?.header;
  const contact = row.resumeSnapshot?.resumeJson?.sections?.contact;
  return (
    text(seeker?.fullName) ||
    text(header?.fullName) ||
    text(contact?.fullName) ||
    "Candidate"
  );
}

function candidatePhoneFromRow(row: AggregatePlacementRow): string {
  const seeker = row.seeker?.[0];
  const header = row.resumeSnapshot?.resumeJson?.header;
  const contact = row.resumeSnapshot?.resumeJson?.sections?.contact;
  return (
    text(seeker?.whatsappNumber) ||
    text(header?.phone) ||
    text(contact?.phone)
  );
}

function candidateEmailFromRow(row: AggregatePlacementRow): string {
  const header = row.resumeSnapshot?.resumeJson?.header;
  const contact = row.resumeSnapshot?.resumeJson?.sections?.contact;
  return text(header?.email) || text(contact?.email);
}

function mapListItem(row: AggregatePlacementRow): OperationsPlacementListItem {
  const job = row.job?.[0];
  const employer = row.employer?.[0];
  const seeker = row.seeker?.[0];
  const joiningStatus =
    resolvePlacementJoiningStatus(row.status) ?? "joining_pending";

  const city =
    text(job?.cityName) ||
    text(job?.city) ||
    resolveCityLabelFromLocationFields({
      city: seeker?.city,
      preferredJobLocation: seeker?.preferredJobLocation,
    });
  const state = resolveIndiaStateFromLocationFields({
    state: job?.stateName || job?.state || seeker?.state,
    city: job?.cityName || job?.city || seeker?.city,
    preferredJobLocation: seeker?.preferredJobLocation,
  });
  const stateDisplay = state === "Unspecified" ? text(seeker?.state) || text(job?.stateName) || text(job?.state) : state;

  const company =
    text(job?.companyName) ||
    text(employer?.companyName) ||
    text(employer?.establishmentName) ||
    "Company";

  const placedAt = resolvePlacementCohortDate({
    statusHistory: row.statusHistory,
    updatedAt: row.updatedAt,
  });

  const id = row._id.toString();

  return {
    id,
    displayId: formatPlacementDisplayId(id),
    candidateName: candidateNameFromRow(row),
    candidatePhone: candidatePhoneFromRow(row) || undefined,
    candidateEmail: candidateEmailFromRow(row) || undefined,
    jobRole: text(job?.jobTitle) || "Job",
    company,
    location: formatLocation(city, stateDisplay),
    city,
    state: stateDisplay,
    category: resolveEmployerIndustryLabel(job?.industry),
    offerDate: offerDateOrNull(row.offer?.offerDate),
    joiningDate: offerDateOrNull(row.offer?.joiningDate),
    joiningStatus,
    statusLabel: placementStatusLabel(joiningStatus),
    applicationStatus: row.status as ApplicationStatus,
    publicJobId: text(row.publicJobId) || text(job?.jobId),
    jobId: (row.jobId ?? job?._id)?.toString?.() ?? "",
    employerId: (row.employerId ?? employer?._id)?.toString?.() ?? "",
    jobSeekerId: (row.jobSeekerId ?? seeker?._id)?.toString?.() ?? "",
    placedAt: placedAt ? placedAt.toISOString() : null,
    updatedAt: isoOrNull(row.updatedAt),
    appliedAt: isoOrNull(row.appliedAt),
  };
}

function sanitizePlacementListItem(
  item: OperationsPlacementListItem,
  access: OperationsResolvedAccess | undefined,
): OperationsPlacementListItem {
  const next = { ...item };
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.name)) {
    omitKey(next, "candidateName");
  }
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.phone)) {
    omitKey(next, "candidatePhone");
  }
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.email)) {
    omitKey(next, "candidateEmail");
  }
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.location)) {
    omitKey(next, "location");
    omitKey(next, "city");
    omitKey(next, "state");
  }
  return next;
}

function sanitizePlacementDetail(
  detail: OperationsPlacementDetail,
  access: OperationsResolvedAccess | undefined,
): OperationsPlacementDetail {
  const next: OperationsPlacementDetail = {
    ...detail,
    ...sanitizePlacementListItem(detail, access),
  };
  if (!operationsAccessCanKey(access, CANDIDATE_FIELD_PERMISSION_KEYS.location)) {
    omitKey(next, "candidateCity");
    omitKey(next, "candidateState");
    omitKey(next, "jobLocation");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.name)) {
    omitKey(next, "employerName");
    omitKey(next, "company");
    omitKey(next, "jobCompanyName");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.phone)) {
    omitKey(next, "employerPhone");
  }
  if (!operationsAccessCanKey(access, EMPLOYER_FIELD_PERMISSION_KEYS.email)) {
    omitKey(next, "employerEmail");
  }
  return next;
}

function lookupStages(): mongoose.PipelineStage[] {
  return [
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    {
      $lookup: {
        from: "employers",
        localField: "employerId",
        foreignField: "_id",
        as: "employer",
      },
    },
    {
      $lookup: {
        from: "jobseekers",
        localField: "jobSeekerId",
        foreignField: "_id",
        as: "seeker",
      },
    },
  ];
}

function statusMatchForFilter(
  status: ListOperationsPlacementsQuery["status"],
): Record<string, unknown> {
  if (status === "all") {
    return { ...PLACEMENT_STATUS_MATCH };
  }
  return {
    status: joiningStatusToApplicationStatus(status as PlacementJoiningStatus),
  };
}

function buildListPipeline(
  query: ListOperationsPlacementsQuery,
): mongoose.PipelineStage[] {
  const match: Record<string, unknown> = statusMatchForFilter(query.status);
  const pipeline: mongoose.PipelineStage[] = [
    { $match: match },
    ...placementCohortAtStages(),
    ...lookupStages(),
  ];

  const postMatch: Record<string, unknown>[] = [];

  const dateRange = resolvePlacementsAnalyticsDateRange({
    preset: query.preset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  if (dateRange.preset !== "all") {
    postMatch.push({
      placementCohortAt: {
        $gte: new Date(dateRange.from),
        $lte: new Date(dateRange.to),
      },
    });
  }

  if (query.search.trim()) {
    const rawSearch = query.search.trim();
    const regex = new RegExp(escapeRegex(rawSearch), "i");
    const searchOr: Record<string, unknown>[] = [
      { "seeker.fullName": regex },
      { "job.jobTitle": regex },
      { "job.companyName": regex },
      { "employer.companyName": regex },
      { "employer.establishmentName": regex },
      { "job.city": regex },
      { "job.cityName": regex },
      { "job.state": regex },
      { "job.stateName": regex },
      { "seeker.city": regex },
      { "seeker.state": regex },
      { "seeker.preferredJobLocation": regex },
      { publicJobId: regex },
    ];

    const idToken = extractPlacementSearchObjectId(rawSearch);
    if (idToken && mongoose.Types.ObjectId.isValid(idToken)) {
      // Full ObjectId → exact match; short display suffix → ends-with on hex id.
      if (idToken.length === 24) {
        searchOr.push({ _id: new mongoose.Types.ObjectId(idToken) });
      } else {
        searchOr.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: `${escapeRegex(idToken)}$`,
              options: "i",
            },
          },
        });
      }
    } else if (/^AJ-PLC-/i.test(rawSearch)) {
      searchOr.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: escapeRegex(rawSearch.replace(/^AJ-PLC-/i, "")),
            options: "i",
          },
        },
      });
    }

    postMatch.push({ $or: searchOr });
  }

  if (query.category.trim()) {
    const category = query.category.trim();
    postMatch.push({
      $or: [
        { "job.industry": new RegExp(`^${escapeRegex(category)}$`, "i") },
        {
          "job.industry": new RegExp(
            `^${escapeRegex(category.replace(/\s+/g, "-"))}$`,
            "i",
          ),
        },
      ],
    });
  }

  if (query.state.trim()) {
    const stateRegex = new RegExp(escapeRegex(query.state.trim()), "i");
    postMatch.push({
      $or: [
        { "job.state": stateRegex },
        { "job.stateName": stateRegex },
        { "seeker.state": stateRegex },
      ],
    });
  }

  if (query.city.trim()) {
    const cityRegex = new RegExp(escapeRegex(query.city.trim()), "i");
    postMatch.push({
      $or: [
        { "job.city": cityRegex },
        { "job.cityName": cityRegex },
        { "seeker.city": cityRegex },
        { "seeker.preferredJobLocation": cityRegex },
      ],
    });
  }

  if (query.employerId.trim()) {
    match.employerId = new mongoose.Types.ObjectId(query.employerId.trim());
  }

  if (query.jobId.trim()) {
    const jobIdValue = query.jobId.trim();
    if (mongoose.Types.ObjectId.isValid(jobIdValue)) {
      match.jobId = new mongoose.Types.ObjectId(jobIdValue);
    } else {
      postMatch.push({
        $or: [
          { publicJobId: jobIdValue.toUpperCase() },
          { "job.jobId": jobIdValue.toUpperCase() },
        ],
      });
    }
  }

  // Re-apply base match after optional employer/job id mutations.
  pipeline[0] = { $match: match };

  if (postMatch.length > 0) {
    pipeline.push({
      $match: postMatch.length === 1 ? postMatch[0]! : { $and: postMatch },
    });
  }

  const sortDirection: 1 | -1 = query.order === "asc" ? 1 : -1;
  const sortStage: Record<string, 1 | -1> =
    query.sort === "offerDate"
      ? { "offer.offerDate": sortDirection, updatedAt: -1 }
      : query.sort === "joiningDate"
        ? { "offer.joiningDate": sortDirection, updatedAt: -1 }
        : query.sort === "candidateName"
          ? { "seeker.fullName": sortDirection, updatedAt: -1 }
          : query.sort === "company"
            ? { "job.companyName": sortDirection, updatedAt: -1 }
            : { placementCohortAt: sortDirection, updatedAt: -1 };

  pipeline.push({ $sort: sortStage });
  pipeline.push({
    $facet: {
      items: [
        { $skip: (query.page - 1) * query.limit },
        { $limit: query.limit },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  return pipeline;
}

async function loadFilterOptions(): Promise<OperationsPlacementsFilterOptions> {
  const rows = await ApplicationModel.aggregate<{
    industries: string[];
    states: string[];
    cities: string[];
    seekerStates: string[];
    seekerCities: string[];
  }>([
    { $match: PLACEMENT_STATUS_MATCH },
    ...lookupStages(),
    {
      $group: {
        _id: null,
        industries: {
          $addToSet: {
            $ifNull: [{ $arrayElemAt: ["$job.industry", 0] }, ""],
          },
        },
        states: {
          $addToSet: {
            $ifNull: [
              { $arrayElemAt: ["$job.stateName", 0] },
              { $ifNull: [{ $arrayElemAt: ["$job.state", 0] }, ""] },
            ],
          },
        },
        cities: {
          $addToSet: {
            $ifNull: [
              { $arrayElemAt: ["$job.cityName", 0] },
              { $ifNull: [{ $arrayElemAt: ["$job.city", 0] }, ""] },
            ],
          },
        },
        seekerStates: {
          $addToSet: { $ifNull: [{ $arrayElemAt: ["$seeker.state", 0] }, ""] },
        },
        seekerCities: {
          $addToSet: { $ifNull: [{ $arrayElemAt: ["$seeker.city", 0] }, ""] },
        },
      },
    },
  ]);

  const row = rows[0];
  const categorySet = new Map<string, string>();
  for (const raw of row?.industries ?? []) {
    const label = resolveEmployerIndustryLabel(raw);
    if (label === "Unspecified") continue;
    categorySet.set(label.toLowerCase(), label);
  }

  const stateSet = new Set<string>();
  for (const raw of [...(row?.states ?? []), ...(row?.seekerStates ?? [])]) {
    const label = resolveIndiaStateFromLocationFields({
      state: raw,
      city: "",
    });
    if (label !== "Unspecified") {
      stateSet.add(label);
    } else if (text(raw)) {
      stateSet.add(text(raw));
    }
  }

  const citySet = new Set<string>();
  for (const raw of [...(row?.cities ?? []), ...(row?.seekerCities ?? [])]) {
    const label = text(raw);
    if (label) citySet.add(label);
  }

  return {
    statuses: [
      { value: "all", label: "All" },
      { value: "joining_pending", label: "Joining Pending" },
      { value: "joined", label: "Joined" },
      { value: "did_not_join", label: "Did Not Join" },
    ],
    categories: Array.from(categorySet.values())
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ value: label, label })),
    states: Array.from(stateSet).sort((a, b) => a.localeCompare(b)),
    cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
  };
}

function mapTimeline(
  history: AggregatePlacementRow["statusHistory"],
): OperationsPlacementTimelineEntry[] {
  if (!Array.isArray(history)) {
    return [];
  }
  return history.map((entry) => {
    const status = text(entry.status) || "submitted";
    const joiningStatus = resolvePlacementJoiningStatus(status);
    return {
      status,
      statusLabel:
        APPLICATION_STATUS_LABELS[
          status as keyof typeof APPLICATION_STATUS_LABELS
        ] ?? status,
      joiningStatus,
      at: isoOrNull(entry.at) ?? new Date().toISOString(),
      actorType: text(entry.actorType) || "system",
      remark: text(entry.remark),
    };
  });
}

function emitApplicationEvent(
  eventName: string,
  context: ApplicationNotificationContext,
): void {
  void notificationService
    .handleApplicationEvent({ eventName, context })
    .catch((error: unknown) => {
      console.error("[notifications] Failed to handle application event", {
        eventName,
        applicationId: context.applicationId,
        error,
      });
    });
}

export const operationsPlacementsService = {
  async getAnalytics(
    query: OperationsPlacementsAnalyticsQuery,
  ): Promise<OperationsPlacementsAnalyticsResult> {
    return getPlacementsAnalytics(query);
  },

  async list(
    query: ListOperationsPlacementsQuery,
    access: OperationsResolvedAccess,
  ): Promise<OperationsPlacementsListResult> {
    const [facet, filterOptions] = await Promise.all([
      ApplicationModel.aggregate<{
        items: AggregatePlacementRow[];
        totalCount: Array<{ count: number }>;
      }>(buildListPipeline(query)),
      loadFilterOptions(),
    ]);

    const total = facet?.[0]?.totalCount?.[0]?.count ?? 0;
    const items = (facet?.[0]?.items ?? []).map((row) =>
      sanitizePlacementListItem(mapListItem(row), access),
    );
    const pagination = buildListPagination(query.page, query.limit, total);

    return {
      items,
      filterOptions,
      pagination: {
        ...pagination,
        page:
          query.page > pagination.totalPages ? pagination.page : query.page,
      },
    };
  },

  async getById(
    id: string,
    access: OperationsResolvedAccess,
  ): Promise<OperationsPlacementDetail> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Placement not found.", HTTP_STATUS.NOT_FOUND);
    }

    const rows = await ApplicationModel.aggregate<AggregatePlacementRow>([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          ...PLACEMENT_STATUS_MATCH,
        },
      },
      ...lookupStages(),
      { $limit: 1 },
    ]);

    const row = rows[0];
    if (!row) {
      throw new AppError("Placement not found.", HTTP_STATUS.NOT_FOUND);
    }

    const listItem = mapListItem(row);
    const job = row.job?.[0];
    const employer = row.employer?.[0];
    const seeker = row.seeker?.[0];
    const joiningStatus = listItem.joiningStatus;

    const offer =
      text(row.offer?.offerDate) ||
      text(row.offer?.joiningDate) ||
      text(row.offer?.packageText) ||
      text(row.offer?.notes)
        ? {
            offerDate: text(row.offer?.offerDate),
            joiningDate: text(row.offer?.joiningDate),
            packageText: text(row.offer?.packageText),
            notes: text(row.offer?.notes),
          }
        : null;

    const joinedAt =
      joiningStatus === "joined"
        ? parseOfferDate(row.offer?.joiningDate) ??
          findStatusHistoryAt(row.statusHistory, "joined")
        : null;

    const detail: OperationsPlacementDetail = {
      ...listItem,
      candidateCity: text(seeker?.city),
      candidateState: text(seeker?.state),
      employerName:
        text(employer?.companyName) ||
        text(employer?.establishmentName) ||
        listItem.company,
      employerPhone:
        text(employer?.phone) || text(employer?.whatsappNumber) || undefined,
      employerEmail: text(employer?.email) || undefined,
      employerLogoUrl: resolveEmployerPosterImageUrl(employer) || "",
      employerVerified: ["verified", "approved"].includes(
        text(employer?.verificationStatus).toLowerCase(),
      ),
      jobTitle: listItem.jobRole,
      jobCompanyName: text(job?.companyName) || listItem.company,
      jobLocation: listItem.location,
      offer,
      timeline: mapTimeline(row.statusHistory),
      daysToJoin:
        joiningStatus === "joined"
          ? daysBetweenOfferAndJoin(row.offer?.offerDate, joinedAt)
          : null,
      canUpdateJoining:
        joiningStatus === "joining_pending" &&
        operationsAccessCanKey(access, PLACEMENTS_DETAIL_UPDATE_JOINING_KEY),
    };

    return sanitizePlacementDetail(detail, access);
  },

  async updateJoiningStatus(
    id: string,
    body: UpdatePlacementJoiningStatusBody,
    access: OperationsResolvedAccess,
    operationsUserId: string,
  ): Promise<OperationsPlacementDetail> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Placement not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (!mongoose.Types.ObjectId.isValid(operationsUserId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const nextStatus = body.joiningStatus;
    const expectedStatus = body.expectedStatus || "selected";
    if (expectedStatus !== "selected") {
      throw new AppError(
        "Invalid expected status for joining update.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    const now = new Date();
    const historyEntry = {
      status: nextStatus,
      at: now,
      actorType: "operations" as const,
      remark:
        text(body.remarks) ||
        (nextStatus === "joined"
          ? "Joining confirmed by Operations"
          : "Did not join recorded by Operations"),
    };

    // Atomic compare-and-set: only one concurrent updater wins (409 otherwise).
    const updated = await ApplicationModel.findOneAndUpdate(
      {
        _id: id,
        status: expectedStatus,
      },
      {
        $set: { status: nextStatus },
        $push: { statusHistory: historyEntry },
      },
      { new: true },
    ).lean();

    if (!updated) {
      const existing = await ApplicationModel.findById(id)
        .select("status")
        .lean();
      if (!existing) {
        throw new AppError("Placement not found.", HTTP_STATUS.NOT_FOUND);
      }
      if (
        !(PLACEMENT_APPLICATION_STATUSES as readonly string[]).includes(
          String(existing.status),
        )
      ) {
        throw new AppError("Placement not found.", HTTP_STATUS.NOT_FOUND);
      }
      throw new AppError(
        "Joining status was already updated. Refresh and try again.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const [job, seeker, opsUser] = await Promise.all([
      JobModel.findById(updated.jobId).select("jobTitle companyName").lean(),
      JobSeekerModel.findById(updated.jobSeekerId)
        .select("fullName whatsappNumber")
        .lean(),
      OperationsTeamUserModel.findById(operationsUserId)
        .select("fullName")
        .lean(),
    ]);

    const actorName = text(opsUser?.fullName) || "Operations";

    const eventName =
      nextStatus === "joined"
        ? APPLICATION_EVENT_NAMES.JOINED
        : APPLICATION_EVENT_NAMES.DID_NOT_JOIN;

    emitApplicationEvent(eventName, {
      applicationId: updated._id.toString(),
      jobSeekerId: String(updated.jobSeekerId),
      employerId: String(updated.employerId),
      publicJobId: text(updated.publicJobId),
      jobTitle: text(job?.jobTitle) || "Job",
      companyName: text(job?.companyName),
      candidateName: text(seeker?.fullName) || undefined,
    });

    try {
      await recordOperationsAuditEvent({
        actorUserId: operationsUserId,
        actorName,
        action: "placements.update_joining",
        targetType: "application",
        targetId: updated._id.toString(),
        targetLabel:
          text(seeker?.fullName) ||
          text(job?.jobTitle) ||
          formatPlacementDisplayId(updated._id.toString()),
        previousState: { status: expectedStatus },
        nextState: { status: nextStatus },
        metadata: {
          joiningStatus: nextStatus,
          publicJobId: text(updated.publicJobId),
        },
      });
    } catch (error) {
      console.error("[operations-placements] audit failed", {
        applicationId: updated._id.toString(),
        errorCategory: error instanceof Error ? error.name : "unknown",
      });
    }

    return this.getById(id, access);
  },

  async export(
    query: ExportOperationsPlacementsQuery,
    access: OperationsResolvedAccess,
    format: OperationsPlacementsExportFormat = "xlsx",
    actor?: { operationsUserId: string; actorName?: string },
  ): Promise<OperationsPlacementsExportFileResult> {
    const rows: OperationsPlacementListItem[] = [];
    let page = 1;

    while (rows.length < EXPORT_MAX_ROWS) {
      const result = await this.list(
        {
          page,
          limit: EXPORT_PAGE_SIZE,
          search: query.search,
          status: query.status,
          category: query.category,
          state: query.state,
          city: query.city,
          employerId: query.employerId,
          jobId: query.jobId,
          sort: query.sort,
          order: query.order,
          preset: query.preset,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        },
        access,
      );
      rows.push(...result.items);
      if (
        result.items.length === 0 ||
        page >= result.pagination.totalPages ||
        rows.length >= result.pagination.total
      ) {
        break;
      }
      page += 1;
    }

    const file = await buildOperationsPlacementsExportFile({
      rows: rows.slice(0, EXPORT_MAX_ROWS),
      format,
    });

    if (actor?.operationsUserId) {
      try {
        await recordOperationsAuditEvent({
          actorUserId: actor.operationsUserId,
          actorName: text(actor.actorName) || "Operations",
          action: "placements.export",
          targetType: "placements",
          targetId: "export",
          targetLabel: `Placements export (${format})`,
          metadata: {
            format,
            rowCount: Math.min(rows.length, EXPORT_MAX_ROWS),
            status: query.status,
            preset: query.preset,
            search: query.search ? "[redacted]" : "",
            category: query.category || "",
            state: query.state || "",
            city: query.city || "",
          },
        });
      } catch (error) {
        console.error("[operations-placements] export audit failed", {
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      }
    }

    return file;
  },
};
