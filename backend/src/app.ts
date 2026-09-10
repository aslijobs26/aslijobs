import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { isSensitiveUploadPublicPath } from "./modules/storage/private-file.service.js";
import apiRouter from "./routes/index.js";
import {
  buildAllowedCorsOrigins,
  buildDevelopmentCorsPorts,
  isDevelopmentLanOriginAllowed,
} from "./utils/cors-origins.js";

const app = express();

// Required so express-rate-limit keys by real client IP behind reverse proxies.
app.set("trust proxy", 1);

app.use(requestIdMiddleware);

const corsExtraOrigins = env.CORS_ALLOWED_ORIGINS.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowedCorsOrigins = buildAllowedCorsOrigins({
  frontendUrl: env.FRONTEND_URL,
  adminUrl: env.ADMIN_URL,
  extraOrigins: corsExtraOrigins,
});

const developmentCorsPorts =
  env.NODE_ENV === "development"
    ? buildDevelopmentCorsPorts({
        frontendUrl: env.FRONTEND_URL,
        adminUrl: env.ADMIN_URL,
        extraOrigins: corsExtraOrigins,
      })
    : null;

// Authenticated API responses must not be served from HTTP cache (304),
// otherwise status/timestamp updates can appear stale in Employer Jobs.
app.set("etag", false);
app.use("/api/v1", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  next();
});

// cross-origin: required so browser frontends on another host can read API responses.
// same-origin (Helmet default) blocks credentialed cross-origin fetches even when CORS allows them.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (health checks, server-to-server) omit Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Next.js / Vite Network URLs use LAN IPs (e.g. http://192.168.x.x:3000).
      // Without this, browser OTP send/verify calls are blocked by CORS even
      // though WhatsApp delivery itself is healthy.
      if (
        developmentCorsPorts &&
        isDevelopmentLanOriginAllowed(origin, developmentCorsPorts)
      ) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.STORAGE_PROVIDER === "local") {
  // Public static only for non-sensitive assets (employer logos, company assets).
  // Resumes / job-seeker profiles / employer docs require authenticated APIs.
  app.use("/uploads", (req, res, next) => {
    if (isSensitiveUploadPublicPath(req.path)) {
      res.status(404).end();
      return;
    }
    next();
  });
  app.use(
    "/uploads",
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      etag: true,
      lastModified: true,
      setHeaders(res) {
        res.setHeader(
          "Cache-Control",
          "public, max-age=86400, stale-while-revalidate=604800",
        );
      },
    }),
  );
}

/**
 * General API rate limit.
 * Auth OTP endpoints keep their own stricter dedicated limiters and are skipped
 * here so a busy dashboard cannot block legitimate login attempts.
 *
 * Development uses a much higher ceiling — Operations UI fans out many GETs
 * (list + analytics + badge poll + candidate photos). Production stays strict.
 */
const AUTH_OTP_PATH_SUFFIXES = [
  "/employers/login/send-otp",
  "/employers/login/resend-otp",
  "/employers/login/verify-otp",
  "/employers/register",
  "/jobseekers/login/send-otp",
  "/jobseekers/login/resend-otp",
  "/jobseekers/login/verify-otp",
  "/jobseekers/register",
  "/jobseekers/register/resend-otp",
  "/jobseekers/register/verify-otp",
  "/auth/workspace/refresh",
  "/auth/job-seeker/refresh",
  "/auth/workspace/logout",
  "/auth/job-seeker/logout",
] as const;

/** High-frequency authenticated GETs that should not burn the global budget. */
function isHighFrequencyOperationsRead(pathName: string): boolean {
  if (pathName.includes("/operations/registration-awareness/badges")) {
    return true;
  }
  if (
    pathName.includes("/operations/candidates/seekers/") &&
    pathName.endsWith("/photo")
  ) {
    return true;
  }
  return false;
}

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "development" ? 5_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const pathName = req.path;
    if (pathName === "/health" || pathName === "/api/v1/health") {
      return true;
    }
    if (isHighFrequencyOperationsRead(pathName)) {
      return true;
    }
    if (
      pathName.includes("/employers/") &&
      (pathName.endsWith("/otp/resend") || pathName.endsWith("/otp/verify"))
    ) {
      return true;
    }
    return AUTH_OTP_PATH_SUFFIXES.some(
      (suffix) =>
        pathName === suffix ||
        pathName === `/api/v1${suffix}` ||
        pathName.endsWith(suffix),
    );
  },
});

app.use("/api/v1", apiRateLimit);

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    message: "AsliJobs API is running",
    data: {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

app.use("/api/v1", apiRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
