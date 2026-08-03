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
import apiRouter from "./routes/index.js";
import { buildAllowedCorsOrigins } from "./utils/cors-origins.js";

const app = express();

// Required so express-rate-limit keys by real client IP behind reverse proxies.
app.set("trust proxy", 1);

app.use(requestIdMiddleware);

const allowedCorsOrigins = buildAllowedCorsOrigins({
  frontendUrl: env.FRONTEND_URL,
  adminUrl: env.ADMIN_URL,
  extraOrigins: env.CORS_ALLOWED_ORIGINS.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
});

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
  // Serve uploads BEFORE the API rate limiter so avatars/logos/resumes do not
  // consume the shared request budget used by authenticated dashboard traffic.
  app.use(
    "/uploads",
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)),
  );
}

/**
 * General API rate limit.
 * Auth OTP endpoints keep their own stricter dedicated limiters and are skipped
 * here so a busy dashboard cannot block legitimate login attempts.
 * Max is intentionally unchanged — request storms must be fixed at the source.
 */
const AUTH_OTP_PATH_SUFFIXES = [
  "/employers/login/send-otp",
  "/employers/login/resend-otp",
  "/employers/login/verify-otp",
  "/jobseekers/login/send-otp",
  "/jobseekers/login/resend-otp",
  "/jobseekers/login/verify-otp",
  "/auth/workspace/refresh",
  "/auth/job-seeker/refresh",
  "/auth/workspace/logout",
  "/auth/job-seeker/logout",
] as const;

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const pathName = req.path;
    if (pathName === "/health" || pathName === "/api/v1/health") {
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
