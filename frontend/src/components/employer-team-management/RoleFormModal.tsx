"use client";

import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import {
  ACCESS_LEVEL_LABELS,
  EMPLOYER_TEAM_QUERY_KEYS,
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
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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
  }, [mode, role]);

  const handleSubmit = () => {
    const name = form.name.trim();
    if (name.length < 2) {
      setFieldError("Role name must be at least 2 characters.");
      return;
    }
    if (name.length > 60) {
      setFieldError("Role name must be at most 60 characters.");
      return;
    }
    if (form.description.length > 300) {
      setFieldError("Description must be at most 300 characters.");
      return;
    }
    setFieldError(null);
    onSubmit({
      name,
      description: form.description.trim(),
      accessLevel: form.accessLevel,
      status: form.status,
      color: form.color,
      icon: form.icon,
      ...(mode === "create" && form.cloneRoleId
        ? { cloneRoleId: form.cloneRoleId }
        : {}),
    });
  };

  return (
    <EmployerProfileDialog
      title={mode === "create" ? "Create Role" : "Edit Role"}
      description={
        mode === "create"
          ? "Define a role and optionally clone permissions from an existing role."
          : "Update role details. Permission matrix can be edited from the roles panel."
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
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Access Level
            </span>
            <select
              value={form.accessLevel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  accessLevel: event.target.value as TeamAccessLevel,
                }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {(Object.keys(ACCESS_LEVEL_LABELS) as TeamAccessLevel[]).map(
                (level) => (
                  <option key={level} value={level}>
                    {ACCESS_LEVEL_LABELS[level]}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as "active" | "inactive",
                }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
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

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Role Icon
          </span>
          <select
            value={form.icon}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                icon: event.target.value as TeamRoleIcon,
              }))
            }
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {ROLE_ICON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {mode === "create" ? (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Clone Existing Role
            </span>
            <select
              value={form.cloneRoleId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cloneRoleId: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">None</option>
              {(rolesQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </EmployerProfileDialog>
  );
}
