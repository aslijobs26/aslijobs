import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  useCompleteOperationsEmployer,
  useRegisterOperationsEmployer,
  useResendOperationsEmployerOtp,
  useVerifyOperationsEmployerOtp,
} from "../../../../hooks/use-operations-employers";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";
import {
  getOperationsEmployerBusinessCategoryOptions,
  OPERATIONS_EMPLOYER_INDUSTRY_OPTIONS,
} from "../../../../constants/operations-employer-industries";
import { OperationsPostJobPlaceAutocomplete } from "../../jobs/post/OperationsPostJobPlaceAutocomplete";
import type { PlaceSuggestion } from "../../../../types/place-suggestion";
import { OperationsAlertDialog } from "../../../ui/OperationsAlertDialog";
import {
  firstOperationsErrorMessage,
  getOperationsApiErrorMessage,
  getOperationsApiFieldErrors,
} from "../../../../utils/operations-api-errors";
import { AddEmployerDocumentField } from "./AddEmployerDocumentField";
import { AddEmployerImageField } from "./AddEmployerImageField";
import { AddEmployerOtpSection } from "./AddEmployerOtpSection";
import {
  addEmployerImageFieldId,
  addEmployerImageFieldLabel,
  EMPTY_ADD_EMPLOYER_FORM,
  isolateAddEmployerForm,
  OPERATIONS_EMPLOYER_ACCOUNT_TYPE_OPTIONS,
  OPERATIONS_EMPLOYER_OTP_LENGTH,
  operationsEmployerDocumentOptions,
  operationsEmployerDocumentSectionLabel,
  parseOptionalInt,
  validateAddEmployerDocumentFile,
  validateAddEmployerForm,
  type AddEmployerDocumentPreview,
  type AddEmployerFormState,
  type AddEmployerImagePreview,
  type OperationsEmployerAccountType,
} from "./add-employer-form";

interface AddEmployerDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_OTP = Array.from({ length: OPERATIONS_EMPLOYER_OTP_LENGTH }, () => "");

const inputClassName =
  "w-full rounded-lg border border-border-subtle bg-hero-bg/40 px-2.5 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

function RequiredMark() {
  return (
    <span className="text-danger" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function FieldLabel({
  htmlFor,
  label,
  required = false,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-semibold text-muted">
      {label}
      {required ? <RequiredMark /> : null}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="mt-1 text-[11px] text-danger" role="alert">
      {message}
    </p>
  );
}

export function AddEmployerDialog({ open, onClose }: AddEmployerDialogProps) {
  const titleId = useId();
  const registerMutation = useRegisterOperationsEmployer();
  const resendMutation = useResendOperationsEmployerOtp();
  const verifyMutation = useVerifyOperationsEmployerOtp();
  const completeMutation = useCompleteOperationsEmployer();

  const [form, setForm] = useState<AddEmployerFormState>(EMPTY_ADD_EMPLOYER_FORM);
  const [imagePreview, setImagePreview] =
    useState<AddEmployerImagePreview | null>(null);
  const [documentPreview, setDocumentPreview] =
    useState<AddEmployerDocumentPreview | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(EMPTY_ADD_EMPLOYER_FORM);
    setImagePreview(null);
    setDocumentPreview(null);
    setFieldErrors({});
    setFormError(null);
    setAlertMessage(null);
    setEmployerId(null);
    setOtpDigits(EMPTY_OTP);
    setOtpSent(false);
    setOtpVerified(false);
    setResendSecondsLeft(0);
  }, [open]);

  useEffect(() => {
    if (resendSecondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setResendSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendSecondsLeft]);

  if (!open) {
    return null;
  }

  const accountType = form.accountType;
  const isBusy =
    registerMutation.isPending ||
    resendMutation.isPending ||
    verifyMutation.isPending ||
    completeMutation.isPending;
  const businessCategories = getOperationsEmployerBusinessCategoryOptions(
    form.industry,
  );

  const applyErrors = (error: unknown, fallback?: Record<string, string>) => {
    const next = {
      ...(fallback ?? {}),
      ...getOperationsApiFieldErrors(error),
    };
    setFieldErrors(next);
    const message = getOperationsApiErrorMessage(error);
    setFormError(message);
    setAlertMessage(message);
    const first = Object.keys(next)[0];
    if (first) {
      window.requestAnimationFrame(() => {
        document.getElementById(first)?.focus();
      });
    }
  };

  const clearFieldErrors = (...keys: Array<keyof AddEmployerFormState>) => {
    setFieldErrors((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of keys) {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  };

  const updateField = <K extends keyof AddEmployerFormState>(
    key: K,
    value: AddEmployerFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldErrors(key);
    if (key === "whatsappNumber" && (otpSent || otpVerified)) {
      setOtpSent(false);
      setOtpVerified(false);
      setEmployerId(null);
      setOtpDigits(EMPTY_OTP);
    }
  };

  const handleCategoryChange = (value: OperationsEmployerAccountType) => {
    setForm((prev) => isolateAddEmployerForm(value, { ...prev, accountType: value }));
    setDocumentPreview(null);
    setFieldErrors({});
    setFormError(null);
    setAlertMessage(null);
    setOtpSent(false);
    setOtpVerified(false);
    setEmployerId(null);
    setOtpDigits(EMPTY_OTP);
  };

  const maskedPhone = form.whatsappNumber
    ? `+91${form.whatsappNumber.replace(/\D/g, "").slice(0, 10)}`
    : "";

  const handleSendOtp = async () => {
    const errors = validateAddEmployerForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      setAlertMessage(
        firstOperationsErrorMessage(
          errors,
          "Please correct the highlighted fields.",
        ),
      );
      const first = Object.keys(errors)[0];
      if (first) {
        document.getElementById(first)?.focus();
      }
      return;
    }
    if (!form.accountType) {
      return;
    }

    try {
      setFormError(null);
      const result = await registerMutation.mutateAsync({
        accountType: form.accountType,
        companyName: form.accountType === "individual" ? "" : form.companyName.trim(),
        establishmentName:
          form.accountType === "individual" ? form.establishmentName.trim() : "",
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        emailAddress: form.emailAddress.trim(),
        whatsappNumber: form.whatsappNumber.replace(/\D/g, ""),
      });
      setEmployerId(result.employerId);
      setOtpSent(true);
      setOtpVerified(false);
      setOtpDigits(EMPTY_OTP);
      setResendSecondsLeft(result.resendAvailableIn);
    } catch (error) {
      applyErrors(error);
    }
  };

  const handleResendOtp = async () => {
    if (!employerId || resendSecondsLeft > 0) {
      return;
    }
    try {
      setFormError(null);
      const result = await resendMutation.mutateAsync(employerId);
      setResendSecondsLeft(result.resendAvailableIn);
      setOtpDigits(EMPTY_OTP);
    } catch (error) {
      applyErrors(error);
    }
  };

  const handleVerifyOtp = async () => {
    if (!employerId) {
      return;
    }
    const otp = otpDigits.join("");
    if (otp.length !== OPERATIONS_EMPLOYER_OTP_LENGTH) {
      const message = "Enter the 6-digit OTP.";
      setFieldErrors((prev) => ({ ...prev, otp: message }));
      setAlertMessage(message);
      return;
    }
    try {
      setFormError(null);
      await verifyMutation.mutateAsync({ employerId, otp });
      setOtpVerified(true);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.otp;
        return next;
      });
    } catch (error) {
      applyErrors(error);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = validateAddEmployerForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setAlertMessage(
        firstOperationsErrorMessage(
          errors,
          "Please correct the highlighted fields.",
        ),
      );
      const first = Object.keys(errors)[0];
      if (first) {
        document.getElementById(first)?.focus();
      }
      return;
    }
    if (!otpVerified || !employerId || !form.accountType) {
      const message = "Verify the WhatsApp OTP before creating the employer.";
      setFormError(message);
      setAlertMessage(message);
      return;
    }

    const documentOptions = operationsEmployerDocumentOptions(form.accountType);
    const documentErrors: Record<string, string> = {};
    if (
      !form.documentType ||
      !documentOptions.some((option) => option.value === form.documentType)
    ) {
      documentErrors.documentType = "Select a document type.";
    }
    if (!documentPreview?.file) {
      documentErrors.documentFile = "Upload the verification document.";
    } else {
      const fileError = validateAddEmployerDocumentFile(documentPreview.file);
      if (fileError) {
        documentErrors.documentFile = fileError;
      }
    }
    if (Object.keys(documentErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...documentErrors }));
      setAlertMessage(
        firstOperationsErrorMessage(
          documentErrors,
          "Please correct the highlighted fields.",
        ),
      );
      const first = Object.keys(documentErrors)[0];
      if (first) {
        document.getElementById(first)?.focus();
      }
      return;
    }

    try {
      setFormError(null);
      await completeMutation.mutateAsync({
        employerId,
        documentFile: documentPreview!.file,
        payload: {
          accountType: form.accountType,
          documentType: form.documentType,
          companyName: form.accountType === "individual" ? "" : form.companyName.trim(),
          establishmentName:
            form.accountType === "individual" ? form.establishmentName.trim() : "",
          industry: form.accountType === "company" ? form.industry : "",
          businessCategory:
            form.accountType === "company" ? form.businessCategory : "",
          minimumEmployees:
            form.accountType === "company"
              ? parseOptionalInt(form.minimumEmployees)
              : null,
          maximumEmployees:
            form.accountType === "company"
              ? parseOptionalInt(form.maximumEmployees)
              : null,
          companyAddress: form.companyAddress.trim(),
          pincode: form.pincode.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
        },
        imageFile: imagePreview?.file ?? null,
      });
      onClose();
    } catch (error) {
      applyErrors(error);
    }
  };

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-subtle bg-surface p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-sm font-bold text-foreground">
              Add Employer
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Create an employer with the same category fields, verification
              document, and WhatsApp OTP as public registration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          <fieldset>
            <legend className="mb-1.5 block text-[11px] font-semibold text-muted">
              Employer Category
              <RequiredMark />
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {OPERATIONS_EMPLOYER_ACCOUNT_TYPE_OPTIONS.map((option) => {
                const selected = accountType === option.value;
                return (
                  <button
                    key={option.value}
                    id={option.value === "individual" ? "accountType" : undefined}
                    type="button"
                    aria-pressed={selected}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                      selected
                        ? "border-primary bg-primary text-surface"
                        : "border-border-subtle bg-hero-bg/40 text-foreground hover:border-primary/40"
                    }`}
                    onClick={() => handleCategoryChange(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <FieldError id="accountType-error" message={fieldErrors.accountType} />
          </fieldset>

          {accountType ? (
            <>
              {accountType === "individual" ? (
                <LabeledInput
                  id="establishmentName"
                  label="Establishment Name"
                  required
                  value={form.establishmentName}
                  error={fieldErrors.establishmentName}
                  onChange={(value) => updateField("establishmentName", value)}
                />
              ) : (
                <LabeledInput
                  id="companyName"
                  label={
                    accountType === "consultancy"
                      ? "Consultancy Name"
                      : "Company / Business Name"
                  }
                  required
                  value={form.companyName}
                  error={fieldErrors.companyName}
                  onChange={(value) => updateField("companyName", value)}
                />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LabeledInput
                  id="firstName"
                  label="First Name"
                  required
                  value={form.firstName}
                  error={fieldErrors.firstName}
                  onChange={(value) => updateField("firstName", value)}
                />
                <LabeledInput
                  id="lastName"
                  label="Last Name"
                  required
                  value={form.lastName}
                  error={fieldErrors.lastName}
                  onChange={(value) => updateField("lastName", value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LabeledInput
                  id="whatsappNumber"
                  label="WhatsApp Number"
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={form.whatsappNumber}
                  error={fieldErrors.whatsappNumber}
                  onChange={(value) =>
                    updateField("whatsappNumber", value.replace(/\D/g, "").slice(0, 10))
                  }
                />
                <LabeledInput
                  id="emailAddress"
                  label="Email"
                  type="email"
                  value={form.emailAddress}
                  error={fieldErrors.emailAddress}
                  onChange={(value) => updateField("emailAddress", value)}
                />
              </div>

              {accountType === "company" ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <LabeledSelect
                      id="industry"
                      label="Industry"
                      required
                      value={form.industry}
                      options={[...OPERATIONS_EMPLOYER_INDUSTRY_OPTIONS]}
                      error={fieldErrors.industry}
                      onChange={(value) => {
                        updateField("industry", value);
                        updateField("businessCategory", "");
                      }}
                    />
                    <LabeledSelect
                      id="businessCategory"
                      label="Business Category"
                      required
                      value={form.businessCategory}
                      options={[...businessCategories]}
                      error={fieldErrors.businessCategory}
                      onChange={(value) => updateField("businessCategory", value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <LabeledInput
                      id="minimumEmployees"
                      label="Min Employees"
                      required
                      type="number"
                      min={0}
                      value={form.minimumEmployees}
                      error={fieldErrors.minimumEmployees}
                      onChange={(value) => {
                        updateField("minimumEmployees", value);
                        updateField("companyStrength", "");
                      }}
                    />
                    <LabeledInput
                      id="maximumEmployees"
                      label="Max Employees"
                      required
                      type="number"
                      min={0}
                      value={form.maximumEmployees}
                      error={fieldErrors.maximumEmployees}
                      onChange={(value) => {
                        updateField("maximumEmployees", value);
                        updateField("companyStrength", "");
                      }}
                    />
                  </div>
                </>
              ) : null}

              {accountType ? (
                <>
                  <LabeledInput
                    id="companyAddress"
                    label={
                      accountType === "individual"
                        ? "Address"
                        : "Company Address"
                    }
                    required
                    value={form.companyAddress}
                    error={fieldErrors.companyAddress}
                    onChange={(value) => updateField("companyAddress", value)}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <LabeledPlaceField
                      id="state"
                      label="State"
                      required
                      mode="state"
                      value={form.state}
                      error={fieldErrors.state}
                      placeholder="Search state"
                      onChange={(value) => {
                        setForm((prev) => ({ ...prev, state: value, city: "" }));
                        clearFieldErrors("state", "city");
                      }}
                      onSelect={(suggestion) => {
                        setForm((prev) => ({
                          ...prev,
                          state: suggestion.state,
                          city: "",
                        }));
                        clearFieldErrors("state", "city");
                      }}
                    />
                    <LabeledPlaceField
                      id="city"
                      label="City"
                      required
                      mode="city"
                      value={form.city}
                      selectedState={form.state}
                      disabled={!form.state.trim()}
                      error={fieldErrors.city}
                      placeholder={
                        form.state.trim()
                          ? "Search city"
                          : "Select a state first"
                      }
                      onChange={(value) => updateField("city", value)}
                      onSelect={(suggestion) =>
                        updateField("city", suggestion.city)
                      }
                    />
                    <LabeledInput
                      id="pincode"
                      label="Pincode"
                      required
                      value={form.pincode}
                      error={fieldErrors.pincode}
                      onChange={(value) => updateField("pincode", value)}
                    />
                  </div>
                </>
              ) : null}

              <fieldset className="space-y-2 rounded-lg border border-border-subtle p-3">
                <legend className="px-1 text-[11px] font-semibold text-muted">
                  {operationsEmployerDocumentSectionLabel(accountType)}
                  <RequiredMark />
                </legend>
                <LabeledSelect
                  id="documentType"
                  label="Select Document"
                  required
                  value={form.documentType}
                  options={[...operationsEmployerDocumentOptions(accountType)]}
                  error={fieldErrors.documentType}
                  onChange={(value) => {
                    updateField("documentType", value);
                    setDocumentPreview(null);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.documentFile;
                      return next;
                    });
                  }}
                />
                {form.documentType ? (
                  <AddEmployerDocumentField
                    preview={documentPreview}
                    error={fieldErrors.documentFile}
                    onPreviewChange={(preview) => {
                      setDocumentPreview(preview);
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.documentFile;
                        return next;
                      });
                    }}
                    onInvalidFile={(message) => {
                      setFieldErrors((prev) => ({
                        ...prev,
                        documentFile: message,
                      }));
                      setAlertMessage(message);
                    }}
                  />
                ) : null}
              </fieldset>

              <AddEmployerImageField
                id={addEmployerImageFieldId(accountType)}
                label={addEmployerImageFieldLabel(accountType)}
                preview={imagePreview}
                error={
                  fieldErrors[addEmployerImageFieldId(accountType)] ??
                  fieldErrors.companyLogo ??
                  fieldErrors.profilePhoto
                }
                onPreviewChange={(preview) => {
                  setImagePreview(preview);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.companyLogo;
                    delete next.profilePhoto;
                    return next;
                  });
                }}
                onInvalidFile={(message) => {
                  const fieldId = addEmployerImageFieldId(accountType);
                  setFieldErrors((prev) => ({ ...prev, [fieldId]: message }));
                  setAlertMessage(message);
                }}
              />

              {otpSent ? (
                <AddEmployerOtpSection
                  digits={otpDigits}
                  maskedPhone={maskedPhone}
                  isVerified={otpVerified}
                  isSubmitting={verifyMutation.isPending}
                  resendSecondsLeft={resendSecondsLeft}
                  error={fieldErrors.otp ?? null}
                  onChange={setOtpDigits}
                  onVerify={() => void handleVerifyOtp()}
                  onResend={() => void handleResendOtp()}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSendOtp()}
                  disabled={isBusy}
                  className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  {registerMutation.isPending ? "Sending OTP…" : "Send OTP"}
                </button>
              )}
            </>
          ) : null}

          {formError ? (
            <p className="text-xs text-danger" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy || !otpVerified}
              className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-surface shadow-sm hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
            >
              {completeMutation.isPending ? "Creating…" : "Create Employer"}
            </button>
          </div>
        </form>
      </div>
    </div>
    <OperationsAlertDialog
      open={Boolean(alertMessage)}
      message={alertMessage ?? ""}
      onClose={() => setAlertMessage(null)}
    />
    </>
  );
}

function LabeledPlaceField({
  id,
  label,
  mode,
  value,
  onChange,
  onSelect,
  error,
  required,
  placeholder,
  selectedState,
  disabled = false,
}: {
  id: string;
  label: string;
  mode: "state" | "city";
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: PlaceSuggestion) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  selectedState?: string;
  disabled?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <OperationsPostJobPlaceAutocomplete
        id={id}
        name={id}
        mode={mode}
        value={value}
        selectedState={selectedState}
        disabled={disabled}
        placeholder={placeholder}
        hasError={Boolean(error)}
        portal
        inputClassName={inputClassName}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={error ? errorId : undefined}
        onChange={onChange}
        onSelect={onSelect}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "email" | "tel" | "text";
  maxLength?: number;
  min?: number;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function LabeledSelect({
  id,
  label,
  value,
  options,
  onChange,
  error,
  required,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <OperationsFilterSelect
        id={id}
        label={label}
        value={value}
        options={options}
        onChange={onChange}
        hideSrOnlyLabel
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
