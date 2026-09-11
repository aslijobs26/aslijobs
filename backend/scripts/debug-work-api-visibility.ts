/**
 * Direct service-level verification (no HTTP auth): Super Admin visibility
 * vs personal My Queue for the newly reconciled WorkItem.
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";
import { operationsWorkService } from "../src/modules/operations/work/operations-work.service.js";
import type { OperationsResolvedAccess } from "../src/modules/operations/rbac/operations-access.types.js";
import { OPERATIONS_PERMISSION_CATALOG } from "../src/modules/operations/rbac/operations-permission-catalog.js";
import { buildSuperAdminPermissions } from "../src/modules/operations/auth/operations-rbac.js";

function superAdminAccess(userId: string): OperationsResolvedAccess {
  return {
    userId,
    isSuperAdmin: true,
    roleId: null,
    roleName: "SUPER_ADMIN",
    departmentId: null,
    departmentName: null,
    status: "active",
    grantedKeys: OPERATIONS_PERMISSION_CATALOG.map((d) => d.key),
    delegatableKeys: OPERATIONS_PERMISSION_CATALOG.map((d) => d.key),
    permissions: buildSuperAdminPermissions(),
    canCreateRoles: true,
    canManageUsers: true,
    canAssignRoles: true,
    fullName: "Debug Super Admin",
    email: null,
  };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  const teamUser = await mongoose.connection.db!
    .collection("operations_team_users")
    .findOne({ status: "active" }, { projection: { _id: 1, fullName: 1, isSuperAdmin: 1, role: 1 } });
  console.log("actorSample=", JSON.stringify(teamUser));
  const userId = String(teamUser?._id ?? new mongoose.Types.ObjectId());
  const access = superAdminAccess(userId);

  const analytics = await operationsWorkService.getAnalytics(access);
  const all = await operationsWorkService.list(
    {
      page: 1,
      limit: 10,
      tab: "all",
      type: "",
      priority: "",
      due: "all",
      search: "",
      sort: "dueAt",
      order: "asc",
    },
    access,
  );
  const myQueue = await operationsWorkService.list(
    {
      page: 1,
      limit: 10,
      tab: "my_queue",
      type: "",
      priority: "",
      due: "all",
      search: "",
      sort: "dueAt",
      order: "asc",
    },
    access,
  );
  const waitingP1 = await operationsWorkService.list(
    {
      page: 1,
      limit: 10,
      tab: "waiting",
      type: "",
      priority: "P1",
      due: "all",
      search: "",
      sort: "dueAt",
      order: "asc",
    },
    access,
  );

  console.log(
    JSON.stringify(
      {
        analyticsKpis: analytics.kpis,
        myQueueBadge: analytics.myQueueBadge,
        all: {
          total: all.pagination.total,
          tabs: all.tabs,
          titles: all.items.map((i) => i.title),
        },
        myQueue: { total: myQueue.pagination.total, tabs: myQueue.tabs },
        waitingP1: { total: waitingP1.pagination.total },
      },
      null,
      2,
    ),
  );
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
