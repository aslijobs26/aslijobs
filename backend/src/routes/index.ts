import { Router } from "express";
import applicationRouter from "../modules/applications/application.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import employerRouter from "../modules/employers/employer.routes.js";
import jobRouter from "../modules/jobs/job.routes.js";
import jobSeekerRouter from "../modules/job-seekers/job-seeker.routes.js";
import notificationRouter from "../modules/notifications/notification.routes.js";
import resumeRouter from "../modules/resumes/resume.routes.js";
import savedCandidateRouter from "../modules/saved-candidates/saved-candidate.routes.js";
import savedJobRouter from "../modules/saved-jobs/saved-job.routes.js";
import teamRouter from "../modules/team/team.routes.js";
import operationsRouter from "../modules/operations/operations.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/employers", employerRouter);
apiRouter.use("/jobs", jobRouter);
apiRouter.use("/jobseekers", jobSeekerRouter);
apiRouter.use("/resumes", resumeRouter);
apiRouter.use("/applications", applicationRouter);
apiRouter.use("/saved-jobs", savedJobRouter);
apiRouter.use("/saved-candidates", savedCandidateRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/team", teamRouter);
apiRouter.use("/operations", operationsRouter);

export default apiRouter;
