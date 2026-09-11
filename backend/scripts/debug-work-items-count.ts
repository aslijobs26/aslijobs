import "dotenv/config";
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("NO_MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    console.error("NO_DB");
    process.exit(1);
  }
  console.log("dbName=", db.databaseName);
  const cols = await db.listCollections({}, { nameOnly: true }).toArray();
  console.log(
    "workRelated=",
    cols
      .map((c) => c.name)
      .filter((n) => n.includes("work") || n.includes("operations_"))
      .join(","),
  );
  const work = db.collection("operations_work_items");
  const count = await work.countDocuments();
  console.log("operations_work_items.count=", count);
  if (count > 0) {
    const sample = await work
      .find({})
      .limit(8)
      .project({
        displayId: 1,
        status: 1,
        priority: 1,
        assignedToUserId: 1,
        departmentId: 1,
        origin: 1,
        sourceEventKey: 1,
        type: 1,
        dueAt: 1,
        title: 1,
      })
      .toArray();
    console.log("sample=", JSON.stringify(sample, null, 2));
    const byStatus = await work
      .aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])
      .toArray();
    console.log("byStatus=", JSON.stringify(byStatus));
    console.log(
      "unassigned=",
      await work.countDocuments({ assignedToUserId: null }),
    );
    console.log(
      "nullDept=",
      await work.countDocuments({ departmentId: null }),
    );
  } else {
    const employers = db.collection("employers");
    const jobs = db.collection("jobs");
    const applications = db.collection("applications");
    console.log(
      "pendingEmployers=",
      await employers.countDocuments({
        verificationStatus: { $in: ["pending", "under_review"] },
      }),
    );
    console.log(
      "pendingJobs=",
      await jobs.countDocuments({ status: "pending_approval" }),
    );
    console.log(
      "selectedApps=",
      await applications.countDocuments({ status: "selected" }),
    );
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
