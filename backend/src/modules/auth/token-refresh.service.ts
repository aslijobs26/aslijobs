import bcrypt from "bcryptjs";
import { z } from "zod";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerModel } from "../employers/employer.model.js";
import { JobSeekerModel } from "../job-seekers/job-seeker.model.js";
import { TeamMemberModel } from "../team/team-member.model.js";
import { jwtService } from "./jwt.service.js";
import type { IssuedTokenPair, WorkspaceJwtPayload } from "./jwt.types.js";

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().trim().min(20).max(4096),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;

export type RefreshedSession = IssuedTokenPair & {
  principal: "employer" | "team_member" | "job_seeker";
};

async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

async function matchesRefreshHash(
  token: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) {
    return false;
  }
  return bcrypt.compare(token, hash);
}

function ensureRefreshNotExpired(expiresAt: Date | null | undefined): void {
  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    throw new AppError("Session expired. Please sign in again.", HTTP_STATUS.UNAUTHORIZED);
  }
}

class TokenRefreshService {
  async refreshWorkspace(refreshToken: string): Promise<RefreshedSession> {
    const payload = jwtService.verifyWorkspaceRefreshToken(refreshToken);

    if (payload.role === "employer") {
      return this.refreshEmployer(payload, refreshToken);
    }

    return this.refreshTeamMember(payload, refreshToken);
  }

  async refreshJobSeeker(refreshToken: string): Promise<RefreshedSession> {
    const payload = jwtService.verifyJobSeekerRefreshToken(refreshToken);
    const seeker = await JobSeekerModel.findById(payload.sub).select(
      "+refreshTokenHash +refreshTokenExpiresAt",
    );

    if (!seeker) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    ensureRefreshNotExpired(seeker.refreshTokenExpiresAt);
    const valid = await matchesRefreshHash(
      refreshToken,
      seeker.refreshTokenHash,
    );
    if (!valid) {
      // Possible theft / race: revoke stored refresh.
      seeker.refreshTokenHash = null;
      seeker.refreshTokenExpiresAt = null;
      await seeker.save();
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = jwtService.issueJobSeekerTokens({
      sub: seeker._id.toString(),
      whatsappNumber: seeker.whatsappNumber,
    });

    seeker.refreshTokenHash = await hashRefreshToken(tokens.refreshToken);
    seeker.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    await seeker.save();

    return { ...tokens, principal: "job_seeker" };
  }

  async logoutWorkspace(refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = jwtService.verifyWorkspaceRefreshToken(refreshToken);
      if (payload.role === "employer") {
        await EmployerModel.updateOne(
          { _id: payload.sub },
          { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } },
        );
        return;
      }

      await TeamMemberModel.updateOne(
        { _id: payload.sub, employerId: payload.employerId },
        { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } },
      );
    } catch {
      // Logout is idempotent — invalid tokens still clear client-side.
    }
  }

  async logoutJobSeeker(refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = jwtService.verifyJobSeekerRefreshToken(refreshToken);
      await JobSeekerModel.updateOne(
        { _id: payload.sub },
        { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } },
      );
    } catch {
      // Idempotent.
    }
  }

  private async refreshEmployer(
    payload: Extract<WorkspaceJwtPayload, { role: "employer" }>,
    refreshToken: string,
  ): Promise<RefreshedSession> {
    const employer = await EmployerModel.findById(payload.sub).select(
      "+refreshTokenHash +refreshTokenExpiresAt",
    );

    if (!employer) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    ensureRefreshNotExpired(employer.refreshTokenExpiresAt);
    const valid = await matchesRefreshHash(
      refreshToken,
      employer.refreshTokenHash,
    );
    if (!valid) {
      employer.refreshTokenHash = null;
      employer.refreshTokenExpiresAt = null;
      await employer.save();
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = jwtService.issueEmployerTokens({
      sub: employer._id.toString(),
      accountType: employer.accountType as
        | "company"
        | "consultancy"
        | "individual",
      whatsappNumber: employer.whatsappNumber,
    });

    employer.refreshTokenHash = await hashRefreshToken(tokens.refreshToken);
    employer.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    await employer.save();

    return { ...tokens, principal: "employer" };
  }

  private async refreshTeamMember(
    payload: Extract<WorkspaceJwtPayload, { role: "team_member" }>,
    refreshToken: string,
  ): Promise<RefreshedSession> {
    const member = await TeamMemberModel.findOne({
      _id: payload.sub,
      employerId: payload.employerId,
      isDeleted: false,
      status: "active",
    }).select("+refreshTokenHash +refreshTokenExpiresAt");

    if (!member) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    ensureRefreshNotExpired(member.refreshTokenExpiresAt);
    const valid = await matchesRefreshHash(
      refreshToken,
      member.refreshTokenHash,
    );
    if (!valid) {
      member.refreshTokenHash = null;
      member.refreshTokenExpiresAt = null;
      await member.save();
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = jwtService.issueTeamMemberTokens({
      sub: String(member._id),
      employerId: String(member.employerId),
    });

    member.refreshTokenHash = await hashRefreshToken(tokens.refreshToken);
    member.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    member.lastActiveAt = new Date();
    await member.save();

    return { ...tokens, principal: "team_member" };
  }
}

export const tokenRefreshService = new TokenRefreshService();
