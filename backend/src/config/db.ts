import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function connectDB(): Promise<void> {
  if (!env.MONGO_URI) {
    console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
    return;
  }

  try {
    await mongoose.connect(env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    const databaseName = mongoose.connection.db?.databaseName ?? "unknown";
    console.log(`MongoDB connected successfully: ${databaseName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isDnsRelated =
      message.includes("querySrv") ||
      message.includes("ENOTFOUND") ||
      message.includes("ECONNREFUSED");

    if (isDnsRelated) {
      console.error("DNS/MongoDB connection error:", message);
    } else {
      console.error("MongoDB connection error:", message);
    }

    process.exit(1);
  }
}
