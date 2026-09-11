import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import mongoose from "mongoose";

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  const col = mongoose.connection.db!.collection("operations_work_items");
  console.log("indexes=", JSON.stringify(await col.indexes(), null, 2));

  const dups = await col
    .aggregate([
      {
        $group: {
          _id: "$sourceEventKey",
          n: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      { $match: { n: { $gt: 1 } } },
    ])
    .toArray();
  console.log("duplicateKeys=", JSON.stringify(dups, null, 2));

  for (const dup of dups) {
    const keep = dup.ids[0];
    const remove = dup.ids.slice(1);
    const result = await col.deleteMany({ _id: { $in: remove } });
    console.log("deduped", dup._id, "kept", String(keep), "removed", result.deletedCount);
  }

  // Ensure unique partial index exists
  try {
    await col.createIndex(
      { sourceEventKey: 1 },
      {
        unique: true,
        name: "sourceEventKey_unique_string",
        partialFilterExpression: { sourceEventKey: { $type: "string" } },
      },
    );
    console.log("uniqueIndex=ensured");
  } catch (error) {
    console.log("uniqueIndexError=", error instanceof Error ? error.message : error);
  }

  console.log("count=", await col.countDocuments());
  console.log("indexesAfter=", JSON.stringify(await col.indexes(), null, 2));
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
