"use client";

import { ROUTES } from "@/constants/routes";
import { RBAC_QUERY_KEYS } from "@/constants/employer-rbac";
import { useTranslate } from "@/i18n/translate";
import { loginTeamMember } from "@/services/employer-team.service";
import { getTeamApiErrorMessage } from "@/utils/employer-team";
import { establishEmployerClientSession } from "@/utils/employer-session";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function TeamMemberLoginForm() {
  const t = useTranslate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const activated = searchParams.get("activated") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: loginTeamMember,
    onSuccess: async (data) => {
      setErrorMessage(null);
      await establishEmployerClientSession(queryClient, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      queryClient.setQueryData(RBAC_QUERY_KEYS.session(), data.rbac);
      router.replace(ROUTES.EMPLOYER_DASHBOARD);
    },
    onError: (error) => {
      setErrorMessage(
        getTeamApiErrorMessage(error, t("auth.team.loginFailed")),
      );
    },
  });

  return (
    <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="break-words text-xl font-bold text-foreground">
        {t("auth.team.heading")}
      </h1>
      <p className="mt-1 break-words text-sm text-muted">
        {t("auth.team.subtitle")}
      </p>

      {activated ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {t("auth.team.activated")}
        </p>
      ) : null}

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          loginMutation.mutate({
            email: email.trim(),
            password,
          });
        }}
      >
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            {t("auth.team.email")}
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            {t("auth.team.password")}
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-50"
        >
          {loginMutation.isPending
            ? t("auth.team.signingIn")
            : t("auth.team.signIn")}
        </button>
      </form>

      <p className="mt-4 break-words text-center text-sm text-muted">
        {t("auth.team.employerAccount")}{" "}
        <Link
          href={ROUTES.EMPLOYER_LOGIN}
          className="font-semibold text-primary hover:underline"
        >
          {t("auth.team.loginHere")}
        </Link>
      </p>
    </div>
  );
}

export function TeamMemberLoginPageClient() {
  const t = useTranslate();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-4 py-10">
      <Suspense
        fallback={
          <div
            className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface p-8 text-center text-sm text-muted"
            role="status"
          >
            {t("auth.team.loading")}
          </div>
        }
      >
        <TeamMemberLoginForm />
      </Suspense>
    </div>
  );
}
