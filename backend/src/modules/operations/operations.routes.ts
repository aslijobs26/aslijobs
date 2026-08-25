import { Router } from "express";
import operationsAuthRouter from "./auth/operations-auth.routes.js";
import operationsCandidatesRouter from "./candidates/operations-candidates.routes.js";
import operationsEmployersRouter from "./employers/operations-employers.routes.js";
import operationsJobsRouter from "./jobs/operations-jobs.routes.js";

export const operationsRouter = Router();

operationsRouter.use("/auth", operationsAuthRouter);
operationsRouter.use("/employers", operationsEmployersRouter);
operationsRouter.use("/candidates", operationsCandidatesRouter);
operationsRouter.use("/jobs", operationsJobsRouter);

export default operationsRouter;
