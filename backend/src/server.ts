import type { Server } from "node:http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { startNotificationRetentionScheduler } from "./modules/notifications/notification.retention.js";
import { clearAllRbacCaches } from "./modules/rbac/rbac-context.cache.js";
import { logEmailConfigurationStatus } from "./modules/team/team-invitation-email.service.js";
import mongoose from "mongoose";

let httpServer: Server | null = null;
let isShuttingDown = false;
let stopNotificationRetention: (() => void) | null = null;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.info(`[shutdown] received ${signal}; draining...`);

  const forceTimer = setTimeout(() => {
    console.error("[shutdown] forced exit after timeout");
    process.exit(1);
  }, 15_000);
  forceTimer.unref();

  try {
    stopNotificationRetention?.();
    stopNotificationRetention = null;
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer?.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
    clearAllRbacCaches();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    console.info("[shutdown] clean exit");
    process.exit(0);
  } catch (error) {
    console.error("[shutdown] failed", error);
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  await connectDB();
  logEmailConfigurationStatus();
  stopNotificationRetention = startNotificationRetentionScheduler();

  httpServer = app.listen(env.PORT, () => {
    console.log(`AsliJobs API running on port ${env.PORT}`);
    console.log("================================================");
    console.log("[AsliJobs OTP]");
    console.log(`OTP Provider: ${env.OTP_PROVIDER}`);
    console.log(
      `Test OTP Enabled: ${env.OTP_TEST_MODE === true && env.OTP_TEST_CODE.length > 0}`,
    );
    console.log("================================================");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[process] unhandledRejection", reason);
  });
  process.on("uncaughtException", (error) => {
    console.error("[process] uncaughtException", error);
    void shutdown("uncaughtException");
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
