import mongoose from "mongoose";
import { EMPLOYER_INDUSTRIES } from "../../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { notificationService } from "../../notifications/notification.service.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import {
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import {
  sanitizeEmployerDetail,
  sanitizeEmployerListItem,
} from "../rbac/operations-field-sanitize.js";
import {
  operationsEmployersService,
  resolveVerificationStatus,
} from "../employers/operations-employers.service.js";
import type { OperationsEmployerListItem } from "../employers/operations-employers.types.js";
import {
  PENDING_VERIFICATION_FILTER,
  SLA_TARGET_DAYS,
  VERIFIED_EMPLOYER_FILTER,
  getOperationsVerificationsAnalytics,
} from "./operations-verifications-analytics.js";
import {
  resolveEmployerIndustryLabel,
  resolveVerificationAllowedActions,
  resolveVerificationListStatus,
} from "./operations-verifications-domain.js";
import type {
  OperationsVerificationDetail,
  OperationsVerificationListItem,
  OperationsVerificationsAnalyticsResult,
  OperationsVerificationsFilterOptions,
  OperationsVerificationsListResult,
} from "./operations-verifications.types.js";
import type {
  ExportOperationsVerificationsQuery,
  ListOperationsVerificationsQuery,
  RequestVerificationDocumentsBody,
  UpdateOperationsVerificationBody,
  VerificationsAnalyticsQueryInput,
} from "./operations-verifications.validation.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function text(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function formatEmployerDisplayId(id: string): string {
  return `EMP-${id.slice(-8).toUpperCase()}`;
}

function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveListDateRange(query: ListOperationsVerificationsQuery): {
  from: Date | null;
  to: Date | null;
} {
  const now = new Date();
  switch (query.datePreset) {
    case "today":
      return { from: startOfLocalDay(now), to: endOfLocalDay(now) };
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        from: startOfLocalDay(yesterday),
        to: endOfLocalDay(yesterday),
      };
    }
    case "last_7_days": {
      const from = startOfLocalDay(now);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfLocalDay(now) };
    }
    case "last_30_days": {
      const from = startOfLocalDay(now);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfLocalDay(now) };
    }
    case "custom": {
      const fromRaw = parseDateOnly(query.dateFrom);
      const toRaw = parseDateOnly(query.dateTo);
      return {
        from: fromRaw ? startOfLocalDay(fromRaw) : null,
        to: toRaw ? endOfLocalDay(toRaw) : fromRaw ? endOfLocalDay(fromRaw) : null,
      };
    }
    default:
      return { from: null, to: null };
  }
}

function underReviewFilter(): Record<string, unknown> {
  return {
    $and: [
      {
        $or: [
          { verificationStatus: "pending" },
          { verificationStatus: null },
          { verificationStatus: "" },
          { verificationStatus: { $exists: false } },
        ],
      },
      { verificationSubmittedAt: { $exists: true, $ne: null } },
      {
        $expr: {
          $gt: [{ $size: { $ifNull: ["$documentIds", []] } }, 0],
        },
      },
    ],
  };
}

function slaBreachesFilter(now: Date): Record<string, unknown> {
  const slaCutoff = new Date(now.getTime() - SLA_TARGET_DAYS * 24 * 60 * 60 * 1000);
  return {
    $or: [
      {
        $and: [
          {
            $or: [
              { verificationStatus: "pending" },
              { verificationStatus: null },
              { verificationStatus: "" },
              { verificationStatus: { $exists: false } },
            ],
          },
          {
            $or: [
              { verificationSubmittedAt: { $lte: slaCutoff } },
              {
                $and: [
                  {
                    $or: [
                      { verificationSubmittedAt: null },
                      { verificationSubmittedAt: { $exists: false } },
                    ],
                  },
                  { createdAt: { $lte: slaCutoff } },
                ],
              },
            ],
          },
        ],
      },
      {
        $and: [
          { verificationStatus: "verified" },
          { verifiedAt: { $exists: true, $ne: null } },
          {
            $expr: {
              $gt: [
                {
                  $subtract: [
                    "$verifiedAt",
                    { $ifNull: ["$verificationSubmittedAt", "$createdAt"] },
                  ],
                },
                SLA_TARGET_DAYS * 24 * 60 * 60 * 1000,
              ],
            },
          },
        ],
      },
      {
        $and: [
          { verificationStatus: "rejected" },
          { rejectedAt: { $exists: true, $ne: null } },
          {
            $expr: {
              $gt: [
                {
                  $subtract: [
                    "$rejectedAt",
                    { $ifNull: ["$verificationSubmittedAt", "$createdAt"] },
                  ],
                },
                SLA_TARGET_DAYS * 24 * 60 * 60 * 1000,
              ],
            },
          },
        ],
      },
    ],
  };
}

function needsAttentionFilter(now: Date): Record<string, unknown> {
  const slaCutoff = new Date(now.getTime() - SLA_TARGET_DAYS * 24 * 60 * 60 * 1000);
  return {
    $and: [
      {
        $or: [
          { verificationStatus: "pending" },
          { verificationStatus: null },
          { verificationStatus: "" },
          { verificationStatus: { $exists: false } },
        ],
      },
      {
        $or: [
          { verificationSubmittedAt: { $lte: slaCutoff } },
          {
            $and: [
              {
                $or: [
                  { verificationSubmittedAt: null },
                  { verificationSubmittedAt: { $exists: false } },
                ],
              },
              { createdAt: { $lte: slaCutoff } },
            ],
          },
          {
            $and: [
              { registrationStatus: "completed" },
              {
                $expr: {
                  $eq: [{ $size: { $ifNull: ["$documentIds", []] } }, 0],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

function withinSlaOpenFilter(now: Date): Record<string, unknown> {
  const slaCutoff = new Date(now.getTime() - SLA_TARGET_DAYS * 24 * 60 * 60 * 1000);
  return {
    $and: [
      {
        $or: [
          { verificationStatus: "pending" },
          { verificationStatus: null },
          { verificationStatus: "" },
          { verificationStatus: { $exists: false } },
        ],
      },
      {
        $or: [
          { verificationSubmittedAt: { $gt: slaCutoff } },
          {
            $and: [
              {
                $or: [
                  { verificationSubmittedAt: null },
                  { verificationSubmittedAt: { $exists: false } },
                ],
              },
              { createdAt: { $gt: slaCutoff } },
            ],
          },
        ],
      },
    ],
  };
}

async function loadVerificationFilterOptions(): Promise<OperationsVerificationsFilterOptions> {
  const [states, cities] = await Promise.all([
    EmployerModel.distinct("state"),
    EmployerModel.distinct("city"),
  ]);

  const locations = Array.from(
    new Set(
      [...states, ...cities]
        .map((value) => text(value))
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return {
    statuses: [
      { value: "pending", label: "Pending" },
      { value: "under_review", label: "Under Review" },
      { value: "verified", label: "Verified" },
      { value: "rejected", label: "Rejected" },
    ],
    industries: EMPLOYER_INDUSTRIES.map((value) => ({
      value,
      label: resolveEmployerIndustryLabel(value),
    })),
    locations,
    slaOptions: [
      { value: "within", label: "Within SLA" },
      { value: "beyond", label: "Beyond SLA" },
    ],
  };
}

function buildListFilter(
  query: ListOperationsVerificationsQuery,
  now: Date,
): Record<string, unknown> {
  const andClauses: Record<string, unknown>[] = [];

  const search = query.search.trim();
  if (search) {
    const cleanIdSearch = search
      .replace(/^AJ-EMP-/i, "")
      .replace(/^EMP-/i, "")
      .trim();
    const pattern = new RegExp(escapeRegex(search), "i");
    const searchOrs: Record<string, unknown>[] = [
      { companyName: pattern },
      { establishmentName: pattern },
      { firstName: pattern },
      { lastName: pattern },
      { emailAddress: pattern },
      { whatsappNumber: pattern },
      { city: pattern },
      { state: pattern },
      { industry: pattern },
    ];
    if (mongoose.Types.ObjectId.isValid(search)) {
      searchOrs.push({ _id: new mongoose.Types.ObjectId(search) });
    } else if (cleanIdSearch.length >= 4) {
      searchOrs.push({
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: escapeRegex(cleanIdSearch),
            options: "i",
          },
        },
      });
    }
    andClauses.push({ $or: searchOrs });
  }

  const status = query.status.trim().toLowerCase();
  if (status === "verified") {
    andClauses.push(VERIFIED_EMPLOYER_FILTER);
  } else if (status === "rejected") {
    andClauses.push({ verificationStatus: "rejected" });
  } else if (status === "pending") {
    andClauses.push({
      $and: [PENDING_VERIFICATION_FILTER, { $nor: [underReviewFilter()] }],
    });
  } else if (status === "under_review") {
    andClauses.push(underReviewFilter());
  }

  const queue = query.queue.trim().toLowerCase();
  if (queue === "under_review") {
    andClauses.push(underReviewFilter());
  } else if (queue === "sla_breaches") {
    andClauses.push(slaBreachesFilter(now));
  } else if (queue === "needs_attention") {
    andClauses.push(needsAttentionFilter(now));
  }

  if (query.industry.trim()) {
    const industry = query.industry.trim();
    andClauses.push({
      $or: [
        { industry: new RegExp(`^${escapeRegex(industry)}$`, "i") },
        { businessCategory: new RegExp(`^${escapeRegex(industry)}$`, "i") },
      ],
    });
  }

  if (query.employerType.trim()) {
    const type = query.employerType.trim().toLowerCase();
    andClauses.push({
      $or: [
        { accountType: type },
        { companyType: new RegExp(`^${escapeRegex(type)}$`, "i") },
      ],
    });
  }

  if (query.location.trim()) {
    const loc = query.location.trim();
    andClauses.push({
      $or: [
        { city: new RegExp(`^${escapeRegex(loc)}$`, "i") },
        { state: new RegExp(`^${escapeRegex(loc)}$`, "i") },
      ],
    });
  }

  if (query.assignedTo.trim()) {
    const reviewerId = new mongoose.Types.ObjectId(query.assignedTo.trim());
    andClauses.push({
      $or: [{ verifiedBy: reviewerId }, { rejectedBy: reviewerId }],
    });
  }

  if (query.sla === "beyond") {
    andClauses.push(slaBreachesFilter(now));
  } else if (query.sla === "within") {
    andClauses.push({
      $or: [
        withinSlaOpenFilter(now),
        {
          $and: [
            { verificationStatus: "verified" },
            { verifiedAt: { $exists: true, $ne: null } },
            {
              $expr: {
                $lte: [
                  {
                    $subtract: [
                      "$verifiedAt",
                      { $ifNull: ["$verificationSubmittedAt", "$createdAt"] },
                    ],
                  },
                  SLA_TARGET_DAYS * 24 * 60 * 60 * 1000,
                ],
              },
            },
          ],
        },
        {
          $and: [
            { verificationStatus: "rejected" },
            { rejectedAt: { $exists: true, $ne: null } },
            {
              $expr: {
                $lte: [
                  {
                    $subtract: [
                      "$rejectedAt",
                      { $ifNull: ["$verificationSubmittedAt", "$createdAt"] },
                    ],
                  },
                  SLA_TARGET_DAYS * 24 * 60 * 60 * 1000,
                ],
              },
            },
          ],
        },
      ],
    });
  }

  const dateRange = resolveListDateRange(query);
  if (dateRange.from || dateRange.to) {
    const range: Record<string, Date> = {};
    if (dateRange.from) range.$gte = dateRange.from;
    if (dateRange.to) range.$lte = dateRange.to;
    andClauses.push({
      $or: [
        { verificationSubmittedAt: range },
        {
          $and: [
            {
              $or: [
                { verificationSubmittedAt: null },
                { verificationSubmittedAt: { $exists: false } },
              ],
            },
            { createdAt: range },
          ],
        },
      ],
    });
  }

  return andClauses.length > 0 ? { $and: andClauses } : {};
}

function resolveSort(
  query: ListOperationsVerificationsQuery,
): Record<string, 1 | -1> {
  const direction = query.sortDirection === "asc" ? 1 : -1;
  switch (query.sort) {
    case "companyName":
      return { companyName: direction, _id: direction };
    case "status":
      return { verificationStatus: direction, _id: direction };
    case "sla":
      return { verificationSubmittedAt: direction, createdAt: direction, _id: direction };
    case "submittedAt":
    default:
      return { verificationSubmittedAt: direction, createdAt: direction, _id: direction };
  }
}

function mapToListItem(input: {
  doc: Record<string, unknown> & {
    _id: mongoose.Types.ObjectId;
    verifiedBy?: mongoose.Types.ObjectId | null;
    rejectedBy?: mongoose.Types.ObjectId | null;
  };
  documentsCount: number;
  documentsApprovedCount: number;
  reviewerNameById: Map<string, string>;
  access: OperationsResolvedAccess;
}): OperationsVerificationListItem {
  const id = String(input.doc._id);
  const verificationStatusRaw = text(input.doc.verificationStatus);
  const explicitStatus = resolveVerificationStatus({
    verificationStatus: verificationStatusRaw,
  });
  const statusMeta = resolveVerificationListStatus({
    verificationStatus: verificationStatusRaw,
    registrationStatus: text(input.doc.registrationStatus),
    verificationSubmittedAt:
      (input.doc.verificationSubmittedAt as Date | null | undefined) ?? null,
    createdAt: (input.doc.createdAt as Date | null | undefined) ?? null,
    documentsCount: input.documentsCount,
    verifiedAt: (input.doc.verifiedAt as Date | null | undefined) ?? null,
    rejectedAt: (input.doc.rejectedAt as Date | null | undefined) ?? null,
  });

  const city = text(input.doc.city);
  const state = text(input.doc.state);
  const submittedAtRaw =
    (input.doc.verificationSubmittedAt as Date | null | undefined) ??
    (input.doc.createdAt as Date | null | undefined) ??
    null;
  const submittedAt = submittedAtRaw
    ? new Date(submittedAtRaw).toISOString()
    : null;

  const assignedId =
    explicitStatus === "verified" && input.doc.verifiedBy
      ? String(input.doc.verifiedBy)
      : explicitStatus === "rejected" && input.doc.rejectedBy
        ? String(input.doc.rejectedBy)
        : null;
  const assignedToLabel = assignedId
    ? input.reviewerNameById.get(assignedId) || "—"
    : "—";

  const operationalForActions =
    statusMeta.statusLabel === "Under Review" ? "under_review" : explicitStatus;

  const allowedActions = resolveVerificationAllowedActions({
    verificationStatus: operationalForActions,
    canVerify: operationsAccessCanKey(
      input.access,
      "employers.profile.actions.verify",
    ),
    canReject: operationsAccessCanKey(
      input.access,
      "employers.profile.actions.reject",
    ),
    canViewDocuments: operationsAccessCanKey(
      input.access,
      "employers.profile.documents.view",
    ),
    canDownloadDocuments: operationsAccessCanKey(
      input.access,
      "employers.profile.documents.download",
    ),
  });

  const companyName =
    text(input.doc.companyName) ||
    text(input.doc.establishmentName) ||
    [text(input.doc.firstName), text(input.doc.lastName)].filter(Boolean).join(" ") ||
    "—";

  const logoUrl =
    resolveEmployerPosterImageUrl({
      accountType: text(input.doc.accountType),
      companyLogo: (input.doc.companyLogo as
        | { url?: string; fileSize?: number; updatedAt?: Date | string | null }
        | null
        | undefined) ?? null,
      profilePhoto: (input.doc.profilePhoto as
        | { url?: string; fileSize?: number; updatedAt?: Date | string | null }
        | null
        | undefined) ?? null,
    }) || "";

  const item: OperationsVerificationListItem = {
    id,
    displayId: formatEmployerDisplayId(id),
    companyName,
    displayName: companyName,
    industry: resolveEmployerIndustryLabel(
      text(input.doc.industry) || text(input.doc.businessCategory),
    ),
    location: [city, state].filter(Boolean).join(", ") || "—",
    city,
    state,
    logoUrl,
    submittedAt,
    submittedAtDate: formatDisplayDate(submittedAtRaw),
    documentsCount: input.documentsCount,
    documentsApprovedCount: input.documentsApprovedCount,
    documentsLabel:
      input.documentsCount > 0
        ? `${input.documentsApprovedCount}/${input.documentsCount}`
        : "0/0",
    verificationStatus: explicitStatus,
    operationalStatus: statusMeta.operationalStatus,
    statusLabel: statusMeta.statusLabel,
    slaLabel: statusMeta.slaLabel,
    slaBreach: statusMeta.slaBreach,
    needsAttention: statusMeta.needsAttention,
    assignedToLabel,
    assignedToId: assignedId,
    phone: text(input.doc.whatsappNumber),
    email: text(input.doc.emailAddress),
    accountType: text(input.doc.accountType),
    allowedActions,
  };

  // Reuse employer field sanitization for phone/email/name/address
  const asEmployer: OperationsEmployerListItem = {
    id: item.id,
    displayId: item.displayId,
    accountType: item.accountType,
    displayName: item.displayName,
    companyName: item.companyName,
    establishmentName: text(input.doc.establishmentName),
    organizationType: "",
    industry: item.industry,
    phone: item.phone ?? "",
    email: item.email ?? "",
    location: item.location,
    city: item.city,
    state: item.state,
    registeredAt: null,
    registeredAtDate: "—",
    registeredAtTime: "",
    verificationSubmittedAt: item.submittedAt,
    documentsCount: item.documentsCount,
    verificationStatus: item.verificationStatus,
    verificationStatusLabel: item.statusLabel,
    verifiedAt: null,
    verifiedAtDate: "—",
    status: "active",
    statusLabel: "Active",
    activeJobsCount: 0,
    totalJobsCount: 0,
    logoUrl: item.logoUrl,
    isWhatsappVerified: Boolean(input.doc.isWhatsappVerified),
    isProfileComplete: Boolean(input.doc.isProfileComplete),
    registrationStatus: text(input.doc.registrationStatus),
    isNewRegistration: false,
    registrationAwarenessState: null,
  };

  const sanitized = sanitizeEmployerListItem(asEmployer, input.access);
  return {
    ...item,
    companyName: sanitized.companyName ?? item.companyName,
    displayName: sanitized.displayName ?? item.displayName,
    phone: sanitized.phone,
    email: sanitized.email,
    location: sanitized.location ?? item.location,
    city: sanitized.city ?? item.city,
    state: sanitized.state ?? item.state,
  };
}

export const operationsVerificationsService = {
  async getAnalytics(
    query: VerificationsAnalyticsQueryInput,
  ): Promise<OperationsVerificationsAnalyticsResult> {
    return getOperationsVerificationsAnalytics({
      preset: query.preset,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  },

  async list(
    query: ListOperationsVerificationsQuery,
    access: OperationsResolvedAccess,
  ): Promise<OperationsVerificationsListResult> {
    const now = new Date();
    const filter = buildListFilter(query, now);
    const sort = resolveSort(query);
    const skip = (query.page - 1) * query.limit;

    const [docs, total, filterOptions] = await Promise.all([
      EmployerModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .lean(),
      EmployerModel.countDocuments(filter),
      loadVerificationFilterOptions(),
    ]);

    const employerIds = docs.map((doc) => doc._id);
    const documentStats = await EmployerDocumentModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
      approved: number;
    }>([
      { $match: { employerId: { $in: employerIds } } },
      {
        $group: {
          _id: "$employerId",
          count: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$verificationStatus", "approved"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const documentsCountMap = new Map<string, number>();
    const documentsApprovedMap = new Map<string, number>();
    for (const row of documentStats) {
      documentsCountMap.set(String(row._id), row.count);
      documentsApprovedMap.set(String(row._id), row.approved);
    }

    const reviewerIds = Array.from(
      new Set(
        docs
          .flatMap((doc) => [doc.verifiedBy, doc.rejectedBy])
          .filter(Boolean)
          .map((id) => String(id)),
      ),
    ).filter((id) => mongoose.Types.ObjectId.isValid(id));

    const reviewers =
      reviewerIds.length > 0
        ? await OperationsTeamUserModel.find({
            _id: {
              $in: reviewerIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          })
            .select({ fullName: 1 })
            .lean()
        : [];

    const reviewerNameById = new Map<string, string>();
    for (const reviewer of reviewers) {
      reviewerNameById.set(
        String(reviewer._id),
        text(reviewer.fullName) || "Operations",
      );
    }

    const items = docs.map((doc) =>
      mapToListItem({
        doc: doc as typeof doc & {
          verifiedBy?: mongoose.Types.ObjectId | null;
          rejectedBy?: mongoose.Types.ObjectId | null;
        },
        documentsCount: documentsCountMap.get(String(doc._id)) ?? 0,
        documentsApprovedCount:
          documentsApprovedMap.get(String(doc._id)) ?? 0,
        reviewerNameById,
        access,
      }),
    );

    return {
      items,
      filterOptions,
      pagination: buildListPagination(query.page, query.limit, total),
    };
  },

  async getById(
    id: string,
    access: OperationsResolvedAccess,
  ): Promise<OperationsVerificationDetail> {
    const employer = await operationsEmployersService.getEmployerById(id);
    const sanitized = sanitizeEmployerDetail(employer, access);
    const statusMeta = resolveVerificationListStatus({
      verificationStatus: sanitized.verificationStatus,
      registrationStatus: sanitized.registrationStatus,
      verificationSubmittedAt: sanitized.verificationSubmittedAt,
      createdAt: sanitized.registeredAt,
      documentsCount: sanitized.documentsCount,
      verifiedAt: sanitized.verifiedAt,
      rejectedAt: sanitized.rejectedAt,
    });

    const approvedCount = sanitized.documents.filter(
      (doc) => doc.verificationStatus === "approved",
    ).length;

    const operationalForActions =
      statusMeta.statusLabel === "Under Review"
        ? "under_review"
        : sanitized.verificationStatus;

    const allowedActions = resolveVerificationAllowedActions({
      verificationStatus: operationalForActions,
      canVerify: operationsAccessCanKey(
        access,
        "employers.profile.actions.verify",
      ),
      canReject: operationsAccessCanKey(
        access,
        "employers.profile.actions.reject",
      ),
      canViewDocuments: operationsAccessCanKey(
        access,
        "employers.profile.documents.view",
      ),
      canDownloadDocuments: operationsAccessCanKey(
        access,
        "employers.profile.documents.download",
      ),
    });

    const assignedToLabel =
      sanitized.verificationStatus === "verified"
        ? sanitized.verifiedByLabel || "—"
        : sanitized.verificationStatus === "rejected"
          ? sanitized.rejectedByLabel || "—"
          : "—";

    return {
      id: sanitized.id,
      displayId: sanitized.displayId,
      companyName: sanitized.companyName,
      displayName: sanitized.displayName,
      establishmentName: sanitized.establishmentName,
      accountType: sanitized.accountType,
      organizationType: sanitized.organizationType,
      industry: resolveEmployerIndustryLabel(sanitized.industry),
      location: sanitized.location,
      city: sanitized.city,
      state: sanitized.state,
      logoUrl: sanitized.logoUrl,
      phone: sanitized.phone,
      email: sanitized.email,
      verificationStatus: sanitized.verificationStatus,
      operationalStatus: statusMeta.operationalStatus,
      statusLabel: statusMeta.statusLabel,
      submittedAt: sanitized.verificationSubmittedAt,
      verifiedAt: sanitized.verifiedAt,
      rejectedAt: sanitized.rejectedAt,
      verificationRemarks: sanitized.verificationRemarks,
      assignedToLabel,
      assignedToId: null,
      slaLabel: statusMeta.slaLabel,
      slaBreach: statusMeta.slaBreach,
      needsAttention: statusMeta.needsAttention,
      documentsCount: sanitized.documentsCount,
      documentsApprovedCount: approvedCount,
      documentsLabel:
        sanitized.documentsCount > 0
          ? `${approvedCount}/${sanitized.documentsCount}`
          : "0/0",
      documents: sanitized.documents.map((doc) => {
        const docStatus = text(doc.verificationStatus).toLowerCase();
        const verificationStatusLabel =
          docStatus === "approved"
            ? "Approved"
            : docStatus === "rejected"
              ? "Rejected"
              : "Pending";
        return {
          id: doc.id,
          documentType: doc.documentType,
          documentTypeLabel: doc.documentTypeLabel,
          fileName: doc.originalName,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          verificationStatus: doc.verificationStatus,
          verificationStatusLabel,
          uploadedAt: doc.uploadedAt || null,
          url: doc.url,
        };
      }),
      companyAddress: sanitized.companyAddress,
      gstNumber: sanitized.gstNumber,
      panNumber: sanitized.panNumber,
      registrationNumber: sanitized.registrationNumber,
      website: sanitized.website,
      companyDescription: sanitized.companyDescription,
      contactPersonName: sanitized.contactPersonName,
      allowedActions,
    };
  },

  async updateVerification(
    id: string,
    body: UpdateOperationsVerificationBody,
    operationsUserId: string,
    access: OperationsResolvedAccess,
  ): Promise<OperationsVerificationDetail> {
    await operationsEmployersService.updateVerification(
      id,
      {
        verificationStatus: body.verificationStatus,
        remarks: body.remarks,
      },
      operationsUserId,
    );
    return this.getById(id, access);
  },

  async openDocument(id: string, documentId: string) {
    return operationsEmployersService.openEmployerDocument(id, documentId);
  },

  async requestDocuments(
    id: string,
    body: RequestVerificationDocumentsBody,
    operationsUserId: string,
    access: OperationsResolvedAccess,
  ): Promise<OperationsVerificationDetail> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Verification not found.", HTTP_STATUS.NOT_FOUND);
    }
    if (!mongoose.Types.ObjectId.isValid(operationsUserId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(id);
    const opsUserObjectId = new mongoose.Types.ObjectId(operationsUserId);
    const message = body.message.trim();
    const documentTypes = body.documentTypes ?? [];

    const current = await EmployerModel.findById(employerObjectId)
      .select({
        verificationStatus: 1,
        companyName: 1,
        establishmentName: 1,
        firstName: 1,
        lastName: 1,
      })
      .lean();

    if (!current) {
      throw new AppError("Verification not found.", HTTP_STATUS.NOT_FOUND);
    }

    const status = resolveVerificationStatus(current);
    if (status === "verified" || status === "rejected") {
      throw new AppError(
        "Cannot request documents for a closed verification.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const updated = await EmployerModel.findOneAndUpdate(
      {
        _id: employerObjectId,
        $or: [
          { verificationStatus: "pending" },
          { verificationStatus: null },
          { verificationStatus: "" },
          { verificationStatus: { $exists: false } },
        ],
      },
      {
        $set: {
          verificationRemarks: message,
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      throw new AppError(
        "Verification already processed.",
        HTTP_STATUS.CONFLICT,
      );
    }

    const actor = await OperationsTeamUserModel.findById(operationsUserId)
      .select("fullName")
      .lean();
    const actorName = text(actor?.fullName) || "Operations";
    const targetLabel =
      text(updated.companyName) ||
      text(updated.establishmentName) ||
      [text(updated.firstName), text(updated.lastName)].filter(Boolean).join(" ") ||
      id;

    await recordOperationsAuditEvent({
      actorUserId: opsUserObjectId,
      actorName,
      action: "employer.verification_documents_requested",
      targetType: "employer",
      targetId: id,
      targetLabel,
      previousState: { verificationStatus: status },
      nextState: {
        verificationStatus: status,
        documentsRequested: documentTypes,
      },
      reason: message,
    });

    try {
      await notificationService.notifyEmployerVerificationDocumentsRequested({
        employerId: id,
        message,
        documentTypes,
        reviewedByLabel: `${actorName} (Operations)`,
      });
    } catch {
      /* non-blocking notification */
    }

    // Keep/create actionable My Work item while verification remains open.
    void import("../work/operations-work-emit.js")
      .then(({ upsertEmployerVerificationWork }) =>
        upsertEmployerVerificationWork({
          employerId: id,
          companyName: targetLabel,
          submittedAt: new Date(),
          kind: "documents_requested",
        }),
      )
      .catch((error) => {
        console.error("[operations-verifications] work ensure failed", {
          employerId: id,
          errorCategory: error instanceof Error ? error.name : "unknown",
        });
      });

    return this.getById(id, access);
  },

  async export(
    query: ExportOperationsVerificationsQuery,
    access: OperationsResolvedAccess,
  ) {
    // Reuse employers export with mapped verification filters (sanitized + permissioned).
    const verificationStatus =
      query.status === "verified" || query.status === "rejected"
        ? query.status
        : query.status === "pending"
          ? "pending"
          : "";
    const verificationQueue =
      query.queue === "under_review" ||
      query.queue === "sla_breaches" ||
      query.queue === "needs_attention"
        ? query.queue
        : query.status === "under_review"
          ? "under_review"
          : query.sla === "beyond"
            ? "sla_breaches"
            : "";

    return operationsEmployersService.exportEmployers(
      {
        page: 1,
        limit: 100,
        search: query.search,
        verificationStatus,
        verificationQueue,
        employerType: query.employerType || query.industry,
        location: query.location,
        status: "",
        datePreset: query.datePreset,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        analyticsPreset: "all",
        analyticsFrom: "",
        analyticsTo: "",
      },
      access,
      query.format === "csv" ? "csv" : "xlsx",
    );
  },
};
