"use client";

import hireAssistSpecialist from "@/assets/image/hire-assist-specialist.png";
import { Container } from "@/components/layout/Container";
import {
  HIRE_ASSIST_MESSAGE_MAX,
  HIRE_ASSIST_MESSAGE_MIN,
  HIRE_ASSIST_OPTIONS,
  type HireAssistAssistanceValue,
} from "@/constants/hire-assist";
import { ROUTES } from "@/constants/routes";
import {
  readHireAssistError,
  submitHireAssistRequest,
} from "@/services/hire-assist.service";
import {
  computeAnchoredDropdownPosition,
  readSafeAreaInsets,
  readVisibleViewportSize,
  type AnchoredDropdownPosition,
} from "@/utils/anchored-dropdown-position";
import { cn } from "@/utils/cn";
import { Check, CheckCircle2, ChevronDown, Headset, Loader2, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "aslijobs.hireAssist.submission";

type FieldName =
  | "fullName"
  | "companyName"
  | "mobileNumber"
  | "email"
  | "designation"
  | "assistanceType"
  | "message";

type FormState = Record<FieldName, string>;

type SavedSubmission = {
  ticketId: string;
  clientRequestId: string;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  companyName: "",
  mobileNumber: "",
  email: "",
  designation: "",
  assistanceType: "",
  message: "",
};

function createClientRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ha${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function readSavedSubmission(): SavedSubmission | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSubmission;
    if (!parsed.ticketId || !parsed.clientRequestId) return null;
    return parsed;
  } catch {
    return null;
  }
}

const inputClassName =
  "w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-xs text-foreground shadow-sm outline-none transition-colors placeholder:text-[#a8b3bc] focus:border-primary focus:ring-2 focus:ring-primary/25 sm:text-sm";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-600">{message}</p>;
}

function AssistanceSelect({
  id,
  value,
  invalid,
  onChange,
}: {
  id: string;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<AnchoredDropdownPosition | null>(null);
  const [menuWidth, setMenuWidth] = useState(0);
  const selected = HIRE_ASSIST_OPTIONS.find((option) => option.value === value);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const list = listRef.current;
    if (!trigger || !list) return;

    const rect = trigger.getBoundingClientRect();
    const viewport = readVisibleViewportSize();
    const optionHeight = list.querySelector("button")?.getBoundingClientRect().height ?? 40;
    const listStyle = window.getComputedStyle(list);
    const visibleHeight =
      optionHeight * 6 +
      (parseFloat(listStyle.paddingTop) || 0) +
      (parseFloat(listStyle.paddingBottom) || 0) +
      (parseFloat(listStyle.borderTopWidth) || 0) +
      (parseFloat(listStyle.borderBottomWidth) || 0);
    setMenuWidth(rect.width);
    const nextPosition = computeAnchoredDropdownPosition({
      anchorRect: rect,
      contentWidth: rect.width,
      contentHeight: visibleHeight,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      insets: readSafeAreaInsets(),
      gap: 6,
    });
    setPosition({
      ...nextPosition,
      maxHeight: Math.min(nextPosition.maxHeight, visibleHeight),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleViewportChange = () => updatePosition();
    const handleScroll = (event: Event) => {
      if (event.target !== listRef.current) updatePosition();
    };
    const visualViewport = window.visualViewport;

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleScroll, true);
    visualViewport?.addEventListener("resize", handleViewportChange);
    visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleScroll, true);
      visualViewport?.removeEventListener("resize", handleViewportChange);
      visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [isOpen, updatePosition]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={invalid || undefined}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          inputClassName,
          "flex items-center justify-between gap-3 text-left",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
          !selected && "text-muted",
          isOpen && "border-primary ring-2 ring-primary/25",
          invalid && "border-red-400",
        )}
      >
        <span className="truncate">
          {selected?.label ?? "Select the assistance you need"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {isOpen
        ? createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label="How can we help you?"
              style={
                position
                  ? {
                      top: position.top,
                      left: position.left,
                      width: menuWidth,
                      maxHeight: position.maxHeight,
                    }
                  : { top: 0, left: 0, visibility: "hidden" }
              }
              className="fixed z-[55] overflow-y-auto overscroll-contain rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_8px_24px_rgba(26,43,60,0.12)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {HIRE_ASSIST_OPTIONS.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        triggerRef.current?.focus();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-xs transition-colors sm:text-sm",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                        isSelected
                          ? "bg-primary-light font-semibold text-primary"
                          : "font-medium text-foreground hover:bg-primary-light/60",
                      )}
                    >
                      <span>{option.label}</span>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

export function HireAssistPageContent() {
  const formId = useId();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clientRequestId, setClientRequestId] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readSavedSubmission();
    if (saved) {
      setTicketId(saved.ticketId);
      setClientRequestId(saved.clientRequestId);
    } else {
      setClientRequestId(createClientRequestId());
    }
    setReady(true);
  }, []);

  function update(field: FieldName, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function validate(): Partial<Record<FieldName, string>> {
    const next: Partial<Record<FieldName, string>> = {};
    if (form.fullName.trim().length < 2) {
      next.fullName = "Enter your full name.";
    }
    if (form.companyName.trim().length < 2) {
      next.companyName = "Enter your company or organization name.";
    }
    const digits = form.mobileNumber.replace(/\D/g, "");
    const mobile =
      digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits.length === 11 && digits.startsWith("0")
          ? digits.slice(1)
          : digits;
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      next.mobileNumber = "Enter a valid 10-digit Indian mobile number.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!form.assistanceType) {
      next.assistanceType = "Select the assistance you need.";
    }
    const message = form.message.trim();
    if (message.length < HIRE_ASSIST_MESSAGE_MIN) {
      next.message = `Describe your requirements in at least ${HIRE_ASSIST_MESSAGE_MIN} characters.`;
    } else if (message.length > HIRE_ASSIST_MESSAGE_MAX) {
      next.message = "Keep your message within 2,000 characters.";
    }
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !clientRequestId) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please correct the highlighted fields.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const result = await submitHireAssistRequest({
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        email: form.email.trim(),
        designation: form.designation.trim(),
        assistanceType: form.assistanceType as HireAssistAssistanceValue,
        message: form.message.trim(),
        clientRequestId,
      });
      const saved = { ticketId: result.ticketId, clientRequestId };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setTicketId(result.ticketId);
    } catch (error) {
      const parsed = readHireAssistError(error);
      setFormError(parsed.message);
      setErrors((current) => ({ ...current, ...parsed.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  }

  function startAnother() {
    sessionStorage.removeItem(STORAGE_KEY);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError("");
    setTicketId(null);
    setClientRequestId(createClientRequestId());
  }

  if (!ready) {
    return (
      <main className="bg-hero-bg/40">
        <Container className="py-16">
          <p className="text-sm text-muted">Loading Hire Assist…</p>
        </Container>
      </main>
    );
  }

  if (ticketId) {
    return (
      <main className="bg-hero-bg/40">
        <section className="py-10 sm:py-14 lg:py-16">
          <Container>
            <div className="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-surface px-6 py-10 text-center shadow-sm sm:px-10">
              <CheckCircle2
                className="mx-auto size-12 text-emerald-600"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
                Your Request Has Been Submitted!
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                Thank you for contacting AsliJobs. Our team has received your
                hiring assistance request and will get in touch with you.
              </p>
              <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">
                Ticket ID
              </p>
              <p className="mt-1 font-mono text-base font-semibold text-foreground sm:text-lg">
                {ticketId}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={ROUTES.HOME}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-surface hover:bg-primary-hover"
                >
                  Back to Homepage
                </Link>
                <button
                  type="button"
                  onClick={startAnother}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-subtle px-5 text-sm font-semibold text-foreground hover:bg-hero-bg/60"
                >
                  Submit another request
                </button>
              </div>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-hero-bg/40">
      <section className="py-8 sm:py-10 lg:py-14">
        <Container>
          <div className="grid items-start gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 lg:gap-12">
            <div>
              <div className="relative mx-auto mb-4 aspect-square w-full max-w-md overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-[#dff4f1] via-[#f7fbfb] to-[#eef3f4] sm:mb-5">
                <p className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                  <Headset className="size-3.5 text-primary" aria-hidden="true" />
                  Hire Assist
                </p>
                <Image
                  src={hireAssistSpecialist}
                  alt="Hire Assist specialist ready to help you hire"
                  fill
                  priority
                  sizes="(min-width: 1024px) 448px, (min-width: 768px) 340px, 100vw"
                  className="object-contain object-center"
                />
              </div>
              <div className="mx-auto w-full max-w-md">
                <h1 className="text-xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl md:text-2xl lg:text-4xl">
                  Need Help Hiring the Right Talent?
                </h1>
                <p className="mt-2 text-xs leading-5 text-muted sm:mt-3 sm:text-sm sm:leading-6 lg:text-base">
                  Tell us about your hiring requirements. Our team will help you
                  connect with the right candidates faster.
                </p>
                <ul className="mt-4 space-y-2 text-xs leading-5 text-foreground sm:mt-6 sm:space-y-3 sm:text-sm sm:leading-normal">
                  <li className="flex items-start gap-2">
                    <Users className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                    Expert help for job posting, sourcing, and shortlisting
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                    Dedicated support for blue collar and grey collar hiring
                  </li>
                  <li className="flex items-start gap-2">
                    <Headset className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                    A tracked request our team can follow up on
                  </li>
                </ul>
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              noValidate
              className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-sm lg:p-6"
            >
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Contact information
              </h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:text-sm">
                  Full name
                  <input
                    id={`${formId}-name`}
                    name="fullName"
                    autoComplete="name"
                    required
                    value={form.fullName}
                    onChange={(event) => update("fullName", event.target.value)}
                    className={inputClassName}
                  />
                  <FieldError message={errors.fullName} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:text-sm">
                  Company / organization
                  <input
                    name="companyName"
                    autoComplete="organization"
                    required
                    value={form.companyName}
                    onChange={(event) => update("companyName", event.target.value)}
                    className={inputClassName}
                  />
                  <FieldError message={errors.companyName} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:text-sm">
                  Mobile number
                  <input
                    name="mobileNumber"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={form.mobileNumber}
                    onChange={(event) => update("mobileNumber", event.target.value)}
                    className={inputClassName}
                  />
                  <FieldError message={errors.mobileNumber} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:text-sm">
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    className={inputClassName}
                  />
                  <FieldError message={errors.email} />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-foreground sm:text-sm lg:col-span-2">
                  <span>
                    Designation / job role
                    <span className="ml-1.5 font-normal text-muted">Optional</span>
                  </span>
                  <input
                    name="designation"
                    autoComplete="organization-title"
                    value={form.designation}
                    onChange={(event) => update("designation", event.target.value)}
                    className={inputClassName}
                  />
                </label>
              </div>

              <h2 className="mt-6 text-base font-semibold text-foreground sm:text-lg">
                What help do you need?
              </h2>
              <label className="mt-4 flex flex-col gap-1.5 text-xs font-medium text-foreground sm:text-sm">
                How can we help you?
                <AssistanceSelect
                  id={`${formId}-assistance`}
                  value={form.assistanceType}
                  invalid={Boolean(errors.assistanceType)}
                  onChange={(next) => update("assistanceType", next)}
                />
                <FieldError message={errors.assistanceType} />
              </label>

              <label className="mt-4 flex flex-col gap-1.5 text-xs font-medium text-foreground sm:text-sm">
                Tell us more about your requirements
                <textarea
                  name="message"
                  required
                  rows={4}
                  maxLength={HIRE_ASSIST_MESSAGE_MAX}
                  placeholder="Roles, number of candidates, and location."
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  className={`${inputClassName} min-h-28 resize-y`}
                />
                <div className="flex items-center justify-between gap-3 font-normal">
                  <FieldError message={errors.message} />
                  <span className="ml-auto text-xs text-muted">
                    {form.message.trim().length}/{HIRE_ASSIST_MESSAGE_MAX}
                  </span>
                </div>
              </label>

              {formError ? (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-surface hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {submitting ? "Submitting…" : "Submit Hire Assist Request"}
              </button>
            </form>
          </div>
        </Container>
      </section>
    </main>
  );
}
