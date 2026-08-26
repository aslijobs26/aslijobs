import type { ReactNode } from "react";
import type {
  OperationsPermissionAction,
  OperationsPermissionModule,
} from "../../../constants/operations-permissions";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";

type OperationsCanProps = {
  module: OperationsPermissionModule;
  action?: OperationsPermissionAction;
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Declarative UI gate for Operations permissions.
 * Backend authorization remains the source of truth.
 */
export function OperationsCan({
  module,
  action = "read",
  fallback = null,
  children,
}: OperationsCanProps) {
  const { can, isLoading } = useOperationsPermissions();

  if (isLoading) {
    return null;
  }

  if (!can(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
