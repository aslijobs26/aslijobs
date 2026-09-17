import { z } from "zod";
import { OPERATIONS_ORG_UNIT_TYPES } from "./operations-org-unit.model.js";

const objectIdString = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id.");

export const listOrgTreeQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z.enum(["active", "archived", "all"]).optional().default("active"),
  scopeId: z.string().trim().optional().default(""),
});

export const orgUnitIdParamsSchema = z.object({
  unitId: objectIdString,
});

export const createOrgUnitBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(OPERATIONS_ORG_UNIT_TYPES),
  parentId: objectIdString.nullable().optional(),
  code: z.string().trim().max(40).optional(),
  timezone: z.string().trim().max(64).optional(),
  primaryOffice: z.string().trim().max(160).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  headUserId: objectIdString.nullable().optional(),
  establishedAt: z.string().datetime().nullable().optional(),
});

export const updateOrgUnitBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z.string().trim().max(40).optional(),
    timezone: z.string().trim().max(64).optional(),
    primaryOffice: z.string().trim().max(160).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    headUserId: objectIdString.nullable().optional(),
    establishedAt: z.string().datetime().nullable().optional(),
    parentId: objectIdString.nullable().optional(),
    status: z.enum(["active", "archived"]).optional(),
    revision: z.number().int().positive().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required.",
  });

export const orgUnitPeopleQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z
    .enum(["active", "inactive", "suspended", "all"])
    .optional()
    .default("active"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListOrgTreeQuery = z.infer<typeof listOrgTreeQuerySchema>;
export type CreateOrgUnitBody = z.infer<typeof createOrgUnitBodySchema>;
export type UpdateOrgUnitBody = z.infer<typeof updateOrgUnitBodySchema>;
export type OrgUnitPeopleQuery = z.infer<typeof orgUnitPeopleQuerySchema>;
