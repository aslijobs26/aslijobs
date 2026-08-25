import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { OperationsAuthGuard } from "../components/operations/auth/OperationsAuthGuard";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { OperationsCandidatesDetailPage } from "./operations-candidates-detail-page";
import { OperationsCandidatesPage } from "./operations-candidates-page";
import { OperationsDashboardPage } from "./operations-dashboard-page";
import { OperationsJobsDetailPage } from "./operations-jobs-detail-page";
import { OperationsJobsPage } from "./operations-jobs-page";
import { OperationsJobsPostPage } from "./operations-jobs-post-page";
import { OperationsLoginPage } from "./operations-login-page";
import { OperationsPlaceholderPage } from "./operations-placeholder-page";

function OperationsProtectedLayout() {
  return (
    <OperationsAuthGuard>
      <Outlet />
    </OperationsAuthGuard>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={OPERATIONS_ROUTES.LOGIN} element={<OperationsLoginPage />} />
      <Route element={<OperationsProtectedLayout />}>
        <Route
          path={OPERATIONS_ROUTES.ROOT}
          element={<Navigate to={OPERATIONS_ROUTES.DASHBOARD} replace />}
        />
        <Route path={OPERATIONS_ROUTES.DASHBOARD} element={<OperationsDashboardPage />} />
        <Route
          path={OPERATIONS_ROUTES.MY_WORK}
          element={<OperationsPlaceholderPage title="My Work" />}
        />
        <Route
          path={OPERATIONS_ROUTES.WORK_QUEUE}
          element={<OperationsPlaceholderPage title="Work Queue" />}
        />
        <Route
          path={OPERATIONS_ROUTES.WHATSAPP_INBOX}
          element={<OperationsPlaceholderPage title="WhatsApp Inbox" />}
        />
        <Route
          path={OPERATIONS_ROUTES.JOURNEY_ALERTS}
          element={<OperationsPlaceholderPage title="Journey Alerts" />}
        />
        <Route
          path={OPERATIONS_ROUTES.SUPPORT_TICKETS}
          element={<OperationsPlaceholderPage title="Support Tickets" />}
        />
        <Route
          path={OPERATIONS_ROUTES.EMPLOYERS}
          element={<OperationsPlaceholderPage title="Employers" />}
        />
        <Route
          path={OPERATIONS_ROUTES.CANDIDATES}
          element={<OperationsCandidatesPage />}
        />
        <Route
          path={`${OPERATIONS_ROUTES.CANDIDATES}/:jobSeekerId`}
          element={<OperationsCandidatesDetailPage />}
        />
        <Route path={OPERATIONS_ROUTES.JOBS} element={<OperationsJobsPage />} />
        <Route path={OPERATIONS_ROUTES.JOBS_POST} element={<OperationsJobsPostPage />} />
        <Route
          path={`${OPERATIONS_ROUTES.JOBS}/:jobId`}
          element={<OperationsJobsDetailPage />}
        />
        <Route
          path={OPERATIONS_ROUTES.VERIFICATIONS}
          element={<OperationsPlaceholderPage title="Verifications" />}
        />
        <Route
          path={OPERATIONS_ROUTES.ESCALATIONS}
          element={<OperationsPlaceholderPage title="Escalations" />}
        />
        <Route
          path={OPERATIONS_ROUTES.TEAM_MANAGEMENT}
          element={<OperationsPlaceholderPage title="Team Management" />}
        />
        <Route
          path={OPERATIONS_ROUTES.DEPARTMENTS}
          element={<OperationsPlaceholderPage title="Departments" />}
        />
        <Route
          path={OPERATIONS_ROUTES.ROLES}
          element={<OperationsPlaceholderPage title="Roles & Permissions" />}
        />
        <Route
          path={OPERATIONS_ROUTES.ACTIVITY_LOG}
          element={<OperationsPlaceholderPage title="Activity Log" />}
        />
        <Route
          path={OPERATIONS_ROUTES.SUBSCRIPTIONS}
          element={<OperationsPlaceholderPage title="Subscriptions & Boosters" />}
        />
        <Route
          path={OPERATIONS_ROUTES.PAYMENTS}
          element={<OperationsPlaceholderPage title="Payments & Invoices" />}
        />
        <Route
          path={OPERATIONS_ROUTES.TRANSACTIONS}
          element={<OperationsPlaceholderPage title="Transactions" />}
        />
        <Route
          path={OPERATIONS_ROUTES.REFUNDS}
          element={<OperationsPlaceholderPage title="Refunds" />}
        />
        <Route
          path={OPERATIONS_ROUTES.TRUST_COMPLIANCE}
          element={<OperationsPlaceholderPage title="Trust & Compliance" />}
        />
        <Route
          path={OPERATIONS_ROUTES.AUDIT_LOGS}
          element={<OperationsPlaceholderPage title="Audit Logs" />}
        />
        <Route
          path={OPERATIONS_ROUTES.POLICIES}
          element={<OperationsPlaceholderPage title="Policies & Documents" />}
        />
      </Route>
      <Route path="*" element={<Navigate to={OPERATIONS_ROUTES.LOGIN} replace />} />
    </Routes>
  );
}
