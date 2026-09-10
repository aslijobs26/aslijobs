import type { NextConfig } from "next";

/**
 * Next.js blocks cross-origin access to `/_next/*` (including HMR websockets)
 * unless the browser host is listed here. Needed when opening the Network URL
 * (e.g. http://192.168.1.20:3000) instead of localhost.
 *
 * Override/extend via NEXT_DEV_ALLOWED_ORIGINS=192.168.1.20,10.0.0.5
 */
function resolveAllowedDevOrigins(): string[] {
  const fromEnv = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      "192.168.1.20",
      ...fromEnv,
    ]),
  );
}

const nextConfig: NextConfig = {
  allowedDevOrigins: resolveAllowedDevOrigins(),
};

export default nextConfig;
