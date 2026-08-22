import { useEffect } from "react";

import { Navigate, useLocation } from "react-router-dom";

import { useQueryClient } from "@tanstack/react-query";

import type { ReactNode } from "react";

import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";

import {

  resolveOperationsSessionUser,

  useOperationsSessionQuery,

} from "../../../hooks/use-operations-session-query";

import { getOperationsAuthUser, hasOperationsAuthSession } from "../../../utils/operations-auth-storage";

import {

  isOperationsSessionTransientError,

  isOperationsSessionUnauthorized,

} from "../../../utils/operations-session-errors";

import { clearOperationsClientSession } from "../../../utils/operations-session";



interface OperationsAuthGuardProps {

  children: ReactNode;

}



function SessionLoadingState() {

  return (

    <div className="flex min-h-dvh items-center justify-center bg-hero-bg text-sm text-muted">

      Verifying session...

    </div>

  );

}



function SessionReconnectBanner({ onRetry }: { onRetry: () => void }) {

  return (

    <div

      className="border-b border-warning/20 bg-warning/10 px-3 py-2 text-center text-[11px] text-foreground sm:px-4"

      role="status"

    >

      <span>

        Operations API is temporarily unavailable. Continuing with your saved

        session.

      </span>{" "}

      <button

        type="button"

        onClick={onRetry}

        className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"

      >

        Retry

      </button>

    </div>

  );

}



function SessionUnavailableState({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {

  return (

    <div className="flex min-h-dvh items-center justify-center bg-hero-bg px-4">

      <div className="max-w-sm rounded-xl border border-border-subtle bg-surface px-5 py-6 text-center shadow-sm">

        <p className="text-sm font-semibold text-foreground">

          Unable to verify session

        </p>

        <p className="mt-1 text-xs text-muted">

          The operations API is temporarily unavailable. Your saved sign-in was

          not cleared. Check that the backend is running, then retry.

        </p>

        <button

          type="button"

          onClick={onRetry}

          disabled={isRetrying}

          className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"

        >

          {isRetrying ? "Retrying..." : "Retry"}

        </button>

      </div>

    </div>

  );

}



export function OperationsAuthGuard({ children }: OperationsAuthGuardProps) {

  const location = useLocation();

  const queryClient = useQueryClient();

  const hasToken = hasOperationsAuthSession();

  const sessionQuery = useOperationsSessionQuery({ mode: "protected" });

  const sessionUser = resolveOperationsSessionUser(sessionQuery.data);

  const hasCachedIdentity = Boolean(sessionUser ?? getOperationsAuthUser());

  const isTransientError =

    sessionQuery.isError && isOperationsSessionTransientError(sessionQuery.error);



  useEffect(() => {

    if (

      sessionQuery.isError &&

      isOperationsSessionUnauthorized(sessionQuery.error)

    ) {

      clearOperationsClientSession(queryClient);

    }

  }, [queryClient, sessionQuery.error, sessionQuery.isError]);



  if (!hasToken) {

    return (

      <Navigate

        to={OPERATIONS_ROUTES.LOGIN}

        replace

        state={{ from: location.pathname }}

      />

    );

  }



  if (sessionQuery.isPending && !hasCachedIdentity) {

    return <SessionLoadingState />;

  }



  if (sessionQuery.isError) {

    if (isOperationsSessionUnauthorized(sessionQuery.error)) {

      return (

        <Navigate

          to={OPERATIONS_ROUTES.LOGIN}

          replace

          state={{ from: location.pathname }}

        />

      );

    }



    if (isTransientError && hasCachedIdentity) {

      return (

        <>

          <SessionReconnectBanner

            onRetry={() => {

              void sessionQuery.refetch();

            }}

          />

          {children}

        </>

      );

    }



    if (isTransientError) {

      return (

        <SessionUnavailableState

          isRetrying={sessionQuery.isFetching}

          onRetry={() => {

            void sessionQuery.refetch();

          }}

        />

      );

    }



    clearOperationsClientSession(queryClient);

    return (

      <Navigate

        to={OPERATIONS_ROUTES.LOGIN}

        replace

        state={{ from: location.pathname }}

      />

    );

  }



  return children;

}



interface OperationsGuestGuardProps {

  children: ReactNode;

}



export function OperationsGuestGuard({ children }: OperationsGuestGuardProps) {

  const queryClient = useQueryClient();

  const hasToken = hasOperationsAuthSession();

  const sessionQuery = useOperationsSessionQuery({ mode: "guest" });



  useEffect(() => {

    if (

      sessionQuery.isError &&

      isOperationsSessionUnauthorized(sessionQuery.error)

    ) {

      clearOperationsClientSession(queryClient);

    }

  }, [queryClient, sessionQuery.error, sessionQuery.isError]);



  if (!hasToken) {

    return children;

  }



  if (sessionQuery.isPending && !getOperationsAuthUser()) {

    return <SessionLoadingState />;

  }



  if (sessionQuery.isSuccess) {

    return <Navigate to={OPERATIONS_ROUTES.DASHBOARD} replace />;

  }



  if (

    sessionQuery.isError &&

    isOperationsSessionTransientError(sessionQuery.error) &&

    getOperationsAuthUser()

  ) {

    return <Navigate to={OPERATIONS_ROUTES.DASHBOARD} replace />;

  }



  return children;

}

