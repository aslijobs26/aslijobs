"use client";

import { RBAC_QUERY_KEYS } from "@/constants/employer-rbac";
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
  if (!evaluateCan(session, module, mode === "write" ? "update" : "read")) {
    return false;
  }
  const fromMap = session.fieldAccess?.[module]?.[fieldKey];
  if (typeof fromMap === "boolean") {
    return fromMap;
  }
  const fromModule = session.permissions[module]?.fields?.[fieldKey];
  if (typeof fromModule === "boolean") {
    return fromModule;
  }
  return true;
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
      canField,
      allowedModules: session?.allowedModules ?? [],
      refetch,
    }),
    [session, isLoading, isError, can, canField, refetch],
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
  const { can, canField, session, isLoading } = usePermissionContext();
  return { can, canField, session, isLoading };
}
