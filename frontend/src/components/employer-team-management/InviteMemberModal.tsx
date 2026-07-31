"use client";

import { EmployerProfileDialog } from "@/components/employer-profile/EmployerProfileDialog";
import {
  ACCESS_LEVEL_LABELS,
  EMPLOYER_TEAM_QUERY_KEYS,
} from "@/constants/employer-team-management";
import {
  fetchDepartments,
  fetchTeamRoles,
} from "@/services/employer-team.service";
import type {
  InviteMemberPayload,
  TeamAccessLevel,
  TeamMemberListItem,
  UpdateMemberPayload,
} from "@/types/employer-team";
import { isAssignableRole } from "@/utils/employer-team-permissions";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type InviteMemberModalProps = {
  mode: "invite" | "edit";
  member?: TeamMemberListItem | null;
  initialEmail?: string;
  initialRoleId?: string;
  initialDepartmentId?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmitInvite: (payload: InviteMemberPayload) => void;
  onSubmitEdit: (payload: UpdateMemberPayload) => void;
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  roleId: string;
  designation: string;
  accessLevel: TeamAccessLevel;
  message: string;
  status: "active" | "inactive" | "suspended";
};

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  departmentId: "",
  roleId: "",
  designation: "",
  accessLevel: "limited",
  message: "",
  status: "active",
};

export function InviteMemberModal({
  mode,
  member,
  initialEmail = "",
  initialRoleId = "",
  initialDepartmentId = "",
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmitInvite,
  onSubmitEdit,
}: InviteMemberModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const departmentsQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.departments({
      status: "active",
      limit: 100,
      page: 1,
    }),
    queryFn: () => fetchDepartments({ status: "active", limit: 100, page: 1 }),
    staleTime: 30_000,
  });

  const rolesQuery = useQuery({
    queryKey: EMPLOYER_TEAM_QUERY_KEYS.roles(),
    queryFn: fetchTeamRoles,
    staleTime: 30_000,
  });

  const assignableRoles = useMemo(() => {
    const roles = rolesQuery.data ?? [];
    const currentRoleId = mode === "edit" ? member?.role?.id : undefined;
    return roles.filter(
      (role) =>
        isAssignableRole(role.status) ||
        (currentRoleId !== undefined && role.id === currentRoleId),
    );
  }, [rolesQuery.data, mode, member?.role?.id]);

  useEffect(() => {
    if (mode === "edit" && member) {
      setForm({
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        departmentId: member.department?.id ?? "",
        roleId: member.role?.id ?? "",
        designation: member.designation,
        accessLevel: member.accessLevel,
        message: "",
        status:
          member.status === "invited"
            ? "inactive"
            : member.status === "removed"
              ? "inactive"
              : member.status,
      });
      return;
    }
    setForm({
      ...EMPTY,
      email: initialEmail,
      roleId: initialRoleId,
      departmentId: initialDepartmentId,
    });
  }, [mode, member, initialEmail, initialRoleId, initialDepartmentId]);

  const handleSubmit = () => {
    if (form.fullName.trim().length < 2) {
      setFieldError("Full name is required.");
      return;
    }
    if (mode === "invite") {
      if (!form.email.trim() || !form.email.includes("@")) {
        setFieldError("A valid email is required.");
        return;
      }
      if (!form.departmentId) {
        setFieldError("Department is required.");
        return;
      }
      if (!form.roleId) {
        setFieldError("Role is required.");
        return;
      }
      setFieldError(null);
      onSubmitInvite({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        departmentId: form.departmentId,
        roleId: form.roleId,
        designation: form.designation.trim() || undefined,
        accessLevel: form.accessLevel,
        message: form.message.trim() || undefined,
      });
      return;
    }

    if (!form.departmentId || !form.roleId) {
      setFieldError("Department and role are required.");
      return;
    }
    setFieldError(null);
    onSubmitEdit({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      designation: form.designation.trim(),
      departmentId: form.departmentId,
      roleId: form.roleId,
      accessLevel: form.accessLevel,
      status: form.status,
    });
  };

  return (
    <EmployerProfileDialog
      title={mode === "invite" ? "Invite Team Member" : "Edit Team Member"}
      description={
        mode === "invite"
          ? "Send an invitation to add a new member to your organization."
          : "Update member profile, department, role and status."
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
              ? mode === "invite"
                ? "Sending…"
                : "Saving…"
              : mode === "invite"
                ? "Send Invitation"
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
            Full Name <span className="text-red-600">*</span>
          </span>
          <input
            value={form.fullName}
            onChange={(event) =>
              setForm((current) => ({ ...current, fullName: event.target.value }))
            }
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Email {mode === "invite" ? <span className="text-red-600">*</span> : null}
          </span>
          <input
            type="email"
            value={form.email}
            disabled={mode === "edit"}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-hero-bg disabled:text-muted"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Phone</span>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Designation
            </span>
            <input
              value={form.designation}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  designation: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Department <span className="text-red-600">*</span>
            </span>
            <select
              value={form.departmentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  departmentId: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select department</option>
              {(departmentsQuery.data?.departments ?? []).map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Role <span className="text-red-600">*</span>
            </span>
            <select
              value={form.roleId}
              onChange={(event) => {
                const roleId = event.target.value;
                const role = assignableRoles.find(
                  (item) => item.id === roleId,
                );
                setForm((current) => ({
                  ...current,
                  roleId,
                  accessLevel: role?.accessLevel ?? current.accessLevel,
                }));
              }}
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select role</option>
              {assignableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>

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
              {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {mode === "edit" ? (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as FormState["status"],
                  }))
                }
                className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          ) : (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Invitation Message
              </span>
              <input
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Optional"
              />
            </label>
          )}
        </div>
      </div>
    </EmployerProfileDialog>
  );
}
