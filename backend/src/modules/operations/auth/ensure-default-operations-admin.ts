import bcrypt from "bcryptjs";
import { OPERATIONS_TEAM_ROLES } from "../operations.constants.js";
import { OperationsTeamUserModel } from "./operations-team-user.model.js";

const DEFAULT_OPS_ADMIN_EMAIL = "admin@aslijobs.com";
const DEFAULT_OPS_ADMIN_MOBILE = "9999999999";
const DEFAULT_OPS_ADMIN_PASSWORD = "Admin@123";
const DEFAULT_OPS_ADMIN_NAME = "Operations Admin";

/**
 * Ensures a default Operations Super Admin exists for local/dev API access.
 * Idempotent — does not overwrite an existing user with the same email/mobile.
 */
export async function ensureDefaultOperationsAdmin(): Promise<void> {
  const existing = await OperationsTeamUserModel.findOne({
    $or: [
      { email: DEFAULT_OPS_ADMIN_EMAIL },
      { mobileNumber: DEFAULT_OPS_ADMIN_MOBILE },
    ],
  })
    .select("_id email mobileNumber")
    .lean();

  if (existing) {
    if (!existing.email) {
      await OperationsTeamUserModel.updateOne(
        { _id: existing._id },
        { $set: { email: DEFAULT_OPS_ADMIN_EMAIL } },
      );
    }
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_OPS_ADMIN_PASSWORD, 10);

  await OperationsTeamUserModel.create({
    fullName: DEFAULT_OPS_ADMIN_NAME,
    email: DEFAULT_OPS_ADMIN_EMAIL,
    mobileNumber: DEFAULT_OPS_ADMIN_MOBILE,
    passwordHash,
    role: OPERATIONS_TEAM_ROLES[0],
    status: "active",
  });

  console.info(
    `[operations-auth] Seeded default admin ${DEFAULT_OPS_ADMIN_EMAIL} / ${DEFAULT_OPS_ADMIN_MOBILE}`,
  );
}
