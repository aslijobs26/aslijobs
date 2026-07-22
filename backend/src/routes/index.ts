import { Router } from "express";
import employerRouter from "../modules/employers/employer.routes.js";
import jobRouter from "../modules/jobs/job.routes.js";
import jobSeekerRouter from "../modules/job-seekers/job-seeker.routes.js";

const apiRouter = Router();

apiRouter.use("/employers", employerRouter);
apiRouter.use("/jobs", jobRouter);
apiRouter.use("/jobseekers", jobSeekerRouter);

export default apiRouter;
