import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";
import { isSensitiveUploadPublicPath } from "./private-file.service.js";

let cloudinaryConfigured = false;

function ensureCloudinaryConfigured(): boolean {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
  const apiKey = env.CLOUDINARY_API_KEY?.trim() ?? "";
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim() ?? "";

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    cloudinaryConfigured = true;
  }

  return true;
}

/**
 * Maps a public `/uploads` request path to a Cloudinary delivery URL candidate.
 * Does not prove the asset exists — callers must verify before redirecting.
 */
export function resolveCloudinaryDeliveryUrlForPublicUpload(
  requestPath: string,
): string | null {
  if (!ensureCloudinaryConfigured()) {
    return null;
  }

  if (isSensitiveUploadPublicPath(requestPath)) {
    return null;
  }

  const normalized = requestPath
    .split("?")[0]
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");

  if (!normalized || normalized.includes("..")) {
    return null;
  }

  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash <= 0) {
    return null;
  }

  const folder = normalized.slice(0, lastSlash);
  const filename = normalized.slice(lastSlash + 1);
  const baseName = filename.replace(/\.[^.]+$/, "");

  if (!folder || !baseName || baseName === filename) {
    return null;
  }

  const root = env.CLOUDINARY_ROOT_FOLDER.replace(/^\/+|\/+$/g, "");
  const publicId = `${root}/${folder}/${baseName}`;

  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
  });
}

/**
 * Returns a Cloudinary delivery URL only when the asset actually exists.
 * Prevents silent redirects to non-existent Cloudinary images (which break
 * <img> tags and force Admin initials fallbacks).
 */
export async function resolveExistingCloudinaryDeliveryUrlForPublicUpload(
  requestPath: string,
): Promise<string | null> {
  const deliveryUrl = resolveCloudinaryDeliveryUrlForPublicUpload(requestPath);
  if (!deliveryUrl) {
    return null;
  }

  try {
    const response = await fetch(deliveryUrl, { method: "HEAD" });
    if (response.ok) {
      return deliveryUrl;
    }
  } catch {
    return null;
  }

  return null;
}

export function hasCloudinaryPublicUploadCredentials(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME?.trim() &&
      env.CLOUDINARY_API_KEY?.trim() &&
      env.CLOUDINARY_API_SECRET?.trim(),
  );
}
