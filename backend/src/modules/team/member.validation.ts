import { z } from "zod";
import {
  TEAM_ACCESS_LEVELS,
  TEAM_INVITE_MESSAGE_MAX_LENGTH,
  TEAM_INVITATION_STATUSES,
  TEAM_MEMBER_DESIGNATION_MAX_LENGTH,
  TEAM_MEMBER_LIST_SORTS,
  TEAM_MEMBER_NAME_MAX_LENGTH,
  TEAM_MEMBER_NAME_MIN_LENGTH,
  TEAM_MEMBER_PASSWORD_MAX_LENGTH,
  TEAM_MEMBER_PASSWORD_MIN_LENGTH,
  TEAM_MEMBER_PASSWORD_PATTERN,
  TEAM_MEMBER_PASSWORD_REQUIREMENTS_MESSAGE,
  TEAM_MEMBER_PHONE_MAX_LENGTH,
  TEAM_MEMBER_STATUSES,
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

export const memberIdParamsSchema = z.object({
  memberId: objectIdSchema,
});

export const invitationIdParamsSchema = z.object({
  invitationId: objectIdSchema,
});

export const inviteMemberSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(TEAM_MEMBER_NAME_MIN_LENGTH)
    .max(TEAM_MEMBER_NAME_MAX_LENGTH),
  email: z.string().trim().email().toLowerCase(),
  phone: optionalTrimmed(TEAM_MEMBER_PHONE_MAX_LENGTH),
  departmentId: objectIdSchema,
  roleId: objectIdSchema,
  designation: optionalTrimmed(TEAM_MEMBER_DESIGNATION_MAX_LENGTH),
  accessLevel: z.enum(TEAM_ACCESS_LEVELS).optional(),
  message: optionalTrimmed(TEAM_INVITE_MESSAGE_MAX_LENGTH),
});

export const updateMemberSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(TEAM_MEMBER_NAME_MIN_LENGTH)
      .max(TEAM_MEMBER_NAME_MAX_LENGTH)
      .optional(),
    phone: optionalTrimmed(TEAM_MEMBER_PHONE_MAX_LENGTH).optional(),
    designation: optionalTrimmed(TEAM_MEMBER_DESIGNATION_MAX_LENGTH).optional(),
    departmentId: objectIdSchema.optional(),
    roleId: objectIdSchema.optional(),
    accessLevel: z.enum(TEAM_ACCESS_LEVELS).optional(),
    status: z.enum(["active", "inactive", "suspended"] as const).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const transferMemberDepartmentSchema = z.object({
  departmentId: objectIdSchema,
});

export const changeMemberRoleSchema = z.object({
  roleId: objectIdSchema,
});

const strongPasswordSchema = z
  .string()
  .min(TEAM_MEMBER_PASSWORD_MIN_LENGTH)
  .max(TEAM_MEMBER_PASSWORD_MAX_LENGTH)
  .regex(
    TEAM_MEMBER_PASSWORD_PATTERN,
    TEAM_MEMBER_PASSWORD_REQUIREMENTS_MESSAGE,
  );

export const acceptInvitationSchema = z
  .object({
    token: z.string().trim().min(32).max(128),
    fullName: z
      .string()
      .trim()
      .min(TEAM_MEMBER_NAME_MIN_LENGTH)
      .max(TEAM_MEMBER_NAME_MAX_LENGTH),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1),
    acceptTerms: z.literal(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const previewInvitationQuerySchema = z.object({
  token: z.string().trim().min(32).max(128),
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

export const listMembersQuerySchema = z.object({
  search: z.string().trim().optional().default(""),
  departmentId: objectIdSchema.optional(),
  roleId: objectIdSchema.optional(),
  status: z.enum(TEAM_MEMBER_STATUSES).optional(),
  invitationStatus: z.enum(TEAM_INVITATION_STATUSES).optional(),
  joinedFrom: optionalDateString,
  joinedTo: optionalDateString,
  lastActiveFrom: optionalDateString,
  lastActiveTo: optionalDateString,
  sort: z.enum(TEAM_MEMBER_LIST_SORTS).optional().default("joined_newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type TransferMemberDepartmentInput = z.infer<
  typeof transferMemberDepartmentSchema
>;
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type PreviewInvitationQuery = z.infer<
  typeof previewInvitationQuerySchema
>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
