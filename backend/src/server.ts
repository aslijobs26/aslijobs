import type { Server } from "node:http";
import app from "./app.js";
import { connectDB, getConnectedDatabaseName } from "./config/db.js";
import { env } from "./config/env.js";
import { markRuntimeShuttingDown } from "./config/runtime-ready.js";
import { startNotificationRetentionScheduler } from "./modules/notifications/notification.retention.js";
import { startJobTranslationRuntime } from "./modules/jobs/job-translation.queue.js";
import { startWhatsAppInboundRuntime } from "./modules/whatsapp/whatsapp-inbound.queue.js";
import { startEmployerProfileCompletionReminderRuntime } from "./modules/whatsapp/notifications/employer-profile-completion-reminder.queue.js";
import { startJobSeekerProfileCompletionReminderRuntime } from "./modules/whatsapp/notifications/jobseeker-profile-completion-reminder.queue.js";
import { startJobPostIncompleteReminderRuntime } from "./modules/whatsapp/notifications/job-post-incomplete-reminder.queue.js";
import { startWhatsAppNotificationRuntime } from "./modules/whatsapp/notifications/whatsapp-notification.queue.js";
import { clearAllRbacCaches } from "./modules/rbac/rbac-context.cache.js";
import { logEmailConfigurationStatus } from "./modules/team/team-invitation-email.service.js";
import mongoose from "mongoose";

let httpServer: Server | null = null;
let isShuttingDown = false;
let stopNotificationRetention: (() => void) | null = null;
let stopWorkReconcile: (() => void) | null = null;
let stopJobTranslation: (() => Promise<void>) | null = null;
let stopWhatsAppInbound: (() => Promise<void>) | null = null;
let stopWhatsAppNotifications: (() => Promise<void>) | null = null;
let stopEmployerProfileReminders: (() => Promise<void>) | null = null;
let stopJobSeekerProfileReminders: (() => Promise<void>) | null = null;
let stopJobPostIncompleteReminders: (() => Promise<void>) | null = null;

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  markRuntimeShuttingDown();
  console.info(`[shutdown] received ${signal}; draining...`);

  const forceTimer = setTimeout(() => {
    console.error("[shutdown] forced exit after timeout");
    process.exit(1);
  }, 25_000);
  forceTimer.unref();

  // Stop accepting traffic first so readiness fails while workers drain.
  const closeHttp = httpServer
    ? new Promise<void>((resolve) => {
        httpServer?.close((error) => {
          if (error) {
            console.error("[shutdown] http close failed", error);
          }
          resolve();
        });
      })
    : Promise.resolve();

  stopNotificationRetention?.();
  stopNotificationRetention = null;
  stopWorkReconcile?.();
  stopWorkReconcile = null;

  const stops: Array<Promise<unknown>> = [
    closeHttp,
    stopJobTranslation?.() ?? Promise.resolve(),
    stopWhatsAppInbound?.() ?? Promise.resolve(),
    stopWhatsAppNotifications?.() ?? Promise.resolve(),
    stopEmployerProfileReminders?.() ?? Promise.resolve(),
    stopJobSeekerProfileReminders?.() ?? Promise.resolve(),
    stopJobPostIncompleteReminders?.() ?? Promise.resolve(),
  ];
  stopJobTranslation = null;
  stopWhatsAppInbound = null;
  stopWhatsAppNotifications = null;
  stopEmployerProfileReminders = null;
  stopJobSeekerProfileReminders = null;
  stopJobPostIncompleteReminders = null;

  const results = await Promise.allSettled(stops);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[shutdown] stop step failed", result.reason);
    }
  }

  clearAllRbacCaches();
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error("[shutdown] mongo close failed", error);
    process.exit(1);
    return;
  }

  console.info(`[shutdown] exit code=${exitCode}`);
  process.exit(exitCode);
}

async function startServer(): Promise<void> {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log(
    `[startup] Environment: ${env.NODE_ENV}; Database: ${getConnectedDatabaseName() ?? "none"}`,
  );
  const { ensureDefaultOperationsAdmin } = await import(
    "./modules/operations/auth/ensure-default-operations-admin.js"
  );
  await ensureDefaultOperationsAdmin();
  const { ensureOperationsRbacSeed } = await import(
    "./modules/operations/rbac/operations-rbac-seed.js"
  );
  await ensureOperationsRbacSeed();
  logEmailConfigurationStatus();
  stopNotificationRetention = startNotificationRetentionScheduler();
  const { startOperationsWorkReconcileScheduler } = await import(
    "./modules/operations/work/operations-work-reconcile.js"
  );
  const { ensureOperationsWorkDepartments } = await import(
    "./modules/operations/work/operations-work-department.js"
  );
  await ensureOperationsWorkDepartments();
  stopWorkReconcile = startOperationsWorkReconcileScheduler();
  stopJobTranslation = startJobTranslationRuntime();
  stopWhatsAppInbound = startWhatsAppInboundRuntime();
  stopWhatsAppNotifications = startWhatsAppNotificationRuntime();
  stopEmployerProfileReminders = startEmployerProfileCompletionReminderRuntime();
  stopJobSeekerProfileReminders = startJobSeekerProfileCompletionReminderRuntime();
  stopJobPostIncompleteReminders = startJobPostIncompleteReminderRuntime();

  httpServer = app.listen(env.PORT, () => {
    console.log(`AsliJobs API running on port ${env.PORT}`);
    console.log(`[AsliJobs OTP] provider=${env.OTP_PROVIDER}`);
    console.log(
      `[startup] ready environment=${env.NODE_ENV} database=${getConnectedDatabaseName() ?? "none"}`,
    );
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM", 0);
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT", 0);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[process] unhandledRejection", reason);
  });
  process.on("uncaughtException", (error) => {
    console.error("[process] uncaughtException", error);
    void shutdown("uncaughtException", 1);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
