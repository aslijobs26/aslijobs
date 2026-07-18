import { Router } from "express";
import employerRouter from "../modules/employers/employer.routes.js";

const apiRouter = Router();

apiRouter.use("/employers", employerRouter);

export default apiRouter;
