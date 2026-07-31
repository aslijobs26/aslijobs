"use client";

import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULE_LABELS,
} from "@/constants/employer-team-management";
import type {
  ModulePermission,
  RolePermissionsMatrix,
  TeamPermissionModule,
} from "@/types/employer-team";
import { cn } from "@/utils/cn";
import {
  toggleModuleAction,
  type MatrixActionKey,
} from "@/utils/employer-team-permissions";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Minus,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

type RolePermissionMatrixProps = {
  permissions: RolePermissionsMatrix;
  editable?: boolean;
  onChange?: (next: RolePermissionsMatrix) => void;
  compact?: boolean;
};

const N_A_MODULES: Partial<
  Record<TeamPermissionModule, MatrixActionKey[]>
> = {
  dashboard: ["create", "delete"],
  subscription: ["create", "delete"],
  settings: ["export"],
};

const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  jobs: Briefcase,
  candidates: Users,
  interviews: Calendar,
  messages: MessageSquare,
  campaigns: Megaphone,
  reports: BarChart3,
  subscription: CreditCard,
  company_profile: Building2,
  team_management: UsersRound,
  settings: Settings,
};

function isApplicable(
  moduleKey: TeamPermissionModule,
  action: MatrixActionKey,
): boolean {
  const blocked = N_A_MODULES[moduleKey];
  return !blocked?.includes(action);
}

export function RolePermissionMatrix({
  permissions,
  editable = false,
  onChange,
  compact = false,
}: RolePermissionMatrixProps) {
  const modules = Object.keys(permissions) as TeamPermissionModule[];

  const handleToggle = (
    moduleKey: TeamPermissionModule,
    action: MatrixActionKey,
    enabled: boolean,
  ) => {
    if (!editable || !onChange) return;
    onChange({
      ...permissions,
      [moduleKey]: toggleModuleAction(permissions[moduleKey], action, enabled),
    });
  };

  return (
    <div className="space-y-3">
      <div className="min-w-0 overflow-x-auto overscroll-x-contain rounded-lg border border-border-subtle scrollbar-hidden">
        <table
          className={cn(
            "w-full border-collapse text-left",
            compact ? "min-w-[34rem]" : "min-w-[42rem]",
          )}
        >
          <thead>
            <tr className="border-b border-border-subtle bg-hero-bg/50 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
              <th className="sticky left-0 z-[1] bg-hero-bg/95 px-3 py-2.5">
                Module
              </th>
              {PERMISSION_ACTIONS.map((action) => (
                <th key={action} className="px-1.5 py-2.5 text-center">
                  {PERMISSION_ACTION_LABELS[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((moduleKey) => {
              const row = permissions[moduleKey];
              const ModuleIcon = MODULE_ICONS[moduleKey] ?? Settings;
              return (
                <tr
                  key={moduleKey}
                  className="border-b border-border-subtle last:border-b-0"
                >
                  <td className="sticky left-0 z-[1] bg-surface px-3 py-2.5">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      <ModuleIcon
                        className="size-3.5 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                      {PERMISSION_MODULE_LABELS[moduleKey] ?? moduleKey}
                    </span>
                  </td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const actionKey = action as MatrixActionKey;
                    const applicable = isApplicable(moduleKey, actionKey);
                    const checked = Boolean(
                      row[actionKey as keyof ModulePermission],
                    );
                    const disabledByFullAccess =
                      editable &&
                      row.fullAccess &&
                      actionKey !== "fullAccess";

                    return (
                      <td key={action} className="px-1.5 py-2 text-center">
                        {!applicable ? (
                          <span
                            className="inline-flex size-5 items-center justify-center text-muted"
                            aria-label="Not applicable"
                          >
                            <Minus className="size-3.5" aria-hidden="true" />
                          </span>
                        ) : editable ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabledByFullAccess}
                            aria-label={`${PERMISSION_MODULE_LABELS[moduleKey]} ${PERMISSION_ACTION_LABELS[action]}`}
                            onChange={(event) =>
                              handleToggle(
                                moduleKey,
                                actionKey,
                                event.target.checked,
                              )
                            }
                            className="size-4 rounded border-border text-primary focus:ring-primary/30 disabled:opacity-60"
                          />
                        ) : checked ? (
                          <span
                            className="inline-flex size-5 items-center justify-center rounded border border-primary/30 bg-primary-light text-primary"
                            aria-label="Allowed"
                          >
                            <Check className="size-3.5" aria-hidden="true" />
                          </span>
                        ) : (
                          <span
                            className="inline-block size-4 rounded border border-border-subtle bg-surface"
                            aria-label="Not allowed"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-wrap gap-4 text-xs text-muted">
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center rounded border border-primary/30 bg-primary-light text-primary">
            <Check className="size-3" aria-hidden="true" />
          </span>
          Allowed
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3.5 rounded border border-border-subtle bg-surface" />
          Not Allowed
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Minus className="size-3.5" aria-hidden="true" />
          Not Applicable
        </li>
      </ul>
    </div>
  );
}
