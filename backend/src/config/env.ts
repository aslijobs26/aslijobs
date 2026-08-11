import { config } from "dotenv";
import { z } from "zod";
import { normalizeOrigin } from "../utils/cors-origins.js";

/**
 * Always prefer values from backend/.env over stale shell/IDE-injected env.
 * tsx watch does not reload .env; Cursor/dotenv may pre-inject older values.
 */
config({ override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGO_URI: z.string().optional(),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default("aslijobs-dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default("aslijobs-dev-refresh-secret-change-me"),
  // Short-lived access token; clients renew via /auth/.../refresh.
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  /**
   * Public API base used in export resume links (no trailing slash).
   * Example: http://localhost:5000/api/v1
   */
  PUBLIC_API_URL: z
    .string()
    .url()
    .default("http://localhost:5000/api/v1")
    .transform((value) => value.replace(/\/+$/, "")),
  RESUME_ACCESS_SECRET: z
    .string()
    .min(16)
    .default("aslijobs-dev-resume-access-secret-change-me"),
  RESUME_ACCESS_EXPIRES_IN: z.string().default("24h"),
  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .transform(normalizeOrigin),
  ADMIN_URL: z
    .string()
    .url()
    .default("http://localhost:5173")
    .transform(normalizeOrigin),
  /**
   * Optional comma-separated extra browser origins allowed by CORS
   * (e.g. preview deployments). Trailing slashes are stripped.
   */
  CORS_ALLOWED_ORIGINS: z.string().optional().default(""),
  /** Resend API key for transactional email (team invitations). */
  RESEND_API_KEY: z.string().optional().default(""),
  /**
   * Transactional From address. Must use a domain verified in Resend.
   * Example: AsliJobs <noreply@aslijobs.com>
   * Never use Resend testing addresses for production delivery.
   */
  EMAIL_FROM: z.string().optional().default(""),
  OTP_PROVIDER: z.enum(["console", "whatsapp"]).default("console"),
  /**
   * Temporary auth testing only. Must be the string "true" to enable.
   * Missing / any other value → disabled (safe default).
   */
  OTP_TEST_MODE: z.preprocess(
    (value) => value === "true",
    z.boolean(),
  ),
  /**
   * Fixed OTP accepted for any phone when OTP_TEST_MODE is enabled.
   * Must match the app OTP length (currently 4 digits). Never expose to clients.
   */
  OTP_TEST_CODE: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string(),
  ),
  STORAGE_PROVIDER: z.enum(["local", "cloudinary"]).default("local"),
  UPLOAD_DIR: z.string().default("uploads"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_ROOT_FOLDER: z.string().default("aslijobs"),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  /**
   * Minutes before the same visitor (guest or job seeker) can count
   * another view on the same job. Default: 30.
   */
  JOB_VIEW_COOLDOWN_MINUTES: z.coerce.number().int().min(1).default(30),
  /**
   * Inbox retention for unread notifications (days from createdAt).
   * Expired rows are hidden from inbox/unread APIs; conversation history is preserved.
   */
  NOTIFICATION_UNREAD_RETENTION_DAYS: z.coerce.number().int().min(1).default(90),
  /**
   * Inbox retention for read notifications (days from readAt).
   * Recalculated when a notification is marked read.
   */
  NOTIFICATION_READ_RETENTION_DAYS: z.coerce.number().int().min(1).default(30),
  /** Max documents removed per cleanup batch (hard delete of eligible rows). */
  NOTIFICATION_BATCH_DELETE_LIMIT: z.coerce
    .number()
    .int()
    .min(1)
    .max(10_000)
    .default(1000),
  /** How often the retention cleanup job runs (milliseconds). Default: 1 hour. */
  NOTIFICATION_CLEANUP_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(60_000)
    .default(3_600_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const DEV_SECRET_DEFAULTS = new Set([
  "aslijobs-dev-access-secret-change-me",
  "aslijobs-dev-refresh-secret-change-me",
  "aslijobs-dev-resume-access-secret-change-me",
]);

if (parsed.data.NODE_ENV === "production") {
  const secrets = [
    parsed.data.JWT_ACCESS_SECRET,
    parsed.data.JWT_REFRESH_SECRET,
    parsed.data.RESUME_ACCESS_SECRET,
  ];
  if (secrets.some((value) => DEV_SECRET_DEFAULTS.has(value))) {
    console.error(
      "Production refused to start: replace JWT/resume secret defaults in environment.",
    );
    process.exit(1);
  }
  if (!parsed.data.MONGO_URI?.trim()) {
    console.error("Production refused to start: MONGO_URI is required.");
    process.exit(1);
  }
}

export const env = parsed.data;
