import { Router } from "express";
import applicationRouter from "../modules/applications/application.routes.js";
import employerRouter from "../modules/employers/employer.routes.js";
import jobRouter from "../modules/jobs/job.routes.js";
import jobSeekerRouter from "../modules/job-seekers/job-seeker.routes.js";
import notificationRouter from "../modules/notifications/notification.routes.js";
import resumeRouter from "../modules/resumes/resume.routes.js";
import teamRouter from "../modules/team/team.routes.js";

const apiRouter = Router();

apiRouter.use("/employers", employerRouter);
apiRouter.use("/jobs", jobRouter);
apiRouter.use("/jobseekers", jobSeekerRouter);
apiRouter.use("/resumes", resumeRouter);
apiRouter.use("/applications", applicationRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/team", teamRouter);

export default apiRouter;
