import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sanitizeTeamMemberDto } from "../rbac/field-access.response.js";
import { sendSuccess } from "../../utils/api-response.js";
import type {
  AcceptInvitationInput,
  ChangeMemberRoleInput,
  InviteMemberInput,
  ListMembersQuery,
  PreviewInvitationQuery,
  TransferMemberDepartmentInput,
  UpdateMemberInput,
} from "./member.validation.js";
import { teamMemberService } from "./team-member.service.js";
import { teamRoleService } from "./team-role.service.js";

function requireEmployerId(req: Request): string {
  if (!req.employerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.employerId;
}

function sanitizeMemberPayload(
  req: Request,
  member: unknown,
): Record<string, unknown> {
  return sanitizeTeamMemberDto(
    req.rbac,
    member as Record<string, unknown>,
  );
}

export class TeamMemberController {
  list = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListMembersQuery;
    const result = await teamMemberService.listMembers(employerId, query);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team members fetched successfully.",
      data: {
        ...result,
        members: result.members.map((member) =>
          sanitizeMemberPayload(req, member),
        ),
      },
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const result = await teamMemberService.getMember(employerId, memberId);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member fetched successfully.",
      data: sanitizeMemberPayload(req, result),
    });
  };

  /**
   * Own profile only — resolves from the authenticated team member session.
   * Does not accept a member ID and does not apply team_management field masks
   * (members must always see their own contact details).
   */
  getMe = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    if (req.workspacePrincipal !== "member" || !req.teamMemberId) {
      throw new AppError(
        "This endpoint is only available to team members.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const result = await teamMemberService.getMyProfile(
      employerId,
      req.teamMemberId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Your profile fetched successfully.",
      data: result,
    });
  };

  invite = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const body = req.body as InviteMemberInput;
    const result = await teamMemberService.inviteMember(employerId, body);
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: result.emailDelivered
        ? "Invitation sent successfully."
        : "Invitation created but email delivery failed. Use Resend Invitation after email is configured.",
      data: result,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const body = req.body as UpdateMemberInput;
    const result = await teamMemberService.updateMember(
      employerId,
      memberId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member updated successfully.",
      data: result,
    });
  };

  transferDepartment = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const body = req.body as TransferMemberDepartmentInput;
    const result = await teamMemberService.transferDepartment(
      employerId,
      memberId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Member department updated successfully.",
      data: result,
    });
  };

  changeRole = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const body = req.body as ChangeMemberRoleInput;
    const result = await teamMemberService.changeRole(employerId, memberId, body);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Member role updated successfully.",
      data: result,
    });
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const result = await teamMemberService.setMemberStatus(
      employerId,
      memberId,
      "active",
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member activated successfully.",
      data: result,
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const result = await teamMemberService.setMemberStatus(
      employerId,
      memberId,
      "inactive",
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member deactivated successfully.",
      data: result,
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const result = await teamMemberService.removeMember(employerId, memberId);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member removed successfully.",
      data: result,
    });
  };

  resendInvitation = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const result = await teamMemberService.resendInvitation(
      employerId,
      memberId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: result.emailDelivered
        ? "Invitation resent successfully."
        : "Invitation updated but email delivery failed. Fix email configuration, then use Resend Invitation again.",
      data: result,
    });
  };

  cancelInvitation = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { memberId } = req.params as { memberId: string };
    const result = await teamMemberService.cancelInvitation(
      employerId,
      memberId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Invitation cancelled successfully.",
      data: result,
    });
  };

  deleteInvitationHistory = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { invitationId } = req.params as { invitationId: string };
    const result = await teamMemberService.deleteInvitationHistory(
      employerId,
      invitationId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Invitation history deleted successfully.",
      data: result,
    });
  };

  acceptInvitation = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as AcceptInvitationInput;
    const result = await teamMemberService.acceptInvitation(body);
    sendSuccess(res, HTTP_STATUS.OK, {
      message:
        "Account created successfully. Please sign in with your email and password.",
      data: result,
    });
  };

  previewInvitation = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as PreviewInvitationQuery;
    const result = await teamMemberService.previewInvitation(query.token);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Invitation preview fetched successfully.",
      data: result,
    });
  };

  listRoles = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const roles = await teamRoleService.listRoles(employerId);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Roles fetched successfully.",
      data: { roles },
    });
  };

  sidebar = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const result = await teamMemberService.getSidebar(employerId);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team sidebar data fetched successfully.",
      data: result,
    });
  };
}

export const teamMemberController = new TeamMemberController();
