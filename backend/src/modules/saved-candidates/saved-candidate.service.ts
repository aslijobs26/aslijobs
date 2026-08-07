import mongoose, { type PipelineStage } from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { buildListPagination } from "../../utils/pagination.js";
import { ApplicationModel } from "../applications/application.model.js";
import type { ApplicationResumeSnapshot } from "../applications/application.types.js";
import { ensureEmployerJobRelationsConsistent } from "../jobs/job-cascade-delete.js";
import {
  buildEmployerAvailabilityMatch,
  parseEmployerAvailabilityFilter,
} from "../applications/employer-availability-filter.js";
import { buildEmployerCandidateSearchMatch } from "../applications/employer-candidate-search.js";
import {
  buildEmployerExperienceMatch,
  parseEmployerExperienceFilter,
} from "../applications/employer-experience-filter.js";
import { buildEmployerPreferredLocationMatch } from "../applications/employer-location-filter.js";
import { SAVED_CANDIDATE_EXPORT_MAX_ROWS } from "./saved-candidate-export.constants.js";
import { SavedCandidateModel } from "./saved-candidate.model.js";
import type {
  SavedCandidateActor,
  SavedCandidateListItem,
  SavedCandidatePriority,
  SavedCandidateSort,
  SavedCandidateStats,
  SavedCandidatesPagination,
} from "./saved-candidate.types.js";
import type {
  ListSavedCandidatesQuerySchema,
  SaveCandidateBodySchema,
  UpdateSavedCandidateBodySchema,
} from "./saved-candidate.validation.js";

const CONTACTED_STATUSES = [
  "viewed",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
] as const;

const INTERVIEWED_STATUSES = [
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
] as const;

const HIRED_STATUSES = ["selected", "joined"] as const;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asSnapshot(value: unknown): ApplicationResumeSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const snapshot = value as ApplicationResumeSnapshot;
  if (
    !snapshot.resumeJson ||
    typeof snapshot.resumeJson !== "object" ||
    !("header" in snapshot.resumeJson) ||
    !("sections" in snapshot.resumeJson)
  ) {
    return null;
  }
  return snapshot;
}

function candidateFieldsFromSnapshot(
  snapshot: ApplicationResumeSnapshot | null,
) {
  const header = snapshot?.resumeJson?.header;
  const sections = snapshot?.resumeJson?.sections;
  const contact = sections?.contact;

  const skillsRaw = sections?.skills;
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw
        .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
        .filter(Boolean)
    : [];

  return {
    fullName:
      text(header?.fullName) || text(contact?.fullName) || "Candidate",
    headline: text(header?.headline) || text(sections?.professionalHeadline),
    location:
      text(header?.location) ||
      [text(header?.city) || text(contact?.city), text(header?.state) || text(contact?.state)]
        .filter(Boolean)
        .join(", "),
    phone: text(header?.phone) || text(contact?.phone),
    skills,
    experienceLabel: text(sections?.experienceLabel),
    availability: text(sections?.availability),
    expectedSalary:
      typeof sections?.careerPreferences?.expectedSalary === "number"
        ? sections.careerPreferences.expectedSalary
        : null,
    expectedSalaryPeriod:
      text(sections?.careerPreferences?.expectedSalaryPeriod) || null,
  };
}

function availabilityStatusLabel(status: unknown): string {
  switch (status) {
    case "immediate":
      return "Immediately Available";
    case "within_7":
      return "Within 7 Days";
    case "within_15":
      return "Within 15 Days";
    case "within_30":
      return "Within 30 Days";
    case "currently_working":
      return "Currently Working";
    default:
      return "";
  }
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function normalizePriority(value: unknown): SavedCandidatePriority | null {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return null;
}

function mapListItem(doc: {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  jobSeekerId: mongoose.Types.ObjectId;
  publicJobId: string;
  priority?: string;
  tags?: string[];
  notes?: string;
  savedAt: Date;
  updatedAt?: Date;
  createdByName?: string;
  updatedByName?: string;
  application?: {
    status?: string;
    resumeSnapshot?: unknown;
    interview?: {
      date?: string | null;
      cancelledAt?: Date | string | null;
    } | null;
  };
  job?: {
    jobTitle?: string;
    city?: string;
    cityName?: string;
    state?: string;
    stateName?: string;
  };
  jobSeekerDoc?: {
    availabilityStatus?: string | null;
    preferredJobLocation?: string | null;
    isWhatsappVerified?: boolean;
    expectedSalary?: number | null;
    expectedSalaryPeriod?: string | null;
    email?: string | null;
  };
}): SavedCandidateListItem {
  const snapshot = asSnapshot(doc.application?.resumeSnapshot);
  const candidate = candidateFieldsFromSnapshot(snapshot);
  const statusLabel = availabilityStatusLabel(
    doc.jobSeekerDoc?.availabilityStatus,
  );
  const jobLocation = [
    text(doc.job?.cityName) || text(doc.job?.city),
    text(doc.job?.stateName) || text(doc.job?.state),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: doc._id.toString(),
    applicationId: doc.applicationId.toString(),
    jobSeekerId: doc.jobSeekerId.toString(),
    publicJobId: doc.publicJobId,
    jobTitle: text(doc.job?.jobTitle) || "Job",
    jobLocation,
    candidateName: candidate.fullName,
    candidateHeadline: candidate.headline,
    candidateLocation:
      text(doc.jobSeekerDoc?.preferredJobLocation) || candidate.location,
    candidatePhone: candidate.phone,
    candidateEmail: text(doc.jobSeekerDoc?.email),
    candidateSkills: candidate.skills,
    hasResume: Boolean(asSnapshot(doc.application?.resumeSnapshot)),
    candidateExperienceLabel: candidate.experienceLabel,
    candidateAvailability: statusLabel || candidate.availability,
    candidateAvailabilityStatus:
      typeof doc.jobSeekerDoc?.availabilityStatus === "string"
        ? doc.jobSeekerDoc.availabilityStatus
        : null,
    isWhatsappVerified: Boolean(doc.jobSeekerDoc?.isWhatsappVerified),
    applicationStatus: text(doc.application?.status) || "submitted",
    hasActiveInterview: Boolean(
      text(doc.application?.interview?.date) &&
        !doc.application?.interview?.cancelledAt,
    ),
    interviewDate: text(doc.application?.interview?.date) || null,
    expectedSalary:
      typeof doc.jobSeekerDoc?.expectedSalary === "number"
        ? doc.jobSeekerDoc.expectedSalary
        : candidate.expectedSalary,
    expectedSalaryPeriod:
      text(doc.jobSeekerDoc?.expectedSalaryPeriod) ||
      candidate.expectedSalaryPeriod,
    priority: normalizePriority(doc.priority),
    tags: (doc.tags ?? []).map((tag) => text(tag)).filter(Boolean),
    notes: text(doc.notes),
    savedAt: doc.savedAt.toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    createdByName: text(doc.createdByName),
    updatedByName: text(doc.updatedByName),
  };
}

function buildSortStage(sort: SavedCandidateSort): Record<string, 1 | -1> {
  switch (sort) {
    case "oldest_saved":
      return { savedAt: 1 };
    case "recently_updated":
      return { updatedAt: -1 };
    case "experience":
      return { experienceSortKey: -1, savedAt: -1 };
    case "expected_salary":
      return { salarySortKey: -1, savedAt: -1 };
    case "name_asc":
      return { nameSortKey: 1 };
    case "name_desc":
      return { nameSortKey: -1 };
    case "priority":
      return { prioritySortKey: 1, savedAt: -1 };
    case "recently_saved":
    default:
      return { savedAt: -1 };
  }
}

function prefixApplicationFields(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => prefixApplicationFields(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(record)) {
    if (key.startsWith("$")) {
      next[key] = prefixApplicationFields(nested);
      continue;
    }

    if (key.startsWith("jobSeekerDoc.") || key.startsWith("job.")) {
      next[key] = nested;
      continue;
    }

    next[`application.${key}`] = nested;
  }

  return next;
}

export class SavedCandidateService {
  async save(
    input: {
      employerId: string;
      actor: SavedCandidateActor;
    } & SaveCandidateBodySchema,
  ) {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const application = await ApplicationModel.findById(input.applicationId)
      .select("employerId jobSeekerId jobId publicJobId")
      .lean();

    if (!application) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    if (application.employerId.toString() !== input.employerId) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await SavedCandidateModel.findOne({
      employerId: application.employerId,
      applicationId: application._id,
    }).lean();

    if (existing) {
      throw new AppError(
        "Candidate is already saved",
        HTTP_STATUS.CONFLICT,
      );
    }

    const created = await SavedCandidateModel.create({
      employerId: application.employerId,
      applicationId: application._id,
      jobSeekerId: application.jobSeekerId,
      jobId: application.jobId,
      publicJobId: application.publicJobId,
      savedAt: new Date(),
      priority: input.priority,
      tags: input.tags ?? [],
      notes: input.notes ?? "",
      createdByTeamMemberId: input.actor.teamMemberId
        ? new mongoose.Types.ObjectId(input.actor.teamMemberId)
        : null,
      createdByName: input.actor.displayName,
      updatedByTeamMemberId: input.actor.teamMemberId
        ? new mongoose.Types.ObjectId(input.actor.teamMemberId)
        : null,
      updatedByName: input.actor.displayName,
    });

    return {
      savedCandidate: {
        id: created._id.toString(),
        applicationId: created.applicationId.toString(),
        priority: normalizePriority(created.priority),
      },
      created: true,
    };
  }

  async remove(input: { employerId: string; savedCandidateId: string }) {
    const deleted = await SavedCandidateModel.findOneAndDelete({
      _id: input.savedCandidateId,
      employerId: input.employerId,
    }).lean();

    if (!deleted) {
      throw new AppError("Saved candidate not found", HTTP_STATUS.NOT_FOUND);
    }

    return { removed: true, applicationId: deleted.applicationId.toString() };
  }

  async removeByApplication(input: {
    employerId: string;
    applicationId: string;
  }) {
    const deleted = await SavedCandidateModel.findOneAndDelete({
      employerId: input.employerId,
      applicationId: input.applicationId,
    }).lean();

    if (!deleted) {
      throw new AppError("Saved candidate not found", HTTP_STATUS.NOT_FOUND);
    }

    return {
      removed: true,
      savedCandidateId: deleted._id.toString(),
      applicationId: deleted.applicationId.toString(),
    };
  }

  /**
   * Create or update a saved-candidate row for an application.
   * Used by Shortlist flow to avoid duplicate records.
   */
  async upsertForApplication(input: {
    employerId: string;
    applicationId: string;
    actor: SavedCandidateActor;
    priority: SavedCandidatePriority | null;
    tags: string[];
    notes: string;
  }) {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const application = await ApplicationModel.findById(input.applicationId)
      .select("employerId jobSeekerId jobId publicJobId")
      .lean();

    if (!application) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    if (application.employerId.toString() !== input.employerId) {
      throw new AppError("Application not found", HTTP_STATUS.NOT_FOUND);
    }

    const teamMemberObjectId = input.actor.teamMemberId
      ? new mongoose.Types.ObjectId(input.actor.teamMemberId)
      : null;

    const existing = await SavedCandidateModel.findOne({
      employerId: application.employerId,
      applicationId: application._id,
    });

    if (existing) {
      existing.priority = input.priority;
      existing.tags = input.tags;
      existing.notes = input.notes;
      existing.updatedByName = input.actor.displayName;
      existing.updatedByTeamMemberId = teamMemberObjectId;
      await existing.save();
      return {
        id: existing._id.toString(),
        created: false,
      };
    }

    const created = await SavedCandidateModel.create({
      employerId: application.employerId,
      applicationId: application._id,
      jobSeekerId: application.jobSeekerId,
      jobId: application.jobId,
      publicJobId: application.publicJobId,
      savedAt: new Date(),
      priority: input.priority,
      tags: input.tags,
      notes: input.notes,
      createdByTeamMemberId: teamMemberObjectId,
      createdByName: input.actor.displayName,
      updatedByTeamMemberId: teamMemberObjectId,
      updatedByName: input.actor.displayName,
    });

    return {
      id: created._id.toString(),
      created: true,
    };
  }

  async update(
    input: {
      employerId: string;
      savedCandidateId: string;
      actor: SavedCandidateActor;
    } & UpdateSavedCandidateBodySchema,
  ) {
    const saved = await SavedCandidateModel.findOne({
      _id: input.savedCandidateId,
      employerId: input.employerId,
    });

    if (!saved) {
      throw new AppError("Saved candidate not found", HTTP_STATUS.NOT_FOUND);
    }

    if (input.priority !== undefined) {
      saved.priority = input.priority;
    }
    if (input.tags !== undefined) {
      saved.tags = input.tags;
    }
    if (input.notes !== undefined) {
      saved.notes = input.notes;
    }
    saved.updatedByName = input.actor.displayName;
    saved.updatedByTeamMemberId = input.actor.teamMemberId
      ? new mongoose.Types.ObjectId(input.actor.teamMemberId)
      : null;
    await saved.save();

    return { id: saved._id.toString() };
  }

  async listIds(employerId: string): Promise<{
    applicationIds: string[];
    savedByApplicationId: Record<string, string>;
  }> {
    const rows = await SavedCandidateModel.find({ employerId })
      .select("_id applicationId")
      .lean();
    const savedByApplicationId: Record<string, string> = {};
    for (const row of rows) {
      savedByApplicationId[row.applicationId.toString()] = row._id.toString();
    }
    return {
      applicationIds: Object.keys(savedByApplicationId),
      savedByApplicationId,
    };
  }

  async getStats(employerId: string): Promise<SavedCandidateStats> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [totals] = await SavedCandidateModel.aggregate<{
      totalSaved: number;
      newThisWeek: number;
      newLastWeek: number;
    }>([
      { $match: { employerId: employerObjectId } },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: 1 },
          newThisWeek: {
            $sum: {
              $cond: [{ $gte: ["$savedAt", thisWeekStart] }, 1, 0],
            },
          },
          newLastWeek: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$savedAt", lastWeekStart] },
                    { $lt: ["$savedAt", thisWeekStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const statusBreakdown = await SavedCandidateModel.aggregate<{
      contacted: number;
      interviewed: number;
      hired: number;
      contactedPrev: number;
      interviewedPrev: number;
      hiredPrev: number;
    }>([
      { $match: { employerId: employerObjectId } },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "application",
        },
      },
      { $unwind: { path: "$application", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          contacted: {
            $sum: {
              $cond: [
                { $in: ["$application.status", [...CONTACTED_STATUSES]] },
                1,
                0,
              ],
            },
          },
          interviewed: {
            $sum: {
              $cond: [
                { $in: ["$application.status", [...INTERVIEWED_STATUSES]] },
                1,
                0,
              ],
            },
          },
          hired: {
            $sum: {
              $cond: [
                { $in: ["$application.status", [...HIRED_STATUSES]] },
                1,
                0,
              ],
            },
          },
          contactedPrev: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$application.status", [...CONTACTED_STATUSES]] },
                    { $lt: ["$savedAt", thisWeekStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          interviewedPrev: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$application.status", [...INTERVIEWED_STATUSES]] },
                    { $lt: ["$savedAt", thisWeekStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          hiredPrev: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$application.status", [...HIRED_STATUSES]] },
                    { $lt: ["$savedAt", thisWeekStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const status = statusBreakdown[0];
    const newThisWeek = totals?.newThisWeek ?? 0;
    const newLastWeek = totals?.newLastWeek ?? 0;
    const contacted = status?.contacted ?? 0;
    const interviewed = status?.interviewed ?? 0;
    const hired = status?.hired ?? 0;

    return {
      totalSaved: totals?.totalSaved ?? 0,
      newThisWeek,
      newThisWeekChangePercent: percentChange(newThisWeek, newLastWeek),
      contacted,
      contactedChangePercent: percentChange(
        contacted,
        status?.contactedPrev ?? 0,
      ),
      interviewed,
      interviewedChangePercent: percentChange(
        interviewed,
        status?.interviewedPrev ?? 0,
      ),
      hired,
      hiredChangePercent: percentChange(hired, status?.hiredPrev ?? 0),
    };
  }

  private async queryItems(
    employerId: string,
    query: ListSavedCandidatesQuerySchema,
  ): Promise<{
    items: SavedCandidateListItem[];
    pagination: SavedCandidatesPagination;
  }> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const match: Record<string, unknown> = {
      employerId: new mongoose.Types.ObjectId(employerId),
    };

    if (query.publicJobId) {
      match.publicJobId = query.publicJobId;
    }
    if (query.priority) {
      match.priority = query.priority;
    }
    if (query.tag) {
      match.tags = query.tag;
    }

    const postLookupAnd: Record<string, unknown>[] = [];

    const searchMatch = buildEmployerCandidateSearchMatch(query.search);
    if (searchMatch) {
      postLookupAnd.push(
        prefixApplicationFields(searchMatch) as Record<string, unknown>,
      );
    }

    const locationMatch = buildEmployerPreferredLocationMatch(query.location);
    if (locationMatch) {
      postLookupAnd.push(locationMatch);
    }

    const experienceMatch = buildEmployerExperienceMatch(
      parseEmployerExperienceFilter(query.experience),
    );
    if (experienceMatch) {
      postLookupAnd.push(
        prefixApplicationFields(experienceMatch) as Record<string, unknown>,
      );
    }

    const availabilityMatch = buildEmployerAvailabilityMatch(
      parseEmployerAvailabilityFilter(query.availability),
    );
    if (availabilityMatch) {
      postLookupAnd.push(availabilityMatch);
    }

    const jobTitle = text(query.jobTitle);
    if (jobTitle) {
      postLookupAnd.push({
        "job.jobTitle": {
          $regex: jobTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      });
    }

    const applicationStatus = text(query.applicationStatus);
    if (applicationStatus) {
      postLookupAnd.push({
        "application.status": applicationStatus,
      });
    }

    const sort = buildSortStage(query.sort);
    const page = query.page;
    const limit = query.limit;

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "application",
        },
      },
      { $unwind: { path: "$application", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "jobseekers",
          localField: "jobSeekerId",
          foreignField: "_id",
          as: "jobSeekerDoc",
        },
      },
      {
        $unwind: { path: "$jobSeekerDoc", preserveNullAndEmptyArrays: true },
      },
    ];

    if (postLookupAnd.length > 0) {
      pipeline.push({ $match: { $and: postLookupAnd } });
    }

    pipeline.push({
      $addFields: {
        nameSortKey: {
          $toLower: {
            $ifNull: [
              "$application.resumeSnapshot.resumeJson.header.fullName",
              "",
            ],
          },
        },
        salarySortKey: {
          $ifNull: ["$jobSeekerDoc.expectedSalary", 0],
        },
        experienceSortKey: {
          $size: {
            $ifNull: [
              "$application.resumeSnapshot.resumeJson.sections.experience",
              [],
            ],
          },
        },
        prioritySortKey: {
          $switch: {
            branches: [
              { case: { $eq: ["$priority", "high"] }, then: 0 },
              { case: { $eq: ["$priority", "medium"] }, then: 1 },
              { case: { $eq: ["$priority", "low"] }, then: 2 },
            ],
            // Null / missing priority sorts after explicit values.
            default: 3,
          },
        },
      },
    });

    pipeline.push({
      $facet: {
        items: [
          { $sort: sort },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const [facet] = await SavedCandidateModel.aggregate<{
      items: Array<Parameters<typeof mapListItem>[0]>;
      totalCount: Array<{ count: number }>;
    }>(pipeline);

    const total = facet?.totalCount?.[0]?.count ?? 0;
    const pagination = buildListPagination(page, limit, total);
    const items = (facet?.items ?? []).map(mapListItem);

    // If page was clamped by pagination helper, re-fetch when needed
    if (pagination.page !== page && total > 0) {
      return this.queryItems(employerId, { ...query, page: pagination.page });
    }

    return { items, pagination };
  }

  /**
   * Creates missing saved-candidate rows for applications currently in
   * Shortlisted status so the Shortlisted Candidates page stays complete.
   */
  async ensureSavedRowsForShortlistedApplications(
    employerId: string,
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerObjectId = new mongoose.Types.ObjectId(employerId);

    const shortlistedApps = await ApplicationModel.find({
      employerId: employerObjectId,
      status: "shortlisted",
    })
      .select("_id jobSeekerId jobId publicJobId shortlist")
      .lean();

    if (shortlistedApps.length === 0) {
      return;
    }

    const applicationIds = shortlistedApps.map((app) => app._id);
    const existingRows = await SavedCandidateModel.find({
      employerId: employerObjectId,
      applicationId: { $in: applicationIds },
    })
      .select("applicationId")
      .lean();

    const existingIds = new Set(
      existingRows.map((row) => row.applicationId.toString()),
    );
    const missingApps = shortlistedApps.filter(
      (app) => !existingIds.has(app._id.toString()),
    );

    if (missingApps.length === 0) {
      return;
    }

    const now = new Date();
    try {
      await SavedCandidateModel.insertMany(
        missingApps.map((app) => {
          const shortlist =
            app.shortlist && typeof app.shortlist === "object"
              ? (app.shortlist as {
                  priority?: string | null;
                  tags?: string[];
                  notes?: string;
                  shortlistedAt?: Date | null;
                  shortlistedByTeamMemberId?: mongoose.Types.ObjectId | null;
                  shortlistedByName?: string | null;
                })
              : null;

          // Never invent priority for historical / incomplete shortlist rows.
          const priority = normalizePriority(shortlist?.priority);

          const shortlistedAt =
            shortlist?.shortlistedAt instanceof Date
              ? shortlist.shortlistedAt
              : now;

          const actorName = text(shortlist?.shortlistedByName) || "Employer";

          return {
            employerId: employerObjectId,
            applicationId: app._id,
            jobSeekerId: app.jobSeekerId,
            jobId: app.jobId,
            publicJobId: app.publicJobId,
            savedAt: shortlistedAt,
            priority,
            tags: Array.isArray(shortlist?.tags) ? shortlist.tags : [],
            notes: text(shortlist?.notes),
            createdByTeamMemberId: shortlist?.shortlistedByTeamMemberId ?? null,
            createdByName: actorName,
            updatedByTeamMemberId: shortlist?.shortlistedByTeamMemberId ?? null,
            updatedByName: actorName,
          };
        }),
        { ordered: false },
      );
    } catch (error) {
      // Parallel requests may race on the unique employerId+applicationId index.
      const code =
        error && typeof error === "object" && "code" in error
          ? (error as { code?: number }).code
          : undefined;
      if (code !== 11000) {
        throw error;
      }
    }
  }

  async list(employerId: string, query: ListSavedCandidatesQuerySchema) {
    await ensureEmployerJobRelationsConsistent(employerId);

    if (text(query.applicationStatus) === "shortlisted") {
      await this.ensureSavedRowsForShortlistedApplications(employerId);
    }

    const result = await this.queryItems(employerId, query);
    return {
      savedCandidates: result.items,
      pagination: result.pagination,
    };
  }

  /**
   * Full filtered dataset for export (ignores UI page size caps, max 5000).
   */
  async listForExport(
    employerId: string,
    query: Omit<ListSavedCandidatesQuerySchema, "page" | "limit">,
  ): Promise<{ items: SavedCandidateListItem[]; total: number }> {
    if (text(query.applicationStatus) === "shortlisted") {
      await this.ensureSavedRowsForShortlistedApplications(employerId);
    }

    const result = await this.queryItems(employerId, {
      ...query,
      page: 1,
      limit: SAVED_CANDIDATE_EXPORT_MAX_ROWS,
    });
    return {
      items: result.items,
      total: result.pagination.total,
    };
  }
}

export const savedCandidateService = new SavedCandidateService();
