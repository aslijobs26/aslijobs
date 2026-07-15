"use client";

import {
  EMPLOYER_REGISTER_HEADING,
  EMPLOYER_REGISTER_INITIAL_FORM_DATA,
  EMPLOYER_REGISTER_SUBMIT_LABEL,
} from "@/constants/employer-register";
import type { EmployerRegisterFormData } from "@/types/employer-register";
import { useState, type FormEvent } from "react";

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
      <h1 className="employer-register-form-heading">
        {EMPLOYER_REGISTER_HEADING}
      </h1>

      <form
        className="employer-register-form-fields mt-[clamp(1.5rem,2.5vw,2rem)] w-full"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="employer-register-form-stack">
          <label htmlFor="company-name" className="employer-register-form-label">
            Company/Business Name*
          </label>
          <input
            id="company-name"
            type="text"
            value={formData.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder="Enter company name"
            autoComplete="organization"
            className="employer-register-form-input"
          />
        </div>

        <div className="employer-register-form-row">
          <div className="employer-register-form-stack">
            <label htmlFor="first-name" className="employer-register-form-label">
              First Name
            </label>
            <input
              id="first-name"
              type="text"
              value={formData.firstName}
              onChange={(event) => updateField("firstName", event.target.value)}
              placeholder="Enter company name"
              autoComplete="given-name"
              className="employer-register-form-input"
            />
          </div>

          <div className="employer-register-form-stack">
            <label htmlFor="last-name" className="employer-register-form-label">
              Last Name
            </label>
            <input
              id="last-name"
              type="text"
              value={formData.lastName}
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder="Enter company name"
              autoComplete="family-name"
              className="employer-register-form-input"
            />
          </div>
        </div>

        <div className="employer-register-form-stack">
          <label htmlFor="whatsapp-number" className="employer-register-form-label">
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
            className="employer-register-form-input"
          />
        </div>

        <div className="employer-register-form-stack">
          <label htmlFor="email-address" className="employer-register-form-label">
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
            className="employer-register-form-input"
          />
        </div>

        <button type="submit" className="employer-register-form-submit">
          {EMPLOYER_REGISTER_SUBMIT_LABEL}
        </button>
      </form>
    </div>
  );
}
