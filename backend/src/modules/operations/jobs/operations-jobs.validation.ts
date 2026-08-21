import { z } from "zod";
import {
  JOB_LISTING_PAYMENT_STATUSES,
  JOB_STATUSES,
} from "../../../constants/job.constants.js";

export const OPERATIONS_JOB_TABS = [
  "all",
  "live",
  "pending_payment",
  "expired",
  "drafts",
] as const;

export const listOperationsJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  tab: z.enum(OPERATIONS_JOB_TABS).default("all"),
  search: z.string().trim().max(200).optional().default(""),
  status: z
    .union([z.enum(JOB_STATUSES), z.literal("")])
    .optional()
    .default(""),
  paymentStatus: z
    .union([z.enum(JOB_LISTING_PAYMENT_STATUSES), z.literal("")])
    .optional()
    .default(""),
  category: z.string().trim().max(120).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  sort: z
    .enum(["latest", "oldest", "applications_desc"])
    .optional()
    .default("latest"),
});

export type ListOperationsJobsQuery = z.infer<
  typeof listOperationsJobsQuerySchema
>;
