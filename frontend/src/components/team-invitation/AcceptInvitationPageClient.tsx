"use client";

import { ROUTES } from "@/constants/routes";
import {
  acceptTeamInvitation,
  previewTeamInvitation,
} from "@/services/employer-team.service";
import type { TeamInvitationPreview } from "@/types/employer-team";
import { getTeamApiErrorMessage } from "@/utils/employer-team";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

function InvitationStatusCard({
  title,
  description,
  tone = "neutral",
}: {
  title: string;
  description: string;
  tone?: "neutral" | "error" | "success";
}) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-border-subtle bg-hero-bg text-foreground";

  return (
    <div className={`rounded-xl border px-4 py-5 ${toneClass}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed opacity-90">{description}</p>
      <Link
        href={ROUTES.TEAM_MEMBER_LOGIN}
        className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        Go to Team Member Login
      </Link>
    </div>
  );
}

function AcceptInvitationForm({ preview }: { preview: TeamInvitationPreview }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [fullName, setFullName] = useState(preview.fullName ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(preview.fullName ?? "");
  }, [preview.fullName]);

  const acceptMutation = useMutation({
    mutationFn: acceptTeamInvitation,
    onSuccess: () => {
      router.replace(
        `${ROUTES.TEAM_MEMBER_LOGIN}?activated=1`,
      );
    },
  });

  const passwordHints = useMemo(
    () => [
      {
        label: "At least 8 characters",
        ok: password.length >= 8,
      },
      {
        label: "Uppercase letter",
        ok: /[A-Z]/.test(password),
      },
      {
        label: "Lowercase letter",
        ok: /[a-z]/.test(password),
      },
      {
        label: "Number",
        ok: /\d/.test(password),
      },
      {
        label: "Special character",
        ok: /[^A-Za-z0-9]/.test(password),
      },
    ],
    [password],
  );

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-bold text-foreground">Accept Invitation</h1>
      <p className="mt-1 text-sm text-muted">
        Join {preview.companyName ?? "the team"} as{" "}
        {preview.roleName ?? "Team Member"}
        {preview.departmentName ? ` in ${preview.departmentName}` : ""}.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFieldError(null);

          const trimmedName = fullName.trim();
          if (trimmedName.length < 2) {
            setFieldError("Please enter your full name.");
            return;
          }
          if (!PASSWORD_PATTERN.test(password)) {
            setFieldError(
              "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
            );
            return;
          }
          if (password !== confirmPassword) {
            setFieldError("Passwords do not match.");
            return;
          }
          if (!acceptTerms) {
            setFieldError("Please accept the terms to continue.");
            return;
          }
          if (!token) {
            setFieldError("Invitation token is missing.");
            return;
          }

          acceptMutation.mutate({
            token,
            fullName: trimmedName,
            password,
            confirmPassword,
            acceptTerms: true,
          });
        }}
      >
        {(fieldError || acceptMutation.isError) && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {fieldError ??
              getTeamApiErrorMessage(
                acceptMutation.error,
                "Could not create your account.",
              )}
          </p>
        )}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Full Name
          </span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">Email</span>
          <input
            type="email"
            readOnly
            value={preview.email ?? ""}
            className="h-10 w-full cursor-not-allowed rounded-lg border border-border-subtle bg-hero-bg px-3 text-sm text-muted"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Create Password
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <ul className="space-y-1 text-xs text-muted" aria-live="polite">
          {passwordHints.map((hint) => (
            <li
              key={hint.label}
              className={hint.ok ? "text-emerald-600" : undefined}
            >
              {hint.ok ? "✓" : "•"} {hint.label}
            </li>
          ))}
        </ul>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Confirm Password
          </span>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(event) => setAcceptTerms(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border-subtle text-primary focus:ring-primary/20"
          />
          <span>
            I accept the terms of use and confirm that I am authorized to join
            this organization.
          </span>
        </label>

        <button
          type="submit"
          disabled={acceptMutation.isPending}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-50"
        >
          {acceptMutation.isPending ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const previewQuery = useQuery({
    queryKey: ["team-invitation-preview", token],
    queryFn: () => previewTeamInvitation(token),
    enabled: token.length >= 32,
    retry: false,
  });

  if (!token) {
    return (
      <InvitationStatusCard
        title="Invitation Invalid"
        description="This invitation link is missing a valid token. Ask your employer to resend the invitation."
        tone="error"
      />
    );
  }

  if (previewQuery.isLoading) {
    return (
      <div
        className="rounded-2xl border border-border-subtle bg-surface p-8 text-center text-sm text-muted"
        role="status"
        aria-live="polite"
      >
        Validating your invitation...
      </div>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <InvitationStatusCard
        title="Invitation Invalid"
        description={getTeamApiErrorMessage(
          previewQuery.error,
          "This invitation link is invalid or no longer available.",
        )}
        tone="error"
      />
    );
  }

  const preview = previewQuery.data;

  if (preview.state === "expired") {
    return (
      <InvitationStatusCard
        title="Invitation Expired"
        description="This invitation has expired. Ask your employer to resend a new invitation."
        tone="error"
      />
    );
  }

  if (preview.state === "accepted") {
    return (
      <InvitationStatusCard
        title="Invitation Already Accepted"
        description="This invitation was already used. Sign in with the password you created."
        tone="success"
      />
    );
  }

  if (preview.state === "cancelled" || preview.state === "rejected") {
    return (
      <InvitationStatusCard
        title="Invitation Invalid"
        description={
          preview.message ||
          "This invitation is no longer valid. Contact your employer for a new invite."
        }
        tone="error"
      />
    );
  }

  if (preview.state !== "valid") {
    return (
      <InvitationStatusCard
        title="Invitation Invalid"
        description={
          preview.message ||
          "This invitation link is invalid. Ask your employer to resend the invitation."
        }
        tone="error"
      />
    );
  }

  return <AcceptInvitationForm preview={preview} />;
}

export function AcceptInvitationPageClient() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-4 py-10">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div
              className="rounded-2xl border border-border-subtle bg-surface p-8 text-center text-sm text-muted"
              role="status"
            >
              Loading invitation...
            </div>
          }
        >
          <AcceptInvitationContent />
        </Suspense>
      </div>
    </div>
  );
}
