import { config } from "dotenv";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

config({ path: ".env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function basenameNoExt(value) {
  const name = String(value || "")
    .split("?")[0]
    .split("/")
    .pop();
  return name.replace(/\.[^.]+$/, "");
}

async function listAll(prefix) {
  const resources = [];
  let nextCursor;
  do {
    const res = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: 100,
      resource_type: "image",
      next_cursor: nextCursor,
    });
    resources.push(...(res.resources || []));
    nextCursor = res.next_cursor;
  } while (nextCursor);
  return resources;
}

await mongoose.connect(process.env.MONGO_URI);
const employers = await mongoose.connection.db
  .collection("employers")
  .find({})
  .project({
    companyName: 1,
    establishmentName: 1,
    firstName: 1,
    lastName: 1,
    accountType: 1,
    employerCode: 1,
    displayId: 1,
    companyLogo: 1,
    profilePhoto: 1,
  })
  .toArray();

const logoResources = await listAll("aslijobs/employer-logos");
const photoResources = await listAll("aslijobs/employer-profile-photos");

const cloudByBase = new Map();
for (const r of [...logoResources, ...photoResources]) {
  const base = basenameNoExt(r.public_id);
  cloudByBase.set(base, r);
}

const matches = [];
const missing = [];

for (const emp of employers) {
  const name =
    emp.companyName ||
    emp.establishmentName ||
    [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
    "";

  for (const field of ["companyLogo", "profilePhoto"]) {
    const asset = emp[field];
    const url = asset?.url?.trim() || "";
    const storagePath = asset?.storagePath?.trim() || "";
    if (!url && !storagePath) continue;

    const base = basenameNoExt(url || storagePath);
    const hit = cloudByBase.get(base);
    if (hit) {
      matches.push({
        employerId: String(emp._id),
        name,
        field,
        mongoUrl: url,
        cloudUrl: hit.secure_url,
        publicId: hit.public_id,
      });
    } else {
      missing.push({
        employerId: String(emp._id),
        name,
        field,
        mongoUrl: url,
        storagePath,
        storageProvider: asset?.storageProvider || "",
        base,
      });
    }
  }
}

console.log(
  JSON.stringify(
    {
      mongoEmployers: employers.length,
      cloudinaryLogos: logoResources.length,
      cloudinaryPhotos: photoResources.length,
      exactBasenameMatches: matches.length,
      missingLocalRefs: missing.length,
      matches,
      missing,
      unmatchedCloudinary: [...logoResources, ...photoResources]
        .filter((r) => !matches.some((m) => m.publicId === r.public_id))
        .map((r) => ({ publicId: r.public_id, url: r.secure_url })),
    },
    null,
    2,
  ),
);

await mongoose.disconnect();
