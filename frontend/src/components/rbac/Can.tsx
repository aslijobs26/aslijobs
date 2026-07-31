"use client";

import type { RbacActionKey, TeamPermissionModule } from "@/types/employer-team";
import { useCan } from "@/providers/employer-permission-provider";
import type { ReactNode } from "react";

type CanProps = {
  module: TeamPermissionModule;
  action?: RbacActionKey;
  field?: string;
  fieldMode?: "read" | "write";
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Declarative UI gate. Backend remains the source of truth.
 */
export function Can({
  module,
  action = "read",
  field,
  fieldMode = "read",
  fallback = null,
  children,
}: CanProps) {
  const { can, canField, isLoading } = useCan();

  if (isLoading) {
    return null;
  }

  const allowed = field
    ? canField(module, field, fieldMode)
    : can(module, action);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
