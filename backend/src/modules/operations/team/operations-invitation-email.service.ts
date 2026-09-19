import { randomBytes } from "node:crypto";
import { sendTransactionalEmail } from "../../../lib/email/transactional-email.js";
import { getOperationsAdminLoginUrl } from "../auth/operations-admin-url.js";

export const OPERATIONS_INVITATION_EMAIL_SUBJECT =
  "Your ASLIJOBS Organization Account";

export type OrganizationInvitationEmailPayload = {
  toEmail: string;
  memberName: string;
  roleName: string;
  temporaryPassword: string;
  loginUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function generateOrganizationTemporaryPassword(): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(16);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function buildOrganizationInvitationEmail(payload: {
  memberName: string;
  roleName: string;
  loginEmail: string;
  temporaryPassword: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const name = escapeHtml(payload.memberName);
  const roleName = escapeHtml(payload.roleName);
  const loginEmail = escapeHtml(payload.loginEmail);
  const password = escapeHtml(payload.temporaryPassword);
  const loginUrl = escapeHtml(payload.loginUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${OPERATIONS_INVITATION_EMAIL_SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
          <tr>
            <td>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Your ASLIJOBS Organization Account</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Hello ${name},
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Your ASLIJOBS Organization account has been created.
              </p>
              <p style="margin:0 0 6px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Role:</strong> ${roleName}</p>
              <p style="margin:0 0 6px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Email:</strong> ${loginEmail}</p>
              <p style="margin:0 0 16px;font-size:14px;color:#64748b;"><strong style="color:#0f172a;">Password:</strong> ${password}</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
                Please use these credentials to access the ASLIJOBS Organization dashboard.
              </p>
              <p style="margin:0 0 24px;">
                <a clicktracking="off" href="${loginUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">
                  Login
                </a>
              </p>
              <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">
                Login URL: ${loginUrl}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">
                Regards,<br />ASLIJOBS Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hello ${payload.memberName},`,
    "",
    "Your ASLIJOBS Organization account has been created.",
    "",
    `Role: ${payload.roleName}`,
    `Email: ${payload.loginEmail}`,
    `Password: ${payload.temporaryPassword}`,
    "",
    "Please use these credentials to access the ASLIJOBS Organization dashboard.",
    "",
    `Dashboard: ${payload.loginUrl}`,
    `Login URL: ${payload.loginUrl}`,
    "",
    "Regards,",
    "ASLIJOBS Team",
  ].join("\n");

  return {
    subject: OPERATIONS_INVITATION_EMAIL_SUBJECT,
    html,
    text,
  };
}

export async function sendOrganizationInvitationEmail(
  payload: OrganizationInvitationEmailPayload,
): Promise<{ sent: boolean; errorMessage: string | null }> {
  const loginUrl = payload.loginUrl ?? getOperationsAdminLoginUrl();
  const content = buildOrganizationInvitationEmail({
    memberName: payload.memberName,
    roleName: payload.roleName,
    loginEmail: payload.toEmail,
    temporaryPassword: payload.temporaryPassword,
    loginUrl,
  });

  const result = await sendTransactionalEmail({
    to: payload.toEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
    logPrefix: "org-invite-email",
    devLogExtra: `loginUrl=${loginUrl} role=${payload.roleName}`,
  });

  if (result.ok) {
    return { sent: true, errorMessage: null };
  }

  return { sent: false, errorMessage: result.errorMessage };
}
