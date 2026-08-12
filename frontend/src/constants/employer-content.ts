import { WHATSAPP_JOIN_URL } from "@/constants/cta";
import { ROUTES } from "@/constants/routes";
import type { PublicContentPageData } from "@/types/job-seeker-content";

const EMPLOYER_PRIMARY_ACTIONS = [
  {
    label: "Post a Job",
    href: ROUTES.POST_JOB,
    variant: "primary" as const,
  },
  {
    label: "Employer Login",
    href: ROUTES.EMPLOYER_LOGIN,
    variant: "secondary" as const,
  },
] as const;

export const POST_A_JOB_CONTENT: PublicContentPageData = {
  slug: "post-a-job",
  title: "Post a Job",
  metaDescription:
    "Hire the right blue-collar and grey-collar candidates with AsliJobs.",
  intro: [
    "Hire the right blue-collar and grey-collar candidates with AsliJobs. Whether you need office support staff, delivery executives, drivers, electricians, housekeeping staff, security guards, warehouse workers, retail staff, technicians, or helpers, AsliJobs helps you reach suitable job seekers easily.",
  ],
  sections: [
    {
      id: "post-jobs-easily",
      title: "Post Jobs Easily",
      paragraphs: [
        "Employers can post jobs on AsliJobs by sharing important details such as job title, location, salary, work timings, number of openings, experience required, skills needed, benefits, and interview details.",
      ],
      bullets: [
        "Job title",
        "Location",
        "Salary",
        "Work timings",
        "Number of openings",
        "Experience required",
        "Skills needed",
        "Benefits",
        "Interview details",
      ],
    },
    {
      id: "reach-suitable-candidates",
      title: "Reach Suitable Candidates",
      paragraphs: [
        "Once your job is posted, AsliJobs helps share the opportunity with relevant job seekers based on location, job category, experience, language preference, and availability.",
      ],
    },
    {
      id: "manage-applications",
      title: "Manage Applications",
      paragraphs: [
        "Employers can view applications, shortlist candidates, schedule interviews, and track hiring progress through the employer dashboard or with support from the AsliJobs team.",
      ],
    },
    {
      id: "promote-your-job",
      title: "Promote Your Job",
      paragraphs: [
        "Employers can choose promoted jobs or campaign promotions to increase visibility and reach more suitable candidates.",
      ],
    },
  ],
  cta: {
    title: "Start Hiring with AsliJobs",
    paragraphs: [
      "Post your job on AsliJobs and connect with candidates who are ready to work.",
    ],
    tagline: "Post a job. Reach suitable candidates. Hire faster.",
    badge: "For Employers",
    actions: EMPLOYER_PRIMARY_ACTIONS,
  },
};

export const EMPLOYER_LOGIN_CONTENT: PublicContentPageData = {
  slug: "employer-login-info",
  title: "Employer Login",
  metaDescription:
    "Access your AsliJobs employer dashboard to manage job posts, applications, candidates, interviews, hiring plans, and promotions.",
  intro: [
    "Access your AsliJobs employer dashboard to manage job posts, applications, candidates, interviews, hiring plans, and promotions in one place.",
  ],
  sections: [
    {
      id: "login-to-your-employer-dashboard",
      title: "Login to Your Employer Dashboard",
      paragraphs: [
        "Employers can log in using their registered mobile number, email address, or the login option provided by AsliJobs.",
      ],
    },
    {
      id: "manage-job-posts",
      title: "Manage Job Posts",
      paragraphs: [
        "After logging in, employers can post new jobs, edit job details, update openings, pause jobs, close filled positions, and track active job posts.",
      ],
    },
    {
      id: "view-applications",
      title: "View Applications",
      paragraphs: [
        "Employers can view applications received for their job posts, check candidate details, and shortlist suitable profiles based on hiring requirements.",
      ],
    },
    {
      id: "schedule-interviews",
      title: "Schedule Interviews",
      paragraphs: [
        "Employers can schedule interviews by adding the interview date, time, location, and contact person details. Candidates can receive interview updates through WhatsApp.",
      ],
    },
    {
      id: "track-hiring-progress",
      title: "Track Hiring Progress",
      paragraphs: [
        "The employer dashboard helps track application status, shortlisted candidates, interviews scheduled, selected candidates, and closed job posts.",
      ],
    },
    {
      id: "manage-plans-and-promotions",
      title: "Manage Plans and Promotions",
      paragraphs: [
        "Employers can view hiring plans, promoted jobs, campaign promotions, payments, invoices, and renewal details through the dashboard.",
      ],
    },
    {
      id: "need-login-help",
      title: "Need Login Help?",
      variant: "safety",
      paragraphs: [
        "If you are unable to log in or access your employer dashboard, contact AsliJobs support through WhatsApp, call, or email.",
      ],
      bullets: ["WhatsApp", "Call", "Email"],
    },
  ],
  cta: {
    title: "Employer Login",
    paragraphs: [],
    tagline: "Login. Manage jobs. Hire faster with AsliJobs.",
    badge: "For Employers",
    actions: [
      {
        label: "Employer Login",
        href: ROUTES.EMPLOYER_LOGIN,
        variant: "primary",
      },
      {
        label: "Contact Support",
        href: WHATSAPP_JOIN_URL,
        external: true,
        variant: "secondary",
      },
    ],
  },
};

export const PRICING_PLANS_CONTENT: PublicContentPageData = {
  slug: "pricing-plans",
  title: "Pricing Plans",
  metaDescription:
    "Choose the right hiring plan for your business and connect with suitable blue-collar and grey-collar candidates through AsliJobs.",
  intro: [
    "Choose the right hiring plan for your business and connect with suitable blue-collar and grey-collar candidates through AsliJobs.",
    "AsliJobs offers paid hiring plans for employers who want to post jobs, receive applications, promote openings, and manage hiring more effectively.",
  ],
  sections: [
    {
      id: "simple-plans-for-every-hiring-need",
      title: "Simple Plans for Every Hiring Need",
      paragraphs: [
        "Whether you are hiring for one role or multiple openings, AsliJobs helps you reach job seekers based on location, job category, experience, language preference, and availability.",
      ],
    },
    {
      id: "employer-hiring-plans",
      title: "Employer Hiring Plans",
      cards: [
        {
          id: "basic-hiring-plan",
          title: "Basic Hiring Plan",
          description:
            "Best For: Employers with limited hiring needs. Includes: Job posting, candidate applications, and basic dashboard access.",
        },
        {
          id: "standard-hiring-plan",
          title: "Standard Hiring Plan",
          description:
            "Best For: Employers hiring regularly. Includes: Multiple job postings, more candidate reach, application tracking, and support.",
        },
        {
          id: "premium-hiring-plan",
          title: "Premium Hiring Plan",
          description:
            "Best For: Employers who need faster hiring. Includes: Higher visibility, promoted job options, priority support, and better candidate reach.",
        },
        {
          id: "campaign-hiring-plan",
          title: "Campaign Hiring Plan",
          description:
            "Best For: Employers with bulk or urgent hiring needs. Includes: Targeted hiring campaigns, location-based reach, WhatsApp job alerts, and hiring support.",
        },
      ],
    },
    {
      id: "what-employers-can-do",
      title: "What Employers Can Do",
      bullets: [
        "Post jobs",
        "Receive candidate applications",
        "View candidate details",
        "Shortlist suitable profiles",
        "Schedule interviews",
        "Track hiring progress",
        "Promote job openings",
        "Get support for hiring-related queries",
      ],
    },
    {
      id: "promoted-jobs",
      title: "Promoted Jobs",
      paragraphs: [
        "Promoted jobs help employers increase visibility for important or urgent openings. These jobs can reach more relevant job seekers based on location, job role, and candidate profile.",
      ],
    },
    {
      id: "campaign-promotions",
      title: "Campaign Promotions",
      paragraphs: [
        "Campaign promotions are useful for employers who want to hire in bulk, target specific locations, or reach job seekers in selected job categories.",
      ],
    },
    {
      id: "payments-and-invoices",
      title: "Payments and Invoices",
      paragraphs: [
        "Employers can choose a suitable plan and complete the payment through the available payment options. After payment, invoices can be requested through AsliJobs support.",
      ],
    },
    {
      id: "need-help-choosing-a-plan",
      title: "Need Help Choosing a Plan?",
      variant: "steps",
      paragraphs: [
        "If you are not sure which plan is right for your hiring need, contact AsliJobs support. Our team will help you choose a suitable plan based on your job role, location, number of openings, and hiring urgency.",
      ],
    },
  ],
  cta: {
    title: "Start Hiring with AsliJobs",
    paragraphs: [],
    tagline: "Choose a plan. Post your job. Start hiring with AsliJobs.",
    badge: "For Employers",
    actions: [
      {
        label: "Contact Support",
        href: WHATSAPP_JOIN_URL,
        external: true,
        variant: "primary",
      },
      {
        label: "Post a Job",
        href: ROUTES.POST_JOB,
        variant: "secondary",
      },
    ],
  },
};

export const EMPLOYER_GUIDE_CONTENT: PublicContentPageData = {
  slug: "employer-guide",
  title: "Employer Guide",
  metaDescription:
    "AsliJobs helps employers hire suitable blue-collar and grey-collar candidates through a simple, WhatsApp-friendly hiring process.",
  intro: [
    "AsliJobs helps employers hire suitable blue-collar and grey-collar candidates through a simple, WhatsApp-friendly hiring process. Whether you are hiring for one role or multiple openings, AsliJobs helps you reach job seekers based on location, job category, experience, skills, language preference, and availability.",
  ],
  sections: [
    {
      id: "register-as-an-employer",
      title: "Register as an Employer",
      variant: "steps",
      paragraphs: [
        "Start by creating your employer profile on AsliJobs. Share basic details like employer name, company name, contact person details, mobile number, location, business type, hiring categories, and preferred language.",
      ],
      bullets: [
        "Employer name",
        "Company name",
        "Contact person details",
        "Mobile number",
        "Location",
        "Business type",
        "Hiring categories",
        "Preferred language",
      ],
    },
    {
      id: "post-a-job",
      title: "Post a Job",
      variant: "steps",
      paragraphs: [
        "Post your job by adding clear details such as job title, salary range, work location, timings, number of openings, experience required, skills needed, benefits, and interview details. Clear job details help job seekers understand the opportunity better and apply with confidence.",
      ],
    },
    {
      id: "receive-applications",
      title: "Receive Applications",
      variant: "steps",
      paragraphs: [
        "Once your job is posted, suitable job seekers can view and apply for the job. Applications can be managed through the employer dashboard or with support from the AsliJobs team.",
      ],
    },
    {
      id: "shortlist-candidates",
      title: "Shortlist Candidates",
      variant: "steps",
      paragraphs: [
        "Review candidate details such as name, location, experience, skills, expected salary, availability, and preferred language. Shortlist candidates who match your hiring requirements.",
      ],
    },
    {
      id: "schedule-interviews",
      title: "Schedule Interviews",
      variant: "steps",
      paragraphs: [
        "After shortlisting, schedule interviews by sharing the interview date, time, location, and contact person details. Candidates can receive interview updates through WhatsApp.",
      ],
    },
    {
      id: "track-hiring-progress",
      title: "Track Hiring Progress",
      variant: "steps",
      paragraphs: [
        "Use the employer dashboard to track applications, shortlisted candidates, interviews scheduled, selected candidates, and closed job posts.",
      ],
    },
    {
      id: "promote-job-openings",
      title: "Promote Job Openings",
      variant: "steps",
      paragraphs: [
        "Employers can choose promoted jobs or campaign promotions to improve job visibility and reach more suitable candidates faster.",
      ],
    },
    {
      id: "update-or-close-job-posts",
      title: "Update or Close Job Posts",
      variant: "steps",
      paragraphs: [
        "Keep your job posts updated. If a position is filled, paused, cancelled, or no longer available, update or close the job post through the dashboard or by contacting AsliJobs support.",
      ],
    },
    {
      id: "get-employer-support",
      title: "Get Employer Support",
      variant: "steps",
      paragraphs: [
        "Employers can contact AsliJobs support through WhatsApp, call, or email for help with job posting, applications, candidate shortlisting, interviews, payments, invoices, promotions, or dashboard support.",
      ],
      bullets: [
        "WhatsApp",
        "Call",
        "Email",
        "Job posting",
        "Applications",
        "Candidate shortlisting",
        "Interviews",
        "Payments",
        "Invoices",
        "Promotions",
        "Dashboard support",
      ],
    },
    {
      id: "hiring-tips-for-employers",
      title: "Hiring Tips for Employers",
      variant: "steps",
      bullets: [
        "Add complete and clear job details.",
        "Mention the correct salary, location, and work timings.",
        "Respond to applications on time.",
        "Share interview details clearly.",
        "Close filled jobs to avoid unnecessary applications.",
        "Use promotions for urgent or bulk hiring needs.",
      ],
    },
  ],
  cta: {
    title: "Start Hiring with AsliJobs",
    paragraphs: [
      "AsliJobs makes hiring easier by connecting employers with suitable workforce candidates through a simple and familiar platform.",
    ],
    tagline: "Create your employer profile. Post a job. Hire faster with AsliJobs.",
    badge: "For Employers",
    actions: EMPLOYER_PRIMARY_ACTIONS,
  },
};

