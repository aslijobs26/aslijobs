import { createHash, randomBytes } from "node:crypto";
import type { Types } from "mongoose";
import { TeamActivityModel } from "./team-activity.model.js";
import type { TeamActivityType } from "./team.constants.js";

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

export async function recordTeamActivity(input: {
  employerId: string | Types.ObjectId;
  type: TeamActivityType;
  message: string;
  memberId?: string | Types.ObjectId | null;
  departmentId?: string | Types.ObjectId | null;
  roleId?: string | Types.ObjectId | null;
  invitationId?: string | Types.ObjectId | null;
  actorEmployerId?: string | Types.ObjectId | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await TeamActivityModel.create({
    employerId: input.employerId,
    type: input.type,
    message: input.message,
    memberId: input.memberId ?? null,
    departmentId: input.departmentId ?? null,
    roleId: input.roleId ?? null,
    invitationId: input.invitationId ?? null,
    actorEmployerId: input.actorEmployerId ?? null,
    metadata: input.metadata ?? null,
  });
}
