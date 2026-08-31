import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import type {
  OperationsEmployerDetail,
  OperationsEmployerDocumentItem,
  OperationsEmployerJobItem,
  OperationsEmployerJobsResult,
  OperationsEmployerKpis,
  OperationsEmployerListItem,
  OperationsEmployersFilterOptions,
  OperationsEmployersListResult,
  OperationsEmployersPeriodStats,
  OperationsEmployerStatus,
  OperationsEmployerVerificationStatus,
  OperationsEmployerDatePreset,
} from "./operations-employers.types.js";
import type {
  ListOperationsEmployerJobsQuery,
  ListOperationsEmployersQuery,
  UpdateOperationsEmployerStatusBody,
  UpdateOperationsEmployerVerificationBody,
} from "./operations-employers.validation.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function text(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
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
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveDateRange(input: {
  datePreset: OperationsEmployerDatePreset;
  dateFrom: string;
  dateTo: string;
}): { from: Date | null; to: Date | null; preset: OperationsEmployerDatePreset } {
  const now = new Date();

  switch (input.datePreset) {
    case "today":
      return {
        preset: "today",
        from: startOfLocalDay(now),
        to: endOfLocalDay(now),
      };
    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        preset: "yesterday",
        from: startOfLocalDay(yesterday),
        to: endOfLocalDay(yesterday),
      };
    }
    case "last_7_days": {
      const from = startOfLocalDay(now);
      from.setDate(from.getDate() - 6);
      return { preset: "last_7_days", from, to: endOfLocalDay(now) };
    }
    case "last_30_days": {
      const from = startOfLocalDay(now);
      from.setDate(from.getDate() - 29);
      return { preset: "last_30_days", from, to: endOfLocalDay(now) };
    }
    case "custom": {
      const fromRaw = parseDateOnly(input.dateFrom);
      const toRaw = parseDateOnly(input.dateTo);
      return {
        preset: "custom",
        from: fromRaw ? startOfLocalDay(fromRaw) : null,
        to: toRaw ? endOfLocalDay(toRaw) : fromRaw ? endOfLocalDay(fromRaw) : null,
      };
    }
    default:
      return { preset: "all", from: null, to: null };
  }
}

function formatEmployerDisplayId(id: string): string {
  const cleaned = id.replace(/[^a-fA-F0-9]/g, "");
  const segment = cleaned.length >= 8 ? cleaned.slice(-8).toUpperCase() : cleaned.toUpperCase();
  return `EMP-${segment || "00000000"}`;
}

function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatDisplayTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function resolveDisplayName(employer: {
  accountType?: string | null;
  companyName?: string | null;
  establishmentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const companyName = text(employer.companyName);
  const establishmentName = text(employer.establishmentName);
  const personName = [text(employer.firstName), text(employer.lastName)]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (employer.accountType === "individual") {
    return establishmentName || personName || companyName || "Individual employer";
  }

  return companyName || establishmentName || personName || "Employer";
}

function resolveOrganizationType(employer: {
  accountType?: string | null;
  companyType?: string | null;
  businessCategory?: string | null;
}): string {
  const companyType = text(employer.companyType);
  if (companyType) {
    const formatted = companyType
      .replace(/[_-]+/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return formatted;
  }

  const accountType = text(employer.accountType).toLowerCase();
  if (accountType === "company") return "Private Company";
  if (accountType === "consultancy") return "Consultancy";
  if (accountType === "individual") return "Individual";

  const businessCategory = text(employer.businessCategory);
  if (businessCategory) {
    return businessCategory
      .replace(/[_-]+/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return "Private Company";
}

function resolveVerificationStatus(employer: {
  verificationStatus?: string | null;
  isWhatsappVerified?: boolean | null;
  registrationStatus?: string | null;
}): OperationsEmployerVerificationStatus {
  const explicit = text(employer.verificationStatus).toLowerCase();
  if (explicit === "verified" || explicit === "approved") {
    return "verified";
  }
  if (explicit === "rejected") {
    return "rejected";
  }
  if (explicit === "pending") {
    return "pending";
  }

  if (
    employer.isWhatsappVerified &&
    employer.registrationStatus === "completed"
  ) {
    return "verified";
  }

  return "pending";
}

function resolveVerificationStatusLabel(
  status: OperationsEmployerVerificationStatus,
): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    case "pending":
    default:
      return "Pending";
  }
}

function resolveEmployerStatus(employer: {
  status?: string | null;
  registrationStatus?: string | null;
}): OperationsEmployerStatus {
  const explicit = text(employer.status).toLowerCase();
  if (explicit === "active") return "active";
  if (explicit === "suspended") return "suspended";
  if (explicit === "inactive") return "inactive";

  if (employer.registrationStatus === "pending_otp") {
    return "inactive";
  }

  return "active";
}

function resolveEmployerStatusLabel(status: OperationsEmployerStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "suspended":
      return "Suspended";
    case "inactive":
    default:
      return "Inactive";
  }
}

function percentOf(part: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((part / total) * 1000) / 10;
}

function formatDocumentTypeLabel(type: string): string {
  return type
    .replace(/[_-]+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

async function loadKpis(now: Date): Promise<OperationsEmployerKpis> {
  const startToday = startOfLocalDay(now);
  const endToday = endOfLocalDay(now);
  const start7 = startOfLocalDay(now);
  start7.setDate(start7.getDate() - 6);

  const [
    totalEmployers,
    newEmployersToday,
    newThisWeek,
    activeEmployers,
    verifiedEmployers,
    pendingVerification,
    suspended,
    rejected,
  ] = await Promise.all([
    EmployerModel.countDocuments({}),
    EmployerModel.countDocuments({
      createdAt: { $gte: startToday, $lte: endToday },
    }),
    EmployerModel.countDocuments({
      createdAt: { $gte: start7, $lte: endToday },
    }),
    EmployerModel.countDocuments({
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
      ],
    }),
    EmployerModel.countDocuments({
      $or: [
        { verificationStatus: "verified" },
        {
          $and: [
            { verificationStatus: { $in: [null, undefined, ""] } },
            { isWhatsappVerified: true },
            { registrationStatus: "completed" },
          ],
        },
      ],
    }),
    EmployerModel.countDocuments({
      $or: [
        { verificationStatus: "pending" },
        {
          $and: [
            { verificationStatus: { $in: [null, undefined, ""] } },
            {
              $or: [
                { isWhatsappVerified: false },
                { registrationStatus: { $ne: "completed" } },
              ],
            },
          ],
        },
      ],
    }),
    EmployerModel.countDocuments({ status: "suspended" }),
    EmployerModel.countDocuments({ verificationStatus: "rejected" }),
  ]);

  return {
    totalEmployers,
    newEmployersToday,
    newThisWeek,
    activeEmployers,
    activeEmployersPercent: percentOf(activeEmployers, totalEmployers),
    verifiedEmployers,
    verifiedEmployersPercent: percentOf(verifiedEmployers, totalEmployers),
    pendingVerification,
    pendingVerificationPercent: percentOf(pendingVerification, totalEmployers),
    suspended,
    suspendedPercent: percentOf(suspended, totalEmployers),
    rejected,
    rejectedPercent: percentOf(rejected, totalEmployers),
  };
}

async function loadPeriodStats(
  preset: OperationsEmployerDatePreset,
  dateFrom: string,
  dateTo: string,
): Promise<OperationsEmployersPeriodStats> {
  const window = resolveDateRange({
    datePreset: preset,
    dateFrom,
    dateTo,
  });

  const match: Record<string, unknown> = {};
  if (window.from || window.to) {
    const range: Record<string, Date> = {};
    if (window.from) range.$gte = window.from;
    if (window.to) range.$lte = window.to;
    match.createdAt = range;
  }

  const [registered, verified, pendingVerification, suspended, rejected] =
    await Promise.all([
      EmployerModel.countDocuments(match),
      EmployerModel.countDocuments({
        ...match,
        $or: [
          { verificationStatus: "verified" },
          {
            $and: [
              { verificationStatus: { $in: [null, undefined, ""] } },
              { isWhatsappVerified: true },
              { registrationStatus: "completed" },
            ],
          },
        ],
      }),
      EmployerModel.countDocuments({
        ...match,
        $or: [
          { verificationStatus: "pending" },
          {
            $and: [
              { verificationStatus: { $in: [null, undefined, ""] } },
              {
                $or: [
                  { isWhatsappVerified: false },
                  { registrationStatus: { $ne: "completed" } },
                ],
              },
            ],
          },
        ],
      }),
      EmployerModel.countDocuments({ ...match, status: "suspended" }),
      EmployerModel.countDocuments({
        ...match,
        verificationStatus: "rejected",
      }),
    ]);

  return {
    registered,
    verified,
    pendingVerification,
    suspended,
    rejected,
  };
}

async function loadFilterOptions(): Promise<OperationsEmployersFilterOptions> {
  const [locationRows, companyTypes, accountTypes] = await Promise.all([
    EmployerModel.aggregate<{ _id: string }>([
      {
        $project: {
          location: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$city", ""] },
                  {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$city", ""] },
                          { $ne: ["$state", ""] },
                        ],
                      },
                      ", ",
                      "",
                    ],
                  },
                  { $ifNull: ["$state", ""] },
                ],
              },
            },
          },
        },
      },
      { $match: { location: { $ne: "" } } },
      { $group: { _id: "$location" } },
      { $sort: { _id: 1 } },
      { $limit: 150 },
    ]),
    EmployerModel.distinct("companyType"),
    EmployerModel.distinct("accountType"),
  ]);

  const locations = locationRows
    .map((r) => r._id)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const employerTypesMap = new Map<string, string>([
    ["company", "Private Company"],
    ["consultancy", "Consultancy"],
    ["individual", "Individual"],
  ]);

  companyTypes.forEach((ct) => {
    const raw = text(ct);
    if (raw) {
      employerTypesMap.set(
        raw.toLowerCase(),
        raw
          .replace(/[_-]+/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" "),
      );
    }
  });

  accountTypes.forEach((at) => {
    const raw = text(at);
    if (raw && !employerTypesMap.has(raw.toLowerCase())) {
      employerTypesMap.set(
        raw.toLowerCase(),
        raw.charAt(0).toUpperCase() + raw.slice(1),
      );
    }
  });

  return {
    verificationStatuses: [
      { value: "verified", label: "Verified" },
      { value: "pending", label: "Pending Verification" },
      { value: "rejected", label: "Rejected" },
    ],
    employerTypes: Array.from(employerTypesMap.entries()).map(
      ([value, label]) => ({ value, label }),
    ),
    locations,
    statuses: [
      { value: "active", label: "Active" },
      { value: "suspended", label: "Suspended" },
      { value: "inactive", label: "Inactive" },
    ],
  };
}

export const operationsEmployersService = {
  async listEmployers(
    query: ListOperationsEmployersQuery,
  ): Promise<OperationsEmployersListResult> {
    const now = new Date();
    const andClauses: Record<string, unknown>[] = [];

    // Search
    const search = query.search.trim();
    if (search) {
      const cleanIdSearch = search.replace(/^EMP-/i, "").trim();
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
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        searchOrs.push({ _id: new mongoose.Types.ObjectId(search) });
      } else if (cleanIdSearch.length >= 4) {
        // Match substring on Hex ObjectId converted to string in regex
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

    // Verification Status
    if (query.verificationStatus.trim()) {
      const vs = query.verificationStatus.trim().toLowerCase();
      if (vs === "verified") {
        andClauses.push({
          $or: [
            { verificationStatus: "verified" },
            {
              $and: [
                { verificationStatus: { $in: [null, undefined, ""] } },
                { isWhatsappVerified: true },
                { registrationStatus: "completed" },
              ],
            },
          ],
        });
      } else if (vs === "rejected") {
        andClauses.push({ verificationStatus: "rejected" });
      } else if (vs === "pending") {
        andClauses.push({
          $or: [
            { verificationStatus: "pending" },
            {
              $and: [
                { verificationStatus: { $in: [null, undefined, ""] } },
                {
                  $or: [
                    { isWhatsappVerified: false },
                    { registrationStatus: { $ne: "completed" } },
                  ],
                },
              ],
            },
          ],
        });
      }
    }

    // Employer Type
    if (query.employerType.trim()) {
      const type = query.employerType.trim().toLowerCase();
      andClauses.push({
        $or: [
          { accountType: type },
          { companyType: new RegExp(`^${escapeRegex(type)}$`, "i") },
          { businessCategory: new RegExp(`^${escapeRegex(type)}$`, "i") },
        ],
      });
    }

    // Location
    if (query.location.trim()) {
      const loc = query.location.trim();
      andClauses.push({
        $or: [
          { city: new RegExp(`^${escapeRegex(loc)}$`, "i") },
          { state: new RegExp(`^${escapeRegex(loc)}$`, "i") },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: [
                    { $ifNull: ["$city", ""] },
                    ", ",
                    { $ifNull: ["$state", ""] },
                  ],
                },
                regex: escapeRegex(loc),
                options: "i",
              },
            },
          },
        ],
      });
    }

    // Status
    if (query.status.trim()) {
      const st = query.status.trim().toLowerCase();
      if (st === "active") {
        andClauses.push({
          $or: [
            { status: "active" },
            { status: { $exists: false } },
            { status: null },
          ],
        });
      } else if (st === "suspended") {
        andClauses.push({ status: "suspended" });
      } else if (st === "inactive") {
        andClauses.push({
          $or: [
            { status: "inactive" },
            { registrationStatus: "pending_otp" },
          ],
        });
      }
    }

    // Date range filter
    const dateRange = resolveDateRange({
      datePreset: query.datePreset,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    if (dateRange.from || dateRange.to) {
      const range: Record<string, Date> = {};
      if (dateRange.from) range.$gte = dateRange.from;
      if (dateRange.to) range.$lte = dateRange.to;
      andClauses.push({ createdAt: range });
    }

    const filter: Record<string, unknown> =
      andClauses.length > 0 ? { $and: andClauses } : {};

    const skip = (query.page - 1) * query.limit;

    const [
      kpis,
      periodStats,
      filterOptions,
      employerDocs,
      total,
    ] = await Promise.all([
      loadKpis(now),
      loadPeriodStats(
        query.analyticsPreset || query.datePreset,
        query.analyticsFrom || query.dateFrom,
        query.analyticsTo || query.dateTo,
      ),
      loadFilterOptions(),
      EmployerModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      EmployerModel.countDocuments(filter),
    ]);

    const employerIds = employerDocs.map((doc) => doc._id);

    // Load active jobs and total jobs per employer in parallel
    const [activeJobCounts, totalJobCounts] = await Promise.all([
      JobModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        {
          $match: {
            employerId: { $in: employerIds },
            status: "active",
          },
        },
        { $group: { _id: "$employerId", count: { $sum: 1 } } },
      ]),
      JobModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { employerId: { $in: employerIds } } },
        { $group: { _id: "$employerId", count: { $sum: 1 } } },
      ]),
    ]);

    const activeJobsMap = new Map<string, number>();
    activeJobCounts.forEach((row) => {
      activeJobsMap.set(String(row._id), row.count);
    });

    const totalJobsMap = new Map<string, number>();
    totalJobCounts.forEach((row) => {
      totalJobsMap.set(String(row._id), row.count);
    });

    const employers: OperationsEmployerListItem[] = employerDocs.map((doc) => {
      const id = String(doc._id);
      const vStatus = resolveVerificationStatus(doc);
      const eStatus = resolveEmployerStatus(doc);
      const city = text(doc.city);
      const state = text(doc.state);
      const location = [city, state].filter(Boolean).join(", ") || "—";

      return {
        id,
        displayId: formatEmployerDisplayId(id),
        accountType: text(doc.accountType),
        displayName: resolveDisplayName(doc),
        companyName: text(doc.companyName),
        establishmentName: text(doc.establishmentName),
        organizationType: resolveOrganizationType(doc),
        phone: text(doc.whatsappNumber),
        email: text(doc.emailAddress),
        location,
        city,
        state,
        registeredAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
        registeredAtDate: formatDisplayDate(doc.createdAt),
        registeredAtTime: formatDisplayTime(doc.createdAt),
        verificationStatus: vStatus,
        verificationStatusLabel: resolveVerificationStatusLabel(vStatus),
        verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt).toISOString() : null,
        verifiedAtDate: doc.verifiedAt ? formatDisplayDate(doc.verifiedAt) : "—",
        status: eStatus,
        statusLabel: resolveEmployerStatusLabel(eStatus),
        activeJobsCount: activeJobsMap.get(id) ?? 0,
        totalJobsCount: totalJobsMap.get(id) ?? 0,
        logoUrl: resolveEmployerPosterImageUrl(doc),
        isWhatsappVerified: Boolean(doc.isWhatsappVerified),
        isProfileComplete: Boolean(doc.isProfileComplete),
        registrationStatus: text(doc.registrationStatus),
      };
    });

    return {
      kpis,
      periodStats,
      filterOptions,
      employers,
      pagination: buildListPagination(query.page, query.limit, total),
    };
  },

  async getEmployerById(employerId: string): Promise<OperationsEmployerDetail> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);

    const [employerDoc, documentDocs, jobStatusCounts, applicationStats] =
      await Promise.all([
        EmployerModel.findById(employerObjectId).lean(),
        EmployerDocumentModel.find({ employerId: employerObjectId })
          .sort({ uploadedAt: -1 })
          .lean(),
        JobModel.aggregate<{ _id: string; count: number }>([
          { $match: { employerId: employerObjectId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        ApplicationModel.aggregate<{ _id: string; count: number }>([
          { $match: { employerId: employerObjectId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

    if (!employerDoc) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    const jobCountsByStatus = new Map<string, number>();
    let totalJobs = 0;
    jobStatusCounts.forEach((item) => {
      jobCountsByStatus.set(item._id, item.count);
      totalJobs += item.count;
    });

    const appCountsByStatus = new Map<string, number>();
    let totalApplications = 0;
    applicationStats.forEach((item) => {
      appCountsByStatus.set(item._id, item.count);
      totalApplications += item.count;
    });

    const activeJobs = jobCountsByStatus.get("active") ?? 0;
    const pendingJobs = jobCountsByStatus.get("pending_approval") ?? 0;
    const draftJobs = jobCountsByStatus.get("draft") ?? 0;
    const closedJobs = jobCountsByStatus.get("closed") ?? 0;

    const shortlistedApplications =
      (appCountsByStatus.get("shortlisted") ?? 0) +
      (appCountsByStatus.get("interview_scheduled") ?? 0) +
      (appCountsByStatus.get("interview_completed") ?? 0) +
      (appCountsByStatus.get("offer_sent") ?? 0);
    const hiredApplications =
      (appCountsByStatus.get("hired") ?? 0) +
      (appCountsByStatus.get("selected") ?? 0) +
      (appCountsByStatus.get("joined") ?? 0);

    const id = String(employerDoc._id);
    const vStatus = resolveVerificationStatus(employerDoc);
    const eStatus = resolveEmployerStatus(employerDoc);
    const city = text(employerDoc.city);
    const state = text(employerDoc.state);
    const location = [city, state].filter(Boolean).join(", ") || "—";

    const documents: OperationsEmployerDocumentItem[] = documentDocs.map(
      (doc) => ({
        id: String(doc._id),
        documentType: text(doc.documentType),
        documentTypeLabel: formatDocumentTypeLabel(text(doc.documentType)),
        originalName: text(doc.originalName) || "Document",
        url: text(doc.url),
        mimeType: text(doc.mimeType),
        fileSize: doc.fileSize ?? 0,
        verificationStatus: text(doc.verificationStatus) || "pending",
        uploadedAt: doc.uploadedAt
          ? new Date(doc.uploadedAt).toISOString()
          : new Date().toISOString(),
      }),
    );

    const contactPersonName = [
      text(employerDoc.firstName),
      text(employerDoc.lastName),
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id,
      displayId: formatEmployerDisplayId(id),
      accountType: text(employerDoc.accountType),
      displayName: resolveDisplayName(employerDoc),
      companyName: text(employerDoc.companyName),
      establishmentName: text(employerDoc.establishmentName),
      organizationType: resolveOrganizationType(employerDoc),
      phone: text(employerDoc.whatsappNumber),
      email: text(employerDoc.emailAddress),
      location,
      city,
      state,
      registeredAt: employerDoc.createdAt
        ? new Date(employerDoc.createdAt).toISOString()
        : null,
      registeredAtDate: formatDisplayDate(employerDoc.createdAt),
      registeredAtTime: formatDisplayTime(employerDoc.createdAt),
      verificationStatus: vStatus,
      verificationStatusLabel: resolveVerificationStatusLabel(vStatus),
      verifiedAt: employerDoc.verifiedAt
        ? new Date(employerDoc.verifiedAt).toISOString()
        : null,
      verifiedAtDate: employerDoc.verifiedAt
        ? formatDisplayDate(employerDoc.verifiedAt)
        : "—",
      status: eStatus,
      statusLabel: resolveEmployerStatusLabel(eStatus),
      activeJobsCount: activeJobs,
      totalJobsCount: totalJobs,
      logoUrl: resolveEmployerPosterImageUrl(employerDoc),
      isWhatsappVerified: Boolean(employerDoc.isWhatsappVerified),
      isProfileComplete: Boolean(employerDoc.isProfileComplete),
      registrationStatus: text(employerDoc.registrationStatus),

      industry: text(employerDoc.industry),
      businessCategory: text(employerDoc.businessCategory),
      companyDescription: text(employerDoc.companyDescription),
      website: text(employerDoc.website),
      foundedYear: employerDoc.foundedYear ?? null,
      companyType: text(employerDoc.companyType),
      gstNumber: text(employerDoc.gstNumber),
      panNumber: text(employerDoc.panNumber),
      registrationNumber: text(employerDoc.registrationNumber),
      minimumEmployees: employerDoc.minimumEmployees ?? null,
      maximumEmployees: employerDoc.maximumEmployees ?? null,
      companyAddress: text(employerDoc.companyAddress),
      pincode: text(employerDoc.pincode),
      contactPersonName,
      contactDesignation: text(employerDoc.contactDesignation),
      alternatePhone: text(employerDoc.alternatePhone),
      aboutUs: text(employerDoc.aboutUs),
      culture: text(employerDoc.culture),
      benefits: text(employerDoc.benefits),
      vision: text(employerDoc.vision),
      mission: text(employerDoc.mission),
      values: text(employerDoc.values),
      socialLinks: {
        linkedin: text(employerDoc.socialLinks?.linkedin),
        facebook: text(employerDoc.socialLinks?.facebook),
        instagram: text(employerDoc.socialLinks?.instagram),
        twitter: text(employerDoc.socialLinks?.twitter),
        youtube: text(employerDoc.socialLinks?.youtube),
      },
      lastLoginAt: employerDoc.lastLoginAt
        ? new Date(employerDoc.lastLoginAt).toISOString()
        : null,
      documents,
      analytics: {
        totalJobs,
        activeJobs,
        pendingJobs,
        draftJobs,
        closedJobs,
        totalApplications,
        shortlistedApplications,
        hiredApplications,
      },
      verificationRemarks: text(employerDoc.verificationRemarks),
      suspensionReason: text(employerDoc.suspensionReason),
    };
  },

  async listEmployerJobs(
    employerId: string,
    query: ListOperationsEmployerJobsQuery,
  ): Promise<OperationsEmployerJobsResult> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);
    const filter: Record<string, unknown> = {
      employerId: employerObjectId,
    };

    if (query.status.trim()) {
      filter.status = query.status.trim().toLowerCase();
    }

    const skip = (query.page - 1) * query.limit;

    const [jobDocs, total] = await Promise.all([
      JobModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      JobModel.countDocuments(filter),
    ]);

    const jobs: OperationsEmployerJobItem[] = jobDocs.map((doc) => {
      const minSal = doc.minimumSalary;
      const maxSal = doc.maximumSalary;
      const fixedSal = doc.fixedSalary;
      let salary = "Not disclosed";
      if (fixedSal != null && fixedSal > 0) {
        salary = `₹${fixedSal.toLocaleString("en-IN")}`;
      } else if (minSal != null && maxSal != null) {
        salary = `₹${minSal.toLocaleString("en-IN")} - ₹${maxSal.toLocaleString("en-IN")}`;
      } else if (minSal != null) {
        salary = `From ₹${minSal.toLocaleString("en-IN")}`;
      }

      const rawStatus = text(doc.status);
      const statusLabel = rawStatus
        .replace(/[_-]+/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      return {
        id: String(doc._id),
        jobId: text(doc.jobId),
        jobTitle: text(doc.jobTitle) || "Untitled Job",
        businessCategory: text(doc.businessCategory),
        jobType: text(doc.jobType),
        workMode: text(doc.workMode),
        city: text(doc.city),
        state: text(doc.state),
        salary,
        status: rawStatus,
        statusLabel,
        applicationsCount: doc.applications ?? 0,
        createdAt: doc.createdAt
          ? new Date(doc.createdAt).toISOString()
          : new Date().toISOString(),
      };
    });

    return {
      jobs,
      pagination: buildListPagination(query.page, query.limit, total),
    };
  },

  async updateVerification(
    employerId: string,
    body: UpdateOperationsEmployerVerificationBody,
  ): Promise<OperationsEmployerDetail> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);

    const update: Record<string, unknown> = {
      verificationStatus: body.verificationStatus,
      verificationRemarks: body.remarks?.trim() || "",
    };

    if (body.verificationStatus === "verified") {
      update.verifiedAt = new Date();
      update.isWhatsappVerified = true;
    } else if (body.verificationStatus === "rejected") {
      update.verifiedAt = null;
    }

    const employer = await EmployerModel.findByIdAndUpdate(
      employerObjectId,
      { $set: update },
      { new: true },
    );

    if (!employer) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    // Sync employer documents
    if (body.verificationStatus === "verified") {
      await EmployerDocumentModel.updateMany(
        { employerId: employerObjectId, verificationStatus: "pending" },
        { $set: { verificationStatus: "approved" } },
      );
    } else if (body.verificationStatus === "rejected") {
      await EmployerDocumentModel.updateMany(
        { employerId: employerObjectId, verificationStatus: "pending" },
        { $set: { verificationStatus: "rejected" } },
      );
    }

    return this.getEmployerById(employerId);
  },

  async updateStatus(
    employerId: string,
    body: UpdateOperationsEmployerStatusBody,
  ): Promise<OperationsEmployerDetail> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);

    const update: Record<string, unknown> = {
      status: body.status,
      suspensionReason: body.reason?.trim() || "",
    };

    if (body.status === "suspended") {
      update.suspendedAt = new Date();
    } else if (body.status === "active") {
      update.suspendedAt = null;
      update.suspensionReason = "";
    }

    const employer = await EmployerModel.findByIdAndUpdate(
      employerObjectId,
      { $set: update },
      { new: true },
    );

    if (!employer) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    return this.getEmployerById(employerId);
  },
};
