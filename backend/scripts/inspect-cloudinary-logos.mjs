import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

config({ path: ".env" });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

if (!cloudName || !apiKey || !apiSecret) {
  console.log(JSON.stringify({ ok: false, reason: "missing_cloudinary_env" }));
  process.exit(0);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const prefixes = [
  "aslijobs/employer-logos",
  "aslijobs/employer-profile-photos",
  "aslijobs/company-assets",
  "employer-logos",
  "aslijobs",
];

const out = { ok: true, cloudName, prefixes: {} };

for (const prefix of prefixes) {
  try {
    const res = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: 50,
      resource_type: "image",
    });
    out.prefixes[prefix] = {
      count: res.resources?.length ?? 0,
      nextCursor: res.next_cursor || null,
      sample: (res.resources || []).slice(0, 10).map((r) => ({
        publicId: r.public_id,
        url: r.secure_url,
        bytes: r.bytes,
        createdAt: r.created_at,
      })),
    };
  } catch (error) {
    out.prefixes[prefix] = {
      error: error?.message || String(error),
    };
  }
}

console.log(JSON.stringify(out, null, 2));
