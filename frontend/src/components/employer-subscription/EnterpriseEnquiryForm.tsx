"use client";

import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { useTranslate } from "@/i18n/translate";
import { submitEnterpriseEnquiry } from "@/services/subscription.service";
import { getApiErrorMessage } from "@/utils/normalize-api-error";
import { showAppToast } from "@/utils/share-job";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

const inputClassName =
  "mt-1 block w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function EnterpriseEnquiryForm({ onClose }: { onClose: () => void }) {
  const t = useTranslate();
  const employer = useEmployerProfile().data;

  const [contactName, setContactName] = useState(
    () => (employer ? `${employer.firstName} ${employer.lastName}`.trim() : ""),
  );
  const [phone, setPhone] = useState(() => employer?.whatsappNumber ?? "");
  const [email, setEmail] = useState(() => employer?.emailAddress ?? "");
  const [companyName, setCompanyName] = useState(() => employer?.companyName ?? "");
  const [hires, setHires] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: submitEnterpriseEnquiry,
    onSuccess: (result) => {
      showAppToast(result.message || t("employer.subscriptionPage.enterprise.sent"), "success");
      onClose();
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, t("employer.subscriptionPage.enterprise.failed")));
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const hiresNumber = Number.parseInt(hires, 10);
    mutation.mutate({
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      companyName: companyName.trim(),
      ...(Number.isFinite(hiresNumber) && hiresNumber > 0
        ? { expectedMonthlyHires: hiresNumber }
        : {}),
      message: message.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 rounded-xl border border-primary/20 bg-primary-light/40 p-4 sm:p-5"
      aria-labelledby="enterprise-enquiry-title"
    >
      <h3 id="enterprise-enquiry-title" className="text-base font-bold text-foreground">
        {t("employer.subscriptionPage.enterprise.title")}
      </h3>
      <p className="mt-0.5 text-sm text-muted">
        {t("employer.subscriptionPage.enterprise.description")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          {t("employer.subscriptionPage.enterprise.name")}
          <input
            className={inputClassName}
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          {t("employer.subscriptionPage.enterprise.phone")}
          <input
            className={inputClassName}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            type="tel"
            minLength={10}
            maxLength={16}
            autoComplete="tel"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          {t("employer.subscriptionPage.enterprise.email")}
          <input
            className={inputClassName}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            maxLength={200}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          {t("employer.subscriptionPage.enterprise.company")}
          <input
            className={inputClassName}
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            maxLength={200}
            autoComplete="organization"
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          {t("employer.subscriptionPage.enterprise.hires")}
          <input
            className={inputClassName}
            value={hires}
            onChange={(event) => setHires(event.target.value)}
            type="number"
            min={1}
            max={100000}
            inputMode="numeric"
          />
        </label>
        <label className="block text-sm font-medium text-foreground sm:col-span-2">
          {t("employer.subscriptionPage.enterprise.message")}
          <textarea
            className={inputClassName}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            maxLength={2000}
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-10 items-center rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-hero-bg"
        >
          {t("employer.subscriptionPage.enterprise.cancel")}
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {mutation.isPending
            ? t("employer.subscriptionPage.enterprise.sending")
            : t("employer.subscriptionPage.enterprise.submit")}
        </button>
      </div>
    </form>
  );
}
