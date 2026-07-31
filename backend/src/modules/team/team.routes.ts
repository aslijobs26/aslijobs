import { Router } from "express";
import { requireEmployerAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { teamInvitationAcceptRateLimit } from "../../middleware/team-invitation-rate-limit.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { departmentController } from "./department.controller.js";
import {
  createDepartmentSchema,
  departmentIdParamsSchema,
  listDepartmentsQuerySchema,
  listMemberOptionsQuerySchema,
  updateDepartmentSchema,
} from "./department.validation.js";
import { teamMemberController } from "./team-member.controller.js";
import {
  acceptInvitationSchema,
  changeMemberRoleSchema,
  invitationIdParamsSchema,
  inviteMemberSchema,
  listMembersQuerySchema,
  memberIdParamsSchema,
  previewInvitationQuerySchema,
  transferMemberDepartmentSchema,
  updateMemberSchema,
} from "./member.validation.js";
import { teamRoleController } from "./team-role.controller.js";
import {
  createRoleSchema,
  duplicateRoleSchema,
  listRolesQuerySchema,
  roleIdParamsSchema,
  updateRolePermissionsSchema,
  updateRoleSchema,
} from "./team-role.validation.js";
import {
  teamAuthController,
  teamMemberLoginSchema,
} from "./team-auth.controller.js";

const teamRouter = Router();

teamRouter.get(
  "/invitations/preview",
  teamInvitationAcceptRateLimit,
  validate(previewInvitationQuerySchema, "query"),
  asyncHandler(teamMemberController.previewInvitation),
);

teamRouter.post(
  "/invitations/accept",
  teamInvitationAcceptRateLimit,
  validate(acceptInvitationSchema, "body"),
  asyncHandler(teamMemberController.acceptInvitation),
);

teamRouter.post(
  "/auth/login",
  validate(teamMemberLoginSchema, "body"),
  asyncHandler(teamAuthController.login),
);

teamRouter.use(asyncHandler(requireEmployerAuth));

teamRouter.get("/rbac/session", asyncHandler(teamAuthController.session));

teamRouter.get(
  "/stats",
  asyncHandler(requirePermission("team_management", "read")),
  asyncHandler(departmentController.getStats),
);
teamRouter.get(
  "/sidebar",
  asyncHandler(requirePermission("team_management", "read")),
  asyncHandler(teamMemberController.sidebar),
);

/** Assignment dropdown — full role list (frontend filters active). */
teamRouter.get(
  "/roles",
  asyncHandler(requirePermission("team_management", "read")),
  asyncHandler(teamRoleController.listAssignable),
);

teamRouter.get(
  "/roles/manage",
  asyncHandler(requirePermission("team_management", "read")),
  validate(listRolesQuerySchema, "query"),
  asyncHandler(teamRoleController.list),
);

teamRouter.get(
  "/roles/permission-matrix",
  asyncHandler(requirePermission("team_management", "read")),
  asyncHandler(teamRoleController.getPermissionMatrixMeta),
);

teamRouter.post(
  "/roles",
  asyncHandler(requirePermission("team_management", "create")),
  validate(createRoleSchema, "body"),
  asyncHandler(teamRoleController.create),
);

teamRouter.get(
  "/roles/:roleId/details",
  asyncHandler(requirePermission("team_management", "read")),
  validate(roleIdParamsSchema, "params"),
  asyncHandler(teamRoleController.getDetails),
);

teamRouter.get(
  "/roles/:roleId",
  asyncHandler(requirePermission("team_management", "read")),
  validate(roleIdParamsSchema, "params"),
  asyncHandler(teamRoleController.getById),
);

teamRouter.patch(
  "/roles/:roleId",
  asyncHandler(requirePermission("team_management", "update")),
  validate(roleIdParamsSchema, "params"),
  validate(updateRoleSchema, "body"),
  asyncHandler(teamRoleController.update),
);

teamRouter.patch(
  "/roles/:roleId/permissions",
  asyncHandler(requirePermission("team_management", "update")),
  validate(roleIdParamsSchema, "params"),
  validate(updateRolePermissionsSchema, "body"),
  asyncHandler(teamRoleController.updatePermissions),
);

teamRouter.post(
  "/roles/:roleId/duplicate",
  asyncHandler(requirePermission("team_management", "create")),
  validate(roleIdParamsSchema, "params"),
  validate(duplicateRoleSchema, "body"),
  asyncHandler(teamRoleController.duplicate),
);

teamRouter.post(
  "/roles/:roleId/archive",
  asyncHandler(requirePermission("team_management", "update")),
  validate(roleIdParamsSchema, "params"),
  asyncHandler(teamRoleController.archive),
);

teamRouter.post(
  "/roles/:roleId/deactivate",
  asyncHandler(requirePermission("team_management", "update")),
  validate(roleIdParamsSchema, "params"),
  asyncHandler(teamRoleController.deactivate),
);

teamRouter.post(
  "/roles/:roleId/activate",
  asyncHandler(requirePermission("team_management", "update")),
  validate(roleIdParamsSchema, "params"),
  asyncHandler(teamRoleController.activate),
);

teamRouter.delete(
  "/roles/:roleId",
  asyncHandler(requirePermission("team_management", "delete")),
  validate(roleIdParamsSchema, "params"),
  asyncHandler(teamRoleController.remove),
);

teamRouter.get(
  "/members/options",
  asyncHandler(requirePermission("team_management", "read")),
  validate(listMemberOptionsQuerySchema, "query"),
  asyncHandler(departmentController.listMemberOptions),
);

teamRouter.get(
  "/members",
  asyncHandler(requirePermission("team_management", "read")),
  validate(listMembersQuerySchema, "query"),
  asyncHandler(teamMemberController.list),
);

teamRouter.post(
  "/members/invite",
  asyncHandler(requirePermission("team_management", "create")),
  validate(inviteMemberSchema, "body"),
  asyncHandler(teamMemberController.invite),
);

teamRouter.get(
  "/members/:memberId",
  asyncHandler(requirePermission("team_management", "read")),
  validate(memberIdParamsSchema, "params"),
  asyncHandler(teamMemberController.getById),
);

teamRouter.patch(
  "/members/:memberId",
  asyncHandler(requirePermission("team_management", "update")),
  validate(memberIdParamsSchema, "params"),
  validate(updateMemberSchema, "body"),
  asyncHandler(teamMemberController.update),
);

teamRouter.post(
  "/members/:memberId/transfer-department",
  asyncHandler(requirePermission("team_management", "update")),
  validate(memberIdParamsSchema, "params"),
  validate(transferMemberDepartmentSchema, "body"),
  asyncHandler(teamMemberController.transferDepartment),
);

teamRouter.post(
  "/members/:memberId/change-role",
  asyncHandler(requirePermission("team_management", "update")),
  validate(memberIdParamsSchema, "params"),
  validate(changeMemberRoleSchema, "body"),
  asyncHandler(teamMemberController.changeRole),
);

teamRouter.post(
  "/members/:memberId/activate",
  asyncHandler(requirePermission("team_management", "update")),
  validate(memberIdParamsSchema, "params"),
  asyncHandler(teamMemberController.activate),
);

teamRouter.post(
  "/members/:memberId/deactivate",
  asyncHandler(requirePermission("team_management", "update")),
  validate(memberIdParamsSchema, "params"),
  asyncHandler(teamMemberController.deactivate),
);

teamRouter.delete(
  "/members/:memberId",
  asyncHandler(requirePermission("team_management", "delete")),
  validate(memberIdParamsSchema, "params"),
  asyncHandler(teamMemberController.remove),
);

teamRouter.post(
  "/members/:memberId/resend-invitation",
  asyncHandler(requirePermission("team_management", "update")),
  validate(memberIdParamsSchema, "params"),
  asyncHandler(teamMemberController.resendInvitation),
);

teamRouter.post(
  "/members/:memberId/cancel-invitation",
  asyncHandler(requirePermission("team_management", "update")),
  validate(memberIdParamsSchema, "params"),
  asyncHandler(teamMemberController.cancelInvitation),
);

teamRouter.delete(
  "/invitations/:invitationId",
  asyncHandler(requirePermission("team_management", "delete")),
  validate(invitationIdParamsSchema, "params"),
  asyncHandler(teamMemberController.deleteInvitationHistory),
);

teamRouter.get(
  "/departments",
  asyncHandler(requirePermission("team_management", "read")),
  validate(listDepartmentsQuerySchema, "query"),
  asyncHandler(departmentController.list),
);

teamRouter.post(
  "/departments",
  asyncHandler(requirePermission("team_management", "create")),
  validate(createDepartmentSchema, "body"),
  asyncHandler(departmentController.create),
);

teamRouter.get(
  "/departments/:departmentId/details",
  asyncHandler(requirePermission("team_management", "read")),
  validate(departmentIdParamsSchema, "params"),
  asyncHandler(departmentController.getDetails),
);

teamRouter.get(
  "/departments/:departmentId",
  asyncHandler(requirePermission("team_management", "read")),
  validate(departmentIdParamsSchema, "params"),
  asyncHandler(departmentController.getById),
);

teamRouter.patch(
  "/departments/:departmentId",
  asyncHandler(requirePermission("team_management", "update")),
  validate(departmentIdParamsSchema, "params"),
  validate(updateDepartmentSchema, "body"),
  asyncHandler(departmentController.update),
);

teamRouter.post(
  "/departments/:departmentId/deactivate",
  asyncHandler(requirePermission("team_management", "update")),
  validate(departmentIdParamsSchema, "params"),
  asyncHandler(departmentController.deactivate),
);

teamRouter.delete(
  "/departments/:departmentId",
  asyncHandler(requirePermission("team_management", "delete")),
  validate(departmentIdParamsSchema, "params"),
  asyncHandler(departmentController.remove),
);

export default teamRouter;
