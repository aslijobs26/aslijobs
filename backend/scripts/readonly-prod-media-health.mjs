/**
 * READ-ONLY production media health check.
 * Connects to aslijobs_prod, does not write.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env" });

const testUri = process.env.MONGO_URI;
if (!testUri?.includes("aslijobs_test")) {
  console.error("Expected local MONGO_URI to target aslijobs_test for deriving prod URI");
  process.exit(1);
}

const prodUri = testUri.replace(/\/aslijobs_test(\?|$)/, "/aslijobs_prod$1");

await mongoose.connect(prodUri, { readPreference: "secondaryPreferred" });
const db = mongoose.connection.db;
const employers = db.collection("employers");

const projection = {
  companyName: 1,
  establishmentName: 1,
  firstName: 1,
  lastName: 1,
  accountType: 1,
  "companyLogo.url": 1,
  "companyLogo.storageProvider": 1,
  "companyLogo.publicId": 1,
  "companyLogo.storagePath": 1,
  "profilePhoto.url": 1,
  "profilePhoto.storageProvider": 1,
  "profilePhoto.publicId": 1,
  "profilePhoto.storagePath": 1,
};

const docs = await employers.find({}, { projection }).toArray();

function classify(url, provider) {
  const u = String(url || "").trim();
  const p = String(provider || "").trim();
  if (!u) return "empty";
  if (/^https?:\/\/res\.cloudinary\.com\//i.test(u)) return "cloudinary_https";
  if (/^https?:\/\//i.test(u)) return "other_https";
  if (u.startsWith("/uploads/") || u.startsWith("uploads/")) return "legacy_uploads";
  return `other:${u.slice(0, 40)}`;
}

const stats = {
  db: mongoose.connection.name,
  totalEmployers: docs.length,
  logo: {
    empty: 0,
    cloudinary_https: 0,
    other_https: 0,
    legacy_uploads: 0,
    other: 0,
    providerCloudinary: 0,
    providerLocal: 0,
    providerEmpty: 0,
  },
  photo: {
    empty: 0,
    cloudinary_https: 0,
    other_https: 0,
    legacy_uploads: 0,
    other: 0,
    providerCloudinary: 0,
    providerLocal: 0,
    providerEmpty: 0,
  },
};

const mediaSamples = [];

for (const doc of docs) {
  const name =
    doc.companyName ||
    doc.establishmentName ||
    [doc.firstName, doc.lastName].filter(Boolean).join(" ") ||
    "";

  for (const field of ["companyLogo", "profilePhoto"]) {
    const asset = doc[field] || {};
    const bucket = field === "companyLogo" ? stats.logo : stats.photo;
    const kind = classify(asset.url, asset.storageProvider);
    if (kind === "empty") bucket.empty += 1;
    else if (kind === "cloudinary_https") bucket.cloudinary_https += 1;
    else if (kind === "other_https") bucket.other_https += 1;
    else if (kind === "legacy_uploads") bucket.legacy_uploads += 1;
    else bucket.other += 1;

    const provider = String(asset.storageProvider || "").trim();
    if (provider === "cloudinary") bucket.providerCloudinary += 1;
    else if (provider === "local") bucket.providerLocal += 1;
    else bucket.providerEmpty += 1;

    if (asset.url) {
      mediaSamples.push({
        id: String(doc._id),
        name,
        field,
        url: asset.url,
        storageProvider: provider,
        publicId: asset.publicId || "",
        kind,
      });
    }
  }
}

async function probeUrl(url) {
  try {
    const head = await fetch(url, { method: "HEAD" });
    let bytes = null;
    let contentType = head.headers.get("content-type");
    if (head.ok) {
      const get = await fetch(url, {
        headers: { Range: "bytes=0-63" },
      });
      contentType = get.headers.get("content-type") || contentType;
      const buf = Buffer.from(await get.arrayBuffer());
      bytes = buf.byteLength;
      const isImageMagic =
        (buf[0] === 0xff && buf[1] === 0xd8) || // jpeg
        (buf[0] === 0x89 && buf[1] === 0x50) || // png
        (buf[0] === 0x52 && buf[1] === 0x49) || // riff/webp
        (buf[0] === 0x47 && buf[1] === 0x49); // gif
      return {
        url,
        headStatus: head.status,
        getStatus: get.status,
        contentType,
        sampleBytes: bytes,
        looksLikeImage: isImageMagic || String(contentType).startsWith("image/"),
      };
    }
    return {
      url,
      headStatus: head.status,
      contentType,
      looksLikeImage: false,
    };
  } catch (error) {
    return { url, error: error.message || String(error) };
  }
}

const toProbe = mediaSamples.filter((m) =>
  ["cloudinary_https", "other_https", "legacy_uploads"].includes(m.kind),
);

const probes = [];
for (const item of toProbe) {
  let probeUrlValue = item.url;
  if (item.kind === "legacy_uploads") {
    const path = item.url.startsWith("/") ? item.url : `/${item.url}`;
    probeUrlValue = `https://aslijobs-backend.onrender.com${path}`;
  }
  const result = await probeUrl(probeUrlValue);
  probes.push({
    id: item.id,
    name: item.name,
    field: item.field,
    kind: item.kind,
    storageProvider: item.storageProvider,
    ...result,
  });
}

const broken = probes.filter(
  (p) => p.error || !p.looksLikeImage || (p.headStatus && p.headStatus >= 400),
);
const ok = probes.filter((p) => p.looksLikeImage && p.headStatus && p.headStatus < 400);

console.log(
  JSON.stringify(
    {
      readOnly: true,
      stats,
      mediaWithUrl: mediaSamples.length,
      probed: probes.length,
      okCount: ok.length,
      brokenCount: broken.length,
      broken,
      okSample: ok.slice(0, 8),
      legacyUploads: mediaSamples.filter((m) => m.kind === "legacy_uploads"),
    },
    null,
    2,
  ),
);

await mongoose.disconnect();
