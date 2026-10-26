import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env" });

const testUri = process.env.MONGO_URI;
const prodUri = testUri.replace(/\/aslijobs_test(\?|$)/, "/aslijobs_prod$1");

console.log(
  JSON.stringify({
    testDbHint: testUri.includes("aslijobs_test"),
    prodUriHost: prodUri.split("@")[1]?.split("/")[0] || "",
  }),
);

await mongoose.connect(prodUri);
const employers = mongoose.connection.db.collection("employers");
const stats = {
  db: mongoose.connection.name,
  total: await employers.countDocuments({}),
  logoHttp: await employers.countDocuments({
    "companyLogo.url": { $regex: "^https?://" },
  }),
  logoUploads: await employers.countDocuments({
    "companyLogo.url": { $regex: "^/uploads/" },
  }),
  logoCloudinaryProvider: await employers.countDocuments({
    "companyLogo.storageProvider": "cloudinary",
  }),
  logoLocalProvider: await employers.countDocuments({
    "companyLogo.storageProvider": "local",
  }),
  photoHttp: await employers.countDocuments({
    "profilePhoto.url": { $regex: "^https?://" },
  }),
  photoUploads: await employers.countDocuments({
    "profilePhoto.url": { $regex: "^/uploads/" },
  }),
};

const sample = await employers
  .find(
    {
      $or: [
        { "companyLogo.url": { $regex: "." } },
        { "profilePhoto.url": { $regex: "." } },
      ],
    },
    {
      projection: {
        companyName: 1,
        establishmentName: 1,
        "companyLogo.url": 1,
        "companyLogo.storageProvider": 1,
        "companyLogo.publicId": 1,
        "profilePhoto.url": 1,
        "profilePhoto.storageProvider": 1,
        "profilePhoto.publicId": 1,
      },
    },
  )
  .sort({ updatedAt: -1 })
  .limit(20)
  .toArray();

console.log(
  JSON.stringify(
    {
      stats,
      sample: sample.map((e) => ({
        id: String(e._id),
        name: e.companyName || e.establishmentName || "",
        logo: e.companyLogo || null,
        photo: e.profilePhoto || null,
      })),
    },
    null,
    2,
  ),
);

await mongoose.disconnect();
