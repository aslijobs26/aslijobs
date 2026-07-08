import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`AsliJobs API running on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
