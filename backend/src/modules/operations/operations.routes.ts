import { Router } from "express";
import operationsAuthRouter from "./auth/operations-auth.routes.js";

export const operationsRouter = Router();

operationsRouter.use("/auth", operationsAuthRouter);

export default operationsRouter;
