import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { fetchOperationsSession } from "../../../services/operations-auth.service";
import { hasOperationsAuthSession } from "../../../utils/operations-auth-storage";
import { OPERATIONS_AUTH_QUERY_KEY } from "../../../utils/operations-session";

interface OperationsAuthGuardProps {
  children: ReactNode;
}

export function OperationsAuthGuard({ children }: OperationsAuthGuardProps) {
  const location = useLocation();
  const hasToken = hasOperationsAuthSession();

  const sessionQuery = useQuery({
    queryKey: OPERATIONS_AUTH_QUERY_KEY,
    queryFn: fetchOperationsSession,
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });

  if (!hasToken) {
    return (
      <Navigate
        to={OPERATIONS_ROUTES.LOGIN}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-hero-bg text-sm text-muted">
        Verifying session...
      </div>
    );
  }

  if (sessionQuery.isError) {
    return <Navigate to={OPERATIONS_ROUTES.LOGIN} replace />;
  }

  return children;
}

interface OperationsGuestGuardProps {
  children: ReactNode;
}

export function OperationsGuestGuard({ children }: OperationsGuestGuardProps) {
  if (hasOperationsAuthSession()) {
    return <Navigate to={OPERATIONS_ROUTES.DASHBOARD} replace />;
  }

  return children;
}
