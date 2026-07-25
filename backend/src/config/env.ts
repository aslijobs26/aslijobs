import { config } from "dotenv";
import { z } from "zod";
import { normalizeOrigin } from "../utils/cors-origins.js";

config();

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
  JWT_ACCESS_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
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
  OTP_PROVIDER: z.enum(["console", "whatsapp"]).default("console"),
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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
