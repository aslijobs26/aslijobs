import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleUserRound,
  Users,
} from "lucide-react";

export const JOB_POSTED_SUCCESS_STORAGE_KEY =
  "aslijobs_job_posted_success_summary";

export const JOB_POSTED_SUCCESS_HEADING_PREFIX = "Job Posted";
export const JOB_POSTED_SUCCESS_HEADING_EMPHASIS = "Successfully!";
export const JOB_POSTED_SUCCESS_SUBTITLE =
  "Your job has been posted and is now live for job seekers.";
export const JOB_POSTED_SUCCESS_WHATSAPP_BADGE =
  "Job has also been shared on WhatsApp";

export const JOB_POSTED_SUCCESS_WHATSAPP_TITLE = "Job is Live on WhatsApp!";
export const JOB_POSTED_SUCCESS_WHATSAPP_SUBTITLE =
  "Job seekers can discover and apply for this job via WhatsApp.";
export const JOB_POSTED_SUCCESS_WHATSAPP_CTA = "View on WhatsApp";
export const JOB_POSTED_SUCCESS_WHATSAPP_COMING_SOON = "Coming Soon";

export const JOB_POSTED_SUCCESS_NEXT_HEADING = "What's Next?";

export const JOB_POSTED_SUCCESS_GO_TO_JOBS = "Go to My Jobs";
export const JOB_POSTED_SUCCESS_POST_ANOTHER = "Post Another Job";

export const JOB_POSTED_SUCCESS_SUPPORT_TITLE = "Need Help?";
export const JOB_POSTED_SUCCESS_SUPPORT_SUBTITLE =
  "Our support team is here to help you find the right candidates.";
export const JOB_POSTED_SUCCESS_SUPPORT_CTA = "Contact Support";

export const JOB_POSTED_SUCCESS_STATUS_ACTIVE = "Active";
export const JOB_POSTED_SUCCESS_VISIBILITY_PUBLIC = "Public";
export const JOB_POSTED_SUCCESS_APPLICATIONS_SUFFIX = "(So far)";

export const JOB_POSTED_SUCCESS_META_POSTED_ON = "Posted on";
export const JOB_POSTED_SUCCESS_META_JOB_TYPE = "Job Type";
export const JOB_POSTED_SUCCESS_META_APPLICATIONS = "Applications";
export const JOB_POSTED_SUCCESS_META_VISIBILITY = "Visibility";

export const JOB_POSTED_SUCCESS_FALLBACK_TITLE = "Your Job";
export const JOB_POSTED_SUCCESS_FALLBACK_COMPANY = "Your Company";
export const JOB_POSTED_SUCCESS_FALLBACK_LOCATION = "India";
export const JOB_POSTED_SUCCESS_FALLBACK_SALARY = "Salary not specified";
export const JOB_POSTED_SUCCESS_FALLBACK_JOB_TYPE = "Full-time";

type NextStepTone =
  | "guide"
  | "verified"
  | "languages"
  | "free";

export type JobPostedSuccessNextStep = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: NextStepTone;
};

export const JOB_POSTED_SUCCESS_NEXT_STEPS: readonly JobPostedSuccessNextStep[] =
  [
    {
      id: "receive-applications",
      title: "Receive Applications",
      description:
        "You'll start receiving applications from interested candidates.",
      icon: Users,
      tone: "guide",
    },
    {
      id: "review-candidates",
      title: "Review Candidates",
      description:
        "Check candidate profiles and shortlist the best matches.",
      icon: CircleUserRound,
      tone: "verified",
    },
    {
      id: "schedule-interviews",
      title: "Schedule Interviews",
      description:
        "Connect with candidates and schedule interviews seamlessly.",
      icon: CalendarDays,
      tone: "languages",
    },
    {
      id: "hire-the-best",
      title: "Hire the Best",
      description:
        "Select the right candidate and grow your team with AsliJobs.",
      icon: BriefcaseBusiness,
      tone: "free",
    },
  ] as const;

export const JOB_POSTED_SUCCESS_NEXT_STEP_TONE_CLASS: Record<
  NextStepTone,
  { surface: string; icon: string }
> = {
  guide: {
    surface: "bg-resource-guide-icon-surface",
    icon: "text-resource-guide-icon",
  },
  verified: {
    surface: "bg-benefit-verified-surface",
    icon: "text-benefit-verified-icon",
  },
  languages: {
    surface: "bg-benefit-languages-surface",
    icon: "text-benefit-languages-icon",
  },
  free: {
    surface: "bg-benefit-free-surface",
    icon: "text-benefit-free-icon",
  },
};
