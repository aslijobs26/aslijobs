import bcrypt from "bcryptjs";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { jwtService } from "../auth/jwt.service.js";
import { EmployerModel } from "../employers/employer.model.js";
import { recordTeamActivity } from "./team-activity.service.js";
import { TeamMemberModel } from "./team-member.model.js";
import { rbacService } from "../rbac/rbac.service.js";
import type { ResolvedRbacContext } from "../rbac/rbac.engine.js";

export type TeamMemberLoginInput = {
  email: string;
  password: string;
};

class TeamAuthService {
  async login(input: TeamMemberLoginInput) {
    const email = input.email.trim().toLowerCase();
    const member = await TeamMemberModel.findOne({
      email,
      isDeleted: false,
      status: "active",
    }).select("+passwordHash");

    if (!member || !member.passwordHash) {
      throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
    }

    const valid = await bcrypt.compare(input.password, member.passwordHash);
    if (!valid) {
      throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
    }

    const employerId = String(member.employerId);
    const employer = await EmployerModel.findById(employerId).lean();
    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const rbac = await rbacService.resolveMemberContext(
      employerId,
      String(member._id),
    );

    const tokens = jwtService.issueTeamMemberTokens({
      sub: String(member._id),
      employerId,
    });

    member.lastActiveAt = new Date();
    await member.save();

    await recordTeamActivity({
      employerId,
      type: "member_login",
      message: `${member.fullName} signed in`,
      memberId: member._id,
      roleId: member.roleId,
      departmentId: member.departmentId,
      metadata: { principalType: "member" },
    });

    return {
      ...tokens,
      member: {
        id: String(member._id),
        fullName: member.fullName,
        email: member.email,
        employerId,
      },
      employer: {
        id: employerId,
        companyName: employer.companyName ?? "",
        accountType: employer.accountType,
      },
      rbac: rbacService.getSessionPayload(rbac),
    };
  }

  getRbacSession(context: ResolvedRbacContext) {
    return rbacService.getSessionPayload(context);
  }
}

export const teamAuthService = new TeamAuthService();
