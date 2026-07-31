import { z } from "zod";
import {
  DEPARTMENT_CODE_MAX_LENGTH,
  DEPARTMENT_COLORS,
  DEPARTMENT_DESCRIPTION_MAX_LENGTH,
  DEPARTMENT_EMAIL_MAX_LENGTH,
  DEPARTMENT_ICONS,
  DEPARTMENT_LIST_SORTS,
  DEPARTMENT_NAME_MAX_LENGTH,
  DEPARTMENT_NAME_MIN_LENGTH,
  DEPARTMENT_PHONE_MAX_LENGTH,
  DEPARTMENT_STATUSES,
} from "./team.constants.js";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value ?? "");

const optionalNullableObjectId = z
  .union([objectIdSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === "" || value === null) {
      return null;
    }
    return value;
  });

export const departmentIdParamsSchema = z.object({
  departmentId: objectIdSchema,
});

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(DEPARTMENT_NAME_MIN_LENGTH, "Department name is required")
    .max(DEPARTMENT_NAME_MAX_LENGTH),
  code: optionalTrimmed(DEPARTMENT_CODE_MAX_LENGTH),
  description: optionalTrimmed(DEPARTMENT_DESCRIPTION_MAX_LENGTH),
  headMemberId: optionalNullableObjectId,
  email: optionalTrimmed(DEPARTMENT_EMAIL_MAX_LENGTH).refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Invalid department email",
  ),
  phone: optionalTrimmed(DEPARTMENT_PHONE_MAX_LENGTH),
  status: z.enum(DEPARTMENT_STATUSES).optional().default("active"),
  color: z.enum(DEPARTMENT_COLORS).optional().default("primary"),
  icon: z.enum(DEPARTMENT_ICONS).optional().default("building"),
});

export const updateDepartmentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(DEPARTMENT_NAME_MIN_LENGTH)
      .max(DEPARTMENT_NAME_MAX_LENGTH)
      .optional(),
    code: optionalTrimmed(DEPARTMENT_CODE_MAX_LENGTH).optional(),
    description: optionalTrimmed(DEPARTMENT_DESCRIPTION_MAX_LENGTH).optional(),
    headMemberId: optionalNullableObjectId,
    email: optionalTrimmed(DEPARTMENT_EMAIL_MAX_LENGTH)
      .refine(
        (value) => value === "" || z.string().email().safeParse(value).success,
        "Invalid department email",
      )
      .optional(),
    phone: optionalTrimmed(DEPARTMENT_PHONE_MAX_LENGTH).optional(),
    status: z.enum(DEPARTMENT_STATUSES).optional(),
    color: z.enum(DEPARTMENT_COLORS).optional(),
    icon: z.enum(DEPARTMENT_ICONS).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine(
    (value) => value === "" || !Number.isNaN(Date.parse(value)),
    "Invalid date",
  );

const optionalNonNegativeInt = z.preprocess(
  (value) =>
    value === "" || value === undefined || value === null ? undefined : value,
  z.coerce.number().int().min(0).optional(),
);

export const listDepartmentsQuerySchema = z
  .object({
    search: z.string().trim().optional().default(""),
    status: z.enum(DEPARTMENT_STATUSES).optional(),
    headMemberId: objectIdSchema.optional(),
    createdFrom: optionalDateString,
    createdTo: optionalDateString,
    memberCountMin: optionalNonNegativeInt,
    memberCountMax: optionalNonNegativeInt,
    sort: z.enum(DEPARTMENT_LIST_SORTS).optional().default("newest"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .superRefine((data, ctx) => {
    if (
      data.memberCountMin !== undefined &&
      data.memberCountMax !== undefined &&
      data.memberCountMin > data.memberCountMax
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["memberCountMax"],
        message:
          "Maximum member count must be greater than or equal to minimum",
      });
    }

    if (data.createdFrom && data.createdTo) {
      const from = Date.parse(data.createdFrom);
      const to = Date.parse(data.createdTo);
      if (from > to) {
        ctx.addIssue({
          code: "custom",
          path: ["createdTo"],
          message: "Created to must be on or after created from",
        });
      }
    }
  });

export const listMemberOptionsQuerySchema = z.object({
  status: z.enum(["active", "inactive", "invited"]).optional().default("active"),
  search: z.string().trim().optional().default(""),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
export type ListMemberOptionsQuery = z.infer<
  typeof listMemberOptionsQuerySchema
>;
export type DepartmentIdParams = z.infer<typeof departmentIdParamsSchema>;
