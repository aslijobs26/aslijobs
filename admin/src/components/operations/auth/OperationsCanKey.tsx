import type { ReactNode } from "react";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";

type OperationsCanKeyProps = {
  permissionKey: string;
  fallback?: ReactNode;
  children: ReactNode;
};

/** Granular UI gate. Backend authorization remains the source of truth. */
export function OperationsCanKey({
  permissionKey,
  fallback = null,
  children,
}: OperationsCanKeyProps) {
  const { canKey, isLoading } = useOperationsPermissions();

  if (isLoading) {
    return null;
  }

  if (!canKey(permissionKey)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
