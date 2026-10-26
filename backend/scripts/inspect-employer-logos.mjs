import { config } from "dotenv";
import mongoose from "mongoose";
import { existsSync } from "node:fs";
import path from "node:path";

config({ path: ".env" });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI missing");
  process.exit(1);
}

await mongoose.connect(uri);
const employers = mongoose.connection.db.collection("employers");

const sample = await employers
  .find(
    {},
    {
      projection: {
        companyName: 1,
        establishmentName: 1,
        firstName: 1,
        lastName: 1,
        accountType: 1,
        "companyLogo.url": 1,
        "companyLogo.storagePath": 1,
        "companyLogo.storageProvider": 1,
        "companyLogo.publicId": 1,
        "profilePhoto.url": 1,
        "profilePhoto.storagePath": 1,
        "profilePhoto.storageProvider": 1,
        "profilePhoto.publicId": 1,
      },
    },
  )
  .sort({ updatedAt: -1 })
  .limit(40)
  .toArray();

const stats = {
  total: await employers.countDocuments({}),
  withLogoUrl: await employers.countDocuments({
    "companyLogo.url": { $exists: true, $nin: [null, ""] },
  }),
  withPhotoUrl: await employers.countDocuments({
    "profilePhoto.url": { $exists: true, $nin: [null, ""] },
  }),
  logoLocal: await employers.countDocuments({
    "companyLogo.storageProvider": "local",
  }),
  logoCloudinary: await employers.countDocuments({
    "companyLogo.storageProvider": "cloudinary",
  }),
  logoUploadsPath: await employers.countDocuments({
    "companyLogo.url": { $regex: "^/uploads/" },
  }),
  logoHttp: await employers.countDocuments({
    "companyLogo.url": { $regex: "^https?://" },
  }),
  photoUploadsPath: await employers.countDocuments({
    "profilePhoto.url": { $regex: "^/uploads/" },
  }),
  photoHttp: await employers.countDocuments({
    "profilePhoto.url": { $regex: "^https?://" },
  }),
  photoLocal: await employers.countDocuments({
    "profilePhoto.storageProvider": "local",
  }),
  photoCloudinary: await employers.countDocuments({
    "profilePhoto.storageProvider": "cloudinary",
  }),
};

function localExists(url, storagePath) {
  const candidates = [];
  if (storagePath) {
    candidates.push(path.resolve(process.cwd(), storagePath));
  }
  if (url?.startsWith("/uploads/")) {
    candidates.push(path.resolve(process.cwd(), url.replace(/^\//, "")));
  }
  if (url?.startsWith("uploads/")) {
    candidates.push(path.resolve(process.cwd(), url));
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const rows = sample.map((e) => {
  const logo = e.companyLogo || null;
  const photo = e.profilePhoto || null;
  return {
    id: String(e._id),
    name:
      e.companyName ||
      e.establishmentName ||
      [e.firstName, e.lastName].filter(Boolean).join(" ") ||
      "",
    accountType: e.accountType,
    logo,
    photo,
    logoFileOnDisk: localExists(logo?.url, logo?.storagePath),
    photoFileOnDisk: localExists(photo?.url, photo?.storagePath),
  };
});

console.log(
  JSON.stringify(
    {
      db: mongoose.connection.name,
      storageProviderEnv: process.env.STORAGE_PROVIDER,
      publicApiUrl: process.env.PUBLIC_API_URL,
      stats,
      sample: rows,
    },
    null,
    2,
  ),
);

await mongoose.disconnect();
