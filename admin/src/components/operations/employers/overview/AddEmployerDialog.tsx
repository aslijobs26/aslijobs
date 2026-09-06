import { isAxiosError } from "axios";
import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useCreateOperationsEmployer } from "../../../../hooks/use-operations-employers";
import type { CreateOperationsEmployerInput } from "../../../../types/operations-employers";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";

interface AddEmployerDialogProps {
  open: boolean;
  onClose: () => void;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: "company", label: "Company" },
  { value: "consultancy", label: "Consultancy" },
  { value: "individual", label: "Individual" },
] as const;

const EMPTY_FORM: CreateOperationsEmployerInput = {
  companyName: "",
  firstName: "",
  lastName: "",
  whatsappNumber: "",
  emailAddress: "",
  industry: "",
  accountType: "company",
  city: "",
  state: "",
  minimumEmployees: null,
  maximumEmployees: null,
};

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AddEmployerDialog({ open, onClose }: AddEmployerDialogProps) {
  const titleId = useId();
  const createMutation = useCreateOperationsEmployer();
  const [form, setForm] = useState<CreateOperationsEmployerInput>(EMPTY_FORM);
  const [minEmployeesInput, setMinEmployeesInput] = useState("");
  const [maxEmployeesInput, setMaxEmployeesInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(EMPTY_FORM);
    setMinEmployeesInput("");
    setMaxEmployeesInput("");
    setError(null);
  }, [open]);

  if (!open) {
    return null;
  }

  const updateField = <K extends keyof CreateOperationsEmployerInput>(
    key: K,
    value: CreateOperationsEmployerInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.companyName.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setError("Company name, first name, and last name are required.");
      return;
    }
    if (!form.whatsappNumber.trim()) {
      setError("WhatsApp number is required.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...form,
        companyName: form.companyName.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        emailAddress: form.emailAddress?.trim() || "",
        industry: form.industry?.trim() || "",
        city: form.city?.trim() || "",
        state: form.state?.trim() || "",
        minimumEmployees: parseOptionalInt(minEmployeesInput),
        maximumEmployees: parseOptionalInt(maxEmployeesInput),
      });
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        const message = err.response?.data?.message;
        setError(
          typeof message === "string" && message.trim()
            ? message
            : "Failed to create employer. Please try again.",
        );
        return;
      }
      setError("Failed to create employer. Please try again.");
    }
  };

  const inputClassName =
    "w-full rounded-lg border border-border-subtle bg-hero-bg/40 px-2.5 py-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-subtle bg-surface p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="text-sm font-bold text-foreground">
              Add Employer
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Create an employer account for operations follow-up.
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                First Name *
              </label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={form.whatsappNumber}
                onChange={(e) => updateField("whatsappNumber", e.target.value)}
                placeholder="+919876543210"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                Email
              </label>
              <input
                type="email"
                value={form.emailAddress ?? ""}
                onChange={(e) => updateField("emailAddress", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                Industry
              </label>
              <input
                type="text"
                value={form.industry ?? ""}
                onChange={(e) => updateField("industry", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                Account Type
              </label>
              <OperationsFilterSelect
                label="Account type"
                value={form.accountType ?? "company"}
                options={[...ACCOUNT_TYPE_OPTIONS]}
                onChange={(value) =>
                  updateField(
                    "accountType",
                    value as CreateOperationsEmployerInput["accountType"],
                  )
                }
                hideSearch
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                City
              </label>
              <input
                type="text"
                value={form.city ?? ""}
                onChange={(e) => updateField("city", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                State
              </label>
              <input
                type="text"
                value={form.state ?? ""}
                onChange={(e) => updateField("state", e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                Min Employees
              </label>
              <input
                type="number"
                min={0}
                value={minEmployeesInput}
                onChange={(e) => setMinEmployeesInput(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">
                Max Employees
              </label>
              <input
                type="number"
                min={0}
                value={maxEmployeesInput}
                onChange={(e) => setMaxEmployeesInput(e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-surface shadow-sm hover:bg-primary/90 sm:w-auto"
            >
              {createMutation.isPending ? "Creating…" : "Create Employer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
