import { Schema, model, type InferSchemaType } from "mongoose";
import {
  OPERATIONS_TEAM_ROLES,
  OPERATIONS_TEAM_USER_STATUSES,
} from "../operations.constants.js";

/**
 * Operations internal team user.
 *
 * `role` is currently an enum string (SUPER_ADMIN, OPERATIONS, …).
 * Team Management can later add custom role documents and an optional
 * `customRoleId` ObjectId without removing this field — permission
 * resolution already goes through `resolveOperationsUserPermissions`.
 */
const operationsTeamUserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      match: /^\d{10}$/,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: OPERATIONS_TEAM_ROLES,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: OPERATIONS_TEAM_USER_STATUSES,
      default: "active",
      index: true,
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "operations_team_users",
  },
);

export type OperationsTeamUserDocument = InferSchemaType<
  typeof operationsTeamUserSchema
>;

export const OperationsTeamUserModel = model(
  "OperationsTeamUser",
  operationsTeamUserSchema,
);
