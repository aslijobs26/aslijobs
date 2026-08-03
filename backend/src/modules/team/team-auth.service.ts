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
  /** Required when the same email is active on multiple employer accounts. */
  employerId?: string;
};

class TeamAuthService {
  async login(input: TeamMemberLoginInput) {
    const email = input.email.trim().toLowerCase();
    const employerFilter = input.employerId?.trim();

    const members = await TeamMemberModel.find({
      email,
      isDeleted: false,
      status: "active",
      ...(employerFilter ? { employerId: employerFilter } : {}),
    }).select("+passwordHash");

    if (members.length === 0) {
      throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
    }

    if (members.length > 1 && !employerFilter) {
      const employerIds = members.map((member) => String(member.employerId));
      const employers = await EmployerModel.find({
        _id: { $in: employerIds },
      })
        .select("_id companyName establishmentName accountType")
        .lean();

      const options = employers.map((employer) => {
        const companyName =
          employer.accountType === "individual"
            ? employer.establishmentName?.trim() ||
              employer.companyName?.trim() ||
              "Organization"
            : employer.companyName?.trim() || "Organization";
        return {
          employerId: String(employer._id),
          companyName,
        };
      });

      throw new AppError(
        "Multiple organizations found for this email. Select an organization to continue.",
        HTTP_STATUS.CONFLICT,
        { code: "MULTI_EMPLOYER_LOGIN", employers: options },
      );
    }

    const member = members[0]!;
    if (!member.passwordHash) {
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
    member.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    member.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
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
      rbac: await rbacService.getWorkspaceSession(rbac),
    };
  }

  async getRbacSession(context: ResolvedRbacContext) {
    return rbacService.getWorkspaceSession(context);
  }
}

export const teamAuthService = new TeamAuthService();
