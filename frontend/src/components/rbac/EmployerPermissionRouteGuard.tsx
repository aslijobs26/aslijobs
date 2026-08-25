"use client";

import { EmployerRouteLoadingSkeleton } from "@/components/employer-dashboard/skeletons/EmployerPageSkeletons";
import {
  EMPLOYER_UNAUTHORIZED_PATH,
  ROUTE_PERMISSION_RULES,
} from "@/constants/employer-rbac";
import { ROUTES } from "@/constants/routes";
import { usePermissionContext } from "@/providers/employer-permission-provider";
import type {
  RbacActionKey,
  RbacSession,
  TeamPermissionModule,
} from "@/types/employer-team";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type EmployerPermissionRouteGuardProps = {
  children: ReactNode;
};

function matchRouteRule(pathname: string) {
  const sorted = [...ROUTE_PERMISSION_RULES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  return sorted.find(
    (rule) =>
      pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );
}

function sessionAllows(
  session: RbacSession,
  module: TeamPermissionModule,
  action: RbacActionKey,
): boolean {
  if (session.isSuperAdmin) {
    return true;
  }
  return Boolean(session.allowedActions[module]?.[action]);
}

export function EmployerPermissionRouteGuard({
  children,
}: EmployerPermissionRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isError, session } = usePermissionContext();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (isLoading || isError || !session) {
      return;
    }

    if (
      pathname === EMPLOYER_UNAUTHORIZED_PATH ||
      pathname.startsWith(`${EMPLOYER_UNAUTHORIZED_PATH}/`)
    ) {
      return;
    }

    const rule = matchRouteRule(pathname);
    if (!rule) {
      return;
    }

    const action = rule.action ?? "read";
    if (!sessionAllows(session, rule.module, action)) {
      const params = new URLSearchParams({
        from: pathname,
        module: rule.module,
      });
      routerRef.current.replace(
        `${EMPLOYER_UNAUTHORIZED_PATH}?${params.toString()}`,
      );
    }
  }, [isError, isLoading, pathname, session]);

  if (isLoading) {
    return <EmployerRouteLoadingSkeleton pathname={pathname} />;
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-sm font-semibold text-foreground">
          Unable to load permissions
        </p>
        <button
          type="button"
          onClick={() => router.push(ROUTES.EMPLOYER_DASHBOARD)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
