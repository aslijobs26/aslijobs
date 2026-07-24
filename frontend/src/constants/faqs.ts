import type { FaqCategory } from "@/types/faqs";

export const FAQ_PAGE_TITLE = "FAQs";

export const FAQ_PAGE_SUBTITLE =
  "Find quick answers to common questions about AsliJobs, job search, employer hiring, WhatsApp alerts, safety, and support.";

export const FAQ_SEARCH_PLACEHOLDER = "Search FAQs...";

export const FAQ_EMPTY_TITLE = "No FAQs found";

export const FAQ_EMPTY_DESCRIPTION =
  "Try a different keyword, or browse the categories below after clearing your search.";

export const FAQ_HELP_TITLE = "Still have questions?";

export const FAQ_HELP_DESCRIPTION =
  "Can't find the answer you're looking for?\nOur support team is here to help.";

export const FAQ_HELP_CONTACT_LABEL = "Contact Support";

export const FAQ_HELP_WHATSAPP_LABEL = "WhatsApp Support";

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "general",
    title: "General",
    items: [
      {
        id: "what-is-aslijobs",
        question: "What is AsliJobs?",
        answer:
          "AsliJobs is a WhatsApp-based job portal that helps India’s blue-collar and grey-collar workforce find suitable jobs and helps employers hire the right candidates easily.",
      },
      {
        id: "how-does-aslijobs-work",
        question: "How does AsliJobs work?",
        answer:
          "AsliJobs works through WhatsApp. Job seekers can receive job alerts and apply for jobs, while employers can post jobs and connect with suitable candidates.",
      },
      {
        id: "need-to-download-app",
        question: "Do I need to download an app?",
        answer:
          "No. Job seekers and employers do not need to download any app. AsliJobs works directly through WhatsApp, making it simple and easy to use.",
      },
      {
        id: "which-cities",
        question: "Which cities does AsliJobs serve?",
        answer:
          "AsliJobs serves job seekers and employers across India. Job seekers can search and apply for jobs from anywhere, while employers can post jobs from any location. Job availability may vary depending on the city, area, locality, and current employer openings.",
      },
      {
        id: "job-categories",
        question: "Which job categories are available?",
        answer:
          "AsliJobs supports industries such as manufacturing, construction, logistics and transportation, warehousing, retail, hospitality, facility management, security services, automotive, healthcare support, and other blue-collar and grey-collar sectors.",
      },
    ],
  },
  {
    id: "job-seekers",
    title: "Job Seekers",
    items: [
      {
        id: "free-for-job-seekers",
        question: "Is AsliJobs free for job seekers?",
        answer:
          "Yes. AsliJobs is free for job seekers to search and apply for jobs.",
      },
      {
        id: "job-alerts",
        question: "How will job seekers receive job alerts?",
        answer:
          "Job seekers will receive job alerts on WhatsApp based on their location, job category, experience, and profile details.",
      },
      {
        id: "should-pay-for-job",
        question: "Should job seekers pay money to get a job?",
        answer:
          "No. Job seekers should not pay money for job confirmation. If anyone asks for payment, report it to AsliJobs immediately.",
      },
      {
        id: "job-search-status-badge",
        question: "What is the job search status badge?",
        answer:
          "This badge indicates that you are actively looking for a job. You need to enable this badge on your AsliJobs profile to receive job alerts. If the badge is turned off, you will not receive job alerts.",
      },
    ],
  },
  {
    id: "employers",
    title: "Employers",
    items: [
      {
        id: "employer-free-or-paid",
        question: "Are employer services free or paid?",
        answer:
          "AsliJobs offers both free and paid services for employers. Employers can choose paid hiring plans, promoted jobs, or campaign promotions based on their hiring requirements.",
      },
      {
        id: "how-employers-post-job",
        question: "How do employers post a job?",
        answer:
          "Employers can post a job by sharing details like job title, location, salary, work timing, openings, experience required, and benefits.",
      },
      {
        id: "promoted-job",
        question: "What is a promoted job?",
        answer:
          "A promoted job is a paid job post given extra visibility so more suitable job seekers can see and apply for it.",
      },
    ],
  },
  {
    id: "job-applications",
    title: "Job Applications",
    items: [
      {
        id: "how-job-seekers-apply",
        question: "How do job seekers apply for a job?",
        answer:
          "Job seekers can apply directly through WhatsApp by replying to a job alert or selecting the Apply option. They can also apply through the AsliJobs website.",
      },
      {
        id: "how-employers-receive-applications",
        question: "How will employers receive applications?",
        answer:
          "Employers can view applications through the employer dashboard or receive updates shared by the AsliJobs team.",
      },
      {
        id: "after-job-seeker-applies",
        question: "What happens after a job seeker applies?",
        answer:
          "After a job seeker applies, the application is shared with the employer. Further updates like shortlisting, interview details, or selection status will be shared through WhatsApp.",
      },
      {
        id: "how-employers-shortlist",
        question: "How can employers shortlist candidates?",
        answer:
          "Employers can review candidate details and shortlist profiles that match their hiring requirements.",
      },
    ],
  },
  {
    id: "languages",
    title: "Languages",
    items: [
      {
        id: "supported-languages",
        question: "Which languages does AsliJobs support?",
        answer:
          "AsliJobs supports English, Hindi, Telugu, Tamil, Kannada, and Malayalam.",
      },
      {
        id: "change-language",
        question: "Can users change their language preference?",
        answer:
          "Yes. Users can change their preferred language through the AsliJobs website, WhatsApp, or by contacting AsliJobs support.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    items: [
      {
        id: "report-fake-job",
        question: "How can users report a fake job?",
        answer:
          "Users can report a fake or suspicious job by contacting AsliJobs support and sharing the job details, employer name, issue, and screenshots if available.",
      },
    ],
  },
  {
    id: "profile-account",
    title: "Profile & Account",
    items: [
      {
        id: "update-profile",
        question: "How can users update their profile details?",
        answer:
          "Job seekers can update their profile details through their profile on the AsliJobs website, while employers can update their details through the employer dashboard. Users can also contact AsliJobs support through WhatsApp or the available support options.",
      },
      {
        id: "deactivate-account",
        question: "How can users deactivate their account?",
        answer:
          "Job seekers can deactivate their account through their profile settings on the AsliJobs website, while employers can deactivate their account through the employer dashboard. Users can also contact AsliJobs support for assistance with account deactivation.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        id: "contact-support",
        question: "How can users contact AsliJobs support?",
        answer:
          "You can contact AsliJobs support through WhatsApp, phone, or email.",
      },
      {
        id: "more-help",
        question: "Where can users get more help?",
        answer:
          "For detailed answers, users can visit the AsliJobs Help Center or contact AsliJobs support.",
      },
    ],
  },
];
