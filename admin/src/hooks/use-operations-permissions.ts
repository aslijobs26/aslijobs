import { useContext } from "react";
import {
  OperationsPermissionContext,
  type OperationsPermissionContextValue,
} from "../providers/operations-permission-context";

export function useOperationsPermissions(): OperationsPermissionContextValue {
  const context = useContext(OperationsPermissionContext);
  if (!context) {
    throw new Error(
      "useOperationsPermissions must be used within OperationsPermissionProvider.",
    );
  }
  return context;
}

/** Convenience alias matching employer `useCan` naming. */
export function useCan(): OperationsPermissionContextValue {
  return useOperationsPermissions();
}
