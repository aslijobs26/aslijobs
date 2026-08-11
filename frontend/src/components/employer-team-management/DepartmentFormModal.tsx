"use client";

import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import {
  DEPARTMENT_COLOR_OPTIONS,
  DEPARTMENT_ICON_OPTIONS,
  EMPLOYER_TEAM_QUERY_KEYS,
  EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME,
} from "@/constants/employer-team-management";
import { fetchTeamMemberOptions } from "@/services/employer-team.service";
import type {
  CreateDepartmentPayload,
  DepartmentListItem,
  DepartmentStatus,
} from "@/types/employer-team";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type DepartmentFormModalProps = {
  mode: "create" | "edit";
  department?: DepartmentListItem | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateDepartmentPayload) => void;
};

type FormState = {
  name: string;
  code: string;
  description: string;
  headMemberId: string;
  email: string;
  phone: string;
  status: DepartmentStatus;
  color: CreateDepartmentPayload["color"];
  icon: CreateDepartmentPayload["icon"];
};

const EMPTY_FORM: FormState = {
  name: "",
  code: "",
  description: "",
  headMemberId: "",
  email: "",
  phone: "",
  status: "active",
  color: "primary",
  icon: "building",
};

const DEPARTMENT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function DepartmentFormModal({
  mode,
  department,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.memberOptions({ status: "active" }),
    queryFn: () => fetchTeamMemberOptions({ status: "active" }),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (mode === "edit" && department) {
      setForm({
        name: department.name,
        code: department.code,
        description: department.description,
        headMemberId: department.head?.id ?? "",
        email: department.email,
        phone: department.phone,
        status: department.status,
        color: (department.color || "primary") as FormState["color"],
        icon: (department.icon || "building") as FormState["icon"],
      });
      return;
    }
    setForm(EMPTY_FORM);
  }, [mode, department]);

  const headMemberOptions = useMemo(
    () => [
      { value: "", label: "No Head Assigned" },
      ...(membersQuery.data ?? []).map((member) => ({
        value: member.id,
        label: `${member.fullName} (${member.email})`,
      })),
    ],
    [membersQuery.data],
  );

  const handleSubmit = () => {
    const name = form.name.trim();
    if (name.length < 2) {
      setFieldError("Department name must be at least 2 characters.");
      return;
    }
    if (name.length > 80) {
      setFieldError("Department name must be at most 80 characters.");
      return;
    }
    if (form.description.length > 500) {
      setFieldError("Description must be at most 500 characters.");
      return;
    }
    setFieldError(null);
    onSubmit({
      name,
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      headMemberId: form.headMemberId || null,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      status: form.status,
      color: form.color,
      icon: form.icon,
    });
  };

  return (
    <EmployerProfileDialog
      title={mode === "create" ? "Add Department" : "Edit Department"}
      description={
        mode === "create"
          ? "Create a department for your organization structure."
          : "Update department details. Changes reflect immediately."
      }
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle bg-surface px-4 text-sm font-semibold text-foreground hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create Department"
                : "Save Changes"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {(fieldError || errorMessage) && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {fieldError || errorMessage}
          </p>
        )}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Department Name <span className="text-red-600">*</span>
          </span>
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
            maxLength={80}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Department Code
            </span>
            <input
              value={form.code}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              maxLength={32}
              placeholder="Optional"
            />
          </label>

          <div className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Status</span>
            <EmployerRegisterSearchableSelect
              id="department-status"
              label="Status"
              hideLabel
              value={form.status}
              placeholder="Select status"
              options={DEPARTMENT_STATUS_OPTIONS}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as DepartmentStatus,
                }))
              }
              hideSearch
              triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME}
            />
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Optional"
          />
          <span className="mt-1 block text-xs text-muted">
            {form.description.length}/500
          </span>
        </label>

        <div className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Department Head
          </span>
          <EmployerRegisterSearchableSelect
            id="department-head"
            label="Department Head"
            hideLabel
            value={form.headMemberId}
            placeholder="No Head Assigned"
            options={headMemberOptions}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                headMemberId: value,
              }))
            }
            searchPlaceholder="Search member"
            triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME}
          />
          {!membersQuery.isLoading && (membersQuery.data?.length ?? 0) === 0 ? (
            <span className="mt-1 block text-xs text-muted">
              No active team members yet. Heads can be assigned after members
              are added.
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Department Email
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Optional"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Department Phone
            </span>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Optional"
              maxLength={20}
            />
          </label>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-foreground">
            Color Label
          </legend>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENT_COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setForm((current) => ({ ...current, color: option.value }))
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  form.color === option.value
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border-subtle text-muted hover:bg-hero-bg",
                )}
                aria-pressed={form.color === option.value}
              >
                <span
                  className={cn("size-3 rounded-full", option.swatchClassName)}
                  aria-hidden="true"
                />
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">Icon</span>
          <EmployerRegisterSearchableSelect
            id="department-icon"
            label="Icon"
            hideLabel
            value={form.icon ?? ""}
            placeholder="Select icon"
            options={[...DEPARTMENT_ICON_OPTIONS]}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                icon: value as FormState["icon"],
              }))
            }
            hideSearch
            triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_CLASSNAME}
          />
        </div>
      </div>
    </EmployerProfileDialog>
  );
}
