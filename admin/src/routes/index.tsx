import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { OperationsAuthGuard } from "../components/operations/auth/OperationsAuthGuard";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { OperationsDashboardPage } from "./operations-dashboard-page";
import { OperationsLoginPage } from "./operations-login-page";
import { OperationsPlaceholderPage } from "./operations-placeholder-page";

function ProtectedOperationsPage({ children }: { children: ReactNode }) {
  return <OperationsAuthGuard>{children}</OperationsAuthGuard>;
}

function protectedRoute(element: ReactNode) {
  return <ProtectedOperationsPage>{element}</ProtectedOperationsPage>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={OPERATIONS_ROUTES.LOGIN} element={<OperationsLoginPage />} />
      <Route
        path={OPERATIONS_ROUTES.ROOT}
        element={protectedRoute(<Navigate to={OPERATIONS_ROUTES.DASHBOARD} replace />)}
      />
      <Route
        path={OPERATIONS_ROUTES.DASHBOARD}
        element={protectedRoute(<OperationsDashboardPage />)}
      />
      <Route
        path={OPERATIONS_ROUTES.MY_WORK}
        element={protectedRoute(<OperationsPlaceholderPage title="My Work" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.WORK_QUEUE}
        element={protectedRoute(<OperationsPlaceholderPage title="Work Queue" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.WHATSAPP_INBOX}
        element={protectedRoute(<OperationsPlaceholderPage title="WhatsApp Inbox" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.JOURNEY_ALERTS}
        element={protectedRoute(<OperationsPlaceholderPage title="Journey Alerts" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.SUPPORT_TICKETS}
        element={protectedRoute(<OperationsPlaceholderPage title="Support Tickets" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.EMPLOYERS}
        element={protectedRoute(<OperationsPlaceholderPage title="Employers" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.CANDIDATES}
        element={protectedRoute(<OperationsPlaceholderPage title="Candidates" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.JOBS}
        element={protectedRoute(<OperationsPlaceholderPage title="Jobs" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.VERIFICATIONS}
        element={protectedRoute(<OperationsPlaceholderPage title="Verifications" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.ESCALATIONS}
        element={protectedRoute(<OperationsPlaceholderPage title="Escalations" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
        element={protectedRoute(<OperationsPlaceholderPage title="Team Management" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.DEPARTMENTS}
        element={protectedRoute(<OperationsPlaceholderPage title="Departments" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.ROLES}
        element={protectedRoute(<OperationsPlaceholderPage title="Roles & Permissions" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.ACTIVITY_LOG}
        element={protectedRoute(<OperationsPlaceholderPage title="Activity Log" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.SUBSCRIPTIONS}
        element={protectedRoute(<OperationsPlaceholderPage title="Subscriptions & Boosters" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.PAYMENTS}
        element={protectedRoute(<OperationsPlaceholderPage title="Payments & Invoices" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.TRANSACTIONS}
        element={protectedRoute(<OperationsPlaceholderPage title="Transactions" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.REFUNDS}
        element={protectedRoute(<OperationsPlaceholderPage title="Refunds" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.TRUST_COMPLIANCE}
        element={protectedRoute(<OperationsPlaceholderPage title="Trust & Compliance" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.AUDIT_LOGS}
        element={protectedRoute(<OperationsPlaceholderPage title="Audit Logs" />)}
      />
      <Route
        path={OPERATIONS_ROUTES.POLICIES}
        element={protectedRoute(<OperationsPlaceholderPage title="Policies & Documents" />)}
      />
      <Route path="*" element={<Navigate to={OPERATIONS_ROUTES.LOGIN} replace />} />
    </Routes>
  );
}
