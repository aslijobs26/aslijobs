import { X } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  ORG_UNIT_CHILD_TYPES,
  OPERATIONS_ORG_UNIT_TYPES,
  type CreateOperationsOrgUnitInput,
  type OperationsOrgUnitPublic,
  type OperationsOrgUnitType,
  type UpdateOperationsOrgUnitInput,
} from "../../../types/operations-organization";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import { getOperationsApiErrorMessage } from "../team/team-format";
import { formatOrgUnitType } from "./org-tree-utils";

type FormMode = "create" | "create-sub" | "edit";

interface OrganizationUnitFormDialogProps {
  open: boolean;
  mode: FormMode;
  parentUnit: OperationsOrgUnitPublic | null;
  unit: OperationsOrgUnitPublic | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitCreate: (input: CreateOperationsOrgUnitInput) => Promise<void>;
  onSubmitUpdate: (input: UpdateOperationsOrgUnitInput) => Promise<void>;
}

type FormState = {
  name: string;
  type: OperationsOrgUnitType;
  code: string;
  timezone: string;
  primaryOffice: string;
  status: "active" | "archived";
};

const EMPTY_FORM: FormState = {
  name: "",
  type: "region",
  code: "",
  timezone: "Asia/Kolkata",
  primaryOffice: "",
  status: "active",
};

export function OrganizationUnitFormDialog({
  open,
  mode,
  parentUnit,
  unit,
  isSubmitting,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: OrganizationUnitFormDialogProps) {
  const titleId = useId();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (mode === "edit" && unit) {
      setForm({
        name: unit.name,
        type: (OPERATIONS_ORG_UNIT_TYPES.includes(
          unit.type as OperationsOrgUnitType,
        )
          ? unit.type
          : "office") as OperationsOrgUnitType,
        code: unit.code ?? "",
        timezone: unit.timezone || "Asia/Kolkata",
        primaryOffice: unit.primaryOffice ?? "",
        status: unit.status === "archived" ? "archived" : "active",
      });
      return;
    }

    const allowedTypes =
      mode === "create-sub" && parentUnit
        ? ORG_UNIT_CHILD_TYPES[
            (OPERATIONS_ORG_UNIT_TYPES.includes(
              parentUnit.type as OperationsOrgUnitType,
            )
              ? parentUnit.type
              : "country") as OperationsOrgUnitType
          ]
        : (["country", "region", "state", "city", "office"] as OperationsOrgUnitType[]);

    setForm({
      ...EMPTY_FORM,
      type: allowedTypes[0] ?? "office",
      timezone: parentUnit?.timezone || "Asia/Kolkata",
    });
  }, [open, mode, unit, parentUnit]);

  if (!open) return null;

  const allowedTypes: OperationsOrgUnitType[] =
    mode === "edit"
      ? [form.type]
      : mode === "create-sub" && parentUnit
        ? ORG_UNIT_CHILD_TYPES[
            (OPERATIONS_ORG_UNIT_TYPES.includes(
              parentUnit.type as OperationsOrgUnitType,
            )
              ? parentUnit.type
              : "country") as OperationsOrgUnitType
          ]
        : (["country", "region", "state", "city", "office"] as OperationsOrgUnitType[]);

  const title =
    mode === "edit"
      ? "Edit organization unit"
      : mode === "create-sub"
        ? "Add sub-unit"
        : "Add organization unit";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    try {
      if (mode === "edit" && unit) {
        await onSubmitUpdate({
          name: form.name.trim(),
          code: form.code.trim(),
          timezone: form.timezone.trim() || "Asia/Kolkata",
          primaryOffice: form.primaryOffice.trim(),
          status: form.status,
          revision: unit.revision,
        });
      } else {
        const payload: CreateOperationsOrgUnitInput = {
          name: form.name.trim(),
          type: form.type,
          code: form.code.trim() || undefined,
          timezone: form.timezone.trim() || undefined,
          primaryOffice: form.primaryOffice.trim() || undefined,
          parentId:
            mode === "create-sub" && parentUnit ? parentUnit.id : undefined,
        };
        await onSubmitCreate(payload);
      }
      onClose();
    } catch (submitError) {
      setError(
        getOperationsApiErrorMessage(
          submitError,
          "Unable to save organization unit.",
        ),
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-lg"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div>
            <h2 id={titleId} className="text-[15px] font-semibold text-foreground">
              {title}
            </h2>
            {mode === "create-sub" && parentUnit ? (
              <p className="mt-0.5 text-[11px] text-muted">
                Under {parentUnit.name} ({formatOrgUnitType(parentUnit.type)})
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <form className="space-y-3 p-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-[11px] font-semibold text-muted">
            Name
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              minLength={2}
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>

          {mode !== "edit" ? (
            <OperationsFilterSelect
              label="Type"
              value={form.type}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  type: value as OperationsOrgUnitType,
                }))
              }
              options={allowedTypes.map((type) => ({
                value: type,
                label: formatOrgUnitType(type),
              }))}
            />
          ) : (
            <p className="text-[12px] text-muted">
              Type:{" "}
              <span className="font-medium text-foreground">
                {formatOrgUnitType(form.type)}
              </span>
            </p>
          )}

          <label className="grid gap-1 text-[11px] font-semibold text-muted">
            Code
            <input
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>

          <label className="grid gap-1 text-[11px] font-semibold text-muted">
            Timezone
            <input
              value={form.timezone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  timezone: event.target.value,
                }))
              }
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>

          <label className="grid gap-1 text-[11px] font-semibold text-muted">
            Primary office
            <input
              value={form.primaryOffice}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  primaryOffice: event.target.value,
                }))
              }
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>

          {mode === "edit" ? (
            <OperationsFilterSelect
              label="Status"
              value={form.status}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as "active" | "archived",
                }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ]}
            />
          ) : null}

          {allowedTypes.length === 0 ? (
            <p className="text-[12px] text-danger">
              This unit cannot have sub-units.
            </p>
          ) : null}

          {error ? <p className="text-[12px] text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-border-subtle px-3 text-[12px] font-medium text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                form.name.trim().length < 2 ||
                (mode !== "edit" && allowedTypes.length === 0)
              }
              className="h-9 rounded-lg bg-primary px-3 text-[12px] font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
