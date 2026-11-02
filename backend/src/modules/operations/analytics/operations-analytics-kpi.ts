export type KpiDefinition = {
  definition: string;
  method: string;
  source: string;
  dateField: string;
  filters: string;
  limitation: string;
};

export const ANALYTICS_KPI_DEFINITIONS: Record<string, KpiDefinition> = {
  "unique-visitors": {
    definition: "Distinct opaque visitor ids that sent a page view in the period.",
    method: "distinct visitorId where eventName is page_view",
    source: "analytics_events",
    dateField: "occurredAt",
    filters: "Date only. Location, category, employer, job type, and application status do not apply.",
    limitation: "A visitor id is created in the browser and can be cleared or spoofed.",
  },
  "page-views": {
    definition: "Page view events recorded by the website beacon.",
    method: "count of page_view events",
    source: "analytics_events",
    dateField: "occurredAt",
    filters: "Date only.",
    limitation: "Other event names exist in the schema but the site currently sends page views only.",
  },
  sessions: {
    definition: "Distinct session ids on page view events. A session expires after 30 minutes of inactivity in the browser.",
    method: "distinct sessionId where eventName is page_view",
    source: "analytics_events",
    dateField: "occurredAt",
    filters: "Date only.",
    limitation: "There is no separate session_start event.",
  },
  "job-views": {
    definition: "Visitor–job pairs whose latest recorded view falls in the period. This is not a count of every view event.",
    method: "count job_views documents by lastViewedAt",
    source: "job_views",
    dateField: "lastViewedAt",
    filters: "Date, and job location, category, type, or employer when those filters are set.",
    limitation: "The ledger keeps one row per visitor and job. A later view moves the row out of the earlier period.",
  },
  "jobseeker-registrations": {
    definition: "Jobseeker accounts created in the period.",
    method: "count jobseeker documents",
    source: "jobseekers",
    dateField: "createdAt",
    filters: "Date, state, city, job type, and mapped role category.",
    limitation: "Registration is not the same as an available candidate.",
  },
  "employer-registrations": {
    definition: "Employer accounts created in the period.",
    method: "count employer documents",
    source: "employers",
    dateField: "createdAt",
    filters: "Date, state, city, and employer name or id.",
    limitation: "This is not the count of all employers on the platform.",
  },
  "verified-employers": {
    definition: "Employer accounts created in the period whose current verification status is verified.",
    method: "count employers created in range with verificationStatus verified",
    source: "employers",
    dateField: "createdAt",
    filters: "Date, state, city, and employer name or id.",
    limitation: "An older employer verified during the period is not included, because verification time is not a separate event.",
  },
  applications: {
    definition: "Applications submitted in the period.",
    method: "count applications by appliedAt, one document each",
    source: "applications",
    dateField: "appliedAt",
    filters: "Date, employer, current application-status filter, and the job's location, category, and type.",
    limitation: "Withdrawn applications remain in the submitted count.",
  },
  "interviews-scheduled": {
    definition: "Applications with at least one interview_scheduled history event in the period.",
    method: "distinct applications, not history rows",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    filters: "Date and the same job and employer filters as applications.",
    limitation: "A second schedule in the period is a reschedule, not a second scheduled interview.",
  },
  "interviews-completed": {
    definition: "Applications with an interview_completed history event in the period.",
    method: "distinct applications whose history status is interview_completed",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    filters: "Date and the same job and employer filters as applications.",
    limitation: "Offer, selected, or joined status does not count as a completed interview. Applications missing that history event are reported separately and not added in.",
  },
  offers: {
    definition: "Applications with an offer_sent history event in the period.",
    method: "distinct applications",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    filters: "Date and the same job and employer filters as applications.",
    limitation: "A later rejection does not remove the offer from this period.",
  },
  selected: {
    definition: "Applications with a selected history event in the period. Selected means selected for the job, not joined.",
    method: "distinct applications whose history status is selected",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    filters: "Date and the same job and employer filters as applications.",
    limitation: "No joining date is invented when history has selected but not joined.",
  },
  joined: {
    definition: "Applications with a joined history event in the period.",
    method: "distinct applications whose history status is joined",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    filters: "Date and the same job and employer filters as applications.",
    limitation: "Selected candidates who have not joined are excluded.",
  },
};
