import { Resend } from "resend";
import { env } from "../../config/env.js";

export type TransactionalEmailResult =
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

export type SendTransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  logPrefix: string;
  /** Extra non-secret context for development logs only. */
  devLogExtra?: string;
};

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
  const rawMessage = error.message?.trim() || "Unknown email provider error.";
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

  console.info(`[email-config] Invitation email sender configured: ${from}`);
}

/**
 * Sends a transactional email via the existing Resend configuration.
 */
export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<TransactionalEmailResult> {
  const from = env.EMAIL_FROM.trim();
  const logPrefix = input.logPrefix;

  if (!env.RESEND_API_KEY.trim()) {
    if (env.NODE_ENV === "production") {
      console.error(`[${logPrefix}] RESEND_API_KEY is missing in production`);
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
      `[${logPrefix}:dev] to=${input.to} subject=${input.subject}${
        input.devLogExtra ? ` ${input.devLogExtra}` : ""
      }`,
    );
    return { ok: true, providerMessageId: null };
  }

  if (!from) {
    console.error(`[${logPrefix}] EMAIL_FROM is missing`);
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
      `[${logPrefix}] sending via Resend from=${from} to=${input.to} subject=${input.subject}`,
    );
    const resend = new Resend(env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      const classified = classifyResendError(error);
      console.error(`[${logPrefix}] Resend provider error`, {
        errorName: classified.errorName,
        providerMessage: error.message,
        classifiedMessage: classified.errorMessage,
        statusCode: classified.statusCode,
        toEmail: input.to,
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

    console.error(`[${logPrefix}] Unexpected exception while sending`, {
      errorName,
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      toEmail: input.to,
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
