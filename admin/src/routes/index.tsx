import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { OperationsAuthGuard } from "../components/operations/auth/OperationsAuthGuard";
import { OperationsPermissionRouteGuard } from "../components/operations/auth/OperationsPermissionRouteGuard";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import { OperationsPermissionProvider } from "../providers/operations-permission-provider";
import { OperationsCandidatesDetailPage } from "./operations-candidates-detail-page";
import { OperationsCandidatesPage } from "./operations-candidates-page";
import { OperationsDashboardPage } from "./operations-dashboard-page";
import { OperationsEmployersDetailPage } from "./operations-employers-detail-page";
import { OperationsEmployersPage } from "./operations-employers-page";
import { OperationsJobsDetailPage } from "./operations-jobs-detail-page";
import { OperationsJobsPage } from "./operations-jobs-page";
import { OperationsJobsPostPage } from "./operations-jobs-post-page";
import { OperationsLoginPage } from "./operations-login-page";
import { OperationsActivityLogPage } from "./operations-activity-log-page";
import { OperationsDepartmentsPage } from "./operations-departments-page";
import { OperationsPlaceholderPage } from "./operations-placeholder-page";
import { OperationsRoleDetailPage } from "./operations-role-detail-page";
import { OperationsRoleEditorPage } from "./operations-role-editor-page";
import { OperationsRolesPage } from "./operations-roles-page";
import { OperationsTeamPage } from "./operations-team-page";

function OperationsProtectedLayout() {
  return (
    <OperationsAuthGuard>
      <OperationsPermissionProvider>
        <OperationsPermissionRouteGuard>
          <Outlet />
        </OperationsPermissionRouteGuard>
      </OperationsPermissionProvider>
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
          element={<OperationsEmployersPage />}
        />
        <Route
          path={`${OPERATIONS_ROUTES.EMPLOYERS}/:employerId`}
          element={<OperationsEmployersDetailPage />}
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
          element={<OperationsTeamPage />}
        />
        <Route
          path={OPERATIONS_ROUTES.DEPARTMENTS}
          element={<OperationsDepartmentsPage />}
        />
        <Route
          path={OPERATIONS_ROUTES.ROLES_NEW}
          element={<OperationsRoleEditorPage />}
        />
        <Route
          path={`${OPERATIONS_ROUTES.ROLES}/:roleId/edit`}
          element={<OperationsRoleEditorPage />}
        />
        <Route
          path={`${OPERATIONS_ROUTES.ROLES}/:roleId`}
          element={<OperationsRoleDetailPage />}
        />
        <Route
          path={OPERATIONS_ROUTES.ROLES}
          element={<OperationsRolesPage />}
        />
        <Route
          path={OPERATIONS_ROUTES.ACTIVITY_LOG}
          element={<OperationsActivityLogPage />}
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
