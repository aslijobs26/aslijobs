import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type {
  EmployerJwtPayload,
  IssuedTokenPair,
  JobSeekerJwtPayload,
} from "./jwt.types.js";

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/i.exec(duration.trim());
  if (!match) {
    throw new AppError(
      "Invalid JWT expiry configuration",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      throw new AppError(
        "Invalid JWT expiry configuration",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
  }
}

export class JwtService {
  issueEmployerTokens(
    payload: Omit<EmployerJwtPayload, "role">,
  ): IssuedTokenPair {
    const accessTokenExpiresAt = new Date(
      Date.now() + parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN),
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
    );

    const tokenPayload: EmployerJwtPayload = {
      ...payload,
      role: "employer",
    };

    const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const refreshToken = jwt.sign(
      { ...tokenPayload, typ: "refresh" },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      },
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  verifyAccessToken(token: string): EmployerJwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as EmployerJwtPayload;

      if (decoded.role !== "employer" || !decoded.sub) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (env.NODE_ENV === "development") {
        const reason =
          error instanceof Error ? `${error.name}: ${error.message}` : "unknown";
        console.error(`[JWT] access token verification failed (${reason})`);
      }

      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
  }

  verifyRefreshToken(token: string): EmployerJwtPayload {
    try {
      const decoded = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET,
      ) as EmployerJwtPayload & { typ?: string };

      if (decoded.role !== "employer" || !decoded.sub) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
  }

  issueJobSeekerTokens(
    payload: Omit<JobSeekerJwtPayload, "role">,
  ): IssuedTokenPair {
    const accessTokenExpiresAt = new Date(
      Date.now() + parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN),
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
    );

    const tokenPayload: JobSeekerJwtPayload = {
      ...payload,
      role: "job_seeker",
    };

    const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const refreshToken = jwt.sign(
      { ...tokenPayload, typ: "refresh" },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      },
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  verifyJobSeekerAccessToken(token: string): JobSeekerJwtPayload {
    try {
      const decoded = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET,
      ) as JobSeekerJwtPayload;

      if (decoded.role !== "job_seeker" || !decoded.sub) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
  }

  verifyJobSeekerRefreshToken(token: string): JobSeekerJwtPayload {
    try {
      const decoded = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET,
      ) as JobSeekerJwtPayload & { typ?: string };

      if (decoded.role !== "job_seeker" || !decoded.sub) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
  }
}

export const jwtService = new JwtService();
