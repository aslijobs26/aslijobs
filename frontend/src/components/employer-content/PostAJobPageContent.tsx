"use client";

import { JobSeekerContentPage } from "@/components/job-seeker-content/JobSeekerContentPage";
import { ROUTES } from "@/constants/routes";
import { useTranslate } from "@/i18n/translate";
import type { PublicContentPageData } from "@/types/job-seeker-content";

export function PostAJobPageContent() {
  const t = useTranslate();

  const content: PublicContentPageData = {
    slug: "post-a-job",
    title: t("publicContent.postAJob.title"),
    metaDescription: t("publicContent.postAJob.metaDescription"),
    intro: [t("publicContent.postAJob.intro")],
    sections: [
      {
        id: "post-jobs-easily",
        title: t("publicContent.postAJob.postJobsEasily.title"),
        paragraphs: [t("publicContent.postAJob.postJobsEasily.body")],
        bullets: [
          t("publicContent.postAJob.postJobsEasily.jobTitle"),
          t("publicContent.postAJob.postJobsEasily.location"),
          t("publicContent.postAJob.postJobsEasily.salary"),
          t("publicContent.postAJob.postJobsEasily.workTimings"),
          t("publicContent.postAJob.postJobsEasily.openings"),
          t("publicContent.postAJob.postJobsEasily.experience"),
          t("publicContent.postAJob.postJobsEasily.skills"),
          t("publicContent.postAJob.postJobsEasily.benefits"),
          t("publicContent.postAJob.postJobsEasily.interviewDetails"),
        ],
      },
      {
        id: "reach-suitable-candidates",
        title: t("publicContent.postAJob.reachCandidates.title"),
        paragraphs: [t("publicContent.postAJob.reachCandidates.body")],
      },
      {
        id: "manage-applications",
        title: t("publicContent.postAJob.manageApplications.title"),
        paragraphs: [t("publicContent.postAJob.manageApplications.body")],
      },
      {
        id: "promote-your-job",
        title: t("publicContent.postAJob.promoteJob.title"),
        paragraphs: [t("publicContent.postAJob.promoteJob.body")],
      },
    ],
    cta: {
      title: t("publicContent.postAJob.cta.title"),
      paragraphs: [t("publicContent.postAJob.cta.body")],
      tagline: t("publicContent.postAJob.cta.tagline"),
      badge: t("publicContent.postAJob.cta.badge"),
      actions: [
        {
          label: t("publicContent.postAJob.cta.postAJob"),
          href: ROUTES.POST_JOB,
          variant: "primary",
        },
        {
          label: t("publicContent.postAJob.cta.employerLogin"),
          href: ROUTES.EMPLOYER_LOGIN,
          variant: "secondary",
        },
      ],
    },
  };

  return <JobSeekerContentPage content={content} />;
}
