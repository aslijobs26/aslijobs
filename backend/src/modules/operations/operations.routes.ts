import { Router } from "express";
import operationsAuthRouter from "./auth/operations-auth.routes.js";
import operationsAuditRouter from "./audit/operations-audit.routes.js";
import operationsCandidatesRouter from "./candidates/operations-candidates.routes.js";
import operationsDepartmentsRouter from "./departments/operations-departments.routes.js";
import operationsEmployersRouter from "./employers/operations-employers.routes.js";
import operationsJobsRouter from "./jobs/operations-jobs.routes.js";
import operationsPermissionsRouter from "./roles/operations-permissions.routes.js";
import operationsRolesRouter from "./roles/operations-roles.routes.js";
import operationsTeamRouter from "./team/operations-team.routes.js";

export const operationsRouter = Router();

operationsRouter.use("/auth", operationsAuthRouter);
operationsRouter.use("/employers", operationsEmployersRouter);
operationsRouter.use("/candidates", operationsCandidatesRouter);
operationsRouter.use("/jobs", operationsJobsRouter);
operationsRouter.use("/team", operationsTeamRouter);
operationsRouter.use("/roles", operationsRolesRouter);
operationsRouter.use("/permissions", operationsPermissionsRouter);
operationsRouter.use("/departments", operationsDepartmentsRouter);
operationsRouter.use("/audit-log", operationsAuditRouter);

export default operationsRouter;
