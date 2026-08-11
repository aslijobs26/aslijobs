"use client";

import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVEL_PILL_CLASS,
  EMPLOYER_TEAM_QUERY_KEYS,
  EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME,
  ROLE_COLOR_OPTIONS,
  ROLE_ICON_OPTIONS,
} from "@/constants/employer-team-management";
import { fetchTeamRoles } from "@/services/employer-team.service";
import type {
  CreateRolePayload,
  TeamAccessLevel,
  TeamRoleColor,
  TeamRoleIcon,
  TeamRoleListItem,
} from "@/types/employer-team";
import { cn } from "@/utils/cn";
import { shouldReplacePermissionsOnAccessLevelChange } from "@/utils/employer-team-permissions";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type RoleFormModalProps = {
  mode: "create" | "edit";
  role?: TeamRoleListItem | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateRolePayload) => void;
};

type FormState = {
  name: string;
  description: string;
  accessLevel: TeamAccessLevel;
  status: "active" | "inactive";
  color: TeamRoleColor;
  icon: TeamRoleIcon;
  cloneRoleId: string;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  accessLevel: "limited",
  status: "active",
  color: "primary",
  icon: "shield",
  cloneRoleId: "",
};

const ROLE_ACCESS_LEVEL_OPTIONS = (
  Object.entries(ACCESS_LEVEL_LABELS) as [TeamAccessLevel, string][]
).map(([value, label]) => ({ value, label }));

const ROLE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function RoleFormModal({
  mode,
  role,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
}: RoleFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateRolePayload | null>(
    null,
  );

  const rolesQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.roles(),
    queryFn: fetchTeamRoles,
    staleTime: 30_000,
    enabled: mode === "create",
  });

  useEffect(() => {
    if (mode === "edit" && role) {
      setForm({
        name: role.name,
        description: role.description,
        accessLevel: role.accessLevel,
        status: role.status === "archived" ? "inactive" : role.status,
        color: (role.color || "primary") as TeamRoleColor,
        icon: (role.icon || "shield") as TeamRoleIcon,
        cloneRoleId: "",
      });
      return;
    }
    setForm(EMPTY);
    setPendingPayload(null);
  }, [mode, role]);

  const cloneRoleOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...(rolesQuery.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [rolesQuery.data],
  );

  const buildPayload = (): CreateRolePayload | null => {
    const name = form.name.trim();
    if (name.length < 2) {
      setFieldError("Role name must be at least 2 characters.");
      return null;
    }
    if (name.length > 60) {
      setFieldError("Role name must be at most 60 characters.");
      return null;
    }
    if (form.description.length > 300) {
      setFieldError("Description must be at most 300 characters.");
      return null;
    }
    setFieldError(null);
    return {
      name,
      description: form.description.trim(),
      accessLevel: form.accessLevel,
      status: form.status,
      color: form.color,
      icon: form.icon,
      ...(mode === "create" && form.cloneRoleId
        ? { cloneRoleId: form.cloneRoleId }
        : {}),
    };
  };

  const handleSubmit = () => {
    const payload = buildPayload();
    if (!payload) return;

    if (
      mode === "edit" &&
      role &&
      shouldReplacePermissionsOnAccessLevelChange(
        role.accessLevel,
        form.accessLevel,
      )
    ) {
      setPendingPayload(payload);
      return;
    }

    onSubmit(payload);
  };

  return (
    <>
      <EmployerProfileDialog
        title={mode === "create" ? "Create Role" : "Edit Role"}
        description={
          mode === "create"
            ? "Choose an Access Level to generate a permission template. You can fine-tune the matrix after creation."
            : "Update role details. Changing Access Level to Full, Limited, or View Only replaces the permission matrix."
        }
        onClose={onClose}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-lg border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
            >
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Role"
                  : "Save Changes"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {fieldError || errorMessage ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {fieldError || errorMessage}
            </p>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Role Name <span className="text-red-600">*</span>
            </span>
            <input
              value={form.name}
              disabled={mode === "edit" && Boolean(role?.isSystem)}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-hero-bg disabled:text-muted"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Description
            </span>
            <textarea
              value={form.description}
              rows={3}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Access Level
              </span>
              <EmployerRegisterSearchableSelect
                id="role-access-level"
                label="Access Level"
                hideLabel
                value={form.accessLevel}
                placeholder="Select access level"
                options={ROLE_ACCESS_LEVEL_OPTIONS}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    accessLevel: value as TeamAccessLevel,
                  }))
                }
                hideSearch
                triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME}
              />
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  ACCESS_LEVEL_PILL_CLASS[form.accessLevel],
                )}
              >
                {ACCESS_LEVEL_LABELS[form.accessLevel]}
              </span>
              <p className="mt-1.5 text-xs text-muted">
                {form.accessLevel === "full_access"
                  ? "Enables every module and action."
                  : form.accessLevel === "view_only"
                    ? "Read-only across the application."
                    : form.accessLevel === "limited"
                      ? "Hiring-manager template. Admin modules stay disabled."
                      : "Starts empty. Configure permissions manually after create."}
              </p>
            </div>
            <div className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Status
              </span>
              <EmployerRegisterSearchableSelect
                id="role-status"
                label="Status"
                hideLabel
                value={form.status}
                placeholder="Select status"
                options={ROLE_STATUS_OPTIONS}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as "active" | "inactive",
                  }))
                }
                hideSearch
                triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME}
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-foreground">
              Role Color
            </legend>
            <div className="flex flex-wrap gap-2">
              {ROLE_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={form.color === option.value}
                  onClick={() =>
                    setForm((current) => ({ ...current, color: option.value }))
                  }
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    option.swatchClassName,
                    form.color === option.value
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                />
              ))}
            </div>
          </fieldset>

          <div className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Role Icon
            </span>
            <EmployerRegisterSearchableSelect
              id="role-icon"
              label="Role Icon"
              hideLabel
              value={form.icon}
              placeholder="Select icon"
              options={[...ROLE_ICON_OPTIONS]}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  icon: value as TeamRoleIcon,
                }))
              }
              hideSearch
              triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME}
            />
          </div>

          {mode === "create" ? (
            <div className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Clone Existing Role
              </span>
              <EmployerRegisterSearchableSelect
                id="role-clone"
                label="Clone Existing Role"
                hideLabel
                value={form.cloneRoleId}
                placeholder="None"
                options={cloneRoleOptions}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    cloneRoleId: value,
                  }))
                }
                searchPlaceholder="Search role"
                triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME}
              />
            </div>
          ) : null}
        </div>
      </EmployerProfileDialog>

      {pendingPayload ? (
        <EmployerProfileDialog
          title="Replace permission matrix?"
          description="Changing Access Level will replace the current permission matrix."
          onClose={() => setPendingPayload(null)}
          footer={
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingPayload(null)}
                className="inline-flex h-10 items-center rounded-lg border border-border-subtle px-4 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  const payload = pendingPayload;
                  setPendingPayload(null);
                  onSubmit(payload);
                }}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover disabled:opacity-50"
              >
                Replace
              </button>
            </div>
          }
        >
          <p className="text-sm text-muted">
            Current permissions for this role will be overwritten with the{" "}
            <span className="font-semibold text-foreground">
              {ACCESS_LEVEL_LABELS[pendingPayload.accessLevel ?? "custom"]}
            </span>{" "}
            template. Field-level access is not changed.
          </p>
        </EmployerProfileDialog>
      ) : null}
    </>
  );
}
