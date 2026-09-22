/**
 * Employer job “Under Review” confirmation page copy.
 * Backend status remains `pending_approval`; this is the Employer-facing label.
 */

export const JOB_UNDER_REVIEW_PAGE_TITLE = "Job Under Review | AsliJobs";
export const JOB_UNDER_REVIEW_PAGE_DESCRIPTION =
  "Your job has been submitted and is pending Operations approval before going live on AsliJobs.";

export const JOB_UNDER_REVIEW_SUCCESS_TITLE =
  "Your job has been submitted successfully";
export const JOB_UNDER_REVIEW_STATUS_BADGE = "Under Review";
export const JOB_UNDER_REVIEW_LEAD =
  "Your job is currently under review by the AsliJobs team.";
export const JOB_UNDER_REVIEW_SLA =
  "We’ll verify your job details within 24 hours. Once approved, it will go Live and become visible to job seekers.";

export const JOB_UNDER_REVIEW_LIVE_TITLE = "Your job is Live";
export const JOB_UNDER_REVIEW_LIVE_LEAD =
  "Operations approved your job. It is now visible to job seekers on AsliJobs.";

export const JOB_UNDER_REVIEW_REJECTED_TITLE = "Action required";
export const JOB_UNDER_REVIEW_REJECTED_LEAD =
  "Your job was not approved. Review the feedback, update the details, and resubmit.";

export const JOB_UNDER_REVIEW_LIVE_CHANGE_TITLE =
  "Your changes are under review";
export const JOB_UNDER_REVIEW_LIVE_CHANGE_LEAD =
  "Your edits are pending Operations approval. The current live listing stays visible until the changes are approved.";

export const JOB_UNDER_REVIEW_SUMMARY_HEADING = "Job Summary";
export const JOB_UNDER_REVIEW_TIMELINE_HEADING = "What happens next?";

export const JOB_UNDER_REVIEW_REFRESH = "Refresh status";
export const JOB_UNDER_REVIEW_EDIT_RESUBMIT = "Edit & Resubmit";
export const JOB_UNDER_REVIEW_VIEW_LIVE = "View Live Job";
export const JOB_UNDER_REVIEW_GO_TO_JOBS = "Go to My Jobs";
export const JOB_UNDER_REVIEW_POST_ANOTHER = "Post Another Job";

export const JOB_UNDER_REVIEW_LOADING = "Loading your job…";
export const JOB_UNDER_REVIEW_ERROR_TITLE = "Unable to load this job";
export const JOB_UNDER_REVIEW_ERROR_RETRY = "Try again";
export const JOB_UNDER_REVIEW_NOT_FOUND =
  "This job was not found, or you do not have access to it.";

export const JOB_UNDER_REVIEW_FIELD_TITLE = "Job Title";
export const JOB_UNDER_REVIEW_FIELD_COMPANY = "Company";
export const JOB_UNDER_REVIEW_FIELD_LOCATION = "Location";
export const JOB_UNDER_REVIEW_FIELD_TYPE = "Employment Type";
export const JOB_UNDER_REVIEW_FIELD_STATUS = "Status";
export const JOB_UNDER_REVIEW_FIELD_SUBMITTED = "Submitted";

export type JobUnderReviewTimelineStep = {
  id: string;
  label: string;
  detail: string;
};

export const JOB_UNDER_REVIEW_TIMELINE_PENDING: readonly JobUnderReviewTimelineStep[] =
  [
    {
      id: "submitted",
      label: "Job submitted",
      detail: "Completed",
    },
    {
      id: "verification",
      label: "AsliJobs verification",
      detail: "Under Review",
    },
    {
      id: "live",
      label: "Job goes Live",
      detail: "After approval",
    },
  ];

export const JOB_UNDER_REVIEW_TIMELINE_LIVE: readonly JobUnderReviewTimelineStep[] =
  [
    {
      id: "submitted",
      label: "Job submitted",
      detail: "Completed",
    },
    {
      id: "verification",
      label: "AsliJobs verification",
      detail: "Approved",
    },
    {
      id: "live",
      label: "Job goes Live",
      detail: "Completed",
    },
  ];

export const JOB_UNDER_REVIEW_TIMELINE_REJECTED: readonly JobUnderReviewTimelineStep[] =
  [
    {
      id: "submitted",
      label: "Job submitted",
      detail: "Completed",
    },
    {
      id: "verification",
      label: "AsliJobs verification",
      detail: "Rejected",
    },
    {
      id: "live",
      label: "Job goes Live",
      detail: "Waiting for resubmission",
    },
  ];
