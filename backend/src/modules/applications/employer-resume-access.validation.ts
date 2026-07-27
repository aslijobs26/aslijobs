import { z } from "zod";

export const resumeAccessTokenParamsSchema = z.object({
  token: z.string().trim().min(20, "Invalid resume access token"),
});

export type ResumeAccessTokenParamsSchema = z.infer<
  typeof resumeAccessTokenParamsSchema
>;
