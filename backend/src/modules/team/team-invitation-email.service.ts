import { Resend } from "resend";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error.middleware.js";
import { HTTP_STATUS } from "../../constants/http-status.js";

export type TeamInvitationEmailPayload = {
  toEmail: string;
  memberName: string;
  employerName: string;
  companyName: string;
  roleName: string;
  departmentName: string;
  personalMessage?: string;
  acceptUrl: string;
  expiresInDays: number;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInvitationHtml(payload: TeamInvitationEmailPayload): string {
  const personalMessageBlock = payload.personalMessage?.trim()
    ? `<p style="margin:16px 0;padding:12px 14px;border-left:3px solid #10b981;background:#f0fdf4;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(payload.personalMessage.trim())}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>You're invited</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
          <tr>
            <td>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">You're invited to join ${escapeHtml(payload.companyName)}</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Hello ${escapeHtml(payload.memberName)},
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                ${escapeHtml(payload.employerName)} has invited you to join <strong>${escapeHtml(payload.companyName)}</strong>.
              </p>
              <p style="margin:0 0 6px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Role:</strong> ${escapeHtml(payload.roleName)}</p>
              <p style="margin:0 0 16px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Department:</strong> ${escapeHtml(payload.departmentName)}</p>
              ${personalMessageBlock}
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Click the button below to activate your account and create your password.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${escapeHtml(payload.acceptUrl)}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">
                  Accept Invitation
                </a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">
                Invitation expires in ${payload.expiresInDays} days.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">
                If you weren't expecting this invitation, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildInvitationText(payload: TeamInvitationEmailPayload): string {
  const lines = [
    `Hello ${payload.memberName},`,
    "",
    `${payload.employerName} has invited you to join ${payload.companyName}.`,
    "",
    `Role: ${payload.roleName}`,
    `Department: ${payload.departmentName}`,
  ];

  if (payload.personalMessage?.trim()) {
    lines.push("", payload.personalMessage.trim());
  }

  lines.push(
    "",
    "Activate your account and create your password:",
    payload.acceptUrl,
    "",
    `Invitation expires in ${payload.expiresInDays} days.`,
    "",
    "If you weren't expecting this invitation, ignore this email.",
  );

  return lines.join("\n");
}

export async function sendTeamInvitationEmail(
  payload: TeamInvitationEmailPayload,
): Promise<void> {
  const subject = `You're invited to join ${payload.companyName}`;
  const html = buildInvitationHtml(payload);
  const text = buildInvitationText(payload);

  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") {
      throw new AppError(
        "Email delivery is not configured. Set RESEND_API_KEY.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    console.info(
      `[team-invite-email:dev] to=${payload.toEmail} acceptUrl=${payload.acceptUrl}`,
    );
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: payload.toEmail,
    subject,
    html,
    text,
  });

  if (error) {
    throw new AppError(
      "Failed to send invitation email. Please try again.",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}

export function buildTeamInvitationAcceptUrl(token: string): string {
  const base = env.FRONTEND_URL.replace(/\/+$/, "");
  return `${base}/team/accept-invitation?token=${encodeURIComponent(token)}`;
}
