"use client";

import { RBAC_QUERY_KEYS } from "@/constants/employer-rbac";
import {
  coerceFieldAccessLevel,
  type FieldAccessLevel,
} from "@/constants/employer-field-access";
import { fetchRbacSession } from "@/services/employer-team.service";
import type {
  RbacActionKey,
  RbacSession,
  TeamPermissionModule,
} from "@/types/employer-team";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type PermissionContextValue = {
  session: RbacSession | undefined;
  isLoading: boolean;
  isError: boolean;
  can: (module: TeamPermissionModule, action?: RbacActionKey) => boolean;
  getFieldLevel: (
    module: TeamPermissionModule,
    fieldKey: string,
  ) => FieldAccessLevel;
  canField: (
    module: TeamPermissionModule,
    fieldKey: string,
    mode?: "read" | "write",
  ) => boolean;
  allowedModules: TeamPermissionModule[];
  refetch: () => void;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

function evaluateCan(
  session: RbacSession | undefined,
  module: TeamPermissionModule,
  action: RbacActionKey = "read",
): boolean {
  if (!session) {
    return false;
  }
  if (session.isSuperAdmin) {
    return true;
  }
  return Boolean(session.allowedActions[module]?.[action]);
}

function evaluateFieldLevel(
  session: RbacSession | undefined,
  module: TeamPermissionModule,
  fieldKey: string,
): FieldAccessLevel {
  if (!session) {
    return "hidden";
  }
  if (session.isSuperAdmin) {
    return "edit";
  }
  if (!evaluateCan(session, module, "read")) {
    return "hidden";
  }
  const fromMap = session.fieldAccess?.[module]?.[fieldKey];
  if (fromMap !== undefined) {
    return coerceFieldAccessLevel(fromMap);
  }
  const fromModule = session.permissions[module]?.fields?.[fieldKey];
  if (fromModule !== undefined) {
    return coerceFieldAccessLevel(fromModule);
  }
  return "edit";
}

function evaluateField(
  session: RbacSession | undefined,
  module: TeamPermissionModule,
  fieldKey: string,
  mode: "read" | "write" = "read",
): boolean {
  if (!session) {
    return false;
  }
  if (session.isSuperAdmin) {
    return true;
  }
  if (mode === "write") {
    if (!evaluateCan(session, module, "update")) {
      return false;
    }
    return evaluateFieldLevel(session, module, fieldKey) === "edit";
  }
  if (!evaluateCan(session, module, "read")) {
    return false;
  }
  const level = evaluateFieldLevel(session, module, fieldKey);
  return level === "view" || level === "mask" || level === "edit";
}

export function EmployerPermissionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const sessionQuery = useQuery({
    queryKey: RBAC_QUERY_KEYS.session(),
    queryFn: fetchRbacSession,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const session = sessionQuery.data;
  const isLoading = sessionQuery.isLoading;
  const isError = sessionQuery.isError;
  const refetchSession = sessionQuery.refetch;

  const can = useCallback(
    (module: TeamPermissionModule, action: RbacActionKey = "read") =>
      evaluateCan(session, module, action),
    [session],
  );

  const getFieldLevel = useCallback(
    (module: TeamPermissionModule, fieldKey: string) =>
      evaluateFieldLevel(session, module, fieldKey),
    [session],
  );

  const canField = useCallback(
    (
      module: TeamPermissionModule,
      fieldKey: string,
      mode: "read" | "write" = "read",
    ) => evaluateField(session, module, fieldKey, mode),
    [session],
  );

  const refetch = useCallback(() => {
    void refetchSession();
  }, [refetchSession]);

  const value = useMemo<PermissionContextValue>(
    () => ({
      session,
      isLoading,
      isError,
      can,
      getFieldLevel,
      canField,
      allowedModules: session?.allowedModules ?? [],
      refetch,
    }),
    [session, isLoading, isError, can, getFieldLevel, canField, refetch],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "usePermissionContext must be used within EmployerPermissionProvider",
    );
  }
  return context;
}

export function usePermission(
  module: TeamPermissionModule,
  action: RbacActionKey = "read",
): boolean {
  const { can } = usePermissionContext();
  return can(module, action);
}

export function useCan() {
  const { can, canField, getFieldLevel, session, isLoading } =
    usePermissionContext();
  return { can, canField, getFieldLevel, session, isLoading };
}

/**
 * Safe for public-site shells (e.g. marketing Navbar) that mount employer UI
 * outside EmployerPermissionProvider. Workspace code should keep using useCan().
 */
export function useCanOptional() {
  const context = useContext(PermissionContext);
  if (!context) {
    return {
      can: () => true,
      canField: () => true,
      getFieldLevel: (): FieldAccessLevel => "edit",
      session: undefined,
      isLoading: false,
      hasProvider: false as const,
    };
  }
  return {
    can: context.can,
    canField: context.canField,
    getFieldLevel: context.getFieldLevel,
    session: context.session,
    isLoading: context.isLoading,
    hasProvider: true as const,
  };
}
