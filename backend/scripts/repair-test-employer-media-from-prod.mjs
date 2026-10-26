/**
 * Repairs aslijobs_test employer logo/photo refs that point at missing local
 * /uploads files by copying working Cloudinary asset metadata from aslijobs_prod
 * when the same employer can be matched safely (phone or normalized name).
 *
 * Does NOT invent placeholder images. Only copies real Cloudinary assets.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env" });

const APPLY = process.argv.includes("--apply");

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(pvt|private|ltd|limited|org|organization|organisation|company|constructions?|infra|developers?|solutions?|services?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayName(doc) {
  return (
    doc.companyName ||
    doc.establishmentName ||
    [doc.firstName, doc.lastName].filter(Boolean).join(" ") ||
    ""
  );
}

function isBrokenLocalAsset(asset) {
  if (!asset) return false;
  const url = String(asset.url || "").trim();
  const provider = String(asset.storageProvider || "").trim();
  if (!url) return false;
  if (/^https?:\/\//i.test(url)) return false;
  if (provider === "cloudinary") return false;
  return url.startsWith("/uploads/") || url.startsWith("uploads/");
}

function cloudAssetCopy(asset) {
  return {
    url: asset.url,
    storagePath: asset.storagePath || asset.publicId || "",
    publicId: asset.publicId || "",
    storageProvider: "cloudinary",
    originalName: asset.originalName || "",
    mimeType: asset.mimeType || "",
    fileSize: asset.fileSize || 0,
    updatedAt: asset.updatedAt || new Date(),
  };
}

const testUri = process.env.MONGO_URI;
const prodUri = testUri.replace(/\/aslijobs_test(\?|$)/, "/aslijobs_prod$1");

const testConn = await mongoose.createConnection(testUri).asPromise();
const prodConn = await mongoose.createConnection(prodUri).asPromise();

const testEmployers = await testConn.db.collection("employers").find({}).toArray();
const prodEmployers = await prodConn.db.collection("employers").find({}).toArray();

const prodByPhone = new Map();
const prodByName = new Map();

for (const emp of prodEmployers) {
  const phone = String(emp.phone || emp.mobile || emp.whatsappNumber || "")
    .replace(/\D/g, "")
    .slice(-10);
  if (phone.length === 10) {
    prodByPhone.set(phone, emp);
  }
  const name = normalizeName(displayName(emp));
  if (name) {
    if (!prodByName.has(name)) prodByName.set(name, []);
    prodByName.get(name).push(emp);
  }
}

const plan = [];

for (const emp of testEmployers) {
  const needsLogo = isBrokenLocalAsset(emp.companyLogo);
  const needsPhoto = isBrokenLocalAsset(emp.profilePhoto);
  if (!needsLogo && !needsPhoto) continue;

  const phone = String(emp.phone || emp.mobile || emp.whatsappNumber || "")
    .replace(/\D/g, "")
    .slice(-10);
  let prod = phone.length === 10 ? prodByPhone.get(phone) : null;
  let matchType = prod ? "phone" : null;

  if (!prod) {
    const name = normalizeName(displayName(emp));
    const candidates = name ? prodByName.get(name) || [] : [];
    if (candidates.length === 1) {
      prod = candidates[0];
      matchType = "name";
    } else if (candidates.length > 1) {
      // Prefer candidate that has the asset we need.
      prod =
        candidates.find((c) =>
          needsLogo
            ? /^https?:\/\//i.test(String(c.companyLogo?.url || ""))
            : /^https?:\/\//i.test(String(c.profilePhoto?.url || "")),
        ) || null;
      matchType = prod ? "name-multi" : null;
    }
  }

  if (!prod) {
    plan.push({
      action: "skip",
      reason: "no_prod_match",
      employerId: String(emp._id),
      name: displayName(emp),
      needsLogo,
      needsPhoto,
    });
    continue;
  }

  const update = {};
  if (
    needsLogo &&
    /^https?:\/\//i.test(String(prod.companyLogo?.url || ""))
  ) {
    update.companyLogo = cloudAssetCopy(prod.companyLogo);
  }
  if (
    needsPhoto &&
    /^https?:\/\//i.test(String(prod.profilePhoto?.url || ""))
  ) {
    update.profilePhoto = cloudAssetCopy(prod.profilePhoto);
  }

  if (Object.keys(update).length === 0) {
    plan.push({
      action: "skip",
      reason: "prod_match_has_no_cloud_asset",
      employerId: String(emp._id),
      name: displayName(emp),
      prodId: String(prod._id),
      prodName: displayName(prod),
      matchType,
      needsLogo,
      needsPhoto,
    });
    continue;
  }

  plan.push({
    action: "repair",
    employerId: String(emp._id),
    name: displayName(emp),
    prodId: String(prod._id),
    prodName: displayName(prod),
    matchType,
    updateKeys: Object.keys(update),
    logoUrl: update.companyLogo?.url || null,
    photoUrl: update.profilePhoto?.url || null,
    update,
  });
}

const repairs = plan.filter((p) => p.action === "repair");
const skips = plan.filter((p) => p.action === "skip");

if (APPLY) {
  for (const item of repairs) {
    await testConn.db.collection("employers").updateOne(
      { _id: new mongoose.Types.ObjectId(item.employerId) },
      { $set: item.update },
    );
  }
}

console.log(
  JSON.stringify(
    {
      apply: APPLY,
      repaired: repairs.length,
      skipped: skips.length,
      repairs: repairs.map(({ update, ...rest }) => rest),
      skips,
    },
    null,
    2,
  ),
);

await testConn.close();
await prodConn.close();
