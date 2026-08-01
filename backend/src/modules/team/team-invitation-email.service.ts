import { Resend } from "resend";
import { env } from "../../config/env.js";

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

export type TeamInvitationEmailDeliveryResult =
  | {
      ok: true;
      providerMessageId: string | null;
    }
  | {
      ok: false;
      errorName: string;
      errorMessage: string;
      statusCode: number | null;
      isConfigurationError: boolean;
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
                <a clicktracking="off" href="${escapeHtml(payload.acceptUrl)}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">
                  Accept Invitation
                </a>
              </p>
              <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">
                Or open this link: ${escapeHtml(payload.acceptUrl)}
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

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

export function isResendTestingFromAddress(from: string): boolean {
  return extractEmailAddress(from).endsWith("@resend.dev");
}

function currentSenderLabel(): string {
  return env.EMAIL_FROM.trim() || "(EMAIL_FROM is not set)";
}

function classifyResendError(error: {
  name?: string;
  message?: string;
  statusCode?: number;
}): {
  errorName: string;
  errorMessage: string;
  statusCode: number | null;
  isConfigurationError: boolean;
} {
  const errorName = error.name?.trim() || "ResendError";
  const rawMessage =
    error.message?.trim() || "Unknown email provider error.";
  const statusCode =
    typeof error.statusCode === "number" ? error.statusCode : null;
  const sender = currentSenderLabel();

  const isTestingDomainRestriction =
    /only send testing emails to your own email address/i.test(rawMessage) ||
    (isResendTestingFromAddress(env.EMAIL_FROM) &&
      /verify a domain/i.test(rawMessage));

  const isUnverifiedDomain =
    /domain is not verified/i.test(rawMessage) ||
    (/verify a domain/i.test(rawMessage) &&
      !isResendTestingFromAddress(env.EMAIL_FROM)) ||
    /verify your domain/i.test(rawMessage);

  if (isTestingDomainRestriction) {
    return {
      errorName,
      errorMessage: [
        "Domain is not verified in Resend for production delivery.",
        `Current sender: ${sender}`,
        "Resend testing senders can only deliver to the Resend account owner's email.",
        "Verify your domain at https://resend.com/domains and configure EMAIL_FROM using that verified domain (for example AsliJobs <noreply@aslijobs.com>).",
      ].join(" "),
      statusCode,
      isConfigurationError: true,
    };
  }

  if (isUnverifiedDomain) {
    return {
      errorName,
      errorMessage: [
        "Domain is not verified in Resend.",
        `Current sender: ${sender}`,
        "Configure EMAIL_FROM using your verified domain (for example AsliJobs <noreply@aslijobs.com>), then complete DNS verification at https://resend.com/domains.",
      ].join(" "),
      statusCode,
      isConfigurationError: true,
    };
  }

  return {
    errorName,
    errorMessage: `${rawMessage} Current sender: ${sender}.`,
    statusCode,
    isConfigurationError: statusCode === 403,
  };
}

/**
 * Logs email delivery readiness at process startup.
 * Does not print secrets.
 */
export function logEmailConfigurationStatus(): void {
  const hasApiKey = Boolean(env.RESEND_API_KEY.trim());
  const from = env.EMAIL_FROM.trim();

  if (!hasApiKey) {
    console.warn(
      "[email-config] RESEND_API_KEY is not set. Invitation emails will not be delivered via Resend.",
    );
    return;
  }

  if (!from) {
    console.warn(
      "[email-config] EMAIL_FROM is not set. Set EMAIL_FROM=AsliJobs <noreply@aslijobs.com> after verifying aslijobs.com in Resend.",
    );
    return;
  }

  if (isResendTestingFromAddress(from)) {
    console.warn(
      `[email-config] Production delivery is limited. Current sender "${from}" uses Resend's testing domain and can only deliver to the Resend account owner's email. Verify aslijobs.com at https://resend.com/domains and set EMAIL_FROM=AsliJobs <noreply@aslijobs.com>.`,
    );
    return;
  }

  console.info(
    `[email-config] Invitation email sender configured: ${from}`,
  );
}

/**
 * Sends a team invitation email via Resend.
 * Sender address always comes from env.EMAIL_FROM — never hardcoded.
 */
export async function sendTeamInvitationEmail(
  payload: TeamInvitationEmailPayload,
): Promise<TeamInvitationEmailDeliveryResult> {
  const subject = `You're invited to join ${payload.companyName}`;
  const html = buildInvitationHtml(payload);
  const text = buildInvitationText(payload);
  const from = env.EMAIL_FROM.trim();

  if (!env.RESEND_API_KEY.trim()) {
    if (env.NODE_ENV === "production") {
      console.error(
        "[team-invite-email] RESEND_API_KEY is missing in production",
      );
      return {
        ok: false,
        errorName: "ConfigurationError",
        errorMessage:
          "Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM using a verified domain.",
        statusCode: null,
        isConfigurationError: true,
      };
    }

    console.info(
      `[team-invite-email:dev] to=${payload.toEmail} acceptUrl=${payload.acceptUrl}`,
    );
    return { ok: true, providerMessageId: null };
  }

  if (!from) {
    console.error("[team-invite-email] EMAIL_FROM is missing");
    return {
      ok: false,
      errorName: "ConfigurationError",
      errorMessage:
        "EMAIL_FROM is not configured. Set EMAIL_FROM=AsliJobs <noreply@aslijobs.com> using your verified Resend domain.",
      statusCode: null,
      isConfigurationError: true,
    };
  }

  try {
    console.info(
      `[team-invite-email] sending via Resend from=${from} to=${payload.toEmail}` +
        (env.NODE_ENV === "development"
          ? ` acceptUrl=${payload.acceptUrl}`
          : ` tokenLength=${new URL(payload.acceptUrl).searchParams.get("token")?.length ?? 0}`),
    );
    const resend = new Resend(env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to: payload.toEmail,
      subject,
      html,
      text,
    });

    if (error) {
      const classified = classifyResendError(error);
      console.error("[team-invite-email] Resend provider error", {
        errorName: classified.errorName,
        providerMessage: error.message,
        classifiedMessage: classified.errorMessage,
        statusCode: classified.statusCode,
        toEmail: payload.toEmail,
        from,
        isConfigurationError: classified.isConfigurationError,
      });
      return {
        ok: false,
        ...classified,
      };
    }

    return {
      ok: true,
      providerMessageId: data?.id ?? null,
    };
  } catch (error) {
    const errorName =
      error instanceof Error ? error.constructor.name : "UnknownError";
    const errorMessage =
      error instanceof Error ? error.message : "Unexpected email send failure.";

    console.error("[team-invite-email] Unexpected exception while sending", {
      errorName,
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      toEmail: payload.toEmail,
      from,
    });

    return {
      ok: false,
      errorName,
      errorMessage: `${errorMessage} Current sender: ${from}.`,
      statusCode: null,
      isConfigurationError: false,
    };
  }
}

export function buildTeamInvitationAcceptUrl(token: string): string {
  const base = env.FRONTEND_URL.replace(/\/+$/, "");
  return `${base}/team/accept-invitation?token=${encodeURIComponent(token)}`;
}
