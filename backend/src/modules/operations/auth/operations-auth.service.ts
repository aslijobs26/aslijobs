import bcrypt from "bcryptjs";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { jwtService } from "../../auth/jwt.service.js";
import { OperationsTeamUserModel } from "./operations-team-user.model.js";
import { resolveOperationsUserAccess } from "../rbac/operations-access.service.js";
import type {
  OperationsTeamAuthUser,
  OperationsTeamLoginInput,
  OperationsTeamLoginResponse,
  OperationsTeamSessionResponse,
} from "./operations-auth.types.js";

async function toAuthUser(user: {
  _id: { toString(): string };
  fullName: string;
  email?: string | null;
  mobileNumber: string;
  role: OperationsTeamAuthUser["role"];
  roleId?: { toString(): string } | null;
  departmentId?: { toString(): string } | null;
}): Promise<OperationsTeamAuthUser> {
  const access = await resolveOperationsUserAccess({
    _id: user._id.toString(),
    role: user.role,
    roleId: user.roleId ? String(user.roleId) : null,
    departmentId: user.departmentId ? String(user.departmentId) : null,
  });

  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email?.trim().toLowerCase() || "",
    mobileNumber: user.mobileNumber,
    role: user.role,
    roleId: access.roleId,
    roleName: access.roleName,
    departmentId: access.departmentId,
    departmentName: access.departmentName,
    isSuperAdmin: access.isSuperAdmin,
    canCreateRoles: access.canCreateRoles,
    canManageUsers: access.canManageUsers,
    canAssignRoles: access.canAssignRoles,
    permissions: access.permissions,
    grantedKeys: access.grantedKeys,
    delegatableKeys: access.delegatableKeys,
  };
}

class OperationsAuthService {
  async login(input: OperationsTeamLoginInput): Promise<OperationsTeamLoginResponse> {
    const email = input.email?.trim().toLowerCase() ?? "";
    const mobileNumber = input.mobileNumber?.trim() ?? "";

    const user = await OperationsTeamUserModel.findOne({
      status: "active",
      ...(email
        ? { email }
        : { mobileNumber }),
    }).select("+passwordHash");

    if (!user?.passwordHash) {
      throw new AppError(
        email
          ? "Invalid email or password."
          : "Invalid mobile number or password.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(
        email
          ? "Invalid email or password."
          : "Invalid mobile number or password.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const tokens = jwtService.issueOperationsTeamTokens({
      sub: String(user._id),
      teamRole: user.role,
      mobileNumber: user.mobileNumber,
    });

    user.lastActiveAt = new Date();
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    await user.save();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
      user: await toAuthUser(user),
    };
  }

  async refresh(refreshToken: string): Promise<OperationsTeamLoginResponse> {
    const payload = jwtService.verifyOperationsTeamRefreshToken(refreshToken);

    const user = await OperationsTeamUserModel.findOne({
      _id: payload.sub,
      status: "active",
    }).select("+refreshTokenHash +refreshTokenExpiresAt");

    if (
      !user?.refreshTokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const tokens = jwtService.issueOperationsTeamTokens({
      sub: String(user._id),
      teamRole: user.role,
      mobileNumber: user.mobileNumber,
    });

    user.lastActiveAt = new Date();
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokenExpiresAt = tokens.refreshTokenExpiresAt;
    await user.save();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
      user: await toAuthUser(user),
    };
  }

  async getSession(userId: string): Promise<OperationsTeamSessionResponse> {
    const user = await OperationsTeamUserModel.findOne({
      _id: userId,
      status: "active",
    }).lean();

    if (!user) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    return {
      user: await toAuthUser(user),
    };
  }

  async logout(userId: string): Promise<void> {
    await OperationsTeamUserModel.updateOne(
      { _id: userId },
      {
        $set: {
          refreshTokenHash: null,
          refreshTokenExpiresAt: null,
        },
      },
    );
  }
}

export const operationsAuthService = new OperationsAuthService();
