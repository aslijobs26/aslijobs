"use client";

import {
  EMPLOYER_REGISTER_HEADING,
  EMPLOYER_REGISTER_INITIAL_FORM_DATA,
  EMPLOYER_REGISTER_SUBMIT_LABEL,
} from "@/constants/employer-register";
import type { EmployerRegisterFormData } from "@/types/employer-register";
import { useState, type FormEvent } from "react";

const fieldLabelClassName = "text-sm font-bold text-foreground";

const inputClassName =
  "h-12 w-full rounded-md border border-border bg-surface px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

export function EmployerRegisterForm() {
  const [formData, setFormData] = useState<EmployerRegisterFormData>(
    EMPLOYER_REGISTER_INITIAL_FORM_DATA,
  );

  const updateField = <K extends keyof EmployerRegisterFormData>(
    field: K,
    value: EmployerRegisterFormData[K],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-tight">
        {EMPLOYER_REGISTER_HEADING}
      </h1>

      <form className="mt-8 w-full space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="flex w-full flex-col gap-2">
          <label htmlFor="company-name" className={fieldLabelClassName}>
            Company/Business Name*
          </label>
          <input
            id="company-name"
            type="text"
            value={formData.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder="Enter company name"
            autoComplete="organization"
            className={inputClassName}
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="first-name" className={fieldLabelClassName}>
              First Name
            </label>
            <input
              id="first-name"
              type="text"
              value={formData.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              placeholder="Enter company name"
              autoComplete="given-name"
              className={inputClassName}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="last-name" className={fieldLabelClassName}>
              Last Name
            </label>
            <input
              id="last-name"
              type="text"
              value={formData.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder="Enter company name"
              autoComplete="family-name"
              className={inputClassName}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <label htmlFor="whatsapp-number" className={fieldLabelClassName}>
            WhatsApp Number*
          </label>
          <input
            id="whatsapp-number"
            type="tel"
            inputMode="numeric"
            value={formData.whatsappNumber}
            onChange={(event) =>
              updateField("whatsappNumber", event.target.value)
            }
            placeholder="Enter WhatsApp Number"
            autoComplete="tel"
            className={inputClassName}
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <label htmlFor="email-address" className={fieldLabelClassName}>
            Email Address
          </label>
          <input
            id="email-address"
            type="email"
            value={formData.emailAddress}
            onChange={(event) =>
              updateField("emailAddress", event.target.value)
            }
            placeholder="Enter Email Address"
            autoComplete="email"
            className={inputClassName}
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary-soft text-sm font-bold text-surface transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {EMPLOYER_REGISTER_SUBMIT_LABEL}
        </button>
      </form>
    </div>
  );
}
