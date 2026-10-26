import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env" });
await mongoose.connect(process.env.MONGO_URI);
const employers = mongoose.connection.db.collection("employers");

const docs = await employers
  .find({})
  .project({
    companyName: 1,
    establishmentName: 1,
    companyLogo: 1,
    profilePhoto: 1,
    companyMedia: 1,
  })
  .toArray();

const interesting = [];
for (const doc of docs) {
  const blobs = [doc.companyLogo, doc.profilePhoto, ...(doc.companyMedia || [])].filter(
    Boolean,
  );
  for (const asset of blobs) {
    const url = String(asset.url || "");
    const publicId = String(asset.publicId || "");
    const provider = String(asset.storageProvider || "");
    const storagePath = String(asset.storagePath || "");
    if (
      url.includes("cloudinary") ||
      publicId ||
      provider === "cloudinary" ||
      url.startsWith("http")
    ) {
      interesting.push({
        id: String(doc._id),
        name: doc.companyName || doc.establishmentName || "",
        url,
        publicId,
        provider,
        storagePath,
      });
    }
  }
}

console.log(
  JSON.stringify(
    {
      totalEmployers: docs.length,
      cloudinaryOrHttpAssets: interesting.length,
      interesting,
      allLogoUrls: docs
        .map((d) => ({
          name: d.companyName || d.establishmentName || "",
          logo: d.companyLogo?.url || "",
          photo: d.profilePhoto?.url || "",
          provider: d.companyLogo?.storageProvider || d.profilePhoto?.storageProvider || "",
        }))
        .filter((d) => d.logo || d.photo),
    },
    null,
    2,
  ),
);

await mongoose.disconnect();
