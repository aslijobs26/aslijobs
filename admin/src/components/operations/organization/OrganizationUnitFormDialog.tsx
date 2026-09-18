import { X } from "lucide-react";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  ORG_UNIT_CHILD_TYPES,
  OPERATIONS_ORG_UNIT_TYPES,
  type CreateOperationsOrgUnitInput,
  type OperationsOrgUnitPublic,
  type OperationsOrgUnitType,
  type UpdateOperationsOrgUnitInput,
} from "../../../types/operations-organization";
import { useOperationsTeamMembers } from "../../../hooks/use-operations-team";
import { OperationsDatePicker } from "../../ui/OperationsDatePicker";
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
  headUserId: string;
  establishedAt: string;
  latitude: string;
  longitude: string;
  status: "active" | "archived";
};

const EMPTY_FORM: FormState = {
  name: "",
  type: "region",
  code: "",
  timezone: "Asia/Kolkata",
  primaryOffice: "",
  headUserId: "",
  establishedAt: "",
  latitude: "",
  longitude: "",
  status: "active",
};

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toIsoDateTime(dateOnly: string): string | null {
  const trimmed = dateOnly.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseOptionalCoordinate(
  value: string,
  kind: "latitude" | "longitude",
): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error(
      kind === "latitude"
        ? "Latitude must be a valid number."
        : "Longitude must be a valid number.",
    );
  }
  if (kind === "latitude" && (parsed < -90 || parsed > 90)) {
    throw new Error("Latitude must be between -90 and 90.");
  }
  if (kind === "longitude" && (parsed < -180 || parsed > 180)) {
    throw new Error("Longitude must be between -180 and 180.");
  }
  return parsed;
}

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
  const establishedPickerId = useId();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const teamMembersQuery = useOperationsTeamMembers(
    {
      page: 1,
      limit: 100,
      status: "active",
    },
    { enabled: open },
  );

  const headOptions = useMemo(() => {
    const members = teamMembersQuery.data?.members ?? [];
    const options = [
      { value: "", label: "No head assigned" },
      ...members.map((member) => ({
        value: member.id,
        label: member.fullName,
      })),
    ];
    if (
      mode === "edit" &&
      unit?.headUserId &&
      unit.headName &&
      !options.some((option) => option.value === unit.headUserId)
    ) {
      options.push({
        value: unit.headUserId,
        label: `${unit.headName} (current)`,
      });
    }
    return options;
  }, [mode, teamMembersQuery.data?.members, unit?.headName, unit?.headUserId]);

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
        headUserId: unit.headUserId ?? "",
        establishedAt: toDateInputValue(unit.establishedAt),
        latitude:
          unit.latitude != null && Number.isFinite(unit.latitude)
            ? String(unit.latitude)
            : "",
        longitude:
          unit.longitude != null && Number.isFinite(unit.longitude)
            ? String(unit.longitude)
            : "",
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

    let latitude: number | null;
    let longitude: number | null;
    try {
      latitude = parseOptionalCoordinate(form.latitude, "latitude");
      longitude = parseOptionalCoordinate(form.longitude, "longitude");
    } catch (coordinateError) {
      setError(
        coordinateError instanceof Error
          ? coordinateError.message
          : "Invalid coordinates.",
      );
      return;
    }

    if ((latitude == null) !== (longitude == null)) {
      setError("Provide both latitude and longitude, or leave both empty.");
      return;
    }

    const establishedAt = toIsoDateTime(form.establishedAt);
    if (form.establishedAt.trim() && !establishedAt) {
      setError("Established date is invalid.");
      return;
    }

    const headUserId = form.headUserId.trim() || null;

    try {
      if (mode === "edit" && unit) {
        await onSubmitUpdate({
          name: form.name.trim(),
          code: form.code.trim(),
          timezone: form.timezone.trim() || "Asia/Kolkata",
          primaryOffice: form.primaryOffice.trim(),
          headUserId,
          establishedAt,
          latitude,
          longitude,
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
          headUserId,
          establishedAt,
          latitude,
          longitude,
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
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-lg scrollbar-hidden"
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
            ) : mode === "edit" ? (
              <p className="mt-0.5 text-[11px] text-muted">
                Updates Key Information fields for this unit.
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

        <form className="space-y-3 p-4" onSubmit={(event) => void handleSubmit(event)}>
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
            {mode === "edit" && form.type === "state" ? (
              <span className="font-normal text-[10px] text-muted">
                For state units, this is the State shown in Key Information.
              </span>
            ) : null}
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
            <p className="rounded-lg border border-border-subtle bg-hero-bg/40 px-3 py-2 text-[12px] text-muted">
              Type:{" "}
              <span className="font-medium text-foreground">
                {formatOrgUnitType(form.type)}
              </span>
              <span className="mt-1 block text-[10px]">
                Region / Country / State labels in Key Information come from the
                hierarchy parents (except State name for state units).
              </span>
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
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
                placeholder="Asia/Kolkata"
                className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
          </div>

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
              placeholder="e.g. Madhapur, Hyderabad"
              className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>

          <OperationsFilterSelect
            label="Head"
            value={form.headUserId}
            onChange={(value) =>
              setForm((current) => ({ ...current, headUserId: value }))
            }
            options={headOptions}
            hideSearch={headOptions.length <= 8}
          />

          <div className="grid gap-1">
            <label
              htmlFor={establishedPickerId}
              className="text-[11px] font-semibold text-muted"
            >
              Established
            </label>
            <OperationsDatePicker
              id={establishedPickerId}
              value={form.establishedAt}
              placeholder="Select established date"
              maxDate={new Date().toISOString().slice(0, 10)}
              aria-label="Established date"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  establishedAt: value,
                }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-[11px] font-semibold text-muted">
              Latitude
              <input
                inputMode="decimal"
                value={form.latitude}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    latitude: event.target.value,
                  }))
                }
                placeholder="e.g. 17.3850"
                className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-semibold text-muted">
              Longitude
              <input
                inputMode="decimal"
                value={form.longitude}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    longitude: event.target.value,
                  }))
                }
                placeholder="e.g. 78.4867"
                className="h-10 rounded-lg border border-border-subtle bg-hero-bg/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
          </div>
          <p className="text-[10px] text-muted">
            Coordinates power the Key Information map location. Leave both empty
            to clear.
          </p>

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

          {mode === "edit" ? (
            <aside className="rounded-lg border border-border-subtle bg-hero-bg/50 px-3 py-2.5 text-[10px] leading-relaxed text-muted">
              <strong className="font-semibold text-foreground">
                Not edited here:
              </strong>{" "}
              Total People and Total Teams are calculated from assignments.
              Region / Country come from parent units in the hierarchy.
            </aside>
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
