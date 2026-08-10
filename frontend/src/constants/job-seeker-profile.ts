export const JOB_SEEKER_RESUME_QUERY_KEY = ["job-seeker", "my-resume"] as const;

/** Generated + uploaded resume preferences for My Resume / apply chooser. */
export const JOB_SEEKER_RESUME_BUNDLE_QUERY_KEY = [
  "job-seeker",
  "my-resume-bundle",
] as const;

export const JOB_SEEKER_PROFILE_VISIBILITY_OPTIONS = [
  {
    value: "visible",
    label: "Visible to Employers",
    description: "Your profile is visible to employers.",
  },
  {
    value: "recruiter_only",
    label: "Recruiter Only",
    description: "Only recruiters reviewing applications can see your profile.",
  },
  {
    value: "private",
    label: "Private",
    description: "Your profile is hidden from employer search.",
  },
] as const;
